package com.botleague.backend.admin.controller;

import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.AssignJudgeToEventRequest;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.JudgeEventAssignmentResponse;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.SportMatchesResponse;
import com.botleague.backend.admin.service.AdminJudgeAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/judges")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
public class AdminJudgeAssignmentController {

    private final AdminJudgeAssignmentService service;

    public AdminJudgeAssignmentController(AdminJudgeAssignmentService service) {
        this.service = service;
    }

    @GetMapping("/{userId}/assignments")
    public ResponseEntity<List<JudgeEventAssignmentResponse>> getAssignments(@PathVariable UUID userId) {
        return ResponseEntity.ok(service.getAssignments(userId));
    }

    @PostMapping("/{userId}/assignments")
    public ResponseEntity<JudgeEventAssignmentResponse> assignToEvent(
            @PathVariable UUID userId, @RequestBody AssignJudgeToEventRequest req) {
        return ResponseEntity.ok(service.assignToEvent(userId, req.eventId));
    }

    @DeleteMapping("/{userId}/assignments/{eventJudgeId}")
    public ResponseEntity<Void> removeFromEvent(@PathVariable UUID userId, @PathVariable UUID eventJudgeId) {
        service.removeFromEvent(userId, eventJudgeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/events/{eventId}/matches")
    public ResponseEntity<List<SportMatchesResponse>> getEventMatches(@PathVariable UUID eventId) {
        return ResponseEntity.ok(service.getEventMatches(eventId));
    }

    @PostMapping("/{userId}/assignments/{eventJudgeId}/matches/{matchId}")
    public ResponseEntity<Void> assignMatch(
            @PathVariable UUID userId, @PathVariable UUID eventJudgeId, @PathVariable UUID matchId,
            Authentication auth) {
        service.assignMatch(userId, eventJudgeId, matchId, extractUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/assignments/{eventJudgeId}/matches/{matchId}")
    public ResponseEntity<Void> unassignMatch(
            @PathVariable UUID userId, @PathVariable UUID eventJudgeId, @PathVariable UUID matchId) {
        service.unassignMatch(userId, matchId);
        return ResponseEntity.noContent().build();
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
