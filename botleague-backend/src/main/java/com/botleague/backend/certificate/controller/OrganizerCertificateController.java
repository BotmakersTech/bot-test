package com.botleague.backend.certificate.controller;

import com.botleague.backend.certificate.dto.*;
import com.botleague.backend.certificate.entity.CertificateTemplate;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.service.CertificateGenerationService;
import com.botleague.backend.certificate.service.CertificateTemplateService;
import com.botleague.backend.certificate.service.CertificateTypeService;
import com.botleague.backend.certificate.service.CertificateVerificationService;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * ORGANISER-provider certificate management, scoped by AuthorizationService
 * the same way every other sport-management endpoint in this app is —
 * templates are the organiser's own personal gallery (owner_user_id =
 * caller), certificate types/generation are scoped per-sport via
 * assertCanManageSport, reusing the exact ownership chain the rest of the
 * platform already relies on (no new authorization concept for this feature).
 */
@RestController
@RequestMapping("/api/organizer/certificates")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
public class OrganizerCertificateController {

    private final CertificateTemplateService templateService;
    private final CertificateTypeService typeService;
    private final CertificateGenerationService generationService;
    private final CertificateVerificationService verificationService;
    private final AuthorizationService authorizationService;
    private final UploadService uploadService;
    private final FileKeyService fileKeyService;

    public OrganizerCertificateController(
            CertificateTemplateService templateService,
            CertificateTypeService typeService,
            CertificateGenerationService generationService,
            CertificateVerificationService verificationService,
            AuthorizationService authorizationService,
            UploadService uploadService,
            FileKeyService fileKeyService) {
        this.templateService = templateService;
        this.typeService = typeService;
        this.generationService = generationService;
        this.verificationService = verificationService;
        this.authorizationService = authorizationService;
        this.uploadService = uploadService;
        this.fileKeyService = fileKeyService;
    }

    // ── Templates (organiser's own gallery) ─────────────────────────────

    @PostMapping("/templates/upload-url")
    public ResponseEntity<UploadResponse> getTemplateUploadUrl(
            @RequestParam String fileType, @RequestParam long fileSize) {
        String key = fileKeyService.generateCertificateTemplateKey(fileType);
        return ResponseEntity.ok(uploadService.generateCertificateTemplateUploadUrl(key, fileType, fileSize));
    }

