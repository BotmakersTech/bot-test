package com.botleague.backend.matches.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;


import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.team.repository.TeamRepository;
import com.botleague.backend.matches.dto.LeaderboardEntryDTO;
import com.botleague.backend.matches.dto.LeaderboardResponseDTO;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.BracketSide;
import com.botleague.backend.matches.enums.LeaderboardStatus;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;
import com.botleague.backend.matches.repository.MatchRepository;

/**
 * Builds the leaderboard for a single bracket (one event-sport).
 *
 * The whole bracket is read in one go and every team is placed using a
 * 3-element integer sort key {stage, depth, intra} where LOWER is BETTER and
 * keys are compared lexicographically. Teams whose keys are identical genuinely
 * tie and SHARE a rank number (standard competition ranking: 1, 2, 2, 4 …);
 * the display order within a tie is settled by point differential, then wins,
 * then a stable id ordering.
 *
 * The same key scheme drives both an in-progress "current standings" view and
 * the final standings — when matches are still SCHEDULED/LIVE the response is
 * flagged isFinal=false and the affected ranks are provisional.
 *
 * Read-only and stateless, so it is safe as a Spring singleton. No admin check,
 * mirroring the public read endpoints in MatchService.
 *
 * ── Supported shapes ─────────────────────────────────────────────────────
 *   SINGLE_ELIMINATION : ONE_VS_ONE, TRIPLE_THREAT, FATAL_FOUR
 *   DOUBLE_ELIMINATION : ONE_VS_ONE
 *
 * ── Edge cases handled ───────────────────────────────────────────────────
 *   • N = 0  → empty leaderboard, isFinal = true
 *   • N = 1  → single bye match → that team is CHAMPION (0 wins, 1 bye)
 *   • cascading byes / walkovers (never counted as wins)
 *   • in-progress brackets → provisional ranks, isFinal = false
 *   • genuine ties → shared rank + tied = true
 *   • 3rd-place match completed while the final is still live (and vice-versa)
 *   • double-elim bracket reset (the reset game is the decider)
 *   • multi-team finals (a TRIPLE_THREAT/FATAL_FOUR final ranks 1-3 / 1-4
 *     directly; any generated 3rd-place match then ranks its teams just below)
 * ──────────────────────────────────────────────────────────────────────────
 */
@Service
public class LeaderboardService {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final MatchRepository matchRepository;
    private final SportRegistrationRepository eventRegistrationRepository;
    private final TeamRepository teamRepository;

    public LeaderboardService(
            MatchRepository matchRepository,
            SportRegistrationRepository eventRegistrationRepository,
            TeamRepository teamRepository
    ) {
        this.matchRepository = matchRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.teamRepository = teamRepository;
    }

    // =====================================================
    // PUBLIC ENTRY POINT
    // GET /v1/leaderboard/event-sport/{eventSportId}
    // =====================================================

    public LeaderboardResponseDTO getLeaderboard(UUID eventSportId) {

        List<Match> matches =
                matchRepository
                        .findByEventSportIdAndDeletedAtIsNullOrderByRoundNumberAscMatchNumberAsc(
                                eventSportId
                        );

        LeaderboardResponseDTO response = new LeaderboardResponseDTO();
        response.setEventSportId(eventSportId);
        response.setTournamentFormat(firstNonNullFormat(matches));
        response.setMatchType(firstNonNullMatchType(matches));

        // ── N = 0 : nothing to rank ───────────────────────────────────
        if (matches == null || matches.isEmpty()) {
            response.setEntries(new ArrayList<>());
            response.setTotalTeams(0);
            response.setIsFinal(true);
            return response;
        }

        // ── Collect every distinct team in the bracket ────────────────
        Set<UUID> teamIds = collectTeamIds(matches);

        // ── One Standing per team, keyed by registration id ───────────
        Map<UUID, Standing> standings = new LinkedHashMap<>();
        for (UUID id : teamIds) {
            standings.put(id, new Standing(id));
        }

        // ── Aggregate stats from COMPLETED matches only ───────────────
        accumulateStats(matches, standings);

        int totalRounds = 0;
        for (Match m : matches) {
            totalRounds = Math.max(totalRounds, orZero(m.getRoundNumber()));
        }

        boolean isFinal = computeIsFinal(matches);

        // ── Assign sort keys per format ───────────────────────────────
        TournamentFormat format = response.getTournamentFormat();
        if (format == TournamentFormat.DOUBLE_ELIMINATION) {
            rankDoubleElimination(matches, standings, totalRounds);
        } else {
            // SINGLE_ELIMINATION (and the safe default for null)
            rankSingleElimination(matches, standings, totalRounds);
        }

        // ── Sort, then assign competition ranks (ties share a number) ─
        List<Standing> ordered = new ArrayList<>(standings.values());
        ordered.sort(STANDING_COMPARATOR);
        assignRanks(ordered);

        // ── Resolve robot + team names (one lookup per id) ───────────
        Map<UUID, String[]> names = resolveNames(teamIds);

        // ── Build entries + locate champion ───────────────────────────
        List<LeaderboardEntryDTO> entries = new ArrayList<>();
        UUID championId = null;
        for (Standing s : ordered) {
            if (s.champion && championId == null) {
                championId = s.registrationId;
            }
            String[] pair = names.getOrDefault(s.registrationId, new String[]{null, null});
            entries.add(toEntry(s, pair[0], pair[1]));
        }

        response.setEntries(entries);
        response.setTotalTeams(teamIds.size());
        response.setIsFinal(isFinal);
        if (championId != null) {
            response.setChampionRegistrationId(championId);
            String[] pair = names.getOrDefault(championId, new String[]{null, null});
            response.setChampionRobotName(pair[0]);
            response.setChampionTeamName(pair[1]);
        }

        return response;
    }

