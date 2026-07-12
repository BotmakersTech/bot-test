package com.botleague.backend.events.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.events.dto.EventSportsRequestDTO;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.dto.UpdateSportsDTO;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.enums.SportMediaSlot;
import com.botleague.backend.events.service.EventSportsService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.team.dto.MediaRequest;

@RestController
@RequestMapping("/api/events/{eventId}/sports")
public class EventSportsController {

    private final EventSportsService service;
    private final AuthorizationService authorizationService;
    private final UploadService uploadService;
    private final FileKeyService fileKeyService;

    public EventSportsController(
            EventSportsService service,
            AuthorizationService authorizationService,
            UploadService uploadService,
            FileKeyService fileKeyService) {
        this.service = service;
        this.authorizationService = authorizationService;
        this.uploadService = uploadService;
        this.fileKeyService = fileKeyService;
    }

    // =========================
    // CREATE SPORT
    // =========================
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<EventSports> createEventSport(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventSportsRequestDTO dto,
            Authentication auth) {

        dto.setEventId(eventId);

        // Privileged roles (platform admins, or the organiser who owns this
        // event) get immediate approval; EVENT_HEAD goes through the approval
        // workflow starting at DRAFT.
        UUID currentUserId = extractUserId(auth);
        boolean isPrivileged = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .anyMatch(r -> r.equals("ROLE_SUPER_ADMIN") || r.equals("ROLE_ADMIN"))
                || authorizationService.isOrganiserOwner(currentUserId, eventId);

        SportEventStatus initialStatus = isPrivileged
                ? SportEventStatus.APPROVED
                : SportEventStatus.DRAFT;

        EventSports response = service.addSport(dto, initialStatus);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // =========================
    // UPDATE SPORT
    // =========================
    @PatchMapping("/{sportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<String> updateEventSport(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            @Valid @RequestBody UpdateSportsDTO dto,
            Authentication auth) {

        dto.setEventId(eventId);
        dto.setSportId(sportId);
        service.updateSports(dto, extractUserId(auth), extractRoles(auth));
        return ResponseEntity.ok("Sport updated successfully");
    }

    // =========================
    // TOGGLE REGISTRATION OPEN/CLOSED
    // =========================
    @PatchMapping("/{sportId}/registration")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<String> toggleRegistration(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            Authentication auth) {

        String status = service.updateSportsRegistration(sportId, eventId, extractUserId(auth), extractRoles(auth));
        return ResponseEntity.ok("Registration status updated to " + status);
    }

    // =========================
    // LIST SPORTS FOR AN EVENT
    // Public — any visitor browsing the event page must be able to see sports.
    // =========================
    @GetMapping
    public ResponseEntity<List<GetEventSportsDTO>> getEventSports(
            @PathVariable UUID eventId) {

        List<GetEventSportsDTO> response = service.getEventSports(eventId);
        return ResponseEntity.ok(response);
    }

    // =========================
    // SPORT MEDIA — thumbnail + teaser video
    // SPORT_HEAD must be able to reach these for their own assigned sport, so
    // permission is enforced inside the service via assertCanManageSport
    // rather than a class/method-level role allowlist.
    // =========================
    @PostMapping("/{sportId}/media/{slot}/upload-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UploadResponse> getSportMediaUploadUrl(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            @PathVariable SportMediaSlot slot,
            @RequestParam String fileType,
            @RequestParam long fileSize,
            Authentication auth) {

        authorizationService.assertCanManageSport(extractUserId(auth), sportId);

        String key = fileKeyService.generateSportMediaKey(sportId, slot.name(), fileType);
        UploadResponse response = uploadService.generateUploadUrl(key, fileType, fileSize);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{sportId}/media/{slot}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> confirmSportMediaUpload(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            @PathVariable SportMediaSlot slot,
            @RequestBody MediaRequest request,
            Authentication auth) {

        service.saveSportMediaSlot(eventId, sportId, slot, request.getKey(), request.getFileType(), extractUserId(auth));
        return ResponseEntity.ok("Sport media saved");
    }

    @DeleteMapping("/{sportId}/media/{slot}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> clearSportMedia(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            @PathVariable SportMediaSlot slot,
            Authentication auth) {

        service.clearSportMediaSlot(eventId, sportId, slot, extractUserId(auth));
        return ResponseEntity.ok("Sport media removed");
    }

    // =========================
    // HELPERS
    // =========================

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }

    private List<String> extractRoles(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .map(a -> a.replace("ROLE_", ""))
                .collect(java.util.stream.Collectors.toList());
    }
}