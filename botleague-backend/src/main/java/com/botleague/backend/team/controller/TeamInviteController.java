package com.botleague.backend.team.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


import com.botleague.backend.team.dto.GetInvitedPlayersResponseDTO;
import com.botleague.backend.team.dto.InviteTeamMemberRequestDTO;
import com.botleague.backend.team.dto.TeamInviteResponseDTO;
import com.botleague.backend.team.service.TeamInviteService;
import com.botleague.backend.team.service.TeamMembershipService;

@RestController
@RequestMapping("api")
public class TeamInviteController {

    private final TeamInviteService teamInviteService;
    private final TeamMembershipService teamMembershipService;

    public TeamInviteController(
            TeamInviteService teamInviteService,
            TeamMembershipService teamMembershipService
    ) {
        this.teamInviteService = teamInviteService;
        this.teamMembershipService = teamMembershipService;
    }

    /*
     * =========================================================
     * GET TEAM INVITABLE PLAYERS
     * GET /api/team-invites/invites
     * =========================================================
     */
    @GetMapping("/team-invites/invites")
    public ResponseEntity<GetInvitedPlayersResponseDTO> getInvites(
            Authentication authentication
    ) {

        GetInvitedPlayersResponseDTO response =
                teamMembershipService.getInvites(authentication);

        return ResponseEntity.ok(response);
    }

    /*
     * =========================================================
     * SEND INVITE
     * POST /api/teams/{teamCode}/invites
     * =========================================================
     */
    @PostMapping("/team-invites/teams/{teamCode}/invite")
    public ResponseEntity<TeamInviteResponseDTO> inviteMember(
            @PathVariable String teamCode,
            @Valid @RequestBody InviteTeamMemberRequestDTO request,
            Authentication authentication
    ) {

        UUID currentUserId =
                getCurrentUser(authentication);

        TeamInviteResponseDTO response =
                teamInviteService.sendInvite(
                        teamCode,
                        request.getInvitedUserId(),
                        request.getRole(),
                        currentUserId
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * =========================================================
     * ACCEPT INVITE
     * POST /api/team-invites/{inviteId}/accept
     * =========================================================
     */
    @PostMapping("/team-invites/{inviteId}/accept")
    public ResponseEntity<TeamInviteResponseDTO> acceptInvite(
            @PathVariable UUID inviteId,
            Authentication authentication
    ) {

        UUID currentUserId =
                getCurrentUser(authentication);

        TeamInviteResponseDTO response =
                teamInviteService.acceptInvite(
                        inviteId,
                        currentUserId
                );

        return ResponseEntity.ok(response);
    }

    /*
     * =========================================================
     * REJECT INVITE
     * POST /api/team-invites/{inviteId}/reject
     * =========================================================
     */
    @PostMapping("/team-invites/{inviteId}/reject")
    public ResponseEntity<TeamInviteResponseDTO> rejectInvite(
            @PathVariable UUID inviteId,
            Authentication authentication
    ) {

        UUID currentUserId =
                getCurrentUser(authentication);

        TeamInviteResponseDTO response =
                teamInviteService.rejectInvite(
                        inviteId,
                        currentUserId
                );

        return ResponseEntity.ok(response);
    }

    /*
     * =========================================================
     * REVOKE INVITE
     * DELETE /api/team-invites/{inviteId}
     * =========================================================
     */
    @DeleteMapping("/team-invites/{inviteId}")
    public ResponseEntity<TeamInviteResponseDTO> revokeInvite(
            @PathVariable UUID inviteId,
            Authentication authentication
    ) {

        UUID currentUserId =
                getCurrentUser(authentication);

        TeamInviteResponseDTO response =
                teamInviteService.revokeInvite(
                        inviteId,
                        currentUserId
                );

        return ResponseEntity.ok(response);
    }

    /*
     * =========================================================
     * GET MY INVITES
     * GET /api/team-invites/my
     * =========================================================
     */
    @GetMapping("/team-invites/my")
    public ResponseEntity<List<TeamInviteResponseDTO>> getMyInvites(
            Authentication authentication
    ) {

        UUID currentUserId =
                getCurrentUser(authentication);

        List<TeamInviteResponseDTO> response =
                teamInviteService.getMyInvites(
                        currentUserId
                );

        return ResponseEntity.ok(response);
    }

    /*
     * =========================================================
     * HELPER
     * =========================================================
     */
    private UUID getCurrentUser(
            Authentication authentication
    ) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}