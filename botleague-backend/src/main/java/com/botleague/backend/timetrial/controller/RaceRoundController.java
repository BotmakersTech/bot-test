package com.botleague.backend.timetrial.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.timetrial.dto.GenerateRoundRequestDTO;
import com.botleague.backend.timetrial.dto.RecordRoundTimesRequestDTO;
import com.botleague.backend.timetrial.dto.RoundResponseDTO;
import com.botleague.backend.timetrial.dto.ShortlistRoundRequestDTO;
import com.botleague.backend.timetrial.service.RaceRoundService;

/**
 * Round-wise time trial — see RaceRoundService for the full call-order
 * narrative. Sibling to /api/v1/matches, for sports using
 * MatchFormatKind.ROUND_TIME_TRIAL instead of the elimination bracket.
 */
@RestController
@RequestMapping("/api/v1/race-rounds")
@PreAuthorize("isAuthenticated()")
public class RaceRoundController {

    private final RaceRoundService raceRoundService;

    public RaceRoundController(RaceRoundService raceRoundService) {
        this.raceRoundService = raceRoundService;
    }

    @PostMapping("/generate")
    public ResponseEntity<RoundResponseDTO> generateFirstRound(
            Authentication authentication,
            @Valid @RequestBody GenerateRoundRequestDTO request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(raceRoundService.generateFirstRound(authentication, request.getEventSportId()));
    }

    // Spectator-visible — public matches/rounds views read this without an account.
    @GetMapping("/event-sport/{eventSportId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<RoundResponseDTO>> getRoundsForSport(@PathVariable UUID eventSportId) {
        return ResponseEntity.ok(raceRoundService.getRoundsForSport(eventSportId));
    }

    @GetMapping("/{roundId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<RoundResponseDTO> getRound(@PathVariable UUID roundId) {
        return ResponseEntity.ok(raceRoundService.getRound(roundId));
    }

    @PatchMapping("/{roundId}/times")
    public ResponseEntity<RoundResponseDTO> recordTimes(
            @PathVariable UUID roundId,
            @Valid @RequestBody RecordRoundTimesRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(raceRoundService.recordTimes(authentication, roundId, request));
    }

    @PatchMapping("/{roundId}/shortlist")
    public ResponseEntity<RoundResponseDTO> shortlist(
            @PathVariable UUID roundId,
            @Valid @RequestBody ShortlistRoundRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(raceRoundService.shortlist(authentication, roundId, request.getCutoffCount()));
    }

    @PatchMapping("/{roundId}/finalize")
    public ResponseEntity<RoundResponseDTO> finalizeRound(
            @PathVariable UUID roundId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(raceRoundService.finalizeRound(authentication, roundId));
    }

    @DeleteMapping("/{roundId}")
    public ResponseEntity<Void> deleteRound(
            @PathVariable UUID roundId,
            Authentication authentication
    ) {
        raceRoundService.deleteRound(authentication, roundId);
        return ResponseEntity.noContent().build();
    }
}