    // =====================================================
    // STATS — wins / losses / byes / points
    //
    // Only COMPLETED matches contribute. A match counts as:
    //   • 0 teams present → skipped (empty placeholder)
    //   • 1 team present  → a BYE for that team (byes++, no win/loss)
    //   • 2+ teams present → a REAL match (played, win/loss, points)
    //
    // pointsAgainst in a multi-team match = the combined score of every
    // OTHER present team.
    // =====================================================

    private void accumulateStats(List<Match> matches, Map<UUID, Standing> standings) {

        for (Match match : matches) {

            if (match.getStatus() != MatchStatus.COMPLETED) continue;

            List<UUID> present = presentTeams(match);
            if (present.isEmpty()) continue;

            // ── Bye / walkover (exactly one real team) ────────────────
            if (present.size() == 1) {
                Standing s = standings.get(present.get(0));
                if (s != null) s.byes++;
                continue;
            }

            // ── Real, contested match ─────────────────────────────────
            UUID winnerId = match.getWinnerRegistrationId();
            for (UUID teamId : present) {
                Standing s = standings.get(teamId);
                if (s == null) continue;

                s.played++;
                s.pointsFor += score(match, teamId);
                s.pointsAgainst += opponentsScore(match, teamId, present);

                if (winnerId != null && winnerId.equals(teamId)) {
                    s.wins++;
                } else {
                    s.losses++;
                }
            }
        }
    }

    // =====================================================
    // SINGLE ELIMINATION — sort keys
    //
    // stage : 0 = grand final, 1 = 3rd-place match,
    //         2 + (totalRounds - r) = normal round r (deeper = smaller)
    // depth : unused here (always 0)
    // intra : finish position within the stage; for normal rounds,
    //         0 = still active, 1 = eliminated (active ranks above out)
    // =====================================================

