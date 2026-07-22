package com.botleague.backend.certificate.controller;

import com.botleague.backend.certificate.dto.*;
import com.botleague.backend.certificate.entity.CertificateTemplate;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.service.CertificateGenerationService;
import com.botleague.backend.certificate.service.CertificateTemplateService;
import com.botleague.backend.certificate.service.CertificateTypeService;
import com.botleague.backend.certificate.service.CertificateVerificationService;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** BotLeague-provider certificate management — platform admin only. */
@RestController
@RequestMapping("/api/admin/certificates")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
public class AdminCertificateController {

    private final CertificateTemplateService templateService;
    private final CertificateTypeService typeService;
    private final CertificateGenerationService generationService;
    private final CertificateVerificationService verificationService;
    private final UploadService uploadService;
    private final FileKeyService fileKeyService;

    public AdminCertificateController(
            CertificateTemplateService templateService,
            CertificateTypeService typeService,
            CertificateGenerationService generationService,
            CertificateVerificationService verificationService,
            UploadService uploadService,
            FileKeyService fileKeyService) {
        this.templateService = templateService;
        this.typeService = typeService;
        this.generationService = generationService;
        this.verificationService = verificationService;
        this.uploadService = uploadService;
        this.fileKeyService = fileKeyService;
    }

    // ── Templates ────────────────────────────────────────────────────────

    @PostMapping("/templates/upload-url")
    public ResponseEntity<UploadResponse> getTemplateUploadUrl(
            @RequestParam String fileType, @RequestParam long fileSize) {
        String key = fileKeyService.generateCertificateTemplateKey(fileType);
        return ResponseEntity.ok(uploadService.generateCertificateTemplateUploadUrl(key, fileType, fileSize));
    }

    @PostMapping("/templates")
    public ResponseEntity<CertificateTemplateResponse> createTemplate(
            @RequestBody CreateCertificateTemplateRequest req, Authentication auth) {
        return ResponseEntity.ok(templateService.create(CertificateTemplate.PROVIDER_BOTLEAGUE, null, req, extractUserId(auth)));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<CertificateTemplateResponse>> listTemplates() {
        return ResponseEntity.ok(templateService.list(CertificateTemplate.PROVIDER_BOTLEAGUE, null));
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<CertificateTemplateResponse> getTemplate(@PathVariable UUID templateId) {
        return ResponseEntity.ok(templateService.get(templateId, CertificateTemplate.PROVIDER_BOTLEAGUE, null));
    }

    @PatchMapping("/templates/{templateId}")
    public ResponseEntity<CertificateTemplateResponse> updateTemplate(
            @PathVariable UUID templateId, @RequestBody UpdateCertificateTemplateRequest req, Authentication auth) {
        return ResponseEntity.ok(templateService.update(templateId, CertificateTemplate.PROVIDER_BOTLEAGUE, null, req, extractUserId(auth)));
    }

    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<String> archiveTemplate(@PathVariable UUID templateId) {
        templateService.archive(templateId, CertificateTemplate.PROVIDER_BOTLEAGUE, null);
        return ResponseEntity.ok("Template archived");
    }

    // ── Certificate types ────────────────────────────────────────────────

    @PostMapping("/sports/{eventSportId}/types")
    public ResponseEntity<CertificateTypeResponse> createType(
            @PathVariable UUID eventSportId, @RequestBody CreateCertificateTypeRequest req, Authentication auth) {
        return ResponseEntity.ok(typeService.create(CertificateType.PROVIDER_BOTLEAGUE, eventSportId, req, extractUserId(auth)));
    }

    @GetMapping("/sports/{eventSportId}/types")
    public ResponseEntity<List<CertificateTypeResponse>> listTypesForSport(@PathVariable UUID eventSportId) {
        return ResponseEntity.ok(typeService.listForSport(CertificateType.PROVIDER_BOTLEAGUE, eventSportId));
    }

    @GetMapping("/types/{typeId}")
    public ResponseEntity<CertificateTypeResponse> getType(@PathVariable UUID typeId) {
        return ResponseEntity.ok(typeService.get(typeId, CertificateType.PROVIDER_BOTLEAGUE));
    }

    @PatchMapping("/types/{typeId}")
    public ResponseEntity<CertificateTypeResponse> updateType(
            @PathVariable UUID typeId, @RequestBody UpdateCertificateTypeRequest req) {
        return ResponseEntity.ok(typeService.update(typeId, CertificateType.PROVIDER_BOTLEAGUE, req));
    }

    // ── Generation ───────────────────────────────────────────────────────

    @PostMapping("/types/{typeId}/generate")
    public ResponseEntity<CertificateGenerationJobResponse> triggerGeneration(
            @PathVariable UUID typeId, @RequestBody(required = false) TriggerGenerationRequest req, Authentication auth) {
        List<ManualRecipientRequest> manual = req != null ? req.getManualRecipients() : null;
        return ResponseEntity.ok(generationService.trigger(typeId, CertificateType.PROVIDER_BOTLEAGUE, manual, extractUserId(auth)));
    }

    @GetMapping("/types/{typeId}/jobs")
    public ResponseEntity<List<CertificateGenerationJobResponse>> listJobs(@PathVariable UUID typeId) {
        return ResponseEntity.ok(generationService.listForType(typeId, CertificateType.PROVIDER_BOTLEAGUE));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<CertificateGenerationJobResponse> getJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(generationService.get(jobId));
    }

    // ── Issued certificates ──────────────────────────────────────────────

    @GetMapping("/types/{typeId}/issued")
    public ResponseEntity<List<IssuedCertificateResponse>> listIssued(@PathVariable UUID typeId) {
        return ResponseEntity.ok(verificationService.listForType(typeId, CertificateType.PROVIDER_BOTLEAGUE));
    }

    @PostMapping("/issued/{issuedCertificateId}/revoke")
    public ResponseEntity<String> revoke(
            @PathVariable UUID issuedCertificateId, @RequestBody RevokeCertificateRequest req, Authentication auth) {
        verificationService.revoke(issuedCertificateId, req.getReason(), extractUserId(auth));
        return ResponseEntity.ok("Certificate revoked");
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
