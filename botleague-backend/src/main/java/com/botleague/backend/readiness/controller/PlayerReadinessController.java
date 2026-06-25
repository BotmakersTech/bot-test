package com.botleague.backend.readiness.controller;

import com.botleague.backend.readiness.dto.ReadinessResponse;
import com.botleague.backend.readiness.dto.UpdateReadinessRequest;
import com.botleague.backend.readiness.service.PlayerReadinessService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/matches/{matchId}/readiness")
public class PlayerReadinessController {

    private final PlayerReadinessService playerReadinessService;

    public PlayerReadinessController(PlayerReadinessService playerReadinessService) {
        this.playerReadinessService = playerReadinessService;
    }

    @GetMapping("/my")
    public ResponseEntity<ReadinessResponse> getMyReadiness(
            @PathVariable UUID matchId,
            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        return ResponseEntity.ok(playerReadinessService.getMyReadiness(matchId, userId));
    }

    @PatchMapping("/my")
    public ResponseEntity<ReadinessResponse> updateMyReadiness(
            @PathVariable UUID matchId,
            @RequestBody UpdateReadinessRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        return ResponseEntity.ok(
                playerReadinessService.updateReadiness(matchId, userId, request.getRegistrationId(), request));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER','SUB_ORGANIZER')")
    @GetMapping
    public ResponseEntity<List<ReadinessResponse>> getMatchReadiness(
            @PathVariable UUID matchId,
            Authentication authentication) {
        return ResponseEntity.ok(playerReadinessService.getMatchReadiness(matchId));
    }
}
