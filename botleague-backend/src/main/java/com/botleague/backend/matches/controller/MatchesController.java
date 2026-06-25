package com.botleague.backend.matches.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.botleague.backend.matches.dto.CreateMatchRequestDTO;
import com.botleague.backend.matches.dto.GenerateBracketRequestDTO;
import com.botleague.backend.matches.dto.MatchResponseDTO;
import com.botleague.backend.matches.dto.SubmitMatchResultDTO;
import com.botleague.backend.matches.dto.UpdateMatchRequestDTO;
import com.botleague.backend.matches.dto.UpdateMatchScoreDTO;
import com.botleague.backend.matches.service.MatchService;

@RestController
@RequestMapping("/api/v1/matches")
public class MatchesController {

    private final MatchService matchService;

    public MatchesController(MatchService matchService) {
        this.matchService = matchService;
    }

    // =====================================================
    // CREATE — SINGLE MATCH (MANUAL)
    // POST /api/v1/matches
    // =====================================================

    @PostMapping
    public ResponseEntity<MatchResponseDTO> createMatch(
            Authentication authentication,
            @RequestBody CreateMatchRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(matchService.createMatch(authentication, request));
    }

    // =====================================================
    // CREATE — BULK MANUAL BRACKET
    // POST /api/v1/matches/bulk
    // =====================================================

    @PostMapping("/bulk")
    public ResponseEntity<List<MatchResponseDTO>> createTournamentBracket(
            Authentication authentication,
            @RequestBody List<CreateMatchRequestDTO> requests
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(matchService.createTournamentBracket(authentication, requests));
    }

    // =====================================================
    // CREATE — AUTO-GENERATE BRACKET
    // POST /api/v1/matches/generate
    // =====================================================

    @PostMapping("/generate")
    public ResponseEntity<List<MatchResponseDTO>> generateBracket(
            Authentication authentication,
            @RequestBody GenerateBracketRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(matchService.generateBracket(authentication, request));
    }

    // =====================================================
    // READ — SINGLE MATCH
    // GET /api/v1/matches/{matchId}
    // =====================================================

    @GetMapping("/{matchId}")
    public ResponseEntity<MatchResponseDTO> getMatchById(
            @PathVariable UUID matchId
    ) {
        return ResponseEntity.ok(matchService.getMatchById(matchId));
    }

    // =====================================================
    // READ — ALL MATCHES
    // GET /api/v1/matches/all
    // =====================================================

    @GetMapping("/all")
    public ResponseEntity<List<MatchResponseDTO>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    // =====================================================
    // READ — BY EVENT SPORT
    // GET /api/v1/matches/event-sport/{eventSportId}
    // =====================================================

    @GetMapping("/event-sport/{eventSportId}")
    public ResponseEntity<List<MatchResponseDTO>> getMatchesByEventSport(
            @PathVariable UUID eventSportId
    ) {
        return ResponseEntity.ok(matchService.getMatchesByEventSport(eventSportId));
    }

    // =====================================================
    // READ — BY EVENT SPORT + ROUND
    // GET /api/v1/matches/event-sport/{eventSportId}/round/{roundNumber}
    // =====================================================

    @GetMapping("/event-sport/{eventSportId}/round/{roundNumber}")
    public ResponseEntity<List<MatchResponseDTO>> getMatchesByRound(
            @PathVariable UUID eventSportId,
            @PathVariable Integer roundNumber
    ) {
        return ResponseEntity.ok(matchService.getMatchesByRound(eventSportId, roundNumber));
    }

    // =====================================================
    // READ — BY TEAM REGISTRATION
    // GET /api/v1/matches/team/{registrationId}
    // =====================================================

    @GetMapping("/team/{registrationId}")
    public ResponseEntity<List<MatchResponseDTO>> getMatchesByTeam(
            @PathVariable UUID registrationId
    ) {
        return ResponseEntity.ok(matchService.getMatchesByTeam(registrationId));
    }

    // =====================================================
    // UPDATE — FULL MATCH DETAILS
    // PUT /api/v1/matches/{matchId}
    // =====================================================

