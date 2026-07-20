package com.botleague.backend.ranking.service;

import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.ranking.entity.EventLeaderboardEntry;
import com.botleague.backend.ranking.entity.GlobalRankingHistory;
import com.botleague.backend.ranking.entity.Ranking;
import com.botleague.backend.ranking.entity.RankingPointTransaction;
import com.botleague.backend.ranking.enums.RoundType;
import com.botleague.backend.ranking.repository.*;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.realtime.enums.RealtimeEventType;
import com.botleague.backend.team.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core ranking engine — the single source of truth for all point award and
 * ranking update logic.
 *
 * Call order for a completed match:
 *   1. awardMatchPoints(match)        — writes transactions, updates leaderboard entries
 *   2. recalculateLeaderboard(sportId) — re-sorts and sets ranks within the event
 *   3. [after ALL matches done] finalizeEventLeaderboard(sportId) — marks as done
 *   4. updateGlobalRankings(sport, ageGroup, weightClass) — propagates to global table
 *
 * Round-type detection:
 *   leaderboardPosition = 1  → FINAL
 *   leaderboardPosition = 3  → THIRD_PLACE
 *   roundNumber = totalRounds-1 → SEMI_FINAL
 *   roundNumber = totalRounds-2 → QUARTER_FINAL
 *   else                        → ROUND_1
 */
@Service
@Transactional
public class RankingEngineService {

    private static final Logger log = LoggerFactory.getLogger(RankingEngineService.class);

    private static final String SCOPE_NATIONAL = "NATIONAL";
    private static final String SEASON_GLOBAL  = "GLOBAL"; // no seasons; single accumulation bucket

    private final MatchRepository                    matchRepository;
    private final EventSportsRepository              eventSportsRepository;
    private final SportRegistrationRepository        sportRegistrationRepository;
    private final EventLeaderboardEntryRepository    leaderboardEntryRepository;
    private final RankingPointTransactionRepository  transactionRepository;
    private final GlobalRankingHistoryRepository     historyRepository;
    private final RankingRepository                  rankingRepository;
    private final TeamRepository                     teamRepository;
    private final RealtimePublisher                  realtimePublisher;

    public RankingEngineService(
            MatchRepository matchRepository,
            EventSportsRepository eventSportsRepository,
            SportRegistrationRepository sportRegistrationRepository,
            EventLeaderboardEntryRepository leaderboardEntryRepository,
            RankingPointTransactionRepository transactionRepository,
            GlobalRankingHistoryRepository historyRepository,
            RankingRepository rankingRepository,
            TeamRepository teamRepository,
            RealtimePublisher realtimePublisher) {
        this.matchRepository              = matchRepository;
        this.eventSportsRepository        = eventSportsRepository;
        this.sportRegistrationRepository  = sportRegistrationRepository;
        this.leaderboardEntryRepository   = leaderboardEntryRepository;
        this.transactionRepository        = transactionRepository;
        this.historyRepository            = historyRepository;
        this.rankingRepository            = rankingRepository;
        this.teamRepository               = teamRepository;
        this.realtimePublisher            = realtimePublisher;
    }

    // =========================================================================
    // STEP 1 — Award points for a completed match
    // Called by MatchService immediately after COMPLETED status is set.
    // =========================================================================

