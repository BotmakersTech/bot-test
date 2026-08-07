package com.botleague.backend.certificate.service;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.certificate.dto.CertificateTemplateResponse;
import com.botleague.backend.certificate.dto.CreateCertificateTemplateRequest;
import com.botleague.backend.certificate.dto.PreviewTemplateRequest;
import com.botleague.backend.certificate.dto.TemplatePlaceholderPosition;
import com.botleague.backend.certificate.dto.TemplatePreviewResponse;
import com.botleague.backend.certificate.dto.UpdateCertificateTemplateRequest;
import com.botleague.backend.certificate.engine.PlaceholderContext;
import com.botleague.backend.certificate.engine.PlaceholderKey;
import com.botleague.backend.certificate.engine.PdfCertificateRenderer;
import com.botleague.backend.certificate.engine.QrCodeGenerator;
import com.botleague.backend.certificate.engine.RenderedCertificate;
import com.botleague.backend.certificate.entity.CertificateTemplate;
import com.botleague.backend.certificate.repository.CertificateTemplateRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.GetFileService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
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

    private static final DateTimeFormatter PREVIEW_DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final CertificateTemplateRepository templateRepository;
    private final GetFileService getFileService;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;
    private final CertificateStorageService storageService;
    private final PdfCertificateRenderer pdfCertificateRenderer;
    private final QrCodeGenerator qrCodeGenerator;
    private final String verificationBaseUrl;

    public CertificateTemplateService(
            CertificateTemplateRepository templateRepository,
            GetFileService getFileService,
            ObjectMapper objectMapper,
            AuditLogService auditLogService,
            CertificateStorageService storageService,
            PdfCertificateRenderer pdfCertificateRenderer,
            QrCodeGenerator qrCodeGenerator,
            @Value("${app.frontend.url}") String frontendBaseUrl) {
        this.templateRepository = templateRepository;
        this.getFileService = getFileService;
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
        this.storageService = storageService;
        this.pdfCertificateRenderer = pdfCertificateRenderer;
        this.qrCodeGenerator = qrCodeGenerator;
        this.verificationBaseUrl = frontendBaseUrl.replaceAll("/+$", "") + "/verify";
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

    /**
     * Renders one sample certificate from whatever the editor currently has —
     * not a saved template row, so it reflects unsaved drags/edits and works
     * for a template that hasn't been created yet (background already
     * uploaded via the existing upload-url flow, just not persisted). Uses
     * placeholder sample data ("Jane Doe", "Sample Event"…) and a real QR
     * pointing at a fake verification URL, so an editor can actually SEE
     * whether their QR code (and everything else) renders correctly before
     * ever issuing a real certificate — previously the only way to find out
     * was to generate one for a real recipient.
     */
    @Transactional(readOnly = true)
    public TemplatePreviewResponse preview(PreviewTemplateRequest req) {
        if (req.getBackgroundAssetKey() == null || req.getBackgroundAssetKey().isBlank()) {
            throw ApiException.badRequest("Upload a background image before previewing");
        }
        if (req.getPageWidthPx() == null || req.getPageHeightPx() == null
                || req.getPageWidthPx() <= 0 || req.getPageHeightPx() <= 0) {
            throw ApiException.badRequest("Page width and height (in px) are required");
        }
        List<TemplatePlaceholderPosition> positions = req.getPlaceholderMap() != null ? req.getPlaceholderMap() : List.of();
        validatePlaceholderMap(positions);

        byte[] backgroundBytes = storageService.download(req.getBackgroundAssetKey());

        String sampleCertNumber = "SAMPLE-0001";
        String sampleVerificationUrl = verificationBaseUrl + "/" + sampleCertNumber;

        PlaceholderContext context = new PlaceholderContext();
        context.put(PlaceholderKey.PARTICIPANT_NAME, "Jane Doe");
        context.put(PlaceholderKey.TEAM_NAME, "Sample Team");
        context.put(PlaceholderKey.ROBOT_NAME, "Sample Bot");
        context.put(PlaceholderKey.EVENT_NAME, "Sample Championship 2026");
        context.put(PlaceholderKey.EVENT_SPORT, "Sample Sport");
        context.put(PlaceholderKey.COMPETITION_CATEGORY, "Winner");
        context.put(PlaceholderKey.POSITION, "1st Place");
        context.put(PlaceholderKey.RANK, "1");
        context.put(PlaceholderKey.INSTITUTE_NAME, "Sample Institute");
        context.put(PlaceholderKey.ORGANIZER_NAME, "BotLeague");
        context.put(PlaceholderKey.CERTIFICATE_ID, sampleCertNumber);
        context.put(PlaceholderKey.DATE, LocalDate.now().format(PREVIEW_DATE_FORMAT));
        context.put(PlaceholderKey.VERIFICATION_URL, sampleVerificationUrl);
        context.setQrPayloadUrl(sampleVerificationUrl);

        boolean hasQr = positions.stream().anyMatch(p -> PlaceholderKey.QR_CODE.name().equals(p.getKey()));
        byte[] qrBytes = hasQr ? qrCodeGenerator.generatePng(sampleVerificationUrl, 300) : null;

        RenderedCertificate rendered = pdfCertificateRenderer.render(
                backgroundBytes, req.getPageWidthPx(), req.getPageHeightPx(), positions, context, qrBytes);

        TemplatePreviewResponse response = new TemplatePreviewResponse();
        response.setImageBase64("data:image/png;base64," + Base64.getEncoder().encodeToString(rendered.getImageBytes()));
        response.setHasQrPlaceholder(hasQr);
        return response;
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
        dto.setBackgroundAssetKey(template.getBackgroundAssetKey());
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
