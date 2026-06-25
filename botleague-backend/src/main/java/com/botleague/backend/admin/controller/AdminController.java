package com.botleague.backend.admin.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.botleague.backend.admin.dto.AdminAllEventResponse;
import com.botleague.backend.admin.dto.ChangeEventStatusRequest;
import com.botleague.backend.admin.dto.UpdateEventRequest;
import com.botleague.backend.admin.service.AdminService;

@RestController
@RequestMapping("/api/admin")

public class AdminController {

    // =====================================================
    // DEPENDENCY
    // =====================================================

    private final AdminService adminService;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public AdminController(
            AdminService adminService
    ) {
        this.adminService = adminService;
    }

    // =====================================================
    // GET ALL EVENTS
    // =====================================================

    @GetMapping("/events")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<List<AdminAllEventResponse>> getAllEvents() {
        return ResponseEntity.ok(adminService.getAllEvents());
    }

    // =====================================================
    // GET EVENT BY ID
    // =====================================================

    @GetMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER','SUB_ORGANIZER')")
    public ResponseEntity<AdminAllEventResponse> getEventById(
            @PathVariable UUID eventId
    ) {
        return ResponseEntity.ok(adminService.getEventById(eventId));
    }

    @GetMapping("/events/{eventId}/sports/{sportsId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER','SUB_ORGANIZER')")
    public ResponseEntity<AdminAllEventResponse> getEventSportsById(
            @PathVariable UUID eventId,
            @PathVariable UUID sportsId
    ) {
        return ResponseEntity.ok(adminService.getEventById(eventId));
    }

    // =====================================================
    // UPDATE EVENT — full update including tier
    // ADMINISTRATOR and SUPER_ADMIN only.
    // Organisers use PATCH /api/organizer/events/{id}/info.
    // =====================================================

    @PutMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<AdminAllEventResponse> updateEvent(
            @PathVariable UUID eventId,
            @RequestBody UpdateEventRequest request
    ) {
        return ResponseEntity.ok(adminService.updateEvent(eventId, request));
    }

    // =====================================================
    // CHANGE EVENT STATUS  (ADMINISTRATOR and above)
    // =====================================================

    @PatchMapping("/events/{eventId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<AdminAllEventResponse> changeEventStatus(
            @PathVariable UUID eventId,
            @RequestBody ChangeEventStatusRequest request
    ) {
        return ResponseEntity.ok(adminService.changeEventStatus(eventId, request));
    }

    // =====================================================
    // SOFT DELETE EVENT  (MANAGER and above)
    // =====================================================

    @DeleteMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID eventId) {
        adminService.softDeleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }
}