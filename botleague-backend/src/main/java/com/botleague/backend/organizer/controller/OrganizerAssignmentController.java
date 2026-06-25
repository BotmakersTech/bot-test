package com.botleague.backend.organizer.controller;

import com.botleague.backend.organizer.dto.AssignmentResponse;
import com.botleague.backend.organizer.dto.EventAssignmentRequest;
import com.botleague.backend.organizer.dto.SportAssignmentRequest;
import com.botleague.backend.organizer.service.OrganizerAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Admin-facing APIs for assigning / unassigning organizers to events and sports.
 * Requires MANAGER role minimum (so MANAGER, ADMINISTRATOR, SUPER_ADMIN can call these).
 */
@RestController
@RequestMapping("/api/admin/assignments")
public class OrganizerAssignmentController {

    private final OrganizerAssignmentService service;

    public OrganizerAssignmentController(OrganizerAssignmentService service) {
        this.service = service;
    }

    // ── Event assignments ──────────────────────────────────────────────────────

    @PostMapping("/event")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<AssignmentResponse> assignToEvent(
            Authentication authentication,
            @Valid @RequestBody EventAssignmentRequest request) {

        UUID actorId = UUID.fromString((String) authentication.getPrincipal());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.assignUserToEvent(request, actorId));
    }

    @DeleteMapping("/event")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<Void> unassignFromEvent(
            @RequestParam UUID userId,
            @RequestParam UUID eventId) {

        service.unassignUserFromEvent(userId, eventId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<List<AssignmentResponse>> getEventAssignments(
            @PathVariable UUID eventId) {

        return ResponseEntity.ok(service.getAssignmentsForEvent(eventId));
    }

    @GetMapping("/user/{userId}/events")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<List<AssignmentResponse>> getUserEventAssignments(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(service.getAssignmentsForUser(userId));
    }

    // ── Sport assignments ──────────────────────────────────────────────────────

    @PostMapping("/sport")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<AssignmentResponse> assignToSport(
            Authentication authentication,
            @Valid @RequestBody SportAssignmentRequest request) {

        UUID actorId = UUID.fromString((String) authentication.getPrincipal());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.assignUserToSport(request, actorId));
    }

    @DeleteMapping("/sport")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<Void> unassignFromSport(
            @RequestParam UUID userId,
            @RequestParam UUID eventSportId) {

        service.unassignUserFromSport(userId, eventSportId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sport/{eventSportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<List<AssignmentResponse>> getSportAssignments(
            @PathVariable UUID eventSportId) {

        return ResponseEntity.ok(service.getAssignmentsForSport(eventSportId));
    }
}
