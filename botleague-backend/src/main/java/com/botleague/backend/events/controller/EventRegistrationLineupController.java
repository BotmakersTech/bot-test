package com.botleague.backend.events.controller;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.SecurityUtils;
import com.botleague.backend.events.dto.LineupRequest;
import com.botleague.backend.events.dto.LineupResponse;
import com.botleague.backend.events.entity.EventRegistrationLineup;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.events.service.SportRegistrationLineupService;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamMembershipRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/event-registration-lineups")
public class EventRegistrationLineupController {

    private final SportRegistrationLineupService lineupService;
    private final TeamMembershipRepository       membershipRepository;
    private final UserRepository                 userRepository;
    private final SportRegistrationRepository    sportRegistrationRepository;

    public EventRegistrationLineupController(
            SportRegistrationLineupService lineupService,
            TeamMembershipRepository       membershipRepository,
            UserRepository                 userRepository,
            SportRegistrationRepository    sportRegistrationRepository
    ) {
        this.lineupService              = lineupService;
        this.membershipRepository       = membershipRepository;
        this.userRepository             = userRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
    }

    // =====================================================
    // GET LINEUP
    // GET /api/event-registration-lineups/{sportRegistrationId}
    // =====================================================

    @GetMapping("/{sportRegistrationId}")
    public ResponseEntity<List<LineupResponse>> getLineup(
            @PathVariable UUID sportRegistrationId
    ) {
        List<EventRegistrationLineup> lineups =
                lineupService.getLineupForRegistration(sportRegistrationId);
        return ResponseEntity.ok(mapToResponseList(lineups));
    }

    // =====================================================
    // ADD MEMBER TO ROBOT LINEUP
    // POST /api/event-registration-lineups
    //
    // Caller must be CAPTAIN or VICE_CAPTAIN of the team that owns
    // the SportRegistration referenced by sportRegistrationId.
    // =====================================================

    @PostMapping
    public ResponseEntity<LineupResponse> addMember(
            @Valid @RequestBody LineupRequest request,
            Authentication authentication
    ) {
        UUID callerId = SecurityUtils.currentUserId(authentication);
        validateLineupMutationAccess(callerId, request.getSportRegistrationId());

        EventRegistrationLineup lineup = lineupService.addMember(
                request.getSportRegistrationId(),
                request.getRobotId(),
                request.getTeamMembershipId(),
                request.getLineupRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapToResponseSingle(lineup));
    }

    // =====================================================
    // GET LINEUP FOR A SPORT REGISTRATION
    // GET /api/event-registration-lineups/registration/{sportRegistrationId}
    // =====================================================

    @GetMapping("/registration/{sportRegistrationId}")
    public ResponseEntity<List<LineupResponse>> getLineupForRegistration(
            @PathVariable UUID sportRegistrationId
    ) {
        List<EventRegistrationLineup> lineups =
                lineupService.getLineupForRegistration(sportRegistrationId);
        return ResponseEntity.ok(mapToResponseList(lineups));
    }

    // =====================================================
    // GET ALL ACTIVE LINEUP ENTRIES FOR A ROBOT
    // GET /api/event-registration-lineups/robot/{robotId}
    // =====================================================

    @GetMapping("/robot/{robotId}")
    public ResponseEntity<List<LineupResponse>> getLineupForRobot(
            @PathVariable UUID robotId
    ) {
        return ResponseEntity.ok(mapToResponseList(lineupService.getLineupForRobot(robotId)));
    }

    // =====================================================
    // GET ACTIVE LINEUP FOR A SPECIFIC ROBOT IN ONE COMPETITION
    // GET /api/event-registration-lineups/registration/{sportRegistrationId}/robot/{robotId}
    // =====================================================

    @GetMapping("/registration/{sportRegistrationId}/robot/{robotId}")
    public ResponseEntity<List<LineupResponse>> getLineupForRobotInSport(
            @PathVariable UUID sportRegistrationId,
            @PathVariable UUID robotId
    ) {
        return ResponseEntity.ok(mapToResponseList(
                lineupService.getLineupForRobotInSport(sportRegistrationId, robotId)));
    }

    // =====================================================
    // GET ALL COMPETITIONS A TEAM MEMBER IS ASSIGNED TO
    // GET /api/event-registration-lineups/member/{teamMembershipId}
    // =====================================================

    @GetMapping("/member/{teamMembershipId}")
    public ResponseEntity<List<LineupResponse>> getLineupForMember(
            @PathVariable UUID teamMembershipId
    ) {
        return ResponseEntity.ok(mapToResponseList(lineupService.getLineupForMember(teamMembershipId)));
    }

    // =====================================================
    // GET FULL TEAM ROSTER IN ONE SPORT
    // GET /api/event-registration-lineups/event-sport/{eventSportId}/team/{teamId}
    // =====================================================

    @GetMapping("/event-sport/{eventSportId}/team/{teamId}")
    public ResponseEntity<List<LineupResponse>> getTeamLineupInSport(
            @PathVariable UUID eventSportId,
            @PathVariable UUID teamId
    ) {
        return ResponseEntity.ok(mapToResponseList(
                lineupService.getTeamLineupInSport(eventSportId, teamId)));
    }

    // =====================================================
    // GET FULL EVENT PARTICIPANT ROSTER
    // GET /api/event-registration-lineups/event/{eventId}
    // =====================================================

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<LineupResponse>> getFullEventRoster(
            @PathVariable UUID eventId
    ) {
        return ResponseEntity.ok(mapToResponseList(lineupService.getFullEventRoster(eventId)));
    }

