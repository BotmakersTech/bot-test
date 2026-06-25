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
import com.botleague.backend.sponsor.dto.EventSponsorRequest;
import com.botleague.backend.sponsor.dto.EventSponsorResponse;
import com.botleague.backend.sponsor.service.EventSponsorService;

@RestController
@RequestMapping("/api/event-sponsors")
public class EventSponsorController {

    private final EventSponsorService service;
    private final UploadService uploadService;
    private final FileKeyService fileKeyService;

    public EventSponsorController(
            EventSponsorService service,
            UploadService uploadService,
            FileKeyService fileKeyService) {
        this.service       = service;
        this.uploadService = uploadService;
        this.fileKeyService = fileKeyService;
    }

    /** GET /api/event-sponsors/event/{eventId} — public */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<EventSponsorResponse>> getSponsors(@PathVariable UUID eventId) {
        return ResponseEntity.ok(service.getSponsorsForEvent(eventId));
    }

    /** POST /api/event-sponsors/event/{eventId} — ADMINISTRATOR+ */
    @PostMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<EventSponsorResponse> addSponsor(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventSponsorRequest request,
            Authentication auth) {
        UUID callerId = SecurityUtils.currentUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addSponsor(eventId, callerId, request));
    }

    /** PUT /api/event-sponsors/{sponsorId} — ADMINISTRATOR+ */
    @PutMapping("/{sponsorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<EventSponsorResponse> updateSponsor(
            @PathVariable UUID sponsorId,
            @Valid @RequestBody EventSponsorRequest request) {
        return ResponseEntity.ok(service.updateSponsor(sponsorId, request));
    }

    /** DELETE /api/event-sponsors/{sponsorId} — ADMINISTRATOR+ */
    @DeleteMapping("/{sponsorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> deleteSponsor(@PathVariable UUID sponsorId) {
        service.deleteSponsor(sponsorId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/event-sponsors/upload/logo?eventId=...&fileType=...&fileSize=...
     * Returns a presigned R2 URL for direct browser upload.
     */
    @PostMapping("/upload/logo")
    public ResponseEntity<UploadResponse> getLogoUploadUrl(
            @RequestParam UUID eventId,
            @RequestParam String fileType,
            @RequestParam long fileSize) {
        String key = fileKeyService.generateEventSponsorLogoKey(eventId, fileType);
        return ResponseEntity.ok(uploadService.generateUploadUrl(key, fileType, fileSize));
    }
}
