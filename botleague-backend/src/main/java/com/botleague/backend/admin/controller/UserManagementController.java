package com.botleague.backend.admin.controller;

import com.botleague.backend.admin.dto.AssignEventRequest;
import com.botleague.backend.admin.dto.AssignRoleRequest;
import com.botleague.backend.admin.dto.AssignSportRequest;
import com.botleague.backend.admin.dto.CreateAdminUserRequest;
import com.botleague.backend.admin.dto.PagedResponse;
import com.botleague.backend.admin.dto.UpdateUserProfileRequest;
import com.botleague.backend.admin.dto.UserSummaryResponse;
import com.botleague.backend.admin.service.UserManagementService;
import java.util.List;
import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.enums.AccountType;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class UserManagementController {

    private static final Logger log = LoggerFactory.getLogger(UserManagementController.class);

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    // ── Create user (admin) ───────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<UserSummaryResponse> createUser(
            @Valid @RequestBody CreateAdminUserRequest request) {
        return ResponseEntity.ok(userManagementService.createAdminUser(request));
    }

    // ── Users with no active team membership (for captain picker) ─────────

    @GetMapping("/no-team")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<UserSummaryResponse>> getUsersWithoutTeam() {
        return ResponseEntity.ok(userManagementService.getUsersWithoutTeam());
    }

    // ── List / Search ─────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<PagedResponse<UserSummaryResponse>> listUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userManagementService.searchUsers(q, page, size));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<UserSummaryResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(userManagementService.getUserDetail(userId));
    }

    @PatchMapping("/{userId}/profile")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<UserSummaryResponse> updateUserProfile(
            @PathVariable UUID userId,
            @RequestBody UpdateUserProfileRequest request) {
        return ResponseEntity.ok(userManagementService.updateUserProfile(userId, request));
    }

    // ── Role management ───────────────────────────────────────────────────

    @PostMapping("/{userId}/role")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> assignRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request,
            Authentication auth) {
        UUID adminId = UUID.fromString((String) auth.getPrincipal());
        userManagementService.assignRole(userId, request.getRole(), adminId);
        log.info("Role {} assigned to user {} by {}", request.getRole(), userId, adminId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/role/{role}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> removeRole(
            @PathVariable UUID userId,
            @PathVariable AccountType role,
            Authentication auth) {
        UUID adminId = UUID.fromString((String) auth.getPrincipal());
        userManagementService.removeRole(userId, role, adminId);
        return ResponseEntity.noContent().build();
    }

    // ── Account status ────────────────────────────────────────────────────

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID userId,
            @RequestParam AccountStatus status) {
        userManagementService.updateAccountStatus(userId, status);
        return ResponseEntity.noContent().build();
    }

    // ── Event assignments ─────────────────────────────────────────────────
    // MANAGER and above

    @PostMapping("/{userId}/assignments/events")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> assignEvent(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignEventRequest request,
            Authentication auth) {
        UUID adminId = UUID.fromString((String) auth.getPrincipal());
        userManagementService.assignEvent(userId, request.getEventId(), adminId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/assignments/events/{eventId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> removeEventAssignment(
            @PathVariable UUID userId,
            @PathVariable UUID eventId) {
        userManagementService.removeEventAssignment(userId, eventId);
        return ResponseEntity.noContent().build();
    }

    // ── Sport assignments ─────────────────────────────────────────────────

    @PostMapping("/{userId}/assignments/sports")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> assignSport(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignSportRequest request,
            Authentication auth) {
        UUID adminId = UUID.fromString((String) auth.getPrincipal());
        userManagementService.assignSport(userId, request.getEventSportId(), request.getEventId(), adminId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/assignments/sports/{sportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<Void> removeSportAssignment(
            @PathVariable UUID userId,
            @PathVariable UUID sportId) {
        userManagementService.removeSportAssignment(userId, sportId);
        return ResponseEntity.noContent().build();
    }
}