    @PostMapping("/templates")
    public ResponseEntity<CertificateTemplateResponse> createTemplate(
            @RequestBody CreateCertificateTemplateRequest req, Authentication auth) {
        UUID callerId = extractUserId(auth);
        return ResponseEntity.ok(templateService.create(CertificateTemplate.PROVIDER_ORGANISER, callerId, req, callerId));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<CertificateTemplateResponse>> listTemplates(Authentication auth) {
        UUID callerId = extractUserId(auth);
        return ResponseEntity.ok(templateService.list(CertificateTemplate.PROVIDER_ORGANISER, callerId));
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<CertificateTemplateResponse> getTemplate(@PathVariable UUID templateId, Authentication auth) {
        return ResponseEntity.ok(templateService.get(templateId, CertificateTemplate.PROVIDER_ORGANISER, extractUserId(auth)));
    }

    @PatchMapping("/templates/{templateId}")
    public ResponseEntity<CertificateTemplateResponse> updateTemplate(
            @PathVariable UUID templateId, @RequestBody UpdateCertificateTemplateRequest req, Authentication auth) {
        UUID callerId = extractUserId(auth);
        return ResponseEntity.ok(templateService.update(templateId, CertificateTemplate.PROVIDER_ORGANISER, callerId, req, callerId));
    }

    @DeleteMapping("/templates/{templateId}")
    public ResponseEntity<String> archiveTemplate(@PathVariable UUID templateId, Authentication auth) {
        templateService.archive(templateId, CertificateTemplate.PROVIDER_ORGANISER, extractUserId(auth));
        return ResponseEntity.ok("Template archived");
    }

    // ── Certificate types (per-sport) ────────────────────────────────────

    @PostMapping("/sports/{eventSportId}/types")
    public ResponseEntity<CertificateTypeResponse> createType(
            @PathVariable UUID eventSportId, @RequestBody CreateCertificateTypeRequest req, Authentication auth) {
        UUID callerId = extractUserId(auth);
        authorizationService.assertCanManageSport(callerId, eventSportId);
        return ResponseEntity.ok(typeService.create(CertificateType.PROVIDER_ORGANISER, eventSportId, req, callerId));
    }

    @GetMapping("/sports/{eventSportId}/types")
    public ResponseEntity<List<CertificateTypeResponse>> listTypesForSport(
            @PathVariable UUID eventSportId, Authentication auth) {
        authorizationService.assertCanManageSport(extractUserId(auth), eventSportId);
        return ResponseEntity.ok(typeService.listForSport(CertificateType.PROVIDER_ORGANISER, eventSportId));
    }

    @GetMapping("/types/{typeId}")
    public ResponseEntity<CertificateTypeResponse> getType(@PathVariable UUID typeId, Authentication auth) {
        UUID callerId = extractUserId(auth);
        CertificateType type = typeService.getEntity(typeId);
        authorizationService.assertCanManageSport(callerId, type.getEventSportId());
        return ResponseEntity.ok(typeService.get(typeId, CertificateType.PROVIDER_ORGANISER));
    }

    @PatchMapping("/types/{typeId}")
    public ResponseEntity<CertificateTypeResponse> updateType(
            @PathVariable UUID typeId, @RequestBody UpdateCertificateTypeRequest req, Authentication auth) {
        UUID callerId = extractUserId(auth);
        CertificateType type = typeService.getEntity(typeId);
        authorizationService.assertCanManageSport(callerId, type.getEventSportId());
        return ResponseEntity.ok(typeService.update(typeId, CertificateType.PROVIDER_ORGANISER, req));
    }

    // ── Generation ───────────────────────────────────────────────────────

    @PostMapping("/types/{typeId}/generate")
    public ResponseEntity<CertificateGenerationJobResponse> triggerGeneration(
            @PathVariable UUID typeId, @RequestBody(required = false) TriggerGenerationRequest req, Authentication auth) {
        UUID callerId = extractUserId(auth);
        CertificateType type = typeService.getEntity(typeId);
        authorizationService.assertCanManageSport(callerId, type.getEventSportId());
        List<ManualRecipientRequest> manual = req != null ? req.getManualRecipients() : null;
        return ResponseEntity.ok(generationService.trigger(typeId, CertificateType.PROVIDER_ORGANISER, manual, callerId));
    }

    @GetMapping("/types/{typeId}/jobs")
    public ResponseEntity<List<CertificateGenerationJobResponse>> listJobs(@PathVariable UUID typeId, Authentication auth) {
        UUID callerId = extractUserId(auth);
        CertificateType type = typeService.getEntity(typeId);
        authorizationService.assertCanManageSport(callerId, type.getEventSportId());
        return ResponseEntity.ok(generationService.listForType(typeId, CertificateType.PROVIDER_ORGANISER));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<CertificateGenerationJobResponse> getJob(@PathVariable UUID jobId, Authentication auth) {
        CertificateGenerationJobResponse job = generationService.get(jobId);
        CertificateType type = typeService.getEntity(job.getCertificateTypeId());
        authorizationService.assertCanManageSport(extractUserId(auth), type.getEventSportId());
        return ResponseEntity.ok(job);
    }

    // ── Issued certificates ──────────────────────────────────────────────

    @GetMapping("/types/{typeId}/issued")
    public ResponseEntity<List<IssuedCertificateResponse>> listIssued(@PathVariable UUID typeId, Authentication auth) {
        UUID callerId = extractUserId(auth);
        CertificateType type = typeService.getEntity(typeId);
        authorizationService.assertCanManageSport(callerId, type.getEventSportId());
        return ResponseEntity.ok(verificationService.listForType(typeId, CertificateType.PROVIDER_ORGANISER));
    }

    @PostMapping("/issued/{issuedCertificateId}/revoke")
    public ResponseEntity<String> revoke(
            @PathVariable UUID issuedCertificateId, @RequestBody RevokeCertificateRequest req, Authentication auth) {
        // CertificateVerificationService.revoke() itself calls assertCanManageSport
        // against the certificate's own eventSportId — no need to duplicate here.
        verificationService.revoke(issuedCertificateId, req.getReason(), extractUserId(auth));
        return ResponseEntity.ok("Certificate revoked");
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
