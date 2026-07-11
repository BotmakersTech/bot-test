package com.botleague.backend.ranking.controller;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.ranking.dto.RankingDTOs.*;
import java.util.Map;
import com.botleague.backend.ranking.dto.RankingResponse;
import com.botleague.backend.ranking.dto.RankingUpdateRequest;
import com.botleague.backend.ranking.service.RankingEngineService;
import com.botleague.backend.ranking.service.RankingQueryService;
import com.botleague.backend.ranking.service.RankingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * All ranking endpoints — public reads, admin writes.
 *
 * Base path: /api/rankings
 *
 * Public endpoints (no auth):
 *   GET  /api/rankings                                    — legacy global list (category/sport/scope filters)
 *   GET  /api/rankings/event/{eventId}                    — legacy event list
 *   GET  /api/rankings/leaderboard/{eventSportId}         — live event leaderboard
 *   GET  /api/rankings/global                             — global ranking pool
 *   GET  /api/rankings/global/top                         — top N
 *   GET  /api/rankings/global/team/{teamId}               — specific team global rank
 *   GET  /api/rankings/global/team/{teamId}/breakdown     — per-event point breakdown
 *   GET  /api/rankings/global/team/{teamId}/history       — rank change history
 *   GET  /api/rankings/sports                             — available sports list
 *   GET  /api/rankings/sports/{sport}/weight-classes      — weight classes for sport
 *
 * Admin endpoints:
 *   POST /api/rankings                                    — manual upsert (legacy)
 *   POST /api/rankings/recalculate                        — full pool recalculation
 *   POST /api/rankings/finalize/{eventSportId}            — finalize event leaderboard
 */
@RestController
@RequestMapping("/api/rankings")
public class RankingController {

    private final RankingService       rankingService;
    private final RankingQueryService  queryService;
    private final RankingEngineService engineService;
    private final AuditLogService      auditLogService;

    public RankingController(
            RankingService rankingService,
            RankingQueryService queryService,
            RankingEngineService engineService,
            AuditLogService auditLogService) {
        this.rankingService = rankingService;
        this.queryService   = queryService;
        this.engineService  = engineService;
        this.auditLogService = auditLogService;
    }

    // =========================================================================
    // LEGACY (backward-compatible with existing frontend)
    // =========================================================================