    public void awardMatchPoints(Match match) {
        // Guard: genuine bye (auto-advanced with no real competition), CANCELLED,
        // or already processed.
        //
        // NOTE: this deliberately checks autoAdvanced, not isBye. isBye means
        // "this match was GENERATED with an empty slot" (a structural/seeding
        // fact set once at bracket-build time and never cleared) — it stays
        // true even for a TRIPLE_THREAT/FATAL_FOUR match with 2-3 real
        // competitors and one empty slot, once that match is genuinely played
        // and approved. autoAdvanced means "this match was RESOLVED without
        // real competition" (set only by the bracket generator's
        // autoResolveByes(), only when exactly 1 real team was present) — the
        // correct signal for whether points should be awarded.
        if (Boolean.TRUE.equals(match.getAutoAdvanced()) || match.getStatus() != MatchStatus.COMPLETED) return;
        if (match.getWinnerRegistrationId() == null) return;

        EventSports sport = eventSportsRepository.findById(match.getEventSportId()).orElse(null);
        if (sport == null) return;

        String sportName    = sport.getSport();
        // Prefer the snapshot captured at bracket-generation time (see
        // Match.weightClassSnapshot javadoc) so a mid-tournament sport edit
        // can't retroactively move an already-played match's points into a
        // different pool (B-9). Falls back to a live read only for matches
        // created before these columns existed.
        String ageGroup     = match.getAgeGroupSnapshot() != null
                ? match.getAgeGroupSnapshot()
                : (sport.getAgeGroup() != null ? sport.getAgeGroup().name() : "UNKNOWN");
        String weightClass  = match.getWeightClassSnapshot() != null
                ? match.getWeightClassSnapshot()
                : sport.getWeightClass();

        RoundType roundType = detectRoundType(match);
        UUID winnerRegId    = match.getWinnerRegistrationId();

        // Collect all participants
        List<UUID> regIds = participantRegistrationIds(match);

        for (UUID regId : regIds) {
            SportRegistration reg = sportRegistrationRepository.findById(regId).orElse(null);
            if (reg == null || reg.getTeamId() == null) continue;

            UUID teamId   = reg.getTeamId();
            UUID robotId  = reg.getRobotId();
            boolean isWin = regId.equals(winnerRegId);

            if (robotId == null) {
                log.warn("[RankingEngine] SportRegistration {} has no robotId — skipping point award for match {}",
                        regId, match.getId());
                continue;
            }

            // Skip if already processed (idempotent) — per (match, robot), since
            // points are robot-scoped and a team can field multiple robots.
            if (transactionRepository.existsByMatchIdAndRobotId(match.getId(), robotId)) continue;

            int pts = isWin ? roundType.winnerPoints() : roundType.loserPoints();
            UUID opponentRegId = regIds.stream().filter(r -> !r.equals(regId)).findFirst().orElse(null);

            // Write transaction
            RankingPointTransaction tx = new RankingPointTransaction();
            tx.setRobotId(robotId);
            tx.setTeamId(teamId);
            tx.setEventId(sport.getEventId());
            tx.setMatchId(match.getId());
            tx.setEventSportId(sport.getId());
            tx.setSport(sportName);
            tx.setAgeGroup(ageGroup);
            tx.setWeightClass(weightClass);
            tx.setRoundType(roundType.name());
            tx.setIsWinner(isWin);
            tx.setPointsAwarded(pts);
            tx.setOpponentRegistrationId(opponentRegId);

            try {
                transactionRepository.save(tx);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // DB-level backstop for the (match, robot) idempotency check
                // above — a concurrent awardMatchPoints() call for this exact
                // match+robot won the race and committed first (partial unique
                // index uk_rpt_match_robot_active). Already awarded — skip,
                // matching the fail-open idempotent behavior of the check above.
                log.info("[RankingEngine] Concurrent award detected for match {} robot {} — already recorded, skipping",
                        match.getId(), robotId);
                continue;
            }

            // Update event leaderboard entry
            updateLeaderboardEntry(sport, robotId, teamId, reg, pts, isWin, sportName, ageGroup, weightClass);
        }

        // Recalculate leaderboard order
        recalculateLeaderboardRanks(match.getEventSportId());

        // Push realtime update
        try {
            realtimePublisher.pushRankingsUpdated(match.getEventSportId());
        } catch (Exception ignored) {}

        log.info("[RankingEngine] Awarded points for match {} ({}), roundType={}", match.getId(), sportName, roundType);
    }