    // =====================================================
    // UPDATE MEMBER ROLE
    // PATCH /api/event-registration-lineups/{lineupId}/role
    //
    // Caller must be CAPTAIN or VICE_CAPTAIN of the team.
    // =====================================================

    @PatchMapping("/{lineupId}/role")
    public ResponseEntity<LineupResponse> updateRole(
            @PathVariable UUID lineupId,
            @RequestParam String role,
            Authentication authentication
    ) {
        UUID callerId = SecurityUtils.currentUserId(authentication);

        // Resolve the team from the lineup entry to validate ownership
        EventRegistrationLineup existing = lineupService.getLineupById(lineupId);
        validateLineupMutationAccess(callerId, existing.getSportRegistrationId());

        com.botleague.backend.events.enums.LineupRole lineupRole =
                com.botleague.backend.events.enums.LineupRole.valueOf(role.toUpperCase());

        return ResponseEntity.ok(mapToResponseSingle(lineupService.updateRole(lineupId, lineupRole)));
    }

    // =====================================================
    // REMOVE MEMBER (soft-delete)
    // DELETE /api/event-registration-lineups/{lineupId}
    //
    // Caller must be CAPTAIN or VICE_CAPTAIN of the team.
    // =====================================================

    @DeleteMapping("/{lineupId}")
    public ResponseEntity<String> removeMember(
            @PathVariable UUID lineupId,
            Authentication authentication
    ) {
        UUID callerId = SecurityUtils.currentUserId(authentication);

        EventRegistrationLineup existing = lineupService.getLineupById(lineupId);
        validateLineupMutationAccess(callerId, existing.getSportRegistrationId());

        lineupService.removeMember(lineupId);
        return ResponseEntity.ok("Lineup member removed successfully");
    }

    // =====================================================
    // AUTHORIZATION HELPER
    //
    // Verifies the caller is CAPTAIN or VICE_CAPTAIN of the team that
    // owns the given SportRegistration.
    // =====================================================

    private void validateLineupMutationAccess(UUID callerId, UUID sportRegistrationId) {
        UUID teamId = sportRegistrationRepository.findById(sportRegistrationId)
                .map(reg -> reg.getTeamId())
                .orElseThrow(() -> ApiException.notFound("Sport registration not found: " + sportRegistrationId));

        TeamMembership membership = membershipRepository
                .findByTeamIdAndUserIdAndStatus(teamId, callerId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.forbidden("You are not an active member of this team"));

        if (membership.getRoleInTeam() != TeamRole.CAPTAIN
                && membership.getRoleInTeam() != TeamRole.VICE_CAPTAIN) {
            throw ApiException.forbidden("Only captains and vice-captains can manage the lineup");
        }
    }

    // =====================================================
    // BATCH MAPPER  (fixes N+1 — one DB call per type for the whole list)
    // =====================================================

    private List<LineupResponse> mapToResponseList(List<EventRegistrationLineup> lineups) {
        if (lineups == null || lineups.isEmpty()) return List.of();

        // Batch-load all memberships referenced by this response set
        Set<UUID> membershipIds = lineups.stream()
                .map(EventRegistrationLineup::getTeamMembershipId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, TeamMembership> membershipMap = membershipRepository
                .findAllById(membershipIds)
                .stream()
                .collect(Collectors.toMap(TeamMembership::getId, Function.identity()));

        // Batch-load all users from those memberships
        Set<UUID> userIds = membershipMap.values().stream()
                .map(TeamMembership::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, User> userMap = userRepository
                .findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return lineups.stream()
                .map(l -> buildResponse(l, membershipMap, userMap))
                .collect(Collectors.toList());
    }

    /** Single-item convenience — still uses the batch path to stay consistent. */
    private LineupResponse mapToResponseSingle(EventRegistrationLineup lineup) {
        return mapToResponseList(List.of(lineup)).get(0);
    }

    private LineupResponse buildResponse(
            EventRegistrationLineup lineup,
            Map<UUID, TeamMembership> membershipMap,
            Map<UUID, User> userMap
    ) {
        LineupResponse response = new LineupResponse();
        response.setLineupId(lineup.getId());
        response.setSportRegistrationId(lineup.getSportRegistrationId());
        response.setRobotId(lineup.getRobotId());
        response.setTeamMembershipId(lineup.getTeamMembershipId());
        response.setEventId(lineup.getEventId());
        response.setEventSportId(lineup.getEventSportId());
        response.setTeamId(lineup.getTeamId());
        response.setLineupRole(lineup.getLineupRole());
        response.setIsActive(lineup.getIsActive());
        response.setCreatedAt(lineup.getCreatedAt());

        TeamMembership membership = membershipMap.get(lineup.getTeamMembershipId());
        if (membership != null) {
            response.setTeamRole(membership.getRoleInTeam());
            User user = userMap.get(membership.getUserId());
            if (user != null) {
                response.setUserId(user.getId());
                response.setBotleagueId(user.getBotleagueId());
                response.setMemberName(buildDisplayName(user));
            }
        }
        return response;
    }

    private String buildDisplayName(User user) {
        String first = user.getFirstName();
        String last  = user.getLastName();
        if (first != null && last != null) return (first + " " + last).trim();
        if (first != null) return first;
        if (last  != null) return last;
        return user.getUsername() != null ? user.getUsername() : "Unknown";
    }
}
