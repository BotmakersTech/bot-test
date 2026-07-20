package com.botleague.backend.ranking.service;

import com.botleague.backend.common.utils.EligibilityUtils;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.ranking.dto.RankingDTOs.*;
import com.botleague.backend.ranking.entity.EventLeaderboardEntry;
import com.botleague.backend.ranking.entity.GlobalRankingHistory;
import com.botleague.backend.ranking.entity.Ranking;
import com.botleague.backend.ranking.entity.RankingPointTransaction;
import com.botleague.backend.ranking.repository.*;
import com.botleague.backend.ranking.util.RankingMath;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Read-only service for all ranking queries.
 * Separated from RankingEngineService so the write path stays clean.
 */
@Service
@Transactional(readOnly = true)
public class RankingQueryService {

    private static final String SCOPE_NATIONAL = "NATIONAL";
    private static final String SEASON_GLOBAL  = "GLOBAL";

    private final RankingRepository                  rankingRepository;
    private final EventLeaderboardEntryRepository    leaderboardEntryRepository;
    private final GlobalRankingHistoryRepository     historyRepository;
    private final RankingPointTransactionRepository  transactionRepository;
    private final EventRepository                    eventRepository;

    public RankingQueryService(
            RankingRepository rankingRepository,
            EventLeaderboardEntryRepository leaderboardEntryRepository,
            GlobalRankingHistoryRepository historyRepository,
            RankingPointTransactionRepository transactionRepository,
            EventRepository eventRepository) {
        this.rankingRepository         = rankingRepository;
        this.leaderboardEntryRepository = leaderboardEntryRepository;
        this.historyRepository          = historyRepository;
        this.transactionRepository      = transactionRepository;
        this.eventRepository            = eventRepository;
    }

    // =========================================================================
    // EVENT LEADERBOARD
    // =========================================================================

    public EventLeaderboardResponse getEventLeaderboard(UUID eventSportId) {
        List<EventLeaderboardEntry> entries =
                leaderboardEntryRepository.findByEventSportIdOrderByPointsEarnedDescWinsDescMatchesPlayedDesc(eventSportId);

        EventLeaderboardResponse res = new EventLeaderboardResponse();
        res.eventSportId = eventSportId;

        if (!entries.isEmpty()) {
            EventLeaderboardEntry first = entries.get(0);
            res.eventId     = first.getEventId();
            res.sport       = first.getSport();
            res.ageGroup    = first.getAgeGroup();
            res.weightClass = first.getWeightClass();
            res.isFinalized = Boolean.TRUE.equals(first.getIsFinalized());

            eventRepository.findById(first.getEventId())
                    .ifPresent(e -> res.eventName = e.getEventName());
        }

        res.entries = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            EventLeaderboardEntry e = entries.get(i);
            LeaderboardEntryResponse row = new LeaderboardEntryResponse();
            row.rank          = e.getEventRank() != null ? e.getEventRank() : i + 1;
            row.robotId       = e.getRobotId();
            row.teamId        = e.getTeamId();
            row.teamName      = e.getTeamName();
            row.robotName     = e.getRobotName();
            row.wins          = e.getWins();
            row.losses        = e.getLosses();
            row.matchesPlayed = e.getMatchesPlayed();
            row.pointsEarned  = e.getPointsEarned();
            row.winPercentage = RankingMath.winPercentage(e.getWins(), e.getMatchesPlayed());
            row.isFinalized   = Boolean.TRUE.equals(e.getIsFinalized());
            res.entries.add(row);
        }