    private void rankSingleElimination(
            List<Match> matches,
            Map<UUID, Standing> standings,
            int totalRounds
    ) {
        Match grandFinal = findGrandFinalSingle(matches, totalRounds);
        UUID gfId = grandFinal != null ? grandFinal.getId() : null;

        for (Standing s : standings.values()) {

            Match frontier = frontierMatch(matches, s.registrationId);
            if (frontier == null) continue; // keeps the {1000,0,0} default

            boolean isGrandFinal = gfId != null && gfId.equals(frontier.getId());
            boolean isThirdPlace = Integer.valueOf(3).equals(frontier.getLeaderboardPosition());
            boolean completed = frontier.getStatus() == MatchStatus.COMPLETED;
            int round = orZero(frontier.getRoundNumber());

            // ── Grand final ───────────────────────────────────────────
            if (isGrandFinal) {
                if (completed) {
                    int pos = finishPosition(frontier, s.registrationId);
                    s.sortKey = new int[]{0, 0, pos};
                    if (pos == 1) {
                        s.status = LeaderboardStatus.CHAMPION;
                        s.champion = true;
                    } else {
                        s.status = LeaderboardStatus.ELIMINATED;
                        s.eliminatedInRound = round;
                    }
                } else {
                    // final not played yet → provisional tie at the very top
                    s.sortKey = new int[]{0, 0, 0};
                    s.status = LeaderboardStatus.ACTIVE;
                }
                continue;
            }

            // ── 3rd-place match (winner → 3rd, loser → 4th) ───────────
            if (isThirdPlace) {
                if (completed) {
                    int pos = finishPosition(frontier, s.registrationId);
                    s.sortKey = new int[]{1, 0, pos};
                    s.status = LeaderboardStatus.ELIMINATED;
                    s.eliminatedInRound = round;
                } else {
                    s.sortKey = new int[]{1, 0, 0};
                    s.status = LeaderboardStatus.ACTIVE;
                }
                continue;
            }

            // ── Normal bracket match ──────────────────────────────────
            int stage = 2 + Math.max(0, totalRounds - round);
            List<UUID> present = presentTeams(frontier);
            boolean isWinner = s.registrationId.equals(frontier.getWinnerRegistrationId());

            if (!completed) {
                // still has this match to play → active, ranked by reach
                s.sortKey = new int[]{stage, 0, 0};
                s.status = LeaderboardStatus.ACTIVE;
            } else if (present.size() <= 1 || isWinner) {
                // won a bye, or won a real match whose next match isn't wired
                // yet → still in contention
                s.sortKey = new int[]{stage, 0, 0};
                s.status = LeaderboardStatus.ACTIVE;
            } else {
                // lost a real match → eliminated here
                s.sortKey = new int[]{stage, 0, 1};
                s.status = LeaderboardStatus.ELIMINATED;
                s.eliminatedInRound = round;
            }
        }
    }

    /**
     * The grand final is the match flagged leaderboardPosition == 1; failing
     * that, the highest-round non-3rd-place match that nothing advances out of
     * (nextMatchId == null). This also naturally catches the N == 1 single bye
     * match, crowning that lone team.
     */
    private Match findGrandFinalSingle(List<Match> matches, int totalRounds) {

        Match byPosition = null;
        for (Match m : matches) {
            if (Integer.valueOf(1).equals(m.getLeaderboardPosition())) {
                if (byPosition == null
                        || orZero(m.getMatchNumber()) < orZero(byPosition.getMatchNumber())) {
                    byPosition = m;
                }
            }
        }
        if (byPosition != null) return byPosition;

        Match candidate = null;
        for (Match m : matches) {
            if (orZero(m.getRoundNumber()) != totalRounds) continue;
            if (Integer.valueOf(3).equals(m.getLeaderboardPosition())) continue;
            if (m.getNextMatchId() != null) continue;
            if (candidate == null
                    || orZero(m.getMatchNumber()) < orZero(candidate.getMatchNumber())) {
                candidate = m;
            }
        }
        return candidate;
    }

    // =====================================================
    // DOUBLE ELIMINATION — sort keys (ONE_VS_ONE)
    //
    // stage : 0 = decisive grand final,
    //         1 = active in winners bracket (no losses yet),
    //         2 = active in losers bracket (one loss, not yet out),
    //         3 = eliminated in losers bracket
    // depth : distance from the deepest round of that bracket
    //         (so a later elimination/round sorts ahead of an earlier one)
    // intra : 1 = champion / 2 = runner-up in the grand final;
    //         1 for losers-eliminated; 0 for active
    //
    // A WINNERS-bracket loss is NEVER an elimination — it only drops a team
    // into the losers bracket. A complete tournament therefore has no ACTIVE
    // teams; everyone reaches the grand final or loses a losers match.
    // =====================================================

