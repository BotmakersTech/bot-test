package com.botleague.backend.organizer.controller;

import com.botleague.backend.organizer.dto.OrganizerDTOs.VolunteerAssignmentResponse;
import com.botleague.backend.organizer.service.VolunteerApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** The volunteer's own view of their applications/assignments across every event. */
@RestController
@RequestMapping("/api/volunteers/me")
public class VolunteerMeController {

    private final VolunteerApplicationService applicationService;

    public VolunteerMeController(VolunteerApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/assignments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<VolunteerAssignmentResponse>> getMyAssignments(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        return ResponseEntity.ok(applicationService.getMyAssignments(userId));
    }
}
