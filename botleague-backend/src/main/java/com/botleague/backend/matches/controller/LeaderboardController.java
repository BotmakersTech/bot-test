package com.botleague.backend.matches.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.botleague.backend.matches.dto.AwardBonusPointsRequest;
import com.botleague.backend.matches.dto.LeaderboardResponseDTO;
import com.botleague.backend.matches.service.LeaderboardService;

/**
 * Leaderboard endpoints for a bracket.
 *
 *   GET  /v1/leaderboard/event-sport/{eventSportId}         — public read
 *   POST /v1/leaderboard/event-sport/{eventSportId}/bonus   — award/dock
 *        discretionary points (sport-management auth, checked in the service)
 *
 * The read endpoint stays public, mirroring the other match READ endpoints.
 * The bonus endpoint requires authentication; LeaderboardService.awardBonusPoints
 * does the actual authorization check (assertCanManageSport), same pattern
 * MatchService uses for its own sport-management actions.
 */
@RestController
@RequestMapping("/api/v1/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/event-sport/{eventSportId}")
    public ResponseEntity<LeaderboardResponseDTO> getLeaderboard(
            @PathVariable UUID eventSportId
    ) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(eventSportId));
    }

    @PostMapping("/event-sport/{eventSportId}/bonus")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LeaderboardResponseDTO> awardBonusPoints(
            @PathVariable UUID eventSportId,
            @RequestBody AwardBonusPointsRequest request,
            Authentication authentication
    ) {
        UUID currentUserId = UUID.fromString((String) authentication.getPrincipal());
        leaderboardService.awardBonusPoints(eventSportId, request, currentUserId);
        return ResponseEntity.ok(leaderboardService.getLeaderboard(eventSportId));
    }
}