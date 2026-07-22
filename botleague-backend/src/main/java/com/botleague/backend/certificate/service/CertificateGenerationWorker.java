package com.botleague.backend.certificate.service;

import com.botleague.backend.certificate.engine.PdfCertificateRenderer;
import com.botleague.backend.certificate.engine.PlaceholderContext;
import com.botleague.backend.certificate.engine.PlaceholderResolver;
import com.botleague.backend.certificate.engine.QrCodeGenerator;
import com.botleague.backend.certificate.engine.RenderedCertificate;
import com.botleague.backend.certificate.entity.CertificateGenerationJob;
import com.botleague.backend.certificate.entity.CertificateTemplate;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.entity.IssuedCertificate;
import com.botleague.backend.certificate.repository.CertificateGenerationJobRepository;
import com.botleague.backend.certificate.repository.CertificateTemplateRepository;
import com.botleague.backend.certificate.repository.CertificateTypeRepository;
import com.botleague.backend.certificate.repository.IssuedCertificateRepository;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * The actual generation loop, on its own bean so @Async is honored — Spring's
 * async proxy only applies to calls that arrive from a different bean, so
 * CertificateGenerationService (which creates the job row) calls into this
 * one rather than an internal self-invocation, which would silently run
 * synchronously.
 *
 * Each recipient is its own unit of work: the job's succeeded/failed
 * counters are persisted after every recipient, so a mid-batch crash leaves
 * an accurate, resumable record rather than losing all progress — the
 * "chunked/checkpointed" processing called for at this data volume without
 * needing a real external queue yet.
 */
@Service
public class CertificateGenerationWorker {

    private static final Logger log = LoggerFactory.getLogger(CertificateGenerationWorker.class);
    private static final int MAX_ERROR_SUMMARY_LENGTH = 4000;

    private final CertificateGenerationJobRepository jobRepository;
    private final CertificateTypeRepository certificateTypeRepository;
    private final CertificateTemplateRepository certificateTemplateRepository;
    private final IssuedCertificateRepository issuedCertificateRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final CertificateStorageService storageService;
    private final CertificateNumberService certificateNumberService;
    private final PlaceholderResolver placeholderResolver;
    private final QrCodeGenerator qrCodeGenerator;
    private final PdfCertificateRenderer pdfCertificateRenderer;
    private final String verificationBaseUrl;

    public CertificateGenerationWorker(
            CertificateGenerationJobRepository jobRepository,
            CertificateTypeRepository certificateTypeRepository,
            CertificateTemplateRepository certificateTemplateRepository,
            IssuedCertificateRepository issuedCertificateRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            CertificateStorageService storageService,
            CertificateNumberService certificateNumberService,
            PlaceholderResolver placeholderResolver,
            QrCodeGenerator qrCodeGenerator,
            PdfCertificateRenderer pdfCertificateRenderer,
            @Value("${app.frontend.url}") String frontendBaseUrl) {
        this.jobRepository = jobRepository;
        this.certificateTypeRepository = certificateTypeRepository;
        this.certificateTemplateRepository = certificateTemplateRepository;
        this.issuedCertificateRepository = issuedCertificateRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.storageService = storageService;
        this.certificateNumberService = certificateNumberService;
        this.placeholderResolver = placeholderResolver;
        this.qrCodeGenerator = qrCodeGenerator;
        this.pdfCertificateRenderer = pdfCertificateRenderer;
        this.verificationBaseUrl = frontendBaseUrl.replaceAll("/+$", "") + "/verify";
    }

    @Async("certificateGenerationExecutor")
    public void runAsync(UUID jobId, List<CertificateRecipient> recipients) {
        CertificateGenerationJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("[CertificateGeneration] job {} disappeared before it could start", jobId);
            return;
        }

        job.setStatus(CertificateGenerationJob.STATUS_RUNNING);
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        CertificateType type = certificateTypeRepository.findById(job.getCertificateTypeId()).orElse(null);
        EventSports eventSport = type != null ? eventSportsRepository.findById(type.getEventSportId()).orElse(null) : null;
        Event event = eventSport != null ? eventRepository.findById(eventSport.getEventId()).orElse(null) : null;
        CertificateTemplate template = type != null ? certificateTemplateRepository.findById(type.getTemplateId()).orElse(null) : null;

        if (type == null || eventSport == null || event == null || template == null) {
            failJob(job, "One of certificate type / event sport / event / template no longer exists");
            return;
        }

        byte[] backgroundBytes;
        try {
            backgroundBytes = storageService.download(template.getBackgroundAssetKey());
        } catch (Exception e) {
            log.error("[CertificateGeneration] failed to download template background for job {}", jobId, e);
            failJob(job, "Failed to download template background: " + e.getMessage());
            return;
        }

        StringBuilder errors = new StringBuilder();
        int succeeded = 0;
        int failed = 0;

