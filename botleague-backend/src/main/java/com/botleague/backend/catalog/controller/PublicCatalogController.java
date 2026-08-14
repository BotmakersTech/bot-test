package com.botleague.backend.catalog.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.catalog.dto.LeagueResponse;
import com.botleague.backend.catalog.dto.LeagueSportResponse;
import com.botleague.backend.catalog.dto.SportResponse;
import com.botleague.backend.catalog.service.LeagueService;
import com.botleague.backend.catalog.service.LeagueSportService;
import com.botleague.backend.catalog.service.SportService;

/**
 * Unauthenticated reads of the League/Sport catalog — matches
 * EventSportsController's existing public-read precedent. Only ever
 * exposes ACTIVE leagues/sports and LIVE pairings; DRAFT/DISABLED rows
 * never leave the admin API.
 */
@RestController
@RequestMapping("/api/catalog")
public class PublicCatalogController {

    private final LeagueService leagueService;
    private final SportService sportService;
    private final LeagueSportService leagueSportService;

    public PublicCatalogController(LeagueService leagueService, SportService sportService, LeagueSportService leagueSportService) {
        this.leagueService = leagueService;
        this.sportService = sportService;
        this.leagueSportService = leagueSportService;
    }

    @GetMapping("/leagues")
    public ResponseEntity<List<LeagueResponse>> listLeagues() {
        return ResponseEntity.ok(leagueService.listActive());
    }

    @GetMapping("/leagues/{slug}")
    public ResponseEntity<LeagueResponse> getLeague(@PathVariable String slug) {
        return ResponseEntity.ok(leagueService.getActiveBySlug(slug));
    }

    /** Only LIVE pairings — the direct replacement for the old SPORT_SPEC_PRESETS lookup. */
    @GetMapping("/leagues/{slug}/sports")
    public ResponseEntity<List<LeagueSportResponse>> listSportsForLeague(@PathVariable String slug) {
        return ResponseEntity.ok(leagueSportService.listLiveByLeagueSlug(slug));
    }

    @GetMapping("/sports")
    public ResponseEntity<List<SportResponse>> listSports() {
        return ResponseEntity.ok(sportService.listActive());
    }
}
