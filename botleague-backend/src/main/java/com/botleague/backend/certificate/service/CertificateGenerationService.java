package com.botleague.backend.certificate.service;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.certificate.dto.CertificateGenerationJobResponse;
import com.botleague.backend.certificate.dto.ManualRecipientRequest;
import com.botleague.backend.certificate.entity.CertificateGenerationJob;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.repository.CertificateGenerationJobRepository;
import com.botleague.backend.certificate.repository.CertificateTypeRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Sync orchestration for certificate generation: validates the certificate
 * type is ready, resolves the recipient list, creates the job row, then
 * hands off to CertificateGenerationWorker for the actual (async) rendering
 * work. Callers get the job id back immediately and poll it for progress.
 */
@Service
public class CertificateGenerationService {

    private final CertificateTypeRepository certificateTypeRepository;
    private final CertificateGenerationJobRepository jobRepository;
    private final CertificateAllocationService allocationService;
    private final CertificateGenerationWorker worker;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;

    public CertificateGenerationService(
            CertificateTypeRepository certificateTypeRepository,
            CertificateGenerationJobRepository jobRepository,
            CertificateAllocationService allocationService,
            CertificateGenerationWorker worker,
            AuthorizationService authorizationService,
            AuditLogService auditLogService) {
        this.certificateTypeRepository = certificateTypeRepository;
        this.jobRepository = jobRepository;
        this.allocationService = allocationService;
        this.worker = worker;
        this.authorizationService = authorizationService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public CertificateGenerationJobResponse trigger(UUID certificateTypeId, String provider,
                                                      List<ManualRecipientRequest> manualRecipients, UUID callerId) {
        CertificateType type = certificateTypeRepository.findById(certificateTypeId)
                .orElseThrow(() -> ApiException.notFound("Certificate type not found"));
        if (!type.getProvider().equals(provider)) {
            throw ApiException.forbidden("This certificate type does not belong to your provider scope");
        }
        if (!CertificateType.STATUS_ACTIVE.equals(type.getStatus())) {
            throw ApiException.conflict("This certificate type is disabled — enable it before generating certificates");
        }

        authorizationService.assertLeaderboardFinalizedForCertificates(type.getEventSportId());

        List<CertificateRecipient> recipients = CertificateType.RULE_MANUAL_SELECT.equals(type.getEligibilityRule())
                ? allocationService.resolveManual(manualRecipients)
                : allocationService.resolve(type);

        if (recipients.isEmpty()) {
            throw ApiException.badRequest("No eligible recipients were found for this certificate type");
        }

        CertificateGenerationJob job = new CertificateGenerationJob();
        job.setCertificateTypeId(type.getId());
        job.setTotalRecipients(recipients.size());
        job.setTriggeredBy(callerId);
        CertificateGenerationJob saved = jobRepository.save(job);

        auditLogService.log("CERTIFICATE_GENERATION_TRIGGERED", "CERTIFICATE_TYPE", type.getId(), type.getLabel(),
                null, "job=" + saved.getId() + ", recipients=" + recipients.size());

        // The worker reads this job row on its own thread/connection — firing it
        // here directly could race the enclosing transaction's commit (READ
        // COMMITTED would make the row briefly invisible to that thread).
        // Deferring to afterCommit() guarantees the row exists before it starts.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    worker.runAsync(saved.getId(), recipients);
                }
            });
        } else {
            worker.runAsync(saved.getId(), recipients);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CertificateGenerationJobResponse> listForType(UUID certificateTypeId, String provider) {
        CertificateType type = certificateTypeRepository.findById(certificateTypeId)
                .orElseThrow(() -> ApiException.notFound("Certificate type not found"));
        if (!type.getProvider().equals(provider)) {
            throw ApiException.forbidden("This certificate type does not belong to your provider scope");
        }
        return jobRepository.findByCertificateTypeIdOrderByCreatedAtDesc(certificateTypeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificateGenerationJobResponse get(UUID jobId) {
        return toResponse(jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Generation job not found")));
    }

    private CertificateGenerationJobResponse toResponse(CertificateGenerationJob job) {
        CertificateGenerationJobResponse dto = new CertificateGenerationJobResponse();
        dto.setId(job.getId());
        dto.setCertificateTypeId(job.getCertificateTypeId());
        dto.setStatus(job.getStatus());
        dto.setTotalRecipients(job.getTotalRecipients());
        dto.setSucceededCount(job.getSucceededCount());
        dto.setFailedCount(job.getFailedCount());
        dto.setErrorSummary(job.getErrorSummary());
        dto.setTriggeredBy(job.getTriggeredBy());
        dto.setStartedAt(job.getStartedAt());
        dto.setCompletedAt(job.getCompletedAt());
        dto.setCreatedAt(job.getCreatedAt());
        return dto;
    }
}