    @GetMapping
    public ResponseEntity<List<RankingResponse>> getRankings(
            @RequestParam(required = false)               String category,
            @RequestParam(required = false)               String sport,
            @RequestParam(defaultValue = "NATIONAL")      String scope,
            @RequestParam(required = false)               String season,
            @RequestParam(defaultValue = "0")             int    page,
            @RequestParam(defaultValue = "20")            int    size) {
        return ResponseEntity.ok(rankingService.getRankings(category, sport, scope, season, page, size));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<RankingResponse>> getEventRankings(
            @PathVariable UUID eventId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(rankingService.getEventRankings(eventId, page, size));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<RankingResponse> upsertRanking(
            @RequestBody RankingUpdateRequest request, Authentication auth) {
        return ResponseEntity.ok(rankingService.upsert(request));
    }

    // =========================================================================
    // EVENT LEADERBOARD — live, updates after every match
    // =========================================================================

    /**
     * GET /api/rankings/leaderboard/{eventSportId}
     *
     * Returns the live standings for a specific sport competition.
     * Includes: rank, team, robot, wins, losses, points.
     * Public — spectators see this on the event page.
     */
    @GetMapping("/leaderboard/{eventSportId}")
    public ResponseEntity<EventLeaderboardResponse> getEventLeaderboard(
            @PathVariable UUID eventSportId) {
        return ResponseEntity.ok(queryService.getEventLeaderboard(eventSportId));
    }

    // =========================================================================
    // GLOBAL RANKING
    // =========================================================================

    /**
     * GET /api/rankings/global
     *
     * Query params:
     *   sport       — required (e.g. ROBO_WAR)
     *   ageGroup    — required (JUNIOR_INNOVATORS | YOUNG_ENGINEERS | ROBO_MINDS)
     *   weightClass — optional (e.g. 1.5KG). Null = all weight classes combined.
     *   page        — 0-based (default 0)
     *   size        — page size (default 20, max 100)
     */
    @GetMapping("/global")
    public ResponseEntity<GlobalRankingPageResponse> getGlobalRanking(
            @RequestParam                              String sport,
            @RequestParam                              String ageGroup,
            @RequestParam(required = false)            String weightClass,
            @RequestParam(defaultValue = "0")          int    page,
            @RequestParam(defaultValue = "20")         int    size) {
        size = Math.min(size, 100);
        return ResponseEntity.ok(queryService.getGlobalRanking(sport, ageGroup, weightClass, page, size));
    }

    /**
     * GET /api/rankings/global/top
     *
     * Returns top N teams (default 10, max 100) for a given pool.
     * Used for homepage leaderboard widgets.
     */
    @GetMapping("/global/top")
    public ResponseEntity<List<GlobalRankingResponse>> getTopRanked(
            @RequestParam                              String sport,
            @RequestParam                              String ageGroup,
            @RequestParam(required = false)            String weightClass,
            @RequestParam(defaultValue = "10")         int    n) {
        n = Math.min(n, 100);
        return ResponseEntity.ok(queryService.getTopN(sport, ageGroup, weightClass, n));
    }

    /**
     * GET /api/rankings/global/team/{teamId}
     *
     * Get a specific team's current global rank in a pool.
     */
    @GetMapping("/global/team/{teamId}")
    public ResponseEntity<GlobalRankingResponse> getTeamGlobalRank(
            @PathVariable                              UUID   teamId,
            @RequestParam                              String sport,
            @RequestParam                              String ageGroup,
            @RequestParam(required = false)            String weightClass) {
        GlobalRankingResponse res = queryService.getTeamRanking(teamId, sport, ageGroup, weightClass);
        if (res == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(res);
    }

    /**
     * GET /api/rankings/global/team/{teamId}/breakdown
     *
     * Per-event point breakdown with transaction audit trail.
     * Shows: Event 1 = 18 pts, Event 2 = 22 pts, Total = 40 pts.
     */
    @GetMapping("/global/team/{teamId}/breakdown")
    public ResponseEntity<TeamPointBreakdownResponse> getTeamPointBreakdown(
            @PathVariable                              UUID   teamId,
            @RequestParam                              String sport,
            @RequestParam                              String ageGroup,
            @RequestParam(required = false)            String weightClass) {
        return ResponseEntity.ok(queryService.getTeamPointBreakdown(teamId, sport, ageGroup, weightClass));
    }

    /**
     * GET /api/rankings/global/team/{teamId}/history
     *
     * Rank change history for a team in a specific pool.
     * Shows: moved from rank 5 → 3 after Event X.
     */
    @GetMapping("/global/team/{teamId}/history")
    public ResponseEntity<TeamRankingHistoryResponse> getTeamRankingHistory(
            @PathVariable                              UUID   teamId,
            @RequestParam                              String sport,
            @RequestParam                              String ageGroup,
            @RequestParam(required = false)            String weightClass,
            @RequestParam(defaultValue = "20")         int    limit) {
        return ResponseEntity.ok(
                queryService.getTeamRankingHistory(teamId, sport, ageGroup, weightClass, limit));
    }

    // =========================================================================
    // DISCOVERY
    // =========================================================================

    /** GET /api/rankings/pools — distinct (sport, ageGroup) pairs with ranking data. */
    @GetMapping("/pools")
    public ResponseEntity<List<Map<String, String>>> getAvailablePools() {
        return ResponseEntity.ok(queryService.getAvailablePools());
    }

    /** GET /api/rankings/sports — distinct sports with ranking data. */
    @GetMapping("/sports")
    public ResponseEntity<List<String>> getAvailableSports() {
        return ResponseEntity.ok(queryService.getAvailableSports());
    }

    /** GET /api/rankings/sports/{sport}/weight-classes — available weight classes. */
    @GetMapping("/sports/{sport}/weight-classes")
    public ResponseEntity<List<String>> getWeightClasses(@PathVariable String sport) {
        return ResponseEntity.ok(queryService.getWeightClassesForSport(sport));
    }

    // =========================================================================
    // ADMIN — RECALCULATE & FINALIZE
    // =========================================================================

    /**
     * POST /api/rankings/recalculate
     *
     * Trigger a full ranking recalculation for a pool from point transactions.
     * Use after score corrections or data fixes.
     */
    @PostMapping("/recalculate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<String> recalculate(@RequestBody RecalculateRequest request) {
        engineService.fullRecalculate(request.sport, request.ageGroup, request.weightClass);
        return ResponseEntity.ok("Recalculation complete for " + request.sport
                + " / " + request.ageGroup + " / " + request.weightClass);
    }

    /**
     * POST /api/rankings/finalize/{eventSportId}
     *
     * Finalize an event sport's own leaderboard (sort, assign ranks, mark
     * finalized). Does NOT touch the global ranking pool — see
     * /global/push/{eventSportId} for that, which is ADMIN-exclusive with no
     * exceptions. Called automatically by the match engine once every match
     * in the sport is approved; exposed here for admin override (e.g. after
     * a bracket correction).
     */
    @PostMapping("/finalize/{eventSportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<String> finalizeLeaderboard(@PathVariable UUID eventSportId) {
        engineService.finalizeEventLeaderboard(eventSportId);
        return ResponseEntity.ok("Leaderboard finalized for eventSportId=" + eventSportId);
    }

    /**
     * POST /api/rankings/global/push/{eventSportId}
     *
     * The sole gateway to the global ranking pool. ADMIN/SUPER_ADMIN only —
     * no exceptions, not even for an event's own EVENT_HEAD/ORGANISER owner.
     * Requires the event sport's leaderboard to already be finalized.
     */
    @PostMapping("/global/push/{eventSportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<String> pushToGlobalRankings(@PathVariable UUID eventSportId, Authentication auth) {
        engineService.pushToGlobalRankings(eventSportId);
        auditLogService.log("GLOBAL_RANKINGS_PUSHED", "EVENT_SPORT", eventSportId, null, null, "PUSHED");
        return ResponseEntity.ok("Pushed to global rankings for eventSportId=" + eventSportId);
    }
}
