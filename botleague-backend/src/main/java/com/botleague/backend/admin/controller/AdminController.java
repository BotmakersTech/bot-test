package com.botleague.backend.admin.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.service.EventSportsService;
import com.botleague.backend.events.service.SportRegistrationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/admin")

public class AdminController {

    // =====================================================
    // DEPENDENCY
    // =====================================================

    private final AdminService adminService;
    private final EventSportsService eventSportsService;
    private final SportRegistrationService sportRegistrationService;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public AdminController(
            AdminService adminService,
            EventSportsService eventSportsService,
            SportRegistrationService sportRegistrationService
    ) {
        this.adminService = adminService;
        this.eventSportsService = eventSportsService;
        this.sportRegistrationService = sportRegistrationService;
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
            @PathVariable UUID eventId,
            Authentication auth
    ) {
        return ResponseEntity.ok(adminService.getEventById(eventId, extractUserId(auth), extractRoles(auth)));
    }

    @GetMapping("/events/{eventId}/sports/{sportsId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER','SUB_ORGANIZER')")
    public ResponseEntity<AdminAllEventResponse> getEventSportsById(
            @PathVariable UUID eventId,
            @PathVariable UUID sportsId,
            Authentication auth
    ) {
        return ResponseEntity.ok(adminService.getEventById(eventId, extractUserId(auth), extractRoles(auth)));
    }

    // =====================================================
    // UPDATE EVENT — full update
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER')")
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

    // =====================================================
    // SPORT APPROVAL  (ADMINISTRATOR and above)
    // =====================================================

    @PatchMapping("/sports/{sportId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<GetEventSportsDTO> approveSport(@PathVariable UUID sportId) {
        return ResponseEntity.ok(eventSportsService.approveSport(sportId));
    }

    @PatchMapping("/sports/{sportId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<GetEventSportsDTO> rejectSport(
            @PathVariable UUID sportId,
            @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(eventSportsService.rejectSport(sportId, reason));
    }

    // =====================================================
    // ONE-OFF: backfill event-team chat rooms for registrations
    // that happened before that feature existed. Idempotent —
    // safe to call more than once (e.g. once per environment).
    // =====================================================

    @PostMapping("/chat/backfill-event-team-rooms")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<java.util.Map<String, Object>> backfillEventTeamChats() {
        int synced = sportRegistrationService.backfillEventTeamChats();
        return ResponseEntity.ok(java.util.Map.of("registrationsSynced", synced));
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }

    private List<String> extractRoles(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .collect(java.util.stream.Collectors.toList());
    }
}