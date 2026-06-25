package com.botleague.backend.matches.tournament;

import com.botleague.backend.matches.dto.GenerateBracketRequestDTO;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Generates a single-elimination bracket for three match types:
 *
 *   ONE_VS_ONE   — 2 teams per match, bracket size = next power of 2
 *   TRIPLE_THREAT — 3 teams per match, bracket size = next power of 3
 *   FATAL_FOUR   — 4 teams per match, bracket size = next power of 4
 *
 * ── Edge cases handled ────────────────────────────────────────────────
 *  • N = 0                     → empty list
 *  • N = 1                     → single completed bye match (team is champion)
 *  • N < bracketSize           → null slots become byes; isBye = true
 *  • Exactly 1 real team in a match → auto-advance (COMPLETED, autoAdvanced=true)
 *  • 2+ real teams with ≥1 null slot → match is flagged isBye but NOT auto-advanced
 *    (teams still compete; the "bye" just means a slot is empty)
 *  • Cascading byes            → re-resolved in a loop until stable
 *  • 3rd-place match           → only when totalRounds ≥ 2; source matches =
 *    the two semi-final matches (last round before the final)
 *  • matchType propagated      → every generated Match carries the same MatchType
 *    so the service layer can score it correctly
 * ──────────────────────────────────────────────────────────────────────
 */
@Component
public class SingleEliminationBracketGenerator {

    // =====================================================
    // PUBLIC ENTRY POINT
    // =====================================================

    public List<Match> generate(GenerateBracketRequestDTO request) {

        validate(request);

        MatchType matchType = resolveMatchType(request);
        int slotsPerMatch   = slotsFor(matchType);

        UUID eventSportId = request.getEventSportId();

        List<UUID> teamIds =
                request.getTeamRegistrationIds()
                        .stream()
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

        int teamCount = teamIds.size();

        // ── N = 0 ──────────────────────────────────────────────────────
        if (teamCount == 0) {
            return List.of();
        }

        // ── N = 1 ──────────────────────────────────────────────────────
        if (teamCount == 1) {
            return List.of(singleTeamByeMatch(
                    eventSportId, request, teamIds.get(0)
            ));
        }

        // ── BRACKET GEOMETRY ──────────────────────────────────────────
        int bracketSize  = nextPowerOf(slotsPerMatch, teamCount);
        int totalRounds  = logBase(slotsPerMatch, bracketSize);
        int matchesInR1  = bracketSize / slotsPerMatch;

        // ── CREATE ALL MATCH SHELLS ───────────────────────────────────
        List<List<Match>> rounds =
                createRoundShells(
                        eventSportId, request, matchType,
                        totalRounds, matchesInR1, slotsPerMatch
                );

        // ── ASSIGN SEEDS TO ROUND 1 ───────────────────────────────────
        assignSeeds(rounds.get(0), teamIds, teamCount, bracketSize, slotsPerMatch);

        // ── BUILD ID → MATCH LOOKUP ───────────────────────────────────
        Map<UUID, Match> byId = buildIndex(rounds);

        // ── WIRE NEXT-MATCH LINKS ─────────────────────────────────────
        connectRounds(rounds, slotsPerMatch);

        // ── AUTO-RESOLVE BYES (cascading) ─────────────────────────────
        autoResolveByes(rounds, byId, slotsPerMatch);

        // ── 3RD-PLACE MATCH ───────────────────────────────────────────
        Match thirdPlace = buildThirdPlaceMatch(
                rounds, totalRounds, eventSportId, request, matchType
        );

        // ── FLATTEN ───────────────────────────────────────────────────
        List<Match> all = new ArrayList<>();
        rounds.forEach(all::addAll);
        if (thirdPlace != null) all.add(thirdPlace);

        return all;
    }

    // =====================================================
    // STEP 1 — CREATE ROUND SHELLS
    // =====================================================

    private List<List<Match>> createRoundShells(
            UUID eventSportId,
            GenerateBracketRequestDTO request,
            MatchType matchType,
            int totalRounds,
            int matchesInFirstRound,
            int slotsPerMatch
    ) {
        List<List<Match>> rounds = new ArrayList<>();
        int matchesInRound = matchesInFirstRound;

        for (int roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {

            List<Match> round = new ArrayList<>();

            for (int matchNumber = 1; matchNumber <= matchesInRound; matchNumber++) {

                Match m = new Match();
                m.setId(UUID.randomUUID());
                m.setEventSportId(eventSportId);
                m.setTournamentFormat(request.getTournamentFormat());
                m.setMatchType(matchType);
                m.setRoundNumber(roundNumber);
                m.setMatchNumber(matchNumber);
                m.setBracketPosition(matchNumber);
                m.setStatus(MatchStatus.SCHEDULED);
                m.setIsBye(false);
                m.setAutoAdvanced(false);
                m.setTeamAScore(0);
                m.setTeamBScore(0);
                m.setTeamCScore(0);
                m.setTeamDScore(0);

                round.add(m);
            }

            rounds.add(round);
            matchesInRound = Math.max(1, matchesInRound / slotsPerMatch);
        }

        return rounds;
    }

    // =====================================================
    // STEP 2 — ASSIGN SEEDS
    // =====================================================

    private void assignSeeds(
            List<Match> firstRound,
            List<UUID> teamIds,
            int teamCount,
            int bracketSize,
            int slotsPerMatch
    ) {
        List<Integer> seedOrder = buildSeedOrder(bracketSize, slotsPerMatch);

        for (int i = 0; i < firstRound.size(); i++) {

            Match m = firstRound.get(i);
            int base = i * slotsPerMatch;

            UUID slotA = seedToTeam(seedOrder.get(base),     teamCount, teamIds);
            UUID slotB = seedToTeam(seedOrder.get(base + 1), teamCount, teamIds);

            m.setTeamARegistrationId(slotA);
            m.setTeamBRegistrationId(slotB);

            if (slotsPerMatch >= 3) {
                UUID slotC = seedToTeam(seedOrder.get(base + 2), teamCount, teamIds);
                m.setTeamCRegistrationId(slotC);
            }

            if (slotsPerMatch == 4) {
                UUID slotD = seedToTeam(seedOrder.get(base + 3), teamCount, teamIds);
                m.setTeamDRegistrationId(slotD);
            }

            // Mark bye if any slot is null
            boolean hasBye = slotA == null || slotB == null
                    || (slotsPerMatch >= 3 && m.getTeamCRegistrationId() == null)
                    || (slotsPerMatch == 4 && m.getTeamDRegistrationId() == null);

            m.setIsBye(hasBye);
        }
    }

    /** Returns the teamId for a seed, or null if the seed exceeds teamCount (= bye). */
    private UUID seedToTeam(int seed, int teamCount, List<UUID> teamIds) {
        return seed <= teamCount ? teamIds.get(seed - 1) : null;
    }

    // =====================================================
    // STEP 3 — WIRE NEXT-MATCH LINKS
    //
    // Each match in round R feeds its winner into one of
    // the matches in round R+1.
    //
    // For slotsPerMatch=N: every N consecutive matches in
    // the current round feed into the same next match,
    // occupying slots 1..N.
    // =====================================================

    private void connectRounds(List<List<Match>> rounds, int slotsPerMatch) {

        for (int ri = 0; ri < rounds.size() - 1; ri++) {

            List<Match> current = rounds.get(ri);
            List<Match> next    = rounds.get(ri + 1);

            for (int i = 0; i < current.size(); i++) {

                Match currentMatch = current.get(i);
                Match nextMatch    = next.get(i / slotsPerMatch);

                // slot number is 1-indexed: (i % slotsPerMatch) + 1
                int slot = (i % slotsPerMatch) + 1;

                currentMatch.setNextMatchId(nextMatch.getId());
                currentMatch.setNextMatchSlot(slot);

                // back-link: which source feeds into which slot of nextMatch
                setSourceMatchForSlot(nextMatch, slot, currentMatch.getId());
            }
        }
    }

    /** Sets sourceMatchAId / B / C / D on a match according to slot number. */
    private void setSourceMatchForSlot(Match match, int slot, UUID sourceId) {
        switch (slot) {
            case 1 -> match.setSourceMatchAId(sourceId);
            case 2 -> match.setSourceMatchBId(sourceId);
            case 3 -> match.setSourceMatchCId(sourceId);
            case 4 -> match.setSourceMatchDId(sourceId);
            default -> throw new IllegalArgumentException("Invalid slot: " + slot);
        }
    }

    // =====================================================
    // STEP 4 — AUTO-RESOLVE BYES (cascading)
    //
    // A match auto-advances if and only if exactly 1 real
    // team occupies all slots (all other slots are null).
    //
    // A match with 2+ real teams and some null slots is
    // still a real competitive match — it is NOT auto-advanced.
    // It just has isBye=true to signal an empty slot.
    //
    // We iterate until no more byes are resolved in a pass.
    // =====================================================

    private void autoResolveByes(
            List<List<Match>> rounds,
            Map<UUID, Match> byId,
            int slotsPerMatch
    ) {
        boolean changed = true;

        while (changed) {
            changed = false;

            for (List<Match> round : rounds) {
                for (Match match : round) {

                    // Only process flagged byes that haven't been resolved yet
                    if (!Boolean.TRUE.equals(match.getIsBye())) continue;
                    if (match.getWinnerRegistrationId() != null) continue;

                    List<UUID> presentTeams = getPresentTeams(match, slotsPerMatch);

                    // Only auto-advance if exactly 1 real team is present
                    if (presentTeams.size() != 1) continue;

                    UUID winner = presentTeams.get(0);

                    match.setWinnerRegistrationId(winner);
                    match.setStatus(MatchStatus.COMPLETED);
                    match.setAutoAdvanced(true);

                    propagateWinner(match, winner, byId);

                    changed = true;
                }
            }
        }
    }

    /** Collects all non-null team registration IDs from the slots of a match. */
    private List<UUID> getPresentTeams(Match match, int slotsPerMatch) {
        List<UUID> teams = new ArrayList<>();
        if (match.getTeamARegistrationId() != null) teams.add(match.getTeamARegistrationId());
        if (match.getTeamBRegistrationId() != null) teams.add(match.getTeamBRegistrationId());
        if (slotsPerMatch >= 3 && match.getTeamCRegistrationId() != null) teams.add(match.getTeamCRegistrationId());
        if (slotsPerMatch == 4 && match.getTeamDRegistrationId() != null) teams.add(match.getTeamDRegistrationId());
        return teams;
    }

    // =====================================================
    // STEP 5 — 3RD-PLACE MATCH
    //
    // Created only when totalRounds >= 2 (there are at
    // least semi-finals).
    //
    // For ONE_VS_ONE:    source = semiFinalA, semiFinalB (1 match each → 1 runner-up each)
    // For TRIPLE_THREAT: source = last round before final's first 2 matches
    //                    (3rd place match is itself a TRIPLE_THREAT — 2 known runner-ups
    //                     plus potentially a 3rd slot that remains TBD / null)
    // For FATAL_FOUR:    source = semiFinalA + semiFinalB (same pattern)
    //
    // In all cases the 3rd-place match carries the same matchType as the bracket.
    // Team slots are left null (TBD) and filled when semi-final results are submitted.
    // =====================================================

    private Match buildThirdPlaceMatch(
            List<List<Match>> rounds,
            int totalRounds,
            UUID eventSportId,
            GenerateBracketRequestDTO request,
            MatchType matchType
    ) {
        if (totalRounds < 2) return null;

        List<Match> semiFinalRound = rounds.get(totalRounds - 2);

        // We use the first two semi-final matches as sources
        if (semiFinalRound.size() < 2) return null;

        Match semiFinalA = semiFinalRound.get(0);
        Match semiFinalB = semiFinalRound.get(1);

        Match thirdPlace = new Match();
        thirdPlace.setId(UUID.randomUUID());
        thirdPlace.setEventSportId(eventSportId);
        thirdPlace.setTournamentFormat(request.getTournamentFormat());
        thirdPlace.setMatchType(matchType);
        thirdPlace.setRoundNumber(totalRounds);
        thirdPlace.setMatchNumber(2);
        thirdPlace.setBracketPosition(2);
        thirdPlace.setStatus(MatchStatus.SCHEDULED);
        thirdPlace.setTeamAScore(0);
        thirdPlace.setTeamBScore(0);
        thirdPlace.setTeamCScore(0);
        thirdPlace.setTeamDScore(0);
        thirdPlace.setIsBye(false);
        thirdPlace.setAutoAdvanced(false);
        thirdPlace.setLeaderboardPosition(3);

        // Source matches: winners (runners-up) fed from semi-finals
        thirdPlace.setSourceMatchAId(semiFinalA.getId());
        thirdPlace.setSourceMatchBId(semiFinalB.getId());

        // Teams TBD (filled by service when submitting semi-final results)
        thirdPlace.setTeamARegistrationId(null);
        thirdPlace.setTeamBRegistrationId(null);
        thirdPlace.setTeamCRegistrationId(null);
        thirdPlace.setTeamDRegistrationId(null);

        return thirdPlace;
    }

    // =====================================================
    // SEED ORDER BUILDER
    //
    // A "best-out-of-best" balanced draw must satisfy two properties:
    //   (1) the top seeds are placed in DIFFERENT first-round matches, and
    //   (2) they are placed in different regions of the tree, so the two
    //       (or three, or four) strongest teams can only collide as late as
    //       possible — ideally in the final.
    //
    // ONE_VS_ONE (slotsPerMatch=2) — unchanged, your original algorithm:
    //   bracketSize=2:  [1, 2]
    //   bracketSize=4:  [1,4, 3,2]
    //   bracketSize=8:  [1,8, 5,4, 3,6, 7,2]
    //
    // TRIPLE_THREAT (slotsPerMatch=3) and FATAL_FOUR (slotsPerMatch=4):
    //   produced by the recursive band-serpentine expansion below. Examples:
    //   TRIPLE_THREAT  size=9:   (1,6,7) (2,5,8) (3,4,9)          → seeds 1,2,3 split
    //   FATAL_FOUR     size=16:  (1,8,9,16) (2,7,10,15)
    //                            (3,6,11,14) (4,5,12,13)          → every match Σ=34
    //
    // Each block of slotsPerMatch consecutive entries is one match.
    // =====================================================

    private List<Integer> buildSeedOrder(int bracketSize, int slotsPerMatch) {

        if (slotsPerMatch == 2) {
            return buildSeedOrder2(bracketSize);
        }

        // TRIPLE_THREAT and FATAL_FOUR
        return buildSeedOrderN(bracketSize, slotsPerMatch);
    }

    /**
     * Standard 2-slot seed expansion (original algorithm, preserved exactly).
     * Produces a flat list of length bracketSize where consecutive pairs are match participants.
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
                int a    = order.get(i);
                int b    = order.get(i + 1);
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

    /**
     * N-slot balanced seed order for TRIPLE_THREAT (N=3) and FATAL_FOUR (N=4).
     *
     * This is the exact generalisation of the proven 1v1 recursion: we build the
     * smallest bracket first (the final, with N slots) and then expand one round
     * at a time toward round 1. Each expansion multiplies the slot count by N and
     * replaces every existing slot with a full N-way match.
     *
     * For an expansion to {@code size} slots there are N "bands" of equal width
     * (size/N each):
     *   band 0 = strongest seeds  [1 .. size/N]
     *   band 1 = next tier        [size/N+1 .. 2*size/N]
     *   ...
     *   band N-1 = weakest seeds  [size*(N-1)/N+1 .. size]
     *
     * An existing slot ranked {@code s} expands into a match that takes ONE seed
     * from each band, mirroring the position on alternating bands (serpentine):
     *   even band → position s within the band   (keeps top seeds together-ranked)
     *   odd  band → position (size/N + 1 - s)     (mirrors, so a strong slot draws
     *                                              the weakest of that band)
     *
     * Because the recursion preserves the parent ordering, the k strongest seeds
     * always land in k distinct sub-brackets — they can only meet in the final.
     * For even N (FATAL_FOUR) every first-round match has an identical seed sum,
     * i.e. a perfectly balanced draw.
     *
     * Pre-condition: {@code bracketSize} is an exact power of {@code slotsPerMatch}
     * (guaranteed by nextPowerOf).
     */
    private List<Integer> buildSeedOrderN(int bracketSize, int slotsPerMatch) {
        return expandSeedOrder(bracketSize, slotsPerMatch);
    }

    /** Recursive band-serpentine expansion. See buildSeedOrderN for the algorithm. */
    private List<Integer> expandSeedOrder(int size, int slotsPerMatch) {

        // Base case: a single slot holds seed 1.
        if (size == 1) {
            List<Integer> base = new ArrayList<>();
            base.add(1);
            return base;
        }

        // Bracket one round smaller (one fewer round of matches).
        List<Integer> prev = expandSeedOrder(size / slotsPerMatch, slotsPerMatch);

        int bandWidth = size / slotsPerMatch;   // size of each band = seeds per band
        List<Integer> result = new ArrayList<>(size);

        for (int s : prev) {                     // s = rank of the parent slot (1-indexed)
            for (int band = 0; band < slotsPerMatch; band++) {

                // serpentine: even bands keep the rank, odd bands mirror it
                int positionInBand = (band % 2 == 0)
                        ? s
                        : (bandWidth + 1 - s);

                int seed = band * bandWidth + positionInBand;
                result.add(seed);
            }
        }

        return result;
    }

    // =====================================================
    // PROPAGATE WINNER INTO NEXT MATCH
    // =====================================================

    private void propagateWinner(Match match, UUID winner, Map<UUID, Match> byId) {

        UUID nextId = match.getNextMatchId();
        if (nextId == null) return;

        Match next = byId.get(nextId);
        if (next == null) return;

        assignToSlot(next, match.getNextMatchSlot(), winner);
    }

    /** Assigns a registration ID to the correct team slot (1=A, 2=B, 3=C, 4=D). */
    private void assignToSlot(Match match, Integer slot, UUID registrationId) {
        if (slot == null) return;
        switch (slot) {
            case 1 -> match.setTeamARegistrationId(registrationId);
            case 2 -> match.setTeamBRegistrationId(registrationId);
            case 3 -> match.setTeamCRegistrationId(registrationId);
            case 4 -> match.setTeamDRegistrationId(registrationId);
            default -> throw new IllegalArgumentException("Invalid next-match slot: " + slot);
        }
    }

    // =====================================================
    // SINGLE-TEAM MATCH (N=1)
    // =====================================================

    private Match singleTeamByeMatch(
            UUID eventSportId,
            GenerateBracketRequestDTO request,
            UUID teamId
    ) {
        MatchType matchType = resolveMatchType(request);

        Match m = new Match();
        m.setId(UUID.randomUUID());
        m.setEventSportId(eventSportId);
        m.setTournamentFormat(request.getTournamentFormat());
        m.setMatchType(matchType);
        m.setRoundNumber(1);
        m.setMatchNumber(1);
        m.setBracketPosition(1);
        m.setTeamARegistrationId(teamId);
        m.setWinnerRegistrationId(teamId);
        m.setStatus(MatchStatus.COMPLETED);
        m.setIsBye(true);
        m.setAutoAdvanced(true);
        m.setTeamAScore(0);
        m.setTeamBScore(0);
        m.setTeamCScore(0);
        m.setTeamDScore(0);
        return m;
    }

    // =====================================================
    // HELPERS — MATH
    // =====================================================

    /** Returns the smallest power of {@code base} that is >= n. */
    private int nextPowerOf(int base, int n) {
        int value = 1;
        while (value < n) value *= base;
        return value;
    }

    /** Returns log_base(n). n must already be an exact power of base. */
    private int logBase(int base, int n) {
        int count = 0;
        while (n > 1) {
            n /= base;
            count++;
        }
        return count;
    }

    // =====================================================
    // HELPERS — LOOKUP
    // =====================================================

    private Map<UUID, Match> buildIndex(List<List<Match>> rounds) {
        Map<UUID, Match> byId = new HashMap<>();
        rounds.forEach(round -> round.forEach(m -> byId.put(m.getId(), m)));
        return byId;
    }

    // =====================================================
    // HELPERS — MATCH TYPE
    // =====================================================

    private MatchType resolveMatchType(GenerateBracketRequestDTO request) {
        return request.getMatchType() != null
                ? request.getMatchType()
                : MatchType.ONE_VS_ONE;
    }

    private int slotsFor(MatchType matchType) {
        return switch (matchType) {
            case TRIPLE_THREAT -> 3;
            case FATAL_FOUR    -> 4;
            default            -> 2; // ONE_VS_ONE
        };
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
    }
}