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
import com.botleague.backend.events.dto.EventSportsRequestDTO;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.dto.UpdateSportsDTO;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.service.EventSportsService;

@RestController
@RequestMapping("/api/events/{eventId}/sports")
public class EventSportsController {

    private final EventSportsService service;
    private final AuthorizationService authorizationService;

    public EventSportsController(EventSportsService service, AuthorizationService authorizationService) {
        this.service = service;
        this.authorizationService = authorizationService;
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