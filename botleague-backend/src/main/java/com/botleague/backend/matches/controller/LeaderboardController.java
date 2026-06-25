package com.botleague.backend.matches.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.botleague.backend.matches.dto.LeaderboardResponseDTO;
import com.botleague.backend.matches.service.LeaderboardService;

/**
 * Read-only leaderboard endpoint for a bracket.
 *
 *   GET /v1/leaderboard/event-sport/{eventSportId}
 *
 * Public, mirroring the other match READ endpoints (no admin check). Returns
 * the full ranked standings — provisional while the bracket is in progress,
 * final once every match is COMPLETED / CANCELLED (see response.isFinal).
 *
 * Adjust the base path / mapping to match your existing controller conventions.
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
}