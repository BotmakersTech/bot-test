package com.botleague.backend.admin.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.botleague.backend.admin.dto.AdminTeamDetail;
import com.botleague.backend.admin.dto.AdminTeamSummary;
import com.botleague.backend.admin.dto.ChangeTeamStatusRequest;
import com.botleague.backend.admin.dto.CreateAdminTeamRequest;
import com.botleague.backend.admin.dto.PagedResponse;
import com.botleague.backend.admin.dto.UpdateTeamRequest;
import com.botleague.backend.admin.service.AdminTeamService;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/api/admin/teams")
public class AdminTeamController {

    private final AdminTeamService adminTeamService;

    public AdminTeamController(AdminTeamService adminTeamService) {
        this.adminTeamService = adminTeamService;
    }

    // ── Create team (admin) ───────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminTeamDetail> createTeam(
            @RequestBody CreateAdminTeamRequest request) {
        return ResponseEntity.ok(adminTeamService.createAdminTeam(request));
    }

    // ── List / search teams ───────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<PagedResponse<AdminTeamSummary>> listTeams(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminTeamService.searchTeams(q, page, size));
    }

    // ── Team detail with members ──────────────────────────────────────────────

    @GetMapping("/{teamId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<AdminTeamDetail> getTeamDetail(@PathVariable UUID teamId) {
        return ResponseEntity.ok(adminTeamService.getTeamDetail(teamId));
    }

    // ── Update team info ──────────────────────────────────────────────────────

    @PutMapping("/{teamId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<AdminTeamDetail> updateTeam(
            @PathVariable UUID teamId,
            @RequestBody UpdateTeamRequest request
    ) {
        return ResponseEntity.ok(adminTeamService.updateTeam(teamId, request));
    }

    // ── Change team status (PENDING / ACTIVE / REJECTED) ─────────────────────

    @PatchMapping("/{teamId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<AdminTeamDetail> changeTeamStatus(
            @PathVariable UUID teamId,
            @RequestBody ChangeTeamStatusRequest request
    ) {
        return ResponseEntity.ok(adminTeamService.changeTeamStatus(teamId, request));
    }

    // ── Remove a member from a team ───────────────────────────────────────────

    @DeleteMapping("/{teamId}/members/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID teamId,
            @PathVariable UUID userId
    ) {
        adminTeamService.removeMember(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Delete a team ─────────────────────────────────────────────────────────

    @DeleteMapping("/{teamId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID teamId) {
        adminTeamService.deleteTeam(teamId);
        return ResponseEntity.noContent().build();
    }
}
