package com.botleague.backend.sponsor.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.common.security.SecurityUtils;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.sponsor.dto.SportSponsorRequest;
import com.botleague.backend.sponsor.dto.SportSponsorResponse;
import com.botleague.backend.sponsor.service.SportSponsorService;

@RestController
@RequestMapping("/api/sport-sponsors")
public class SportSponsorController {

    private final SportSponsorService service;
    private final UploadService uploadService;
    private final FileKeyService fileKeyService;

    public SportSponsorController(
            SportSponsorService service,
            UploadService uploadService,
            FileKeyService fileKeyService) {
        this.service        = service;
        this.uploadService  = uploadService;
        this.fileKeyService = fileKeyService;
    }

    /** GET /api/sport-sponsors/sport/{sportId} — public */
    @GetMapping("/sport/{sportId}")
    public ResponseEntity<List<SportSponsorResponse>> getSponsors(@PathVariable UUID sportId) {
        return ResponseEntity.ok(service.getSponsorsForSport(sportId));
    }

    /** POST /api/sport-sponsors/sport/{sportId} — ADMINISTRATOR+ */
    @PostMapping("/sport/{sportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<SportSponsorResponse> addSponsor(
            @PathVariable UUID sportId,
            @Valid @RequestBody SportSponsorRequest request,
            Authentication auth) {
        UUID callerId = SecurityUtils.currentUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addSponsor(sportId, callerId, request));
    }

    /** PUT /api/sport-sponsors/{sponsorId} — ADMINISTRATOR+ */
    @PutMapping("/{sponsorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<SportSponsorResponse> updateSponsor(
            @PathVariable UUID sponsorId,
            @Valid @RequestBody SportSponsorRequest request) {
        return ResponseEntity.ok(service.updateSponsor(sponsorId, request));
    }

    /** DELETE /api/sport-sponsors/{sponsorId} — ADMINISTRATOR+ */
    @DeleteMapping("/{sponsorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Void> deleteSponsor(@PathVariable UUID sponsorId) {
        service.deleteSponsor(sponsorId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/sport-sponsors/upload/logo?sportId=...&fileType=...&fileSize=...
     * Returns a presigned R2 URL for direct browser upload.
     */
    @PostMapping("/upload/logo")
    public ResponseEntity<UploadResponse> getLogoUploadUrl(
            @RequestParam UUID sportId,
            @RequestParam String fileType,
            @RequestParam long fileSize) {
        String key = fileKeyService.generateSportSponsorLogoKey(sportId, fileType);
        return ResponseEntity.ok(uploadService.generateUploadUrl(key, fileType, fileSize));
    }
}
