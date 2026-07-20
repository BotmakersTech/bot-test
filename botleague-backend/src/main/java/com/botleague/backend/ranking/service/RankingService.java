package com.botleague.backend.ranking.service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.common.utils.EligibilityUtils;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.ranking.dto.RankingResponse;
import com.botleague.backend.ranking.dto.RankingUpdateRequest;
import com.botleague.backend.ranking.entity.Ranking;
import com.botleague.backend.ranking.repository.RankingRepository;

@Service
@Transactional(readOnly = true)
public class RankingService {

    private final RankingRepository rankingRepository;

    public RankingService(RankingRepository rankingRepository) {
        this.rankingRepository = rankingRepository;
    }

    /**
     * Query rankings with optional filters.
     *
     * @param category  AgeCategory name (JUNIOR_INNOVATORS / YOUNG_ENGINEERS / ROBO_MINDS) or null
     * @param sport     competition type string or null
     * @param scope     "NATIONAL" | "STATE" | "EVENT"  (default NATIONAL)
     * @param season    e.g. "2025-26" (default current year-based)
     * @param page      0-based
     * @param size      results per page (max 50)
     */
    public List<RankingResponse> getRankings(
            String category, String sport, String scope, String season, int page, int size) {

        int clampedSize = Math.min(size, 50);
        PageRequest pageable = PageRequest.of(page, clampedSize);
        String effectiveScope  = scope  != null ? scope.toUpperCase() : "NATIONAL";
        String effectiveSeason = season != null ? season : currentSeason();

        List<Ranking> rows;

        AgeCategory cat = parseCategory(category);

        if (cat != null && sport != null && !sport.isBlank()) {
            rows = rankingRepository.findByCategoryAndSportAndScopeAndSeasonOrderByTotalPointsDesc(
                    cat, sport, effectiveScope, effectiveSeason, pageable);
        } else if (cat != null) {
            rows = rankingRepository.findByCategoryAndScopeAndSeasonOrderByTotalPointsDesc(
                    cat, effectiveScope, effectiveSeason, pageable);
        } else if (sport != null && !sport.isBlank()) {
            rows = rankingRepository.findBySportAndScopeAndSeasonOrderByTotalPointsDesc(
                    sport, effectiveScope, effectiveSeason, pageable);
        } else {
            rows = rankingRepository.findByScopeAndSeasonOrderByTotalPointsDesc(
                    effectiveScope, effectiveSeason, pageable);
        }

        AtomicInteger position = new AtomicInteger(page * clampedSize + 1);
        return rows.stream()
                   .map(r -> toResponse(r, position.getAndIncrement()))
                   .collect(Collectors.toList());
    }

    public List<RankingResponse> getEventRankings(UUID eventId, int page, int size) {
        int clampedSize = Math.min(size, 50);
        PageRequest pageable = PageRequest.of(page, clampedSize);
        List<Ranking> rows = rankingRepository.findByEventIdOrderByTotalPointsDesc(eventId, pageable);
        AtomicInteger position = new AtomicInteger(page * clampedSize + 1);
        return rows.stream().map(r -> toResponse(r, position.getAndIncrement())).collect(Collectors.toList());
    }

    @Transactional
    public RankingResponse upsert(RankingUpdateRequest req) {
        String sport  = req.getSport()  != null ? req.getSport()  : "ALL";
        String scope  = req.getScope()  != null ? req.getScope().toUpperCase() : "NATIONAL";
        String season = req.getSeason() != null ? req.getSeason() : currentSeason();

        Ranking ranking;
        if ("TEAM".equalsIgnoreCase(req.getEntityType()) && req.getTeamId() != null) {
            UUID tid = UUID.fromString(req.getTeamId());
            ranking = rankingRepository.findByTeamIdAndSportAndScopeAndSeason(tid, sport, scope, season)
                    .orElseGet(Ranking::new);
            ranking.setTeamId(tid);
            ranking.setEntityType("TEAM");
        } else if (req.getUserId() != null) {
            UUID uid = UUID.fromString(req.getUserId());
            ranking = rankingRepository.findByUserIdAndSportAndScopeAndSeason(uid, sport, scope, season)
                    .orElseGet(Ranking::new);
            ranking.setUserId(uid);
            ranking.setEntityType("USER");
        } else {
            throw new IllegalArgumentException("Either teamId or userId must be provided");
        }

        if (req.getDisplayName() != null) ranking.setDisplayName(req.getDisplayName());
        if (req.getAvatarUrl()   != null) ranking.setAvatarUrl(req.getAvatarUrl());
        if (req.getState()       != null) ranking.setState(req.getState());
        if (req.getCity()        != null) ranking.setCity(req.getCity());
        if (req.getCategory()    != null) ranking.setCategory(parseCategory(req.getCategory()));
        if (req.getEventId()     != null) ranking.setEventId(UUID.fromString(req.getEventId()));

        ranking.setSport(sport);
        ranking.setScope(scope);
        ranking.setSeason(season);

        if (req.getTotalPoints()  != null) ranking.setTotalPoints(req.getTotalPoints());
        if (req.getEventsPlayed() != null) ranking.setEventsPlayed(req.getEventsPlayed());
        if (req.getWins()         != null) ranking.setWins(req.getWins());
        if (req.getLosses()       != null) ranking.setLosses(req.getLosses());
        if (req.getGoldMedals()   != null) ranking.setGoldMedals(req.getGoldMedals());
        if (req.getSilverMedals() != null) ranking.setSilverMedals(req.getSilverMedals());
        if (req.getBronzeMedals() != null) ranking.setBronzeMedals(req.getBronzeMedals());

        Ranking saved = rankingRepository.save(ranking);
        return toResponse(saved, 0);
    }

    // ── helpers ───────────────────────────────────────────────

    private RankingResponse toResponse(Ranking r, int rank) {
        RankingResponse res = new RankingResponse();
        res.setRank(rank);
        res.setId(r.getId());
        res.setEntityType(r.getEntityType());
        res.setTeamId(r.getTeamId());
        res.setUserId(r.getUserId());
        res.setDisplayName(r.getDisplayName());
        res.setAvatarUrl(r.getAvatarUrl());
        res.setState(r.getState());
        res.setCity(r.getCity());
        if (r.getCategory() != null) {
            res.setCategory(r.getCategory().name());
            res.setCategoryLabel(EligibilityUtils.toCategoryLabel(r.getCategory()));
        }
        res.setSport(r.getSport());
        res.setScope(r.getScope());
        res.setEventId(r.getEventId());
        res.setSeason(r.getSeason());
        res.setTotalPoints(r.getTotalPoints());
        res.setEventsPlayed(r.getEventsPlayed());
        res.setWins(r.getWins());
        res.setLosses(r.getLosses());
        res.setGoldMedals(r.getGoldMedals());
        res.setSilverMedals(r.getSilverMedals());
        res.setBronzeMedals(r.getBronzeMedals());
        res.setLastUpdated(r.getLastUpdated());
        return res;
    }

    private AgeCategory parseCategory(String cat) {
        if (cat == null || cat.isBlank()) return null;
        try { return AgeCategory.valueOf(cat.toUpperCase()); }
        catch (IllegalArgumentException ignored) { return null; }
    }

    private String currentSeason() {
        int year = java.time.LocalDate.now().getYear();
        return year + "-" + String.valueOf(year + 1).substring(2);
    }
}
