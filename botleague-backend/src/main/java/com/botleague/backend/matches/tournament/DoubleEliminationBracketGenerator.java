package com.botleague.backend.matches.tournament;

import com.botleague.backend.matches.dto.GenerateBracketRequestDTO;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.BracketSide;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Generates a standard double-elimination bracket. 1v1 only — matches
 * TournamentFormat.DOUBLE_ELIMINATION's own javadoc constraint — so this is
 * intentionally simpler than SingleEliminationBracketGenerator (no Triple
 * Threat / Fatal Four support).
 *
 * ── Winners bracket (WB) ─────────────────────────────────────────────────
 * Same seeding/bye philosophy as single elimination, tagged bracketSide =
 * WINNERS. Only WB round 1 can ever contain a bye (byes = bracketSize -
 * teamCount is always < bracketSize/2 = matches in round 1, so no round-1
 * match ever has two byes, and every round thereafter always receives two
 * real winners).
 *
 * ── Losers bracket (LB) ──────────────────────────────────────────────────
 * 2R-2 rounds (R = number of WB rounds), alternating "major" rounds (LB
 * survivors vs. that WB round's new losers) and "minor" rounds (LB
 * survivors vs. each other). LB round 1 pairs two WB-round-1 losers, so it
 * needs a three-way classification per match:
 *   - both sources real   → normal match
 *   - exactly one is a bye → can only ever get 1 real participant, once its
 *                            real sibling is actually played — flagged
 *                            isBye=true, resolved later at runtime
 *   - both are byes        → "dead", can never receive ANY participant —
 *                            resolved immediately (COMPLETED, no winner)
 * Dead-ness propagates exactly one hop forward (the corresponding
 * major-round-2 slot also needs isBye=true, since its LB-side input can
 * never arrive) and no further — every subsequent round always receives
 * fully-resolved real winners by construction.
 *
 * ── Grand final ──────────────────────────────────────────────────────────
 * Slot A is always WB-origin, slot B is always LB-origin — a fixed,
 * generator-controlled convention (see GF_SLOT_WB_ORIGIN / GF_SLOT_LB_ORIGIN).
 * The bracket-reset rematch (played only if the LB-origin team wins game 1)
 * is deliberately NOT generated here — MatchService creates it lazily at
 * grand-final completion time, since its existence and participants are
 * conditional on that match's outcome.
 */
@Component
public class DoubleEliminationBracketGenerator {

    public static final int GF_SLOT_WB_ORIGIN = 1;
    public static final int GF_SLOT_LB_ORIGIN = 2;

    private final SingleEliminationBracketGenerator singleEliminationBracketGenerator;

    public DoubleEliminationBracketGenerator(SingleEliminationBracketGenerator singleEliminationBracketGenerator) {
        this.singleEliminationBracketGenerator = singleEliminationBracketGenerator;
    }

    // =====================================================
    // PUBLIC ENTRY POINT
    // =====================================================

    public List<Match> generate(GenerateBracketRequestDTO request) {
        validate(request);

        UUID eventSportId = request.getEventSportId();
        List<UUID> teamIds = request.getTeamRegistrationIds().stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        int teamCount = teamIds.size();

        if (teamCount == 0) {
            return List.of();
        }

        if (teamCount == 1) {
            // No bracket possible — delegate to single elimination's own N=1
            // handling (a completed bye match), then tag it with the
            // double-elimination bracket-side/leaderboard semantics so
            // LeaderboardService.rankDoubleElimination() crowns a champion.
            List<Match> lone = singleEliminationBracketGenerator.generate(request);
            for (Match m : lone) {
                m.setBracketSide(BracketSide.GRAND_FINAL);
                m.setLeaderboardPosition(1);
            }
            return lone;
        }

        int bracketSize = nextPowerOf2(teamCount);
        int totalRounds = log2(bracketSize);

        List<Match> allMatches = new ArrayList<>();

        // ── Winners bracket ────────────────────────────────────────────
        List<List<Match>> wbRounds = createWbRoundShells(eventSportId, request, totalRounds, bracketSize / 2);
        assignSeeds(wbRounds.get(0), teamIds, teamCount, bracketSize);
        connectRounds(wbRounds);
        wbRounds.forEach(allMatches::addAll);

        Match wbFinal = wbRounds.get(totalRounds - 1).get(0);

        // ── Grand final shell ──────────────────────────────────────────
        Match grandFinal = newShell(eventSportId, request, totalRounds + 1, 1, BracketSide.GRAND_FINAL);
        grandFinal.setLeaderboardPosition(1);
        wbFinal.setNextMatchId(grandFinal.getId());
        wbFinal.setNextMatchSlot(GF_SLOT_WB_ORIGIN);
        grandFinal.setSourceMatchAId(wbFinal.getId());

        // ── Losers bracket ───────────────────────────────────────────────
        if (totalRounds == 1) {
            // 2 teams: no real LB match exists. The WB Final's loser goes
            // directly into the grand final's slot B.
            wbFinal.setLoserNextMatchId(grandFinal.getId());
            wbFinal.setLoserNextMatchSlot(GF_SLOT_LB_ORIGIN);
        } else {
            Match lbFinal = buildLosersBracket(eventSportId, request, wbRounds, totalRounds, allMatches);
            lbFinal.setNextMatchId(grandFinal.getId());
            lbFinal.setNextMatchSlot(GF_SLOT_LB_ORIGIN);
            grandFinal.setSourceMatchBId(lbFinal.getId());
        }

        // ── Resolve WB round-1 byes (winner-side cascade only — byes never
        //    have a loser, so nothing propagates through loserNextMatchId
        //    at generation time; that only ever happens later, at runtime,
        //    via MatchService for real completed matches) ─────────────────
        Map<UUID, Match> byId = new HashMap<>();
        allMatches.forEach(m -> byId.put(m.getId(), m));
        byId.put(grandFinal.getId(), grandFinal);
        autoResolveWinnerByes(wbRounds, byId);

        allMatches.add(grandFinal);
        return allMatches;
    }

    // =====================================================
    // WINNERS BRACKET
    // =====================================================

    private List<List<Match>> createWbRoundShells(
            UUID eventSportId, GenerateBracketRequestDTO request, int totalRounds, int matchesInFirstRound) {
        List<List<Match>> rounds = new ArrayList<>();
        int matchesInRound = matchesInFirstRound;
        for (int roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
            rounds.add(createRound(eventSportId, request, roundNumber, matchesInRound, BracketSide.WINNERS));
            matchesInRound = Math.max(1, matchesInRound / 2);
        }
        return rounds;
    }

    private void assignSeeds(List<Match> firstRound, List<UUID> teamIds, int teamCount, int bracketSize) {
        List<Integer> seedOrder = buildSeedOrder2(bracketSize);
        for (int i = 0; i < firstRound.size(); i++) {
            Match m = firstRound.get(i);
            int base = i * 2;
            UUID slotA = seedToTeam(seedOrder.get(base), teamCount, teamIds);
            UUID slotB = seedToTeam(seedOrder.get(base + 1), teamCount, teamIds);
            m.setTeamARegistrationId(slotA);
            m.setTeamBRegistrationId(slotB);
            m.setIsBye(slotA == null || slotB == null);
        }
    }

    private UUID seedToTeam(int seed, int teamCount, List<UUID> teamIds) {
        return seed <= teamCount ? teamIds.get(seed - 1) : null;
    }

    /** Wires round R's matches into round R+1 (2 consecutive matches -> 1 next match, slot 1/2). */
    private void connectRounds(List<List<Match>> rounds) {
        for (int ri = 0; ri < rounds.size() - 1; ri++) {
            List<Match> current = rounds.get(ri);
            List<Match> next = rounds.get(ri + 1);
            for (int i = 0; i < current.size(); i++) {
                Match currentMatch = current.get(i);
                Match nextMatch = next.get(i / 2);
                int slot = (i % 2) + 1;
                currentMatch.setNextMatchId(nextMatch.getId());
                currentMatch.setNextMatchSlot(slot);
                if (slot == 1) nextMatch.setSourceMatchAId(currentMatch.getId());
                else nextMatch.setSourceMatchBId(currentMatch.getId());
            }
        }
    }

    /** Cascading winner-only bye resolution (a bye never has a loser to propagate). */
    private void autoResolveWinnerByes(List<List<Match>> rounds, Map<UUID, Match> byId) {
        boolean changed = true;
        while (changed) {
            changed = false;
            for (List<Match> round : rounds) {
                for (Match match : round) {
                    if (!Boolean.TRUE.equals(match.getIsBye())) continue;
                    if (match.getWinnerRegistrationId() != null) continue;

                    UUID a = match.getTeamARegistrationId();
                    UUID b = match.getTeamBRegistrationId();
                    if ((a == null) == (b == null)) continue; // not resolvable yet (or not a real bye)
                    UUID winner = a != null ? a : b;

                    match.setWinnerRegistrationId(winner);
                    match.setStatus(MatchStatus.COMPLETED);
                    match.setAutoAdvanced(true);

                    UUID nextId = match.getNextMatchId();
                    if (nextId != null) {
                        Match next = byId.get(nextId);
                        if (next != null) {
                            if (Integer.valueOf(1).equals(match.getNextMatchSlot())) next.setTeamARegistrationId(winner);
                            else if (Integer.valueOf(2).equals(match.getNextMatchSlot())) next.setTeamBRegistrationId(winner);
                        }
                    }
                    changed = true;
                }
            }
        }
    }

    // =====================================================
    // LOSERS BRACKET
    // =====================================================

    /** Returns the LB final match (the sole survivor of the last LB round). */
    private Match buildLosersBracket(
            UUID eventSportId, GenerateBracketRequestDTO request,
            List<List<Match>> wbRounds, int totalRounds, List<Match> allMatches) {

        int lbRoundNumber = 1;

        // LB round 1 — pairs WB round 1's losers, two at a time.
        List<Match> wb1 = wbRounds.get(0);
        int lb1Size = wb1.size() / 2;
        List<Match> lb1 = createRound(eventSportId, request, lbRoundNumber++, lb1Size, BracketSide.LOSERS);

        for (int i = 0; i < lb1Size; i++) {
            Match srcA = wb1.get(2 * i);
            Match srcB = wb1.get(2 * i + 1);
            Match target = lb1.get(i);

            srcA.setLoserNextMatchId(target.getId());
            srcA.setLoserNextMatchSlot(1);
            srcB.setLoserNextMatchId(target.getId());
            srcB.setLoserNextMatchSlot(2);
            target.setSourceMatchAId(srcA.getId());
            target.setSourceMatchBId(srcB.getId());

            boolean aBye = Boolean.TRUE.equals(srcA.getIsBye());
            boolean bBye = Boolean.TRUE.equals(srcB.getIsBye());
            if (aBye && bBye) {
                // Dead: neither source will ever produce a loser.
                target.setStatus(MatchStatus.COMPLETED);
                target.setIsBye(true);
                target.setAutoAdvanced(true);
            } else if (aBye || bBye) {
                // Resolves later, at runtime, once the real sibling is played.
                target.setIsBye(true);
            }
        }
        allMatches.addAll(lb1);

        List<Match> survivors = lb1;

        for (int k = 2; k <= totalRounds; k++) {
            List<Match> wbLosers = wbRounds.get(k - 1); // WB round k (0-indexed k-1)
            int majorSize = survivors.size();
            List<Match> major = createRound(eventSportId, request, lbRoundNumber++, majorSize, BracketSide.LOSERS);

            for (int i = 0; i < majorSize; i++) {
                Match survivor = survivors.get(i);
                Match wbLoserSrc = wbLosers.get(i);
                Match target = major.get(i);

                survivor.setNextMatchId(target.getId());
                survivor.setNextMatchSlot(1);
                target.setSourceMatchAId(survivor.getId());

                wbLoserSrc.setLoserNextMatchId(target.getId());
                wbLoserSrc.setLoserNextMatchSlot(2);
                target.setSourceMatchBId(wbLoserSrc.getId());

                boolean survivorDead = Boolean.TRUE.equals(survivor.getIsBye())
                        && Boolean.TRUE.equals(survivor.getAutoAdvanced())
                        && survivor.getWinnerRegistrationId() == null;
                if (survivorDead) {
                    // This match can only ever get 1 real participant (from
                    // WB) — flag it so the runtime bye-cascade hook resolves
                    // it once that WB loser actually lands in slot B.
                    target.setIsBye(true);
                }
            }
            allMatches.addAll(major);

            if (k < totalRounds) {
                int minorSize = majorSize / 2;
                List<Match> minor = createRound(eventSportId, request, lbRoundNumber++, minorSize, BracketSide.LOSERS);
                for (int i = 0; i < minorSize; i++) {
                    Match a = major.get(2 * i);
                    Match b = major.get(2 * i + 1);
                    Match target = minor.get(i);
                    a.setNextMatchId(target.getId());
                    a.setNextMatchSlot(1);
                    b.setNextMatchId(target.getId());
                    b.setNextMatchSlot(2);
                    target.setSourceMatchAId(a.getId());
                    target.setSourceMatchBId(b.getId());
                }
                allMatches.addAll(minor);
                survivors = minor;
            } else {
                survivors = major; // this IS the LB final
            }
        }

        return survivors.get(0);
    }

    // =====================================================
    // SHARED SHELL / MATH HELPERS
    // =====================================================

    private List<Match> createRound(
            UUID eventSportId, GenerateBracketRequestDTO request, int roundNumber, int size, BracketSide side) {
        List<Match> round = new ArrayList<>();
        for (int matchNumber = 1; matchNumber <= size; matchNumber++) {
            round.add(newShell(eventSportId, request, roundNumber, matchNumber, side));
        }
        return round;
    }

    private Match newShell(
            UUID eventSportId, GenerateBracketRequestDTO request, int roundNumber, int matchNumber, BracketSide side) {
        Match m = new Match();
        m.setId(UUID.randomUUID());
        m.setEventSportId(eventSportId);
        m.setTournamentFormat(request.getTournamentFormat());
        m.setMatchType(MatchType.ONE_VS_ONE);
        m.setRoundNumber(roundNumber);
        m.setMatchNumber(matchNumber);
        m.setBracketPosition(matchNumber);
        m.setBracketSide(side);
        m.setStatus(MatchStatus.SCHEDULED);
        m.setIsBye(false);
        m.setAutoAdvanced(false);
        m.setTeamAScore(0);
        m.setTeamBScore(0);
        return m;
    }

    /** Returns the smallest power of 2 that is >= n. */
    private int nextPowerOf2(int n) {
        int value = 1;
        while (value < n) value *= 2;
        return value;
    }

    /** Returns log2(n). n must already be an exact power of 2. */
    private int log2(int n) {
        int count = 0;
        while (n > 1) {
            n /= 2;
            count++;
        }
        return count;
    }

    /**
     * Standard 2-slot balanced-draw seed expansion (identical algorithm to
     * SingleEliminationBracketGenerator.buildSeedOrder2 — duplicated rather
     * than shared to keep this generator fully self-contained and avoid any
     * risk to the already-verified single-elimination code).
     */
    private List<Integer> buildSeedOrder2(int size) {
        List<Integer> order = new ArrayList<>();
        order.add(1);
        order.add(2);
        int currentSize = 2;
        while (currentSize < size) {
            int nextSize = currentSize * 2;
            List<Integer> next = new ArrayList<>(nextSize);
            for (int i = 0; i < order.size(); i += 2) {
                int a = order.get(i);
                int b = order.get(i + 1);
                int compA = nextSize + 1 - a;
                int compB = nextSize + 1 - b;
                next.add(a);
                next.add(compA);
                next.add(compB);
                next.add(b);
            }
            order = next;
            currentSize = nextSize;
        }
        return order;
    }

    // =====================================================
    // VALIDATION
    // =====================================================

    private void validate(GenerateBracketRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("request required");
        }
        if (request.getEventSportId() == null) {
            throw new IllegalArgumentException("eventSportId required");
        }
        if (request.getTeamRegistrationIds() == null) {
            throw new IllegalArgumentException("team list required");
        }
        if (request.getMatchType() != null && request.getMatchType() != MatchType.ONE_VS_ONE) {
            throw new IllegalArgumentException(
                    "Double elimination only supports ONE_VS_ONE matches, got: " + request.getMatchType());
        }
    }
}