    private void rankDoubleElimination(
            List<Match> matches,
            Map<UUID, Standing> standings,
            int totalRounds
    ) {
        Match decisiveGF = findDecisiveGrandFinal(matches);

        int losersMaxRound = 0;
        int winnersMaxRound = 0;
        for (Match m : matches) {
            if (m.getBracketSide() == BracketSide.LOSERS) {
                losersMaxRound = Math.max(losersMaxRound, orZero(m.getRoundNumber()));
            } else if (m.getBracketSide() == BracketSide.WINNERS) {
                winnersMaxRound = Math.max(winnersMaxRound, orZero(m.getRoundNumber()));
            }
        }

        for (Standing s : standings.values()) {

            UUID id = s.registrationId;

            // ── 1. Decisive grand final decides 1st / 2nd ─────────────
            if (decisiveGF != null && isParticipant(decisiveGF, id)) {
                int round = orZero(decisiveGF.getRoundNumber());
                if (decisiveGF.getStatus() == MatchStatus.COMPLETED) {
                    boolean isWinner = id.equals(decisiveGF.getWinnerRegistrationId());
                    if (isWinner) {
                        s.sortKey = new int[]{0, 0, 1};
                        s.status = LeaderboardStatus.CHAMPION;
                        s.champion = true;
                    } else {
                        s.sortKey = new int[]{0, 0, 2};
                        s.status = LeaderboardStatus.ELIMINATED;
                        s.eliminatedInRound = round;
                    }
                } else {
                    s.sortKey = new int[]{0, 0, 0};
                    s.status = LeaderboardStatus.ACTIVE;
                }
                continue;
            }

            // ── 2. Eliminated by a loss in the losers bracket ─────────
            Match losersLoss = lostMatchInBracket(matches, id, BracketSide.LOSERS);
            if (losersLoss != null) {
                int lr = orZero(losersLoss.getRoundNumber());
                s.sortKey = new int[]{3, Math.max(0, losersMaxRound - lr), 1};
                s.status = LeaderboardStatus.ELIMINATED;
                s.eliminatedInRound = lr;
                continue;
            }

            // ── 3. Still active — winners side or dropped to losers ───
            Match frontier = frontierMatch(matches, id);
            int fr = frontier != null ? orZero(frontier.getRoundNumber()) : 0;
            boolean lostInWinners =
                    lostMatchInBracket(matches, id, BracketSide.WINNERS) != null;

            if (lostInWinners) {
                s.sortKey = new int[]{2, Math.max(0, losersMaxRound - fr), 0};
            } else {
                s.sortKey = new int[]{1, Math.max(0, winnersMaxRound - fr), 0};
            }
            s.status = LeaderboardStatus.ACTIVE;
        }
    }

    /**
     * The decisive grand final is the bracket-reset game if one exists
     * (highest round), otherwise the highest-round GRAND_FINAL / leaderboard
     * position-1 match. Both grand-final games involve the same two teams, so
     * only the decider is used to avoid double-counting.
     */
    private Match findDecisiveGrandFinal(List<Match> matches) {

        Match reset = null;
        for (Match m : matches) {
            if (Boolean.TRUE.equals(m.getIsBracketReset())) {
                if (reset == null
                        || orZero(m.getRoundNumber()) > orZero(reset.getRoundNumber())) {
                    reset = m;
                }
            }
        }
        if (reset != null) return reset;

        Match grandFinal = null;
        for (Match m : matches) {
            boolean isGrandFinal = m.getBracketSide() == BracketSide.GRAND_FINAL
                    || Integer.valueOf(1).equals(m.getLeaderboardPosition());
            if (!isGrandFinal) continue;
            if (grandFinal == null
                    || orZero(m.getRoundNumber()) > orZero(grandFinal.getRoundNumber())) {
                grandFinal = m;
            }
        }
        return grandFinal;
    }

    /**
     * The match (if any) on the given bracket side that this team LOST — a
     * completed, real (2+ team) match it took part in but did not win. Returns
     * the deepest such match; in a losers bracket a team can only lose once.
     */
    private Match lostMatchInBracket(List<Match> matches, UUID teamId, BracketSide side) {

        Match found = null;
        for (Match m : matches) {
            if (m.getBracketSide() != side) continue;
            if (m.getStatus() != MatchStatus.COMPLETED) continue;
            if (!isParticipant(m, teamId)) continue;
            if (presentTeams(m).size() <= 1) continue;       // bye, not a loss
            if (teamId.equals(m.getWinnerRegistrationId())) continue; // they won
            if (found == null
                    || orZero(m.getRoundNumber()) > orZero(found.getRoundNumber())) {
                found = m;
            }
        }
        return found;
    }

    // =====================================================
    // FINISH POSITION WITHIN A SINGLE MATCH (1 = best)
    //
    //   ONE_VS_ONE    → winner = 1, otherwise 2
    //   multi-team    → explicit position fields if present,
    //                   else order by score desc,
    //                   else winner = 1 / others = 4
    // =====================================================

