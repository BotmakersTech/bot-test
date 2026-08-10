package com.botleague.backend.certificate.service;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.audit.util.AuditDiff;
import com.botleague.backend.certificate.dto.CertificateTypeResponse;
import com.botleague.backend.certificate.dto.CreateCertificateTypeRequest;
import com.botleague.backend.certificate.dto.UpdateCertificateTypeRequest;
import com.botleague.backend.certificate.entity.CertificateTemplate;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.entity.IssuedCertificate;
import com.botleague.backend.certificate.dto.TemplatePlaceholderPosition;
import com.botleague.backend.certificate.engine.PlaceholderKey;
import com.botleague.backend.certificate.repository.CertificateTemplateRepository;
import com.botleague.backend.certificate.repository.CertificateTypeRepository;
import com.botleague.backend.certificate.repository.IssuedCertificateRepository;
import com.botleague.backend.common.exception.ApiException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CRUD for a sport's configured certificates (e.g. "RoboWar -> BotLeague
 * Winner"). RBAC (assertCanManageSport for organisers, platform-admin gate
 * for the admin controller) happens at the controller layer, which resolves
 * eventSportId via getEntity() before calling any mutating method here.
 */
@Service
public class CertificateTypeService {

    private final CertificateTypeRepository certificateTypeRepository;
    private final CertificateTemplateRepository certificateTemplateRepository;
    private final IssuedCertificateRepository issuedCertificateRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public CertificateTypeService(
            CertificateTypeRepository certificateTypeRepository,
            CertificateTemplateRepository certificateTemplateRepository,
            IssuedCertificateRepository issuedCertificateRepository,
            AuditLogService auditLogService,
            ObjectMapper objectMapper) {
        this.certificateTypeRepository = certificateTypeRepository;
        this.certificateTemplateRepository = certificateTemplateRepository;
        this.issuedCertificateRepository = issuedCertificateRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CertificateTypeResponse create(String provider, UUID eventSportId, CreateCertificateTypeRequest req, UUID callerId) {
        if (req.getLabel() == null || req.getLabel().isBlank()) {
            throw ApiException.badRequest("Label is required");
        }
        validateCategory(req.getCategory());
        validateEligibilityRule(req.getEligibilityRule(), req.getEligibilityRank());

        CertificateTemplate template = certificateTemplateRepository.findById(req.getTemplateId())
                .orElseThrow(() -> ApiException.notFound("Certificate template not found"));
        if (!template.getProvider().equals(provider)) {
            throw ApiException.badRequest("The selected template does not belong to your provider scope");
        }
        boolean effectiveQrEnabled = req.getQrEnabled() != null ? req.getQrEnabled() : Boolean.TRUE;
        validateQrConsistency(template, effectiveQrEnabled);

        String label = req.getLabel().trim();
        if (certificateTypeRepository.findByEventSportIdAndProviderAndCategoryAndLabel(eventSportId, provider, req.getCategory(), label).isPresent()) {
            throw ApiException.conflict("A certificate type with this category and label already exists for this sport");
        }

        CertificateType type = new CertificateType();
        type.setEventSportId(eventSportId);
        type.setProvider(provider);
        type.setCategory(req.getCategory());
        type.setLabel(label);
        type.setTemplateId(req.getTemplateId());
        type.setEligibilityRule(req.getEligibilityRule());
        type.setEligibilityRank(req.getEligibilityRank());
        type.setIssueMode(req.getIssueMode() != null ? req.getIssueMode() : CertificateType.ISSUE_MANUAL_TRIGGER);
        type.setNumberPrefix(req.getNumberPrefix() != null && !req.getNumberPrefix().isBlank() ? req.getNumberPrefix() : "CERT");
        type.setNumberFormat(req.getNumberFormat() != null && !req.getNumberFormat().isBlank() ? req.getNumberFormat() : "{seq}");
        type.setValidityYears(req.getValidityYears());
        if (req.getVerificationEnabled() != null) type.setVerificationEnabled(req.getVerificationEnabled());
        if (req.getQrEnabled() != null) type.setQrEnabled(req.getQrEnabled());
        if (req.getSignatureEnabled() != null) type.setSignatureEnabled(req.getSignatureEnabled());
        type.setCreatedBy(callerId);

        CertificateType saved = certificateTypeRepository.save(type);
        auditLogService.log("CERTIFICATE_TYPE_CREATED", "CERTIFICATE_TYPE", saved.getId(), saved.getLabel(), null, null);
        return toResponse(saved);
    }

    @Transactional
    public CertificateTypeResponse update(UUID typeId, String provider, UpdateCertificateTypeRequest req) {
        CertificateType type = loadForProvider(typeId, provider);

        String oldLabel = type.getLabel();
        UUID oldTemplateId = type.getTemplateId();
        String oldEligibilityRule = type.getEligibilityRule();
        Integer oldEligibilityRank = type.getEligibilityRank();
        String oldIssueMode = type.getIssueMode();
        String oldStatus = type.getStatus();
        String oldNumberPrefix = type.getNumberPrefix();
        String oldNumberFormat = type.getNumberFormat();
        Integer oldValidityYears = type.getValidityYears();
        Boolean oldVerificationEnabled = type.getVerificationEnabled();
        Boolean oldQrEnabled = type.getQrEnabled();
        Boolean oldSignatureEnabled = type.getSignatureEnabled();

        if (req.getLabel() != null && !req.getLabel().isBlank()) {
            type.setLabel(req.getLabel().trim());
        }
        if (req.getTemplateId() != null) {
            CertificateTemplate template = certificateTemplateRepository.findById(req.getTemplateId())
                    .orElseThrow(() -> ApiException.notFound("Certificate template not found"));
            if (!template.getProvider().equals(provider)) {
                throw ApiException.badRequest("The selected template does not belong to your provider scope");
            }
            type.setTemplateId(req.getTemplateId());
        }
        if (req.getEligibilityRule() != null) {
            Integer effectiveRank = req.getEligibilityRank() != null ? req.getEligibilityRank() : type.getEligibilityRank();
            validateEligibilityRule(req.getEligibilityRule(), effectiveRank);
            type.setEligibilityRule(req.getEligibilityRule());
        }
        if (req.getEligibilityRank() != null) {
            type.setEligibilityRank(req.getEligibilityRank());
        }
        if (req.getIssueMode() != null) {
            type.setIssueMode(req.getIssueMode());
        }
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            type.setStatus(req.getStatus());
        }
        if (req.getNumberPrefix() != null) {
            type.setNumberPrefix(req.getNumberPrefix());
        }
        if (req.getNumberFormat() != null) {
            type.setNumberFormat(req.getNumberFormat());
        }
        if (req.getValidityYears() != null) {
            type.setValidityYears(req.getValidityYears());
        }
        if (req.getVerificationEnabled() != null) {
            type.setVerificationEnabled(req.getVerificationEnabled());
        }
        if (req.getQrEnabled() != null) {
            type.setQrEnabled(req.getQrEnabled());
        }
        if (req.getSignatureEnabled() != null) {
            type.setSignatureEnabled(req.getSignatureEnabled());
        }

        // Re-checked here (not just on templateId/qrEnabled change individually) since
        // either one changing can put the pair out of sync with the other's existing value.
        if (Boolean.TRUE.equals(type.getQrEnabled())) {
            CertificateTemplate effectiveTemplate = certificateTemplateRepository.findById(type.getTemplateId())
                    .orElseThrow(() -> ApiException.notFound("Certificate template not found"));
            validateQrConsistency(effectiveTemplate, true);
        }

        CertificateType saved = certificateTypeRepository.save(type);

        AuditDiff diff = new AuditDiff()
                .field("label", oldLabel, saved.getLabel())
                .field("templateId", oldTemplateId, saved.getTemplateId())
                .field("eligibilityRule", oldEligibilityRule, saved.getEligibilityRule())
                .field("eligibilityRank", oldEligibilityRank, saved.getEligibilityRank())
                .field("issueMode", oldIssueMode, saved.getIssueMode())
                .field("status", oldStatus, saved.getStatus())
                .field("numberPrefix", oldNumberPrefix, saved.getNumberPrefix())
                .field("numberFormat", oldNumberFormat, saved.getNumberFormat())
                .field("validityYears", oldValidityYears, saved.getValidityYears())
                .field("verificationEnabled", oldVerificationEnabled, saved.getVerificationEnabled())
                .field("qrEnabled", oldQrEnabled, saved.getQrEnabled())
                .field("signatureEnabled", oldSignatureEnabled, saved.getSignatureEnabled());
        auditLogService.log("CERTIFICATE_TYPE_UPDATED", "CERTIFICATE_TYPE", saved.getId(), saved.getLabel(),
                diff.oldValue(), diff.newValue());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CertificateTypeResponse> listForSport(String provider, UUID eventSportId) {
        return certificateTypeRepository.findByEventSportIdAndProvider(eventSportId, provider)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificateTypeResponse get(UUID typeId, String provider) {
        return toResponse(loadForProvider(typeId, provider));
    }

    /** No provider check — used by controllers to resolve eventSportId before running an RBAC assert. */
    @Transactional(readOnly = true)
    public CertificateType getEntity(UUID typeId) {
        return certificateTypeRepository.findById(typeId)
                .orElseThrow(() -> ApiException.notFound("Certificate type not found"));
    }

    private CertificateType loadForProvider(UUID typeId, String provider) {
        CertificateType type = getEntity(typeId);
        if (!type.getProvider().equals(provider)) {
            throw ApiException.forbidden("This certificate type does not belong to your provider scope");
        }
        return type;
    }

    private void validateCategory(String category) {
        boolean valid = CertificateType.CATEGORY_PARTICIPATION.equals(category)
                || CertificateType.CATEGORY_WINNER.equals(category)
                || CertificateType.CATEGORY_RUNNER_UP.equals(category)
                || CertificateType.CATEGORY_SECOND_RUNNER_UP.equals(category)
                || CertificateType.CATEGORY_SPECIAL.equals(category);
        if (!valid) {
            throw ApiException.badRequest("Invalid certificate category: " + category);
        }
    }

    private void validateEligibilityRule(String rule, Integer rank) {
        boolean valid = CertificateType.RULE_ALL_REGISTERED.equals(rule)
                || CertificateType.RULE_RANK_EQUALS.equals(rule)
                || CertificateType.RULE_MANUAL_SELECT.equals(rule);
        if (!valid) {
            throw ApiException.badRequest("Invalid eligibility rule: " + rule);
        }
        if (CertificateType.RULE_RANK_EQUALS.equals(rule) && (rank == null || rank <= 0)) {
            throw ApiException.badRequest("eligibilityRank is required and must be a positive number when eligibilityRule=RANK_EQUALS");
        }
    }

    /**
     * The single fix for "QR code enabled but nothing prints" — that toggle
     * only controls whether a QR PNG gets *generated*; whether it ever
     * appears on the actual certificate depends entirely on the template
     * having a QR_CODE marker placed in its placeholder_map. Previously
     * nothing connected the two, so a template author could forget to place
     * the marker (or pick the wrong template) and every certificate of that
     * type would silently render with no QR, discovered only after the fact.
     */
    private void validateQrConsistency(CertificateTemplate template, boolean qrEnabled) {
        if (!qrEnabled) {
            return;
        }
        List<TemplatePlaceholderPosition> positions;
        try {
            positions = objectMapper.readValue(template.getPlaceholderMap(), new TypeReference<List<TemplatePlaceholderPosition>>() {});
        } catch (Exception e) {
            positions = List.of();
        }
        boolean hasQrPlaceholder = positions.stream().anyMatch(p -> PlaceholderKey.QR_CODE.name().equals(p.getKey()));
        if (!hasQrPlaceholder) {
            throw ApiException.badRequest(
                    "QR code is enabled, but \"" + template.getName() + "\" has no QR code position — "
                            + "add one in the template editor first, or turn QR code off for this certificate.");
        }
    }

    private void validateStatus(String status) {
        boolean valid = CertificateType.STATUS_ACTIVE.equals(status) || CertificateType.STATUS_DISABLED.equals(status);
        if (!valid) {
            throw ApiException.badRequest("Invalid certificate type status: " + status);
        }
    }

    private CertificateTypeResponse toResponse(CertificateType type) {
        CertificateTypeResponse dto = new CertificateTypeResponse();
        dto.setId(type.getId());
        dto.setEventSportId(type.getEventSportId());
        dto.setProvider(type.getProvider());
        dto.setCategory(type.getCategory());
        dto.setLabel(type.getLabel());
        dto.setTemplateId(type.getTemplateId());
        certificateTemplateRepository.findById(type.getTemplateId()).ifPresent(t -> dto.setTemplateName(t.getName()));
        dto.setEligibilityRule(type.getEligibilityRule());
        dto.setEligibilityRank(type.getEligibilityRank());
        dto.setIssueMode(type.getIssueMode());
        dto.setStatus(type.getStatus());
        dto.setNumberPrefix(type.getNumberPrefix());
        dto.setNumberFormat(type.getNumberFormat());
        dto.setValidityYears(type.getValidityYears());
        dto.setVerificationEnabled(type.getVerificationEnabled());
        dto.setQrEnabled(type.getQrEnabled());
        dto.setSignatureEnabled(type.getSignatureEnabled());
        dto.setIssuedCount(issuedCertificateRepository.countByCertificateTypeIdAndStatusNot(type.getId(), IssuedCertificate.STATUS_SUPERSEDED));
        dto.setCreatedAt(type.getCreatedAt());
        dto.setUpdatedAt(type.getUpdatedAt());
        return dto;
    }
}