        return res;
    }

    // =========================================================================
    // GLOBAL RANKING — paginated pool query
    // =========================================================================

    public GlobalRankingPageResponse getGlobalRanking(
            String sport, String ageGroup, String weightClass, int page, int size) {

        AgeCategory cat = parseCategory(ageGroup);
        List<Ranking> pool = rankingRepository.findPoolOrderedByPoints(
                sport, SCOPE_NATIONAL, SEASON_GLOBAL, cat, weightClass);

        int total = pool.size();
        int from  = Math.min(page * size, total);
        int to    = Math.min(from + size, total);
        List<Ranking> pageSlice = pool.subList(from, to);

        GlobalRankingPageResponse res = new GlobalRankingPageResponse();
        res.sport       = sport;
        res.ageGroup    = ageGroup;
        res.weightClass = weightClass;
        res.total       = total;
        res.page        = page;
        res.size        = size;
        res.entries     = pageSlice.stream()
                .map(r -> toGlobalResponse(r, pool.indexOf(r) + 1))
                .collect(Collectors.toList());

        return res;
    }

    /** Top N teams in a pool (e.g. top 10, top 50, top 100). */
    public List<GlobalRankingResponse> getTopN(String sport, String ageGroup, String weightClass, int n) {
        AgeCategory cat = parseCategory(ageGroup);
        List<Ranking> pool = rankingRepository.findPoolOrderedByPoints(
                sport, SCOPE_NATIONAL, SEASON_GLOBAL, cat, weightClass);

        return pool.stream()
                .limit(n)
                .map(r -> toGlobalResponse(r, pool.indexOf(r) + 1))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // ROBOT / TEAM RANKING DETAIL
    // =========================================================================

    /** A single robot's global rank in a pool — the true single-entity analog of the old team lookup. */
    public GlobalRankingResponse getRobotRanking(UUID robotId, String sport, String ageGroup, String weightClass) {
        AgeCategory cat = parseCategory(ageGroup);
        Optional<Ranking> rOpt = rankingRepository
                .findByRobotIdAndSportAndWeightClassAndScopeAndSeason(
                        robotId, sport, weightClass, SCOPE_NATIONAL, SEASON_GLOBAL);

        if (rOpt.isEmpty()) return null;
        Ranking r = rOpt.get();

        // Compute current rank within pool
        List<Ranking> pool = rankingRepository.findPoolOrderedByPoints(
                sport, SCOPE_NATIONAL, SEASON_GLOBAL, cat, weightClass);
        int rank = pool.indexOf(r) + 1;

        return toGlobalResponse(r, rank);
    }

    /**
     * Every robot a team has ranked in a pool — a team no longer has a single rank
     * once it can field multiple robots into the same sport/weight-class.
     */
    public List<GlobalRankingResponse> getTeamRobotRankings(UUID teamId, String sport, String ageGroup, String weightClass) {
        AgeCategory cat = parseCategory(ageGroup);
        List<Ranking> pool = rankingRepository.findPoolOrderedByPoints(
                sport, SCOPE_NATIONAL, SEASON_GLOBAL, cat, weightClass);

        List<GlobalRankingResponse> result = new ArrayList<>();
        for (int i = 0; i < pool.size(); i++) {
            Ranking r = pool.get(i);
            if (teamId.equals(r.getTeamId())) {
                result.add(toGlobalResponse(r, i + 1));
            }
        }
        return result;
    }

    /** Per-event point breakdown for a robot — the primary breakdown view. */
    public RobotPointBreakdownResponse getRobotPointBreakdown(UUID robotId, String sport, String ageGroup, String weightClass) {
        List<RankingPointTransaction> txs = transactionRepository
                .findByRobotIdAndIsVoidedFalseOrderByCreatedAtDesc(robotId);

        List<RankingPointTransaction> poolTxs = txs.stream()
                .filter(t -> sport.equals(t.getSport()) && ageGroup.equals(t.getAgeGroup())
                        && (weightClass == null || weightClass.equals(t.getWeightClass())))
                .collect(Collectors.toList());

        RobotPointBreakdownResponse res = new RobotPointBreakdownResponse();
        res.robotId     = robotId;
        res.sport       = sport;
        res.ageGroup    = ageGroup;
        res.weightClass = weightClass;
        res.totalPoints = poolTxs.stream().mapToInt(RankingPointTransaction::getPointsAwarded).sum();

        Map<UUID, List<RankingPointTransaction>> byEvent = poolTxs.stream()
                .collect(Collectors.groupingBy(RankingPointTransaction::getEventId));

        res.byEvent = byEvent.entrySet().stream().map(entry -> {
            UUID eventId = entry.getKey();
            List<RankingPointTransaction> etxs = entry.getValue();
            EventPointSummary summary = new EventPointSummary();
            summary.eventId      = eventId;
            summary.pointsEarned = etxs.stream().mapToInt(RankingPointTransaction::getPointsAwarded).sum();
            summary.wins         = (int) etxs.stream().filter(t -> Boolean.TRUE.equals(t.getIsWinner())).count();
            summary.losses       = (int) etxs.stream().filter(t -> !Boolean.TRUE.equals(t.getIsWinner())).count();
            eventRepository.findById(eventId).ifPresent(e -> summary.eventName = e.getEventName());
            // Event rank from leaderboard — uses each transaction's own eventSportId
            // (previously this used the outer eventId, which is a different UUID
            // from eventSportId, so this lookup always came back empty).
            etxs.stream().findFirst().ifPresent(t ->
                    leaderboardEntryRepository.findByEventSportIdAndRobotId(t.getEventSportId(), robotId)
                            .ifPresent(lb -> summary.eventRank = lb.getEventRank()));
            return summary;
        }).collect(Collectors.toList());

        res.transactions = poolTxs.stream().map(this::toTransactionResponse).collect(Collectors.toList());

        return res;
    }

    /** Per-event point breakdown rolled up across every robot a team has fielded. */
    public TeamPointBreakdownResponse getTeamPointBreakdown(UUID teamId, String sport, String ageGroup, String weightClass) {
        List<RankingPointTransaction> txs = transactionRepository
                .findByTeamIdAndIsVoidedFalseOrderByCreatedAtDesc(teamId);

        // Filter to pool
        List<RankingPointTransaction> poolTxs = txs.stream()
                .filter(t -> sport.equals(t.getSport()) && ageGroup.equals(t.getAgeGroup())
                        && (weightClass == null || weightClass.equals(t.getWeightClass())))
                .collect(Collectors.toList());

        TeamPointBreakdownResponse res = new TeamPointBreakdownResponse();
        res.teamId      = teamId;
        res.sport       = sport;
        res.ageGroup    = ageGroup;
        res.weightClass = weightClass;
        res.totalPoints = poolTxs.stream().mapToInt(RankingPointTransaction::getPointsAwarded).sum();

        // Group by event
        Map<UUID, List<RankingPointTransaction>> byEvent = poolTxs.stream()
                .collect(Collectors.groupingBy(RankingPointTransaction::getEventId));

        res.byEvent = byEvent.entrySet().stream().map(entry -> {
            UUID eventId = entry.getKey();
            List<RankingPointTransaction> etxs = entry.getValue();
            EventPointSummary summary = new EventPointSummary();
            summary.eventId      = eventId;
            summary.pointsEarned = etxs.stream().mapToInt(RankingPointTransaction::getPointsAwarded).sum();
            summary.wins         = (int) etxs.stream().filter(t -> Boolean.TRUE.equals(t.getIsWinner())).count();
            summary.losses       = (int) etxs.stream().filter(t -> !Boolean.TRUE.equals(t.getIsWinner())).count();
            eventRepository.findById(eventId).ifPresent(e -> summary.eventName = e.getEventName());
            // Event rank left null here — a team rollup can span multiple robots in
            // the same event, so there's no single leaderboard rank to attach; see
            // getRobotPointBreakdown for the per-robot rank.
            return summary;
        }).collect(Collectors.toList());

        res.transactions = poolTxs.stream().map(this::toTransactionResponse).collect(Collectors.toList());

        return res;
    }

    // =========================================================================
    // RANKING HISTORY
    // =========================================================================

    /** Rank-change history rolled up across every robot a team has fielded. */
    public TeamRankingHistoryResponse getTeamRankingHistory(
            UUID teamId, String sport, String ageGroup, String weightClass, int limit) {

        Pageable pg = PageRequest.of(0, limit);
        List<GlobalRankingHistory> history = historyRepository
                .findByTeamIdAndSportAndAgeGroupAndWeightClassOrderByRecordedAtDesc(
                        teamId, sport, ageGroup, weightClass, pg);

        TeamRankingHistoryResponse res = new TeamRankingHistoryResponse();
        res.teamId      = teamId;
        res.sport       = sport;
        res.ageGroup    = ageGroup;
        res.weightClass = weightClass;
        res.history     = history.stream().map(this::toHistoryEntry).collect(Collectors.toList());

        return res;
    }

    /** Rank-change history for a single robot — the primary history view. */
    public RobotRankingHistoryResponse getRobotRankingHistory(
            UUID robotId, String sport, String ageGroup, String weightClass, int limit) {

        Pageable pg = PageRequest.of(0, limit);
        List<GlobalRankingHistory> history = historyRepository
                .findByRobotIdAndSportAndAgeGroupAndWeightClassOrderByRecordedAtDesc(
                        robotId, sport, ageGroup, weightClass, pg);

        RobotRankingHistoryResponse res = new RobotRankingHistoryResponse();
        res.robotId     = robotId;
        res.sport       = sport;
        res.ageGroup    = ageGroup;
        res.weightClass = weightClass;
        res.history     = history.stream().map(this::toHistoryEntry).collect(Collectors.toList());

        return res;
    }

    private RankingHistoryEntry toHistoryEntry(GlobalRankingHistory h) {
        RankingHistoryEntry entry = new RankingHistoryEntry();
        entry.oldRank              = h.getOldRank() != null ? h.getOldRank() : 0;
        entry.newRank              = h.getNewRank() != null ? h.getNewRank() : 0;
        entry.rankDelta            = h.getRankDelta() != null ? h.getRankDelta() : 0;
        entry.pointsBefore         = h.getPointsBefore() != null ? h.getPointsBefore() : 0;
        entry.pointsAfter          = h.getPointsAfter()  != null ? h.getPointsAfter()  : 0;
        entry.triggeredByEventId   = h.getTriggeredByEventId();
        entry.recordedAt           = h.getRecordedAt();
        return entry;
    }

    // =========================================================================
    // SPORTS / WEIGHT CLASS DISCOVERY
    // =========================================================================

    /** Distinct sports that have ranking data. */
    public List<String> getAvailableSports() {
        return rankingRepository.findAll().stream()
                .map(Ranking::getSport)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /** Distinct weight classes within a sport. */
    public List<String> getWeightClassesForSport(String sport) {
        return rankingRepository.findAll().stream()
                .filter(r -> sport.equals(r.getSport()))
                .map(Ranking::getWeightClass)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * All distinct (sport, ageGroup) combinations that have at least one ranking row.
     * Used by the frontend to show only valid filter combinations and
     * default to the first pool that has real data.
     */
    public List<Map<String, String>> getAvailablePools() {
        return rankingRepository.findAll().stream()
                .filter(r -> r.getSport() != null && r.getCategory() != null)
                .map(r -> Map.of(
                        "sport",    r.getSport(),
                        "ageGroup", r.getCategory().name()
                ))
                .distinct()
                .sorted(Comparator.comparing((Map<String, String> m) -> m.get("sport"))
                        .thenComparing(m -> m.get("ageGroup")))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // MAPPERS
    // =========================================================================

    private GlobalRankingResponse toGlobalResponse(Ranking r, int rank) {
        GlobalRankingResponse res = new GlobalRankingResponse();
        res.rank          = rank;
        res.previousRank  = r.getPreviousRank();
        res.rankDelta     = r.getPreviousRank() != null ? r.getPreviousRank() - rank : null;
        res.robotId       = r.getRobotId();
        res.robotName     = r.getRobotName();
        res.teamId        = r.getTeamId();
        res.teamName      = r.getDisplayName();
        res.avatarUrl     = r.getAvatarUrl();
        res.state         = r.getState();
        res.city          = r.getCity();
        res.sport         = r.getSport();
        res.ageGroup      = r.getCategory() != null ? r.getCategory().name() : null;
        res.ageGroupLabel = r.getCategory() != null
                ? EligibilityUtils.toCategoryLabel(r.getCategory()) : null;
        res.weightClass   = r.getWeightClass();
        res.totalPoints   = r.getTotalPoints();
        res.eventsPlayed  = r.getEventsPlayed();
        res.matchesPlayed = r.getMatchesPlayed();
        res.wins          = r.getWins();
        res.losses        = r.getLosses();
        res.winPercentage = r.getWinPercentage();
        res.goldMedals    = r.getGoldMedals();
        res.silverMedals  = r.getSilverMedals();
        res.bronzeMedals  = r.getBronzeMedals();
        res.lastEventId   = r.getLastEventId();
        res.lastEventDate = r.getLastEventDate();
        res.lastUpdated   = r.getLastUpdated();
        return res;
    }

    private PointTransactionResponse toTransactionResponse(RankingPointTransaction t) {
        PointTransactionResponse res = new PointTransactionResponse();
        res.robotId       = t.getRobotId();
        res.teamId        = t.getTeamId();
        res.matchId       = t.getMatchId();
        res.eventId       = t.getEventId();
        res.sport         = t.getSport();
        res.ageGroup      = t.getAgeGroup();
        res.weightClass   = t.getWeightClass();
        res.roundType     = t.getRoundType();
        res.isWinner      = Boolean.TRUE.equals(t.getIsWinner());
        res.pointsAwarded = t.getPointsAwarded();
        res.isVoided      = Boolean.TRUE.equals(t.getIsVoided());
        res.createdAt     = t.getCreatedAt();
        return res;
    }

    private AgeCategory parseCategory(String ageGroup) {
        if (ageGroup == null) return null;
        try { return AgeCategory.valueOf(ageGroup.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}
