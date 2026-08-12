package com.botleague.backend.admin.controller;

import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.AssignJudgeToEventRequest;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.AssignSportRequest;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.EventSportOptionResponse;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.JudgeEventAssignmentResponse;
import com.botleague.backend.admin.service.AdminJudgeAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/events/{eventId}/sports")
    public ResponseEntity<List<EventSportOptionResponse>> getEventSports(@PathVariable UUID eventId) {
        return ResponseEntity.ok(service.getEventSports(eventId));
    }

    @PutMapping("/{userId}/assignments/{eventJudgeId}/sport")
    public ResponseEntity<JudgeEventAssignmentResponse> assignSport(
            @PathVariable UUID userId, @PathVariable UUID eventJudgeId, @RequestBody AssignSportRequest req) {
        return ResponseEntity.ok(service.assignSport(userId, eventJudgeId, req.eventSportId));
    }

    @DeleteMapping("/{userId}/assignments/{eventJudgeId}/sport")
    public ResponseEntity<JudgeEventAssignmentResponse> unassignSport(
            @PathVariable UUID userId, @PathVariable UUID eventJudgeId) {
        return ResponseEntity.ok(service.unassignSport(userId, eventJudgeId));
    }
}
