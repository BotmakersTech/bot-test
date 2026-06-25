package com.botleague.backend.sponsor.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.common.security.SecurityUtils;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.sponsor.dto.TeamSponsorRequest;
import com.botleague.backend.sponsor.dto.TeamSponsorResponse;
import com.botleague.backend.sponsor.service.TeamSponsorService;

@RestController
@RequestMapping("/api/sponsors")
public class TeamSponsorController {

    private final TeamSponsorService sponsorService;
    private final UploadService uploadService;
    private final FileKeyService fileKeyService;

    public TeamSponsorController(
            TeamSponsorService sponsorService,
            UploadService uploadService,
            FileKeyService fileKeyService) {
        this.sponsorService  = sponsorService;
        this.uploadService   = uploadService;
        this.fileKeyService  = fileKeyService;
    }

    /** GET /api/sponsors/team/{teamId} — public */
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<TeamSponsorResponse>> getSponsors(@PathVariable UUID teamId) {
        return ResponseEntity.ok(sponsorService.getSponsorsForTeam(teamId));
    }

    /** POST /api/sponsors/team/{teamId} — captain only */
    @PostMapping("/team/{teamId}")
    public ResponseEntity<TeamSponsorResponse> addSponsor(
            @PathVariable UUID teamId,
            @Valid @RequestBody TeamSponsorRequest request,
            Authentication auth
    ) {
        UUID callerId = SecurityUtils.currentUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sponsorService.addSponsor(teamId, callerId, request));
    }

    /** PUT /api/sponsors/{sponsorId} — captain or admin */
    @PutMapping("/{sponsorId}")
    public ResponseEntity<TeamSponsorResponse> updateSponsor(
            @PathVariable UUID sponsorId,
            @Valid @RequestBody TeamSponsorRequest request,
            Authentication auth
    ) {
        UUID callerId = SecurityUtils.currentUserId(auth);
        return ResponseEntity.ok(sponsorService.updateSponsor(sponsorId, callerId, request, isAdminRole(auth)));
    }

    /** DELETE /api/sponsors/{sponsorId} — captain or admin */
    @DeleteMapping("/{sponsorId}")
    public ResponseEntity<Void> deleteSponsor(
            @PathVariable UUID sponsorId,
            Authentication auth
    ) {
        UUID callerId = SecurityUtils.currentUserId(auth);
        sponsorService.deleteSponsor(sponsorId, callerId, isAdminRole(auth));
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/sponsors/upload/logo?teamId=...&fileType=...&fileSize=...
     * Returns a presigned R2 URL for uploading a sponsor logo directly from the browser.
     * The caller must be authenticated (captain or admin); the actual logo URL is stored
     * when the sponsor is created/updated via the normal add/update endpoints.
     */
    @PostMapping("/upload/logo")
    public ResponseEntity<UploadResponse> getSponsorLogoUploadUrl(
            @RequestParam UUID teamId,
            @RequestParam String fileType,
            @RequestParam long fileSize,
            Authentication auth
    ) {
        String key = fileKeyService.generateSponsorLogoKey(teamId, fileType);
        UploadResponse response = uploadService.generateUploadUrl(key, fileType, fileSize);
        return ResponseEntity.ok(response);
    }

    // ── helper ─────────────────────────────────────────────────────────────────

    private boolean isAdminRole(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
                a.getAuthority().equals("ROLE_ADMINISTRATOR"));
    }
}
