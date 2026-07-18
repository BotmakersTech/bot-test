package com.botleague.backend.sponsor.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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

    /** POST /api/event-sponsors/event/{eventId} — ADMINISTRATOR+, or ORGANIZER assigned to this event */
    @PostMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<EventSponsorResponse> addSponsor(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventSponsorRequest request,
            Authentication auth) {
        UUID callerId = SecurityUtils.currentUserId(auth);
        service.assertCanManage(eventId, callerId, extractRoles(auth));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addSponsor(eventId, callerId, request));
    }

    /** PUT /api/event-sponsors/{sponsorId} — ADMINISTRATOR+, or ORGANIZER assigned to this event */
    @PutMapping("/{sponsorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<EventSponsorResponse> updateSponsor(
            @PathVariable UUID sponsorId,
            @Valid @RequestBody EventSponsorRequest request,
            Authentication auth) {
        UUID eventId = service.getEventIdForSponsor(sponsorId);
        service.assertCanManage(eventId, SecurityUtils.currentUserId(auth), extractRoles(auth));
        return ResponseEntity.ok(service.updateSponsor(sponsorId, request));
    }

    /** DELETE /api/event-sponsors/{sponsorId} — ADMINISTRATOR+, or ORGANIZER assigned to this event */
    @DeleteMapping("/{sponsorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteSponsor(@PathVariable UUID sponsorId, Authentication auth) {
        UUID eventId = service.getEventIdForSponsor(sponsorId);
        service.assertCanManage(eventId, SecurityUtils.currentUserId(auth), extractRoles(auth));
        service.deleteSponsor(sponsorId);
        return ResponseEntity.noContent().build();
    }

    private List<String> extractRoles(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .collect(Collectors.toList());
    }

    /**
     * POST /api/event-sponsors/upload/logo?eventId=...&fileType=...&fileSize=...
     * Returns a presigned R2 URL for direct browser upload. Was previously
     * permitAll() with no auth check at all — same authorization bar as
     * add/update/delete above.
     */
    @PostMapping("/upload/logo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<UploadResponse> getLogoUploadUrl(
            @RequestParam UUID eventId,
            @RequestParam String fileType,
            @RequestParam long fileSize,
            Authentication auth) {
        service.assertCanManage(eventId, SecurityUtils.currentUserId(auth), extractRoles(auth));
        String key = fileKeyService.generateEventSponsorLogoKey(eventId, fileType);
        return ResponseEntity.ok(uploadService.generateUploadUrl(key, fileType, fileSize));
    }
}