    private int finishPosition(Match match, UUID teamId) {

        MatchType type = match.getMatchType() != null
                ? match.getMatchType()
                : MatchType.ONE_VS_ONE;

        if (type == MatchType.ONE_VS_ONE) {
            return teamId.equals(match.getWinnerRegistrationId()) ? 1 : 2;
        }

        if (teamId.equals(match.getPositionFirstRegistrationId()))  return 1;
        if (teamId.equals(match.getPositionSecondRegistrationId())) return 2;
        if (teamId.equals(match.getPositionThirdRegistrationId()))  return 3;
        if (teamId.equals(match.getPositionFourthRegistrationId())) return 4;

        // Fallback: rank present teams by their score (highest first)
        List<UUID> present = presentTeams(match);
        present.sort((x, y) -> Integer.compare(score(match, y), score(match, x)));
        int idx = present.indexOf(teamId);
        if (idx >= 0) return idx + 1;

        return teamId.equals(match.getWinnerRegistrationId()) ? 1 : 4;
    }

    // =====================================================
    // RANK ASSIGNMENT (standard competition ranking)
    //
    // Equal sort keys ⇒ equal rank, and the next rank skips the tied count
    // (1, 2, 2, 4). Because a strictly-greater key always lands at a later
    // index, equal rank ⇔ equal key, so the tied flag can be read off shared
    // rank numbers among neighbours.
    // =====================================================

    private void assignRanks(List<Standing> ordered) {

        for (int i = 0; i < ordered.size(); i++) {
            Standing cur = ordered.get(i);
            if (i > 0 && sameKey(ordered.get(i - 1), cur)) {
                cur.rank = ordered.get(i - 1).rank;
            } else {
                cur.rank = i + 1;
            }
        }

        for (int i = 0; i < ordered.size(); i++) {
            Standing cur = ordered.get(i);
            boolean prevSame = i > 0
                    && ordered.get(i - 1).rank.equals(cur.rank);
            boolean nextSame = i < ordered.size() - 1
                    && ordered.get(i + 1).rank.equals(cur.rank);
            cur.tied = prevSame || nextSame;
        }
    }

    private boolean sameKey(Standing a, Standing b) {
        return Arrays.equals(a.sortKey, b.sortKey);
    }

    // =====================================================
    // SORT ORDER
    //   1. sort key (lexicographic, lower = better)
    //   2. point differential (higher = better)
    //   3. wins (higher = better)
    //   4. registration id (stable, deterministic)
    // =====================================================

    private static final Comparator<Standing> STANDING_COMPARATOR =
            Comparator.<Standing>comparingInt(s -> s.sortKey[0])
                    .thenComparingInt(s -> s.sortKey[1])
                    .thenComparingInt(s -> s.sortKey[2])
                    .thenComparingInt(s -> -s.pointDifferential())
                    .thenComparingInt(s -> -s.wins)
                    .thenComparing(s -> s.registrationId.toString());

    // =====================================================
    // ENTRY MAPPING
    // =====================================================

    private LeaderboardEntryDTO toEntry(Standing s, String robotName, String teamName) {
        LeaderboardEntryDTO dto = new LeaderboardEntryDTO();
        dto.setRank(s.rank);
        dto.setTied(s.tied);
        dto.setRegistrationId(s.registrationId);
        dto.setRobotName(robotName);
        dto.setTeamName(teamName);
        dto.setStatus(s.status);
        dto.setEliminatedInRound(s.eliminatedInRound);
        dto.setPlayed(s.played);
        dto.setWins(s.wins);
        dto.setLosses(s.losses);
        dto.setByes(s.byes);
        dto.setPointsFor(s.pointsFor);
        dto.setPointsAgainst(s.pointsAgainst);
        dto.setPointDifferential(s.pointDifferential());
        return dto;
    }

    // =====================================================
    // TEAM COLLECTION & NAME RESOLUTION
    // =====================================================

    private Set<UUID> collectTeamIds(List<Match> matches) {
        Set<UUID> ids = new LinkedHashSet<>();
        for (Match m : matches) {
            addIf(ids, m.getTeamARegistrationId());
            addIf(ids, m.getTeamBRegistrationId());
            addIf(ids, m.getTeamCRegistrationId());
            addIf(ids, m.getTeamDRegistrationId());
        }
        return ids;
    }

    private void addIf(Set<UUID> set, UUID id) {
        if (id != null) set.add(id);
    }

    /**
     * Resolves each registration id to its team name with one lookup per id —
     * the same proven pattern used in MatchService. For very large brackets
     * this could be swapped for a single batched findAllById.
     */
    /**
     * Returns a map of registrationId → [robotName, teamName].
     * One repository lookup per id; teamName resolved via TeamRepository.
     */
    private Map<UUID, String[]> resolveNames(Set<UUID> ids) {
        Map<UUID, String[]> names = new HashMap<>();
        for (UUID id : ids) {
            names.put(id, resolveParticipant(id));
        }
        return names;
    }

    private String[] resolveParticipant(UUID registrationId) {
        if (registrationId == null) return new String[]{null, null};
        return eventRegistrationRepository.findById(registrationId)
                .map(reg -> {
                    String robotName = reg.getRobotName();
                    String teamName = null;
                    if (reg.getTeamId() != null) {
                        teamName = teamRepository.findById(reg.getTeamId())
                                .map(t -> t.getTeamName())
                                .orElse(null);
                    }
                    return new String[]{robotName, teamName};
                })
                .orElse(new String[]{null, null});
    }

    // =====================================================
    // SMALL HELPERS
    // =====================================================

    /** A bracket is final only when no match is still SCHEDULED or LIVE. */
    private boolean computeIsFinal(List<Match> matches) {
        for (Match m : matches) {
            MatchStatus status = m.getStatus();
            if (status == MatchStatus.SCHEDULED || status == MatchStatus.LIVE) {
                return false;
            }
        }
        return true;
    }

    /** The deepest-round match this team appears in (its terminal match). */
    private Match frontierMatch(List<Match> matches, UUID teamId) {
        Match best = null;
        for (Match m : matches) {
            if (!isParticipant(m, teamId)) continue;
            if (best == null || orZero(m.getRoundNumber()) > orZero(best.getRoundNumber())) {
                best = m;
            }
        }
        return best;
    }

    private boolean isParticipant(Match match, UUID teamId) {
        return teamId.equals(match.getTeamARegistrationId())
                || teamId.equals(match.getTeamBRegistrationId())
                || teamId.equals(match.getTeamCRegistrationId())
                || teamId.equals(match.getTeamDRegistrationId());
    }

    private List<UUID> presentTeams(Match match) {
        List<UUID> present = new ArrayList<>(4);
        addIf2(present, match.getTeamARegistrationId());
        addIf2(present, match.getTeamBRegistrationId());
        addIf2(present, match.getTeamCRegistrationId());
        addIf2(present, match.getTeamDRegistrationId());
        return present;
    }

    private void addIf2(List<UUID> list, UUID id) {
        if (id != null) list.add(id);
    }

    /** This team's own score in the match (0 if the team isn't a slot here). */
    private int score(Match match, UUID teamId) {
        if (teamId.equals(match.getTeamARegistrationId())) return orZero(match.getTeamAScore());
        if (teamId.equals(match.getTeamBRegistrationId())) return orZero(match.getTeamBScore());
        if (teamId.equals(match.getTeamCRegistrationId())) return orZero(match.getTeamCScore());
        if (teamId.equals(match.getTeamDRegistrationId())) return orZero(match.getTeamDScore());
        return 0;
    }

    /** Combined score of every present team other than this one. */
    private int opponentsScore(Match match, UUID teamId, List<UUID> present) {
        int total = 0;
        for (UUID other : present) {
            if (!other.equals(teamId)) {
                total += score(match, other);
            }
        }
        return total;
    }

    private TournamentFormat firstNonNullFormat(List<Match> matches) {
        if (matches == null) return null;
        for (Match m : matches) {
            if (m.getTournamentFormat() != null) return m.getTournamentFormat();
        }
        return null;
    }

    private MatchType firstNonNullMatchType(List<Match> matches) {
        if (matches == null) return null;
        for (Match m : matches) {
            if (m.getMatchType() != null) return m.getMatchType();
        }
        return null;
    }

    private int orZero(Integer value) {
        return value != null ? value : 0;
    }

    // =====================================================
    // INTERNAL — PER-TEAM ACCUMULATOR
    //
    // sortKey defaults to {1000,0,0} so any team that somehow never resolves
    // a frontier still sorts last instead of throwing.
    // =====================================================

    private static class Standing {

        private final UUID registrationId;

        private int played;
        private int wins;
        private int losses;
        private int byes;

        private int pointsFor;
        private int pointsAgainst;

        private int[] sortKey = {1000, 0, 0};

        private LeaderboardStatus status = LeaderboardStatus.ACTIVE;
        private Integer eliminatedInRound;
        private boolean champion;

        private Integer rank;
        private boolean tied;

        private Standing(UUID registrationId) {
            this.registrationId = registrationId;
        }

        private int pointDifferential() {
            return pointsFor - pointsAgainst;
        }
    }
}