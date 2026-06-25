package com.botleague.backend.team.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.service.TeamMembershipService;

@RestController
@RequestMapping("/api/membership")
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