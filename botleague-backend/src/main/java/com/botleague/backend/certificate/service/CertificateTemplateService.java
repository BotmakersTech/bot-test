package com.botleague.backend.certificate.service;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.certificate.dto.CertificateTemplateResponse;
import com.botleague.backend.certificate.dto.CreateCertificateTemplateRequest;
import com.botleague.backend.certificate.dto.TemplatePlaceholderPosition;
import com.botleague.backend.certificate.dto.UpdateCertificateTemplateRequest;
import com.botleague.backend.certificate.engine.PlaceholderKey;
import com.botleague.backend.certificate.entity.CertificateTemplate;
import com.botleague.backend.certificate.repository.CertificateTemplateRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.GetFileService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CRUD for certificate template assets. Callers always pass an explicit
 * (provider, ownerUserId) scope resolved by the controller layer — never
 * trusted from the request body — so an ORGANISER caller can never create or
 * touch a BOTLEAGUE-provider template and vice versa.
 */
@Service
public class CertificateTemplateService {

    private final CertificateTemplateRepository templateRepository;
    private final GetFileService getFileService;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;

    public CertificateTemplateService(
            CertificateTemplateRepository templateRepository,
            GetFileService getFileService,
            ObjectMapper objectMapper,
            AuditLogService auditLogService) {
        this.templateRepository = templateRepository;
        this.getFileService = getFileService;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public CertificateTemplateResponse create(String provider, UUID ownerUserId, CreateCertificateTemplateRequest req, UUID callerId) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw ApiException.badRequest("Template name is required");
        }
        if (req.getBackgroundAssetKey() == null || req.getBackgroundAssetKey().isBlank()) {
            throw ApiException.badRequest("A background asset is required");
        }
        if (req.getPageWidthPx() == null || req.getPageHeightPx() == null
                || req.getPageWidthPx() <= 0 || req.getPageHeightPx() <= 0) {
            throw ApiException.badRequest("Page width and height (in px) are required");
        }
        validatePlaceholderMap(req.getPlaceholderMap());

        CertificateTemplate template = new CertificateTemplate();
        template.setProvider(provider);
        template.setOwnerUserId(ownerUserId);
        template.setName(req.getName().trim());
        template.setBackgroundAssetKey(req.getBackgroundAssetKey());
        template.setPageWidthPx(req.getPageWidthPx());
        template.setPageHeightPx(req.getPageHeightPx());
        template.setPlaceholderMap(serialize(req.getPlaceholderMap()));
        template.setStatus(CertificateTemplate.STATUS_DRAFT);
        template.setCreatedBy(callerId);

        CertificateTemplate saved = templateRepository.save(template);
        auditLogService.log("CERTIFICATE_TEMPLATE_CREATED", "CERTIFICATE_TEMPLATE", saved.getId(), saved.getName(), null, null);
        return toResponse(saved);
    }

    @Transactional
    public CertificateTemplateResponse update(UUID templateId, String provider, UUID ownerUserId,
                                               UpdateCertificateTemplateRequest req, UUID callerId) {
        CertificateTemplate template = loadOwned(templateId, provider, ownerUserId);

        if (req.getName() != null && !req.getName().isBlank()) {
            template.setName(req.getName().trim());
        }
        if (req.getPlaceholderMap() != null) {
            validatePlaceholderMap(req.getPlaceholderMap());
            template.setPlaceholderMap(serialize(req.getPlaceholderMap()));
        }
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            template.setStatus(req.getStatus());
        }

        CertificateTemplate saved = templateRepository.save(template);
        auditLogService.log("CERTIFICATE_TEMPLATE_UPDATED", "CERTIFICATE_TEMPLATE", saved.getId(), saved.getName(), null, null);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CertificateTemplateResponse> list(String provider, UUID ownerUserId) {
        List<CertificateTemplate> templates = CertificateTemplate.PROVIDER_ORGANISER.equals(provider)
                ? templateRepository.findByProviderAndOwnerUserId(provider, ownerUserId)
                : templateRepository.findByProvider(provider);
        return templates.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CertificateTemplateResponse get(UUID templateId, String provider, UUID ownerUserId) {
        return toResponse(loadOwned(templateId, provider, ownerUserId));
    }

    /** Package-visible: used by CertificateTypeService/allocation code that needs the raw entity, not the DTO. */
    @Transactional(readOnly = true)
    public CertificateTemplate getEntity(UUID templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> ApiException.notFound("Certificate template not found"));
    }

    @Transactional
    public void archive(UUID templateId, String provider, UUID ownerUserId) {
        CertificateTemplate template = loadOwned(templateId, provider, ownerUserId);
        template.setStatus(CertificateTemplate.STATUS_ARCHIVED);
        templateRepository.save(template);
        auditLogService.log("CERTIFICATE_TEMPLATE_ARCHIVED", "CERTIFICATE_TEMPLATE", template.getId(), template.getName(), null, null);
    }

    private CertificateTemplate loadOwned(UUID templateId, String provider, UUID ownerUserId) {
        CertificateTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> ApiException.notFound("Certificate template not found"));
        if (!template.getProvider().equals(provider)) {
            throw ApiException.forbidden("This template does not belong to your provider scope");
        }
        if (CertificateTemplate.PROVIDER_ORGANISER.equals(provider) && !Objects.equals(template.getOwnerUserId(), ownerUserId)) {
            throw ApiException.forbidden("This template belongs to a different organiser");
        }
        return template;
    }

    private void validateStatus(String status) {
        boolean valid = CertificateTemplate.STATUS_DRAFT.equals(status)
                || CertificateTemplate.STATUS_ACTIVE.equals(status)
                || CertificateTemplate.STATUS_ARCHIVED.equals(status);
        if (!valid) {
            throw ApiException.badRequest("Invalid template status: " + status);
        }
    }

    private void validatePlaceholderMap(List<TemplatePlaceholderPosition> positions) {
        if (positions == null) {
            return;
        }
        for (TemplatePlaceholderPosition position : positions) {
            if (position.getKey() == null || resolveKey(position.getKey()) == null) {
                throw ApiException.badRequest("Unknown placeholder key: " + position.getKey());
            }
        }
    }

    private PlaceholderKey resolveKey(String raw) {
        try {
            return PlaceholderKey.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String serialize(List<TemplatePlaceholderPosition> positions) {
        try {
            return objectMapper.writeValueAsString(positions != null ? positions : List.of());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize placeholder map", e);
        }
    }

    private List<TemplatePlaceholderPosition> deserialize(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<TemplatePlaceholderPosition>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private CertificateTemplateResponse toResponse(CertificateTemplate template) {
        CertificateTemplateResponse dto = new CertificateTemplateResponse();
        dto.setId(template.getId());
        dto.setProvider(template.getProvider());
        dto.setOwnerUserId(template.getOwnerUserId());
        dto.setName(template.getName());
        dto.setBackgroundUrl(getFileService.getCertificateUrl(template.getBackgroundAssetKey()));
        dto.setPageWidthPx(template.getPageWidthPx());
        dto.setPageHeightPx(template.getPageHeightPx());
        dto.setPlaceholderMap(deserialize(template.getPlaceholderMap()));
        dto.setStatus(template.getStatus());
        dto.setCreatedBy(template.getCreatedBy());
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());
        return dto;
    }
}
