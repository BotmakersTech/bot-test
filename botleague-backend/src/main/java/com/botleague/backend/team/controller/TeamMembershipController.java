package com.botleague.backend.team.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.service.TeamMembershipService;

// Every action here is scoped to the caller's own active team membership
// inside TeamMembershipService (extractUserId(authentication) is what's
// checked for captain/vice-captain status — the {userId} path variable is
// only ever a target, never an authorization source). @PreAuthorize adds
// method-level defense-in-depth on top of that, independent of whatever
// SecurityConfig's filter-chain rules happen to say.
@RestController
@RequestMapping("/api/membership")
@PreAuthorize("isAuthenticated()")
public class TeamMembershipController {

    private final TeamMembershipService
            teamMembershipService;

    public TeamMembershipController(
            TeamMembershipService teamMembershipService
    ) {
        this.teamMembershipService =
                teamMembershipService;
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<String> assignRole(
            @PathVariable UUID userId,
            @RequestParam TeamRole role,
            Authentication authentication
    ) {

        teamMembershipService.assignRole(
                userId,
                role,
                authentication
        );

        return ResponseEntity.ok(
                "Role updated successfully"
        );
    }

    @PatchMapping("/{userId}/transfer-captain")
    public ResponseEntity<String> transferCaptain(
            @PathVariable UUID userId,
            Authentication authentication
    ) {

        teamMembershipService.transferCaptain(
                userId,
                authentication
        );

        return ResponseEntity.ok(
                "Captain transferred"
        );
    }

    @PostMapping("/leave")
    public ResponseEntity<String> leaveTeam(
            Authentication authentication
    ) {

        teamMembershipService.leaveTeam(
                authentication
        );

        return ResponseEntity.ok(
                "Left team successfully"
        );
    }

    @PostMapping("/{userId}/remove")
    public ResponseEntity<String> removeUser(
            @PathVariable UUID userId,
            Authentication authentication
    ) {

        teamMembershipService.removeMember(
                userId,
                authentication
        );

        return ResponseEntity.ok(
                "Member removed successfully"
        );
    }
}