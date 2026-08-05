package com.botleague.backend.organizer.controller;

import com.botleague.backend.organizer.dto.OrganizerDTOs.VolunteerApplicationRequest;
import com.botleague.backend.organizer.dto.OrganizerDTOs.VolunteerResponse;
import com.botleague.backend.organizer.service.VolunteerApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Self-service "apply to volunteer" flow — distinct from the organiser
 * roster CRUD under /api/organizer/events/{eventId}/volunteers.
 */
@RestController
@RequestMapping("/api/events/{eventId}/volunteer-applications")
public class VolunteerApplicationController {

    private final VolunteerApplicationService applicationService;

    public VolunteerApplicationController(VolunteerApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VolunteerResponse> getMyApplication(
            @PathVariable UUID eventId, Authentication auth) {
        VolunteerResponse response = applicationService.getMyApplication(eventId, extractUserId(auth));
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VolunteerResponse> apply(
            @PathVariable UUID eventId,
            @RequestBody(required = false) VolunteerApplicationRequest req,
            Authentication auth) {
        return ResponseEntity.ok(applicationService.apply(eventId, extractUserId(auth), req));
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