    // =========================================================================
    // CORRECTION — void all points previously awarded for a match
    // Used when a COMPLETED match's result needs to be reopened and re-scored
    // (see MatchService.correctMatchResult). Voids the RankingPointTransaction
    // rows AND reverses their contribution to the affected EventLeaderboardEntry
    // rows, so the leaderboard doesn't keep stale stats around after the
    // transactions themselves are voided. Idempotent — re-running against a
    // match with no live (non-voided) transactions is a no-op.
    // =========================================================================

    public void voidPointsForMatch(UUID matchId) {
        List<RankingPointTransaction> live = transactionRepository.findByMatchId(matchId).stream()
                .filter(t -> !Boolean.TRUE.equals(t.getIsVoided()))
                .collect(Collectors.toList());

        if (live.isEmpty()) return;

        UUID eventSportId = null;

        for (RankingPointTransaction tx : live) {
            eventSportId = tx.getEventSportId();
            leaderboardEntryRepository.findByEventSportIdAndRobotId(tx.getEventSportId(), tx.getRobotId())
                    .ifPresent(entry -> {
                        entry.setPointsEarned(entry.getPointsEarned() - tx.getPointsAwarded());
                        entry.setMatchesPlayed(Math.max(0, entry.getMatchesPlayed() - 1));
                        if (Boolean.TRUE.equals(tx.getIsWinner())) {
                            entry.setWins(Math.max(0, entry.getWins() - 1));
                        } else {
                            entry.setLosses(Math.max(0, entry.getLosses() - 1));
                        }
                        leaderboardEntryRepository.save(entry);
                    });
        }

        transactionRepository.voidAllForMatch(matchId);

        if (eventSportId != null) {
            recalculateLeaderboardRanks(eventSportId);
        }

        log.info("[RankingEngine] Voided {} point transaction(s) for match {}", live.size(), matchId);
    }

    // =========================================================================
    // STEP 2 — Recalculate leaderboard ranks (tie-breaker aware)
    // =========================================================================

