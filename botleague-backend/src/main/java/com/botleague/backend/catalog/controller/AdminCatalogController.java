package com.botleague.backend.catalog.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.catalog.dto.*;
import com.botleague.backend.catalog.service.LeagueService;
import com.botleague.backend.catalog.service.LeagueSportService;
import com.botleague.backend.catalog.service.SportService;

/**
 * Admin CRUD for the League/Sport catalog. No DELETE endpoints — a status
 * flip (ACTIVE/DISABLED, DRAFT/LIVE) is the only way to retire a row, same
 * as CertificateType.
 */
@RestController
@RequestMapping("/api/admin/catalog")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
public class AdminCatalogController {

    private final LeagueService leagueService;
    private final SportService sportService;
    private final LeagueSportService leagueSportService;

    public AdminCatalogController(LeagueService leagueService, SportService sportService, LeagueSportService leagueSportService) {
        this.leagueService = leagueService;
        this.sportService = sportService;
        this.leagueSportService = leagueSportService;
    }

    // ── Leagues ──────────────────────────────────────────────────────────

    @PostMapping("/leagues")
    public ResponseEntity<LeagueResponse> createLeague(@RequestBody CreateLeagueRequest req, Authentication auth) {
        return ResponseEntity.ok(leagueService.create(req, extractUserId(auth)));
    }

    @GetMapping("/leagues")
    public ResponseEntity<List<LeagueResponse>> listLeagues() {
        return ResponseEntity.ok(leagueService.listAll());
    }

    @GetMapping("/leagues/{id}")
    public ResponseEntity<LeagueResponse> getLeague(@PathVariable UUID id) {
        return ResponseEntity.ok(leagueService.get(id));
    }

    @PatchMapping("/leagues/{id}")
    public ResponseEntity<LeagueResponse> updateLeague(@PathVariable UUID id, @RequestBody UpdateLeagueRequest req) {
        return ResponseEntity.ok(leagueService.update(id, req));
    }

    // ── Sports ───────────────────────────────────────────────────────────

    @PostMapping("/sports")
    public ResponseEntity<SportResponse> createSport(@RequestBody CreateSportRequest req, Authentication auth) {
        return ResponseEntity.ok(sportService.create(req, extractUserId(auth)));
    }

    @GetMapping("/sports")
    public ResponseEntity<List<SportResponse>> listSports() {
        return ResponseEntity.ok(sportService.listAll());
    }

    @GetMapping("/sports/{id}")
    public ResponseEntity<SportResponse> getSport(@PathVariable UUID id) {
        return ResponseEntity.ok(sportService.get(id));
    }

    @PatchMapping("/sports/{id}")
    public ResponseEntity<SportResponse> updateSport(@PathVariable UUID id, @RequestBody UpdateSportRequest req) {
        return ResponseEntity.ok(sportService.update(id, req));
    }

    // ── League/Sport pairings ────────────────────────────────────────────

    @PostMapping("/league-sports")
    public ResponseEntity<LeagueSportResponse> createLeagueSport(@RequestBody CreateLeagueSportRequest req, Authentication auth) {
        return ResponseEntity.ok(leagueSportService.create(req, extractUserId(auth)));
    }

    @GetMapping("/league-sports")
    public ResponseEntity<List<LeagueSportResponse>> listLeagueSports(@RequestParam(required = false) UUID leagueId) {
        return ResponseEntity.ok(leagueId != null ? leagueSportService.listByLeague(leagueId) : leagueSportService.listAll());
    }

    @GetMapping("/league-sports/{id}")
    public ResponseEntity<LeagueSportResponse> getLeagueSport(@PathVariable UUID id) {
        return ResponseEntity.ok(leagueSportService.get(id));
    }

    @PatchMapping("/league-sports/{id}")
    public ResponseEntity<LeagueSportResponse> updateLeagueSport(@PathVariable UUID id, @RequestBody UpdateLeagueSportRequest req) {
        return ResponseEntity.ok(leagueSportService.update(id, req));
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
