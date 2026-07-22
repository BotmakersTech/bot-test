package com.botleague.backend.certificate.service;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.certificate.dto.IssuedCertificateResponse;
import com.botleague.backend.certificate.dto.PublicVerificationResponse;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.entity.CertificateVerificationLog;
import com.botleague.backend.certificate.entity.IssuedCertificate;
import com.botleague.backend.certificate.repository.CertificateTypeRepository;
import com.botleague.backend.certificate.repository.CertificateVerificationLogRepository;
import com.botleague.backend.certificate.repository.IssuedCertificateRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.common.service.GetFileService;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Public QR verification, the participant's "My Certificates" repository,
 * and admin/organiser search + revoke over already-issued certificates.
 */
@Service
public class CertificateVerificationService {

    private final IssuedCertificateRepository issuedCertificateRepository;
    private final CertificateVerificationLogRepository verificationLogRepository;
    private final CertificateTypeRepository certificateTypeRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final GetFileService getFileService;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;

    public CertificateVerificationService(
            IssuedCertificateRepository issuedCertificateRepository,
            CertificateVerificationLogRepository verificationLogRepository,
            CertificateTypeRepository certificateTypeRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            GetFileService getFileService,
            AuthorizationService authorizationService,
            AuditLogService auditLogService) {
        this.issuedCertificateRepository = issuedCertificateRepository;
        this.verificationLogRepository = verificationLogRepository;
        this.certificateTypeRepository = certificateTypeRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.getFileService = getFileService;
        this.authorizationService = authorizationService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public PublicVerificationResponse verify(String certificateNumber, String clientIp) {
        IssuedCertificate issued = issuedCertificateRepository.findByCertificateNumber(certificateNumber).orElse(null);

        String result;
        PublicVerificationResponse response = new PublicVerificationResponse();
        response.setCertificateNumber(certificateNumber);

        if (issued == null) {
            result = CertificateVerificationLog.RESULT_NOT_FOUND;
        } else if (IssuedCertificate.STATUS_REVOKED.equals(issued.getStatus())) {
            result = CertificateVerificationLog.RESULT_REVOKED;
        } else {
            result = CertificateVerificationLog.RESULT_VALID;
        }
        response.setResult(result);

        if (issued != null && !CertificateVerificationLog.RESULT_NOT_FOUND.equals(result)) {
            populatePublicFields(response, issued);
        }

        CertificateVerificationLog logEntry = new CertificateVerificationLog();
        logEntry.setIssuedCertificateId(issued != null ? issued.getId() : null);
        logEntry.setIpHash(hashIp(clientIp));
        logEntry.setResult(result);
        verificationLogRepository.save(logEntry);

        return response;
    }

    @Transactional(readOnly = true)
    public List<IssuedCertificateResponse> myCertificates(UUID userId) {
        return issuedCertificateRepository.findByRecipientUserIdAndStatusOrderByIssuedAtDesc(userId, IssuedCertificate.STATUS_ACTIVE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IssuedCertificateResponse getMyCertificate(UUID issuedCertificateId, UUID callerId) {
        IssuedCertificate issued = issuedCertificateRepository.findById(issuedCertificateId)
                .orElseThrow(() -> ApiException.notFound("Certificate not found"));
        if (!Objects.equals(issued.getRecipientUserId(), callerId)) {
            throw ApiException.forbidden("This certificate does not belong to you");
        }
        return toResponse(issued);
    }

    @Transactional(readOnly = true)
    public List<IssuedCertificateResponse> listForType(UUID certificateTypeId, String provider) {
        CertificateType type = certificateTypeRepository.findById(certificateTypeId)
                .orElseThrow(() -> ApiException.notFound("Certificate type not found"));
        if (!type.getProvider().equals(provider)) {
            throw ApiException.forbidden("This certificate type does not belong to your provider scope");
        }
        return issuedCertificateRepository.findByCertificateTypeIdOrderByIssuedAtDesc(certificateTypeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void revoke(UUID issuedCertificateId, String reason, UUID callerId) {
        IssuedCertificate issued = issuedCertificateRepository.findById(issuedCertificateId)
                .orElseThrow(() -> ApiException.notFound("Certificate not found"));
        authorizationService.assertCanManageSport(callerId, issued.getEventSportId());

        if (IssuedCertificate.STATUS_REVOKED.equals(issued.getStatus())) {
            throw ApiException.conflict("This certificate is already revoked");
        }
        issued.setStatus(IssuedCertificate.STATUS_REVOKED);
        issued.setRevokedReason(reason);
        issued.setRevokedBy(callerId);
        issued.setRevokedAt(LocalDateTime.now());
        issuedCertificateRepository.save(issued);

        auditLogService.log("CERTIFICATE_REVOKED", "ISSUED_CERTIFICATE", issued.getId(),
                issued.getCertificateNumber(), null, reason);
    }

    private void populatePublicFields(PublicVerificationResponse response, IssuedCertificate issued) {
        response.setRecipientName(issued.getRecipientNameSnapshot());
        response.setTeamName(issued.getTeamNameSnapshot());
        response.setRobotName(issued.getRobotNameSnapshot());
        response.setPositionSnapshot(issued.getPositionSnapshot());
        response.setImageUrl(getFileService.getCertificateUrl(issued.getImageKey()));
        response.setIssuedAt(issued.getIssuedAt());

        certificateTypeRepository.findById(issued.getCertificateTypeId()).ifPresent(type -> {
            response.setCategory(type.getCategory());
            response.setLabel(type.getLabel());
        });
        eventRepository.findById(issued.getEventId()).ifPresent(event -> response.setEventName(event.getEventName()));
        eventSportsRepository.findById(issued.getEventSportId()).ifPresent(sport -> response.setEventSportName(sport.getSport()));
    }

    private IssuedCertificateResponse toResponse(IssuedCertificate issued) {
        IssuedCertificateResponse dto = new IssuedCertificateResponse();
        dto.setId(issued.getId());
        dto.setCertificateNumber(issued.getCertificateNumber());
        dto.setCertificateTypeId(issued.getCertificateTypeId());
        certificateTypeRepository.findById(issued.getCertificateTypeId()).ifPresent(type -> {
            dto.setCertificateLabel(type.getLabel());
            dto.setCategory(type.getCategory());
        });
        dto.setRecipientUserId(issued.getRecipientUserId());
        dto.setRecipientName(issued.getRecipientNameSnapshot());
        dto.setTeamId(issued.getTeamId());
        dto.setTeamName(issued.getTeamNameSnapshot());
        dto.setRobotId(issued.getRobotId());
        dto.setRobotName(issued.getRobotNameSnapshot());
        dto.setEventId(issued.getEventId());
        Event event = eventRepository.findById(issued.getEventId()).orElse(null);
        dto.setEventName(event != null ? event.getEventName() : null);
        dto.setEventSportId(issued.getEventSportId());
        EventSports sport = eventSportsRepository.findById(issued.getEventSportId()).orElse(null);
        dto.setEventSportName(sport != null ? sport.getSport() : null);
        dto.setPositionSnapshot(issued.getPositionSnapshot());
        dto.setPdfUrl(getFileService.getCertificateUrl(issued.getPdfKey()));
        dto.setImageUrl(getFileService.getCertificateUrl(issued.getImageKey()));
        dto.setQrUrl(getFileService.getCertificateUrl(issued.getQrKey()));
        dto.setVerificationUrl(issued.getVerificationUrl());
        dto.setStatus(issued.getStatus());
        dto.setRevokedReason(issued.getRevokedReason());
        dto.setRevokedAt(issued.getRevokedAt());
        dto.setIssuedAt(issued.getIssuedAt());
        return dto;
    }

    private String hashIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ip.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return null;
        }
    }
}