        for (CertificateRecipient recipient : recipients) {
            try {
                if (isAlreadyIssued(type.getId(), recipient)) {
                    continue; // idempotent no-op on a repeat "Generate" click
                }
                issueOne(job, type, event, eventSport, template, backgroundBytes, recipient);
                succeeded++;
            } catch (DataIntegrityViolationException e) {
                // Lost an idempotency race against the DB's own partial unique
                // index — someone else (or an earlier attempt) already issued
                // this recipient's certificate. Not a real failure.
            } catch (Exception e) {
                failed++;
                log.warn("[CertificateGeneration] failed to issue certificate for {} on job {}", recipient.getRecipientName(), jobId, e);
                appendError(errors, recipient.getRecipientName(), e.getMessage());
            }
            job.setSucceededCount(succeeded);
            job.setFailedCount(failed);
            jobRepository.save(job);
        }

        job.setErrorSummary(errors.length() > 0 ? errors.substring(0, Math.min(errors.length(), MAX_ERROR_SUMMARY_LENGTH)) : null);
        job.setStatus(failed == 0
                ? CertificateGenerationJob.STATUS_COMPLETED
                : (succeeded > 0 ? CertificateGenerationJob.STATUS_PARTIAL : CertificateGenerationJob.STATUS_FAILED));
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);
    }

    private void issueOne(CertificateGenerationJob job, CertificateType type, Event event, EventSports eventSport,
                           CertificateTemplate template, byte[] backgroundBytes, CertificateRecipient recipient) {
        String certificateNumber = certificateNumberService.nextCertificateNumber(type.getId());
        LocalDate issueDate = LocalDate.now();
        String verificationUrl = verificationBaseUrl + "/" + certificateNumber;

        PlaceholderContext context = placeholderResolver.resolve(
                type, event, eventSport,
                recipient.getTeamName(), recipient.getInstituteName(), recipient.getRobotName(),
                recipient.getRecipientName(), recipient.getPositionRank(),
                certificateNumber, verificationUrl, issueDate);

        byte[] qrBytes = Boolean.TRUE.equals(type.getQrEnabled())
                ? qrCodeGenerator.generatePng(verificationUrl, 300)
                : null;

        RenderedCertificate rendered = pdfCertificateRenderer.render(
                backgroundBytes, template.getPageWidthPx(), template.getPageHeightPx(),
                template.getPlaceholderMap(), context, qrBytes);

        String pdfKey = storageService.uploadIssuedAsset(certificateNumber, "certificate.pdf", "application/pdf", rendered.getPdfBytes());
        String imageKey = storageService.uploadIssuedAsset(certificateNumber, "certificate.png", "image/png", rendered.getImageBytes());
        String qrKey = qrBytes != null
                ? storageService.uploadIssuedAsset(certificateNumber, "qr.png", "image/png", qrBytes)
                : null;

        IssuedCertificate issued = new IssuedCertificate();
        issued.setCertificateNumber(certificateNumber);
        issued.setCertificateTypeId(type.getId());
        issued.setGenerationJobId(job.getId());
        issued.setRecipientUserId(recipient.getRecipientUserId());
        issued.setRecipientNameSnapshot(recipient.getRecipientName());
        issued.setTeamId(recipient.getTeamId());
        issued.setTeamNameSnapshot(recipient.getTeamName());
        issued.setRobotId(recipient.getRobotId());
        issued.setRobotNameSnapshot(recipient.getRobotName());
        issued.setEventId(event.getId());
        issued.setEventSportId(eventSport.getId());
        issued.setPositionSnapshot(recipient.getPositionRank());
        issued.setPdfKey(pdfKey);
        issued.setImageKey(imageKey);
        issued.setQrKey(qrKey);
        issued.setVerificationUrl(verificationUrl);
        issued.setStatus(IssuedCertificate.STATUS_ACTIVE);
        if (Boolean.TRUE.equals(type.getSignatureEnabled())) {
            issued.setSignatureHash(signatureHash(certificateNumber, recipient, issueDate));
        }

        issuedCertificateRepository.save(issued);
    }

    private boolean isAlreadyIssued(UUID typeId, CertificateRecipient recipient) {
        if (recipient.getRecipientUserId() != null) {
            return issuedCertificateRepository.findByCertificateTypeIdAndRecipientUserIdAndRobotIdAndStatusNot(
                    typeId, recipient.getRecipientUserId(), recipient.getRobotId(), IssuedCertificate.STATUS_SUPERSEDED).isPresent();
        }
        return issuedCertificateRepository.findByCertificateTypeIdAndRecipientNameSnapshotAndRobotIdAndStatusNot(
                typeId, recipient.getRecipientName(), recipient.getRobotId(), IssuedCertificate.STATUS_SUPERSEDED).isPresent();
    }

    private String signatureHash(String certificateNumber, CertificateRecipient recipient, LocalDate issueDate) {
        try {
            String canonical = certificateNumber + "|" + recipient.getRecipientUserId() + "|"
                    + recipient.getRecipientName() + "|" + issueDate;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(canonical.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return null;
        }
    }

    private void appendError(StringBuilder errors, String recipientName, String message) {
        if (errors.length() > MAX_ERROR_SUMMARY_LENGTH) {
            return;
        }
        errors.append(recipientName != null ? recipientName : "unknown")
                .append(": ").append(message != null ? message : "unknown error").append("; ");
    }

    private void failJob(CertificateGenerationJob job, String reason) {
        job.setStatus(CertificateGenerationJob.STATUS_FAILED);
        job.setErrorSummary(reason);
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);
    }
}