    public void recalculateLeaderboardRanks(UUID eventSportId) {
        List<EventLeaderboardEntry> entries =
                leaderboardEntryRepository.findByEventSportIdOrderByPointsEarnedDescWinsDescMatchesPlayedDesc(eventSportId);

        // Apply full tie-breaker sort
        entries.sort(this::compareLeaderboardEntries);

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setEventRank(i + 1);
        }
        leaderboardEntryRepository.saveAll(entries);
    }

    // =========================================================================
    // STEP 3 — Finalize event leaderboard (call when all bracket matches done)
    // =========================================================================

    public void finalizeEventLeaderboard(UUID eventSportId) {
        // Backfill any completed matches whose points were never recorded
        // (covers events completed before the ranking engine was wired, or
        //  admin-triggered re-finalization after corrections).
        backfillFromMatches(eventSportId);

        List<EventLeaderboardEntry> entries =
                leaderboardEntryRepository.findByEventSportIdOrderByPointsEarnedDescWinsDescMatchesPlayedDesc(eventSportId);

        if (entries.isEmpty()) {
            log.warn("[RankingEngine] No leaderboard entries found for eventSportId={} — nothing to finalize", eventSportId);
            return;
        }

        // Final sort + rank assignment. Deliberately does NOT touch the global
        // Ranking table — see pushToGlobalRankings(), the sole, ADMIN-gated
        // gateway to the global pool.
        entries.sort(this::compareLeaderboardEntries);
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setEventRank(i + 1);
            entries.get(i).setIsFinalized(true);
        }
        leaderboardEntryRepository.saveAll(entries);

        log.info("[RankingEngine] Finalized leaderboard for eventSportId={}", eventSportId);
    }

    // =========================================================================
    // STEP 3.5 — Push a finalized event leaderboard to the GLOBAL ranking pool.
    // This is the one and only path that writes to the global Ranking table —
    // callers must be ADMIN/SUPER_ADMIN, enforced at the controller.
    // =========================================================================

    public void pushToGlobalRankings(UUID eventSportId) {
        EventSports sport = eventSportsRepository.findById(eventSportId).orElse(null);
        if (sport == null) {
            throw com.botleague.backend.common.exception.ApiException.notFound(
                    "Event sport not found: " + eventSportId);
        }

        List<EventLeaderboardEntry> allEntries =
                leaderboardEntryRepository.findByEventSportIdOrderByPointsEarnedDescWinsDescMatchesPlayedDesc(eventSportId);

        if (allEntries.isEmpty()) {
            throw com.botleague.backend.common.exception.ApiException.badRequest(
                    "No leaderboard entries yet for this sport — matches need to be played and approved first.");
        }

        List<EventLeaderboardEntry> entries = allEntries.stream()
                        .filter(e -> Boolean.TRUE.equals(e.getIsFinalized()))
                        .collect(Collectors.toList());

        if (entries.isEmpty()) {
            throw com.botleague.backend.common.exception.ApiException.badRequest(
                    "Leaderboard is not finalized yet — this happens automatically once every match in the "
                    + "bracket is completed and approved. Finish the remaining matches first, or use "
                    + "Finalize Leaderboard to force it.");
        }

        updateGlobalRankings(sport, entries);
        log.info("[RankingEngine] Pushed eventSportId={} to global rankings", eventSportId);
    }

    // =========================================================================
    // STEP 4 — Update global rankings from finalized event leaderboard
    // =========================================================================

    public void updateGlobalRankings(EventSports sport, List<EventLeaderboardEntry> finalEntries) {
        String sportName   = sport.getSport();
        String ageGroup    = sport.getAgeGroup() != null ? sport.getAgeGroup().name() : "UNKNOWN";
        String weightClass = sport.getWeightClass();

        for (EventLeaderboardEntry entry : finalEntries) {
            UUID robotId = entry.getRobotId();
            UUID teamId  = entry.getTeamId();
            if (robotId == null) {
                log.warn("[RankingEngine] leaderboard entry {} has no robotId — skipping global push", entry.getId());
                continue;
            }
            Ranking global = findOrCreateGlobalRanking(robotId, teamId, entry.getRobotName(), sportName, ageGroup, weightClass);

            // Accumulate stats
            global.setTotalPoints(global.getTotalPoints() + entry.getPointsEarned());
            global.setWins(global.getWins() + entry.getWins());
            global.setLosses(global.getLosses() + entry.getLosses());
            global.setMatchesPlayed(global.getMatchesPlayed() + entry.getMatchesPlayed());
            global.setEventsPlayed(global.getEventsPlayed() + 1);
            global.setLastEventId(sport.getEventId());
            global.setLastEventDate(LocalDate.now());

            // Medal awards
            if (Integer.valueOf(1).equals(entry.getEventRank())) global.setGoldMedals(global.getGoldMedals() + 1);
            else if (Integer.valueOf(2).equals(entry.getEventRank())) global.setSilverMedals(global.getSilverMedals() + 1);
            else if (Integer.valueOf(3).equals(entry.getEventRank())) global.setBronzeMedals(global.getBronzeMedals() + 1);

            // Win percentage
            global.setWinPercentage(
                    com.botleague.backend.ranking.util.RankingMath.winPercentage(
                            global.getWins(), global.getMatchesPlayed()));

            rankingRepository.save(global);
        }

        // Re-rank the entire pool after updating all entries
        recalculateGlobalPoolRanks(sportName, ageGroup, weightClass, sport.getEventId());
    }

    // =========================================================================
    // BACKFILL — process completed matches whose points were never recorded
    // Idempotent: awardMatchPoints skips matches already in RankingPointTransaction.
    // =========================================================================

    private void backfillFromMatches(UUID eventSportId) {
        List<Match> completed = matchRepository
                .findByEventSportIdAndDeletedAtIsNull(eventSportId)
                .stream()
                .filter(m -> m.getStatus() == MatchStatus.COMPLETED)
                // See awardMatchPoints() — autoAdvanced, not isBye, is the correct
                // "no real competition occurred" signal.
                .filter(m -> !Boolean.TRUE.equals(m.getAutoAdvanced()))
                .filter(m -> m.getWinnerRegistrationId() != null)
                .collect(Collectors.toList());

        for (Match match : completed) {
            try {
                awardMatchPoints(match);
            } catch (Exception e) {
                log.warn("[RankingEngine] Backfill failed for match {}: {}", match.getId(), e.getMessage());
            }
        }

        if (!completed.isEmpty()) {
            log.info("[RankingEngine] Backfilled points for {} completed matches in eventSportId={}", completed.size(), eventSportId);
        }
    }

    // =========================================================================
    // FULL RECALCULATION (admin-triggered or after correction)
    // Rebuilds global rankings from scratch using point transactions.
    // =========================================================================

    public void fullRecalculate(String sport, String ageGroup, String weightClass) {
        log.info("[RankingEngine] Full recalculation for sport={} ageGroup={} weight={}", sport, ageGroup, weightClass);

        // Get all non-voided transactions in this pool directly (previously this
        // called findByEventSportIdAndIsVoidedFalse(null), which always returned
        // empty since event_sport_id is non-null — a silent no-op).
        List<RankingPointTransaction> txs = transactionRepository.findByPool(sport, ageGroup, weightClass);

        // Map each robot to its (denormalized) team — a robot's team doesn't change mid-pool.
        Map<UUID, UUID> robotToTeam = txs.stream()
                .filter(t -> t.getRobotId() != null)
                .collect(Collectors.toMap(RankingPointTransaction::getRobotId,
                        RankingPointTransaction::getTeamId, (a, b) -> a));

        // Grouped once up front — previously "full" recalculate only rebuilt
        // totalPoints, leaving wins/losses/matchesPlayed/eventsPlayed/medals
        // stale after a correction.
        Map<UUID, List<RankingPointTransaction>> txsByRobot = txs.stream()
                .filter(t -> t.getRobotId() != null)
                .collect(Collectors.groupingBy(RankingPointTransaction::getRobotId));

        for (Map.Entry<UUID, UUID> e : robotToTeam.entrySet()) {
            UUID robotId = e.getKey();
            UUID teamId  = e.getValue();
            int totalPts = transactionRepository.sumPointsByRobotAndPool(robotId, sport, ageGroup, weightClass);

            List<RankingPointTransaction> robotTxs = txsByRobot.getOrDefault(robotId, List.of());
            int wins    = (int) robotTxs.stream().filter(t -> Boolean.TRUE.equals(t.getIsWinner())).count();
            int losses  = robotTxs.size() - wins;
            int eventsPlayed = (int) robotTxs.stream()
                    .map(RankingPointTransaction::getEventId)
                    .filter(Objects::nonNull)
                    .distinct().count();

            // Medals aren't transaction-derivable (they're an event-level
            // outcome, not a per-match one) — recount from this robot's
            // finalized EventLeaderboardEntry rows in this same pool.
            int gold = 0, silver = 0, bronze = 0;
            for (EventLeaderboardEntry entry : leaderboardEntryRepository.findByRobotIdAndIsFinalized(robotId, true)) {
                if (!Objects.equals(entry.getSport(), sport)) continue;
                if (!Objects.equals(entry.getAgeGroup(), ageGroup)) continue;
                if (!Objects.equals(entry.getWeightClass(), weightClass)) continue;
                if (Integer.valueOf(1).equals(entry.getEventRank())) gold++;
                else if (Integer.valueOf(2).equals(entry.getEventRank())) silver++;
                else if (Integer.valueOf(3).equals(entry.getEventRank())) bronze++;
            }

            Ranking r = findOrCreateGlobalRanking(robotId, teamId, null, sport, ageGroup, weightClass);
            r.setTotalPoints(totalPts);
            r.setWins(wins);
            r.setLosses(losses);
            r.setMatchesPlayed(robotTxs.size());
            r.setEventsPlayed(eventsPlayed);
            r.setGoldMedals(gold);
            r.setSilverMedals(silver);
            r.setBronzeMedals(bronze);
            r.setWinPercentage(com.botleague.backend.ranking.util.RankingMath.winPercentage(wins, robotTxs.size()));
            rankingRepository.save(r);
        }

        recalculateGlobalPoolRanks(sport, ageGroup, weightClass, null);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Determines the round type from match context.
     *
     * Algorithm:
     *   1. leaderboardPosition = 1 → FINAL
     *   2. leaderboardPosition = 3 → THIRD_PLACE
     *   3. Get max(roundNumber) for all non-bye, non-deleted matches in this sport
     *   4. roundNumber == maxRound       → FINAL (fallback)
     *   5. roundNumber == maxRound - 1  → SEMI_FINAL
     *   6. roundNumber == maxRound - 2  → QUARTER_FINAL
     *   7. else                          → ROUND_1
     */
    private RoundType detectRoundType(Match match) {
        if (Integer.valueOf(1).equals(match.getLeaderboardPosition())) return RoundType.FINAL;
        if (Integer.valueOf(3).equals(match.getLeaderboardPosition())) return RoundType.THIRD_PLACE;

        if (match.getRoundNumber() == null) return RoundType.ROUND_1;

        int maxRound = matchRepository.findByEventSportIdAndDeletedAtIsNull(match.getEventSportId())
                .stream()
                // See awardMatchPoints() — autoAdvanced, not isBye, is the correct
                // "no real competition occurred" signal; excluding isBye here
                // wrongly dropped genuinely-played TRIPLE_THREAT/FATAL_FOUR
                // matches from the round count, misclassifying rounds.
                .filter(m -> !Boolean.TRUE.equals(m.getAutoAdvanced()))
                .filter(m -> m.getLeaderboardPosition() == null || m.getLeaderboardPosition() != 3)
                .mapToInt(m -> m.getRoundNumber() != null ? m.getRoundNumber() : 1)
                .max()
                .orElse(1);

        int round = match.getRoundNumber();
        if (round == maxRound)     return RoundType.FINAL;       // fallback (leaderboardPosition should catch this)
        if (round == maxRound - 1) return RoundType.SEMI_FINAL;
        if (round == maxRound - 2) return RoundType.QUARTER_FINAL;
        return RoundType.ROUND_1;
    }

    private List<UUID> participantRegistrationIds(Match match) {
        List<UUID> ids = new ArrayList<>();
        if (match.getTeamARegistrationId() != null) ids.add(match.getTeamARegistrationId());
        if (match.getTeamBRegistrationId() != null) ids.add(match.getTeamBRegistrationId());
        if (match.getTeamCRegistrationId() != null) ids.add(match.getTeamCRegistrationId());
        if (match.getTeamDRegistrationId() != null) ids.add(match.getTeamDRegistrationId());
        return ids;
    }

    private void updateLeaderboardEntry(EventSports sport, UUID robotId, UUID teamId, SportRegistration reg,
                                        int points, boolean isWin,
                                        String sportName, String ageGroup, String weightClass) {
        EventLeaderboardEntry entry = leaderboardEntryRepository
                .findByEventSportIdAndRobotId(sport.getId(), robotId)
                .orElseGet(() -> {
                    EventLeaderboardEntry e = new EventLeaderboardEntry();
                    e.setEventId(sport.getEventId());
                    e.setEventSportId(sport.getId());
                    e.setRobotId(robotId);
                    e.setTeamId(teamId);
                    e.setSport(sportName);
                    e.setAgeGroup(ageGroup);
                    e.setWeightClass(weightClass);
                    // Denormalize team/robot name
                    if (reg.getTeamId() != null) {
                        teamRepository.findById(reg.getTeamId())
                                .ifPresent(t -> e.setTeamName(t.getTeamName()));
                    }
                    e.setRobotName(reg.getRobotName());
                    return e;
                });

        entry.setPointsEarned(entry.getPointsEarned() + points);
        entry.setMatchesPlayed(entry.getMatchesPlayed() + 1);
        if (isWin) entry.setWins(entry.getWins() + 1);
        else       entry.setLosses(entry.getLosses() + 1);

        leaderboardEntryRepository.save(entry);
    }

    /**
     * Tie-breaker comparison (descending priority):
     * 1. Total points (higher = better)
     * 2. Total wins (higher = better)
     * 3. Win percentage (higher = better)
     * 4. Head-to-head result, if the two tied robots played each other directly
     *    within this event sport (standard tournament tie-break practice).
     *
     * NOTE: an EventLeaderboardEntry is scoped to a single event sport by
     * definition, so "events played" (used at the global-scope comparator
     * below) doesn't apply here — an earlier version of this comment claimed
     * a 4th "events played" tier that was never actually implemented.
     */
    private int compareLeaderboardEntries(EventLeaderboardEntry a, EventLeaderboardEntry b) {
        if (!Objects.equals(a.getPointsEarned(), b.getPointsEarned()))
            return Integer.compare(b.getPointsEarned(), a.getPointsEarned());
        if (!Objects.equals(a.getWins(), b.getWins()))
            return Integer.compare(b.getWins(), a.getWins());
        double wpA = com.botleague.backend.ranking.util.RankingMath.winPercentage(a.getWins(), a.getMatchesPlayed());
        double wpB = com.botleague.backend.ranking.util.RankingMath.winPercentage(b.getWins(), b.getMatchesPlayed());
        if (Double.compare(wpB, wpA) != 0) return Double.compare(wpB, wpA);
        return headToHeadResult(a, b);
    }

    /**
     * Looks for a direct match between the two robots within this event sport
     * (via RankingPointTransaction.opponentRegistrationId) and, if found,
     * ranks the winner of that match ahead. Returns 0 (still tied) if they
     * never played each other, or if either side's robotId is missing.
     */
    private int headToHeadResult(EventLeaderboardEntry a, EventLeaderboardEntry b) {
        if (a.getRobotId() == null || b.getRobotId() == null) return 0;

        List<RankingPointTransaction> aTxs = transactionRepository
                .findByRobotIdAndIsVoidedFalseOrderByCreatedAtDesc(a.getRobotId());

        for (RankingPointTransaction tx : aTxs) {
            if (!Objects.equals(tx.getEventSportId(), a.getEventSportId())) continue;
            if (tx.getOpponentRegistrationId() == null) continue;

            SportRegistration opponentReg = sportRegistrationRepository
                    .findById(tx.getOpponentRegistrationId()).orElse(null);
            if (opponentReg == null || !Objects.equals(opponentReg.getRobotId(), b.getRobotId())) continue;

            return Boolean.TRUE.equals(tx.getIsWinner()) ? -1 : 1;
        }
        return 0;
    }

    /**
     * Tie-breaker comparison for global rankings:
     * 1. Total points
     * 2. Total wins
     * 3. Win percentage
     * 4. Events played
     * 5. Gold medals → Silver medals → Bronze medals
     */
    private int compareGlobalRankings(Ranking a, Ranking b) {
        if (a.getTotalPoints() != b.getTotalPoints())
            return Integer.compare(b.getTotalPoints(), a.getTotalPoints());
        if (a.getWins() != b.getWins())
            return Integer.compare(b.getWins(), a.getWins());
        if (Double.compare(b.getWinPercentage(), a.getWinPercentage()) != 0)
            return Double.compare(b.getWinPercentage(), a.getWinPercentage());
        if (a.getEventsPlayed() != b.getEventsPlayed())
            return Integer.compare(b.getEventsPlayed(), a.getEventsPlayed());
        if (a.getGoldMedals() != b.getGoldMedals())
            return Integer.compare(b.getGoldMedals(), a.getGoldMedals());
        if (a.getSilverMedals() != b.getSilverMedals())
            return Integer.compare(b.getSilverMedals(), a.getSilverMedals());
        return Integer.compare(b.getBronzeMedals(), a.getBronzeMedals());
    }

    private void recalculateGlobalPoolRanks(String sport, String ageGroup, String weightClass, UUID triggeredByEventId) {
        List<Ranking> pool = rankingRepository
                .findPoolOrderedByPoints(sport, SCOPE_NATIONAL, SEASON_GLOBAL,
                        parseCategory(ageGroup), weightClass);

        if (pool.isEmpty()) return;

        // Sort with full tie-breakers
        pool.sort(this::compareGlobalRankings);

        for (int i = 0; i < pool.size(); i++) {
            Ranking r   = pool.get(i);
            int newRank = i + 1;
            int prevRank = r.getCurrentRank() != null ? r.getCurrentRank() : newRank;

            if (!Integer.valueOf(newRank).equals(r.getCurrentRank())) {
                // Record history snapshot
                GlobalRankingHistory h = new GlobalRankingHistory();
                h.setRobotId(r.getRobotId());
                h.setTeamId(r.getTeamId());
                h.setTeamName(r.getDisplayName());
                h.setSport(sport);
                h.setAgeGroup(ageGroup);
                h.setWeightClass(weightClass);
                h.setOldRank(prevRank);
                h.setNewRank(newRank);
                h.setRankDelta(prevRank - newRank);   // positive = moved up
                h.setPointsBefore(r.getTotalPoints());
                h.setPointsAfter(r.getTotalPoints());
                h.setTriggeredByEventId(triggeredByEventId);
                historyRepository.save(h);
            }

            r.setPreviousRank(r.getCurrentRank());
            r.setCurrentRank(newRank);
            rankingRepository.save(r);
        }

        // Push realtime notification
        try {
            realtimePublisher.toTopic("/topic/rankings/global/" + sport + "/" + ageGroup,
                    RealtimeEventType.RANKINGS_UPDATED,
                    Map.of("sport", sport, "ageGroup", ageGroup, "weightClass", weightClass != null ? weightClass : ""));
        } catch (Exception ignored) {}
    }

    private Ranking findOrCreateGlobalRanking(UUID robotId, UUID teamId, String robotName,
                                               String sport, String ageGroup, String weightClass) {
        com.botleague.backend.events.enums.AgeCategory cat = parseCategory(ageGroup);

        java.util.Optional<Ranking> existing = rankingRepository
                .findByRobotIdAndSportAndWeightClassAndScopeAndSeason(
                        robotId, sport, weightClass, SCOPE_NATIONAL, SEASON_GLOBAL);
        if (existing.isPresent()) return existing.get();

        Ranking nr = new Ranking();
        nr.setEntityType("TEAM");
        nr.setRobotId(robotId);
        nr.setRobotName(robotName);
        nr.setTeamId(teamId);
        nr.setScope(SCOPE_NATIONAL);
        nr.setSeason(SEASON_GLOBAL);
        nr.setSport(sport);
        nr.setCategory(cat);
        nr.setWeightClass(weightClass);
        if (teamId != null) {
            teamRepository.findById(teamId).ifPresent(t -> {
                nr.setDisplayName(t.getTeamName());
                nr.setState(t.getState());
                nr.setCity(t.getCity());
            });
        }

        // Insert immediately (rather than returning a transient object for the
        // caller to save later) so a concurrent caller racing to create the
        // same natural-key row (uk_ranking_natural_key) is caught HERE, before
        // any stats have been accumulated onto an object that's about to be
        // discarded — audit finding B-10. Classic "insert, on-conflict
        // re-select": if we lost the race, fetch the row the winner created.
        try {
            return rankingRepository.save(nr);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return rankingRepository
                    .findByRobotIdAndSportAndWeightClassAndScopeAndSeason(
                            robotId, sport, weightClass, SCOPE_NATIONAL, SEASON_GLOBAL)
                    .orElseThrow(() -> e);
        }
    }

    private com.botleague.backend.events.enums.AgeCategory parseCategory(String ageGroup) {
        if (ageGroup == null) return null;
        try { return com.botleague.backend.events.enums.AgeCategory.valueOf(ageGroup.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}