    @PutMapping("/{matchId}")
    public ResponseEntity<MatchResponseDTO> updateMatch(
            @PathVariable UUID matchId,
            @RequestBody UpdateMatchRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.updateMatch(matchId, request, authentication));
    }

    // =====================================================
    // UPDATE — TEAMS ONLY
    // PATCH /api/v1/matches/{matchId}/teams
    // =====================================================

    @PatchMapping("/{matchId}/teams")
    public ResponseEntity<MatchResponseDTO> updateMatchTeams(
            @PathVariable UUID matchId,
            @RequestBody UpdateMatchRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.updateMatchTeams(matchId, request, authentication));
    }

    // =====================================================
    // UPDATE — SCHEDULE
    // PATCH /api/v1/matches/{matchId}/schedule
    // =====================================================

    @PatchMapping("/{matchId}/schedule")
    public ResponseEntity<MatchResponseDTO> scheduleMatch(
            @PathVariable UUID matchId,
            @RequestBody UpdateMatchRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.scheduleMatch(matchId, request, authentication));
    }

    // =====================================================
    // UPDATE — SCORE (LIVE)
    // PATCH /api/v1/matches/{matchId}/score
    // =====================================================

    @PatchMapping("/{matchId}/score")
    public ResponseEntity<MatchResponseDTO> updateMatchScore(
            @PathVariable UUID matchId,
            @RequestBody UpdateMatchScoreDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.updateMatchScore(matchId, request, authentication));
    }

    // =====================================================
    // STATUS — START
    // PATCH /api/v1/matches/{matchId}/start
    // =====================================================

    @PatchMapping("/{matchId}/start")
    public ResponseEntity<MatchResponseDTO> startMatch(
            @PathVariable UUID matchId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.startMatch(matchId, authentication));
    }

    // =====================================================
    // STATUS — SUBMIT RESULT (FULL CONTROL)
    // PATCH /api/v1/matches/{matchId}/result
    // Accepts winner, finish positions, scores, endedAt.
    // Supports ONE_VS_ONE, TRIPLE_THREAT, FATAL_FOUR.
    // =====================================================

    @PatchMapping("/{matchId}/result")
    public ResponseEntity<MatchResponseDTO> submitMatchResult(
            @PathVariable UUID matchId,
            @RequestBody SubmitMatchResultDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.submitMatchResult(matchId, request, authentication));
    }

    // =====================================================
    // STATUS — COMPLETE (SCORE-BASED SHORTCUT)
    // PATCH /api/v1/matches/{matchId}/complete
    // Infers winner from current scores. Use /result for
    // full control (explicit winner, positions, endedAt).
    // =====================================================

    @PatchMapping("/{matchId}/complete")
    public ResponseEntity<MatchResponseDTO> completeMatch(
            @PathVariable UUID matchId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.completeMatch(matchId, authentication));
    }

    // =====================================================
    // STATUS — CANCEL
    // PATCH /api/v1/matches/{matchId}/cancel
    // =====================================================

    @PatchMapping("/{matchId}/cancel")
    public ResponseEntity<MatchResponseDTO> cancelMatch(
            @PathVariable UUID matchId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(matchService.cancelMatch(matchId, authentication));
    }

    // =====================================================
    // DELETE — SOFT DELETE
    // DELETE /api/v1/matches/{matchId}
    // =====================================================

    @DeleteMapping("/{matchId}")
    public ResponseEntity<String> deleteMatch(
            @PathVariable UUID matchId,
            Authentication authentication
    ) {
        matchService.deleteMatch(matchId, authentication);
        return ResponseEntity.ok("Match deleted successfully");
    }

    // =====================================================
    // MY MATCHES
    // GET /api/v1/matches/my
    // Returns all matches involving the current user's teams.
    // =====================================================

    @GetMapping("/my")
    public ResponseEntity<List<MatchResponseDTO>> getMyMatches(Authentication authentication) {
        com.botleague.backend.auth.entity.User user =
                (com.botleague.backend.auth.entity.User) authentication.getPrincipal();
        return ResponseEntity.ok(matchService.getMyMatches(user.getId()));
    }
}