package com.botleague.backend.matches.tournament;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.botleague.backend.matches.dto.GenerateBracketRequestDTO;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;

/**
 * End-to-end checks on the generated Match rows, as opposed to
 * {@link MultiWayBracketPlannerTest} which checks the geometry in the abstract.
 * The generator has no injected collaborators, so this needs no Spring context.
 */
class SingleEliminationBracketGeneratorTest {

    private static final int MAX_FIELD = 64;

    private final SingleEliminationBracketGenerator generator = new SingleEliminationBracketGenerator();

    // =====================================================
    // MULTI-WAY BRACKETS
    // =====================================================

    @Test
    @DisplayName("a multi-way bracket never contains a bye or an auto-advanced match")
    void multiWayBracketsHaveNoByes() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                for (Match m : generate(type, field)) {
                    assertFalse(Boolean.TRUE.equals(m.getIsBye()),
                            type + " field " + field + " produced a bye");
                    assertFalse(Boolean.TRUE.equals(m.getAutoAdvanced()),
                            type + " field " + field + " auto-advanced a match");
                    assertEquals(MatchStatus.SCHEDULED, m.getStatus());
                }
            }
        }
    }

    @Test
    @DisplayName("every match is tagged with the type matching its own occupied slot count")
    void matchTypeMatchesParticipantCount() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {

                List<Match> all = generate(type, field);
                Map<UUID, Match> byId = all.stream()
                        .collect(Collectors.toMap(Match::getId, m -> m));

                for (Match m : all) {
                    // Round 1 matches are seeded; later ones are wired from
                    // sources. Either way the capacity in use must equal the tag.
                    int occupied = m.getRoundNumber() != null && m.getRoundNumber() == 1
                            ? countTeams(m)
                            : countSources(m, byId);

                    assertEquals(slots(m.getMatchType()), occupied,
                            type + " field " + field + " round " + m.getRoundNumber()
                                    + " match " + m.getMatchNumber() + " is tagged "
                                    + m.getMatchType() + " but uses " + occupied + " slots");
                }
            }
        }
    }

    @Test
    @DisplayName("every team is seeded exactly once and nobody is dropped")
    void everyTeamAppearsExactlyOnceInRoundOne() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {

                List<UUID> teams = teams(field);
                List<Match> all = generator.generate(request(type, teams));

                Set<UUID> seeded = new HashSet<>();
                for (Match m : all) {
                    if (m.getRoundNumber() == null || m.getRoundNumber() != 1) continue;
                    for (UUID id : teamIds(m)) {
                        assertTrue(seeded.add(id), "a team was seeded twice");
                    }
                }
                assertEquals(new HashSet<>(teams), seeded,
                        type + " field " + field + " did not seed every team exactly once");
            }
        }
    }

    @Test
    @DisplayName("winner routing is wired both ways and lands on the final")
    void advancementLinksAreConsistent() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {

                List<Match> all = generate(type, field);
                Map<UUID, Match> byId = all.stream()
                        .collect(Collectors.toMap(Match::getId, m -> m));

                List<Match> withoutNext = new ArrayList<>();

                for (Match m : all) {
                    if (Integer.valueOf(3).equals(m.getLeaderboardPosition())) continue;

                    if (m.getNextMatchId() == null) {
                        withoutNext.add(m);
                        continue;
                    }

                    Match next = byId.get(m.getNextMatchId());
                    assertNotNull(next, "nextMatchId points outside the bracket");
                    assertEquals(m.getRoundNumber() + 1, next.getRoundNumber().intValue(),
                            "a match must feed the very next round");

                    Integer slot = m.getNextMatchSlot();
                    assertNotNull(slot, "a wired match must know which slot it fills");
                    assertTrue(slot >= 1 && slot <= slots(next.getMatchType()),
                            "slot " + slot + " is outside a " + next.getMatchType() + " match");
                    assertEquals(m.getId(), sourceForSlot(next, slot),
                            "the back-link does not match the forward link");
                }

                assertEquals(1, withoutNext.size(),
                        type + " field " + field + " has " + withoutNext.size()
                                + " matches with nowhere to advance; expected exactly the final");
            }
        }
    }

    @Test
    @DisplayName("a 3rd-place match exists only when the final is a straight duel")
    void consolationMatchOnlyForATwoTeamFinal() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {

                List<Match> all = generate(type, field);

                Match consolation = all.stream()
                        .filter(m -> Integer.valueOf(3).equals(m.getLeaderboardPosition()))
                        .findFirst().orElse(null);

                Match theFinal = all.stream()
                        .filter(m -> m.getLeaderboardPosition() == null)
                        .filter(m -> m.getNextMatchId() == null)
                        .findFirst().orElseThrow();

                boolean duelFinal = slots(theFinal.getMatchType()) == 2;
                boolean hasSemifinals = all.stream()
                        .anyMatch(m -> m.getRoundNumber() != null
                                && m.getRoundNumber() < theFinal.getRoundNumber());

                if (duelFinal && hasSemifinals) {
                    assertNotNull(consolation,
                            type + " field " + field + " has a 2-team final but no 3rd-place match");
                    // Both semifinal losers must have a slot to drop into.
                    assertEquals(2, countSourcesRaw(consolation),
                            "the 3rd-place match must take one runner-up per semifinal");
                    assertEquals(MatchType.ONE_VS_ONE, consolation.getMatchType());
                } else {
                    // A 3- or 4-way final already produces a third place of its
                    // own; a consolation match beside it would rank two teams 3rd.
                    assertNull(consolation,
                            type + " field " + field + " has a " + slots(theFinal.getMatchType())
                                    + "-team final and must not also have a 3rd-place match");
                }
            }
        }
    }

    @Test
    @DisplayName("round and match numbering stays unique, as the DB constraint requires")
    void roundAndMatchNumbersAreUnique() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                Set<String> seen = new HashSet<>();
                for (Match m : generate(type, field)) {
                    // uk_match_round_number: (event_sport_id, round_number, match_number, bracket_side)
                    String key = m.getRoundNumber() + "/" + m.getMatchNumber() + "/" + m.getBracketSide();
                    assertTrue(seen.add(key),
                            type + " field " + field + " reuses round/match " + key);
                }
            }
        }
    }

    @Test
    @DisplayName("playing the bracket out fills every slot and leaves exactly one champion")
    void playingTheBracketOutProducesOneChampion() {
        for (MatchType type : List.of(MatchType.TRIPLE_THREAT, MatchType.FATAL_FOUR)) {
            for (int field = 2; field <= MAX_FIELD; field++) {

                List<Match> all = generate(type, field);
                Map<UUID, Match> byId = all.stream()
                        .collect(Collectors.toMap(Match::getId, m -> m));

                List<Match> playable = all.stream()
                        .filter(m -> !Integer.valueOf(3).equals(m.getLeaderboardPosition()))
                        .sorted((a, b) -> a.getRoundNumber() != b.getRoundNumber()
                                ? a.getRoundNumber() - b.getRoundNumber()
                                : a.getMatchNumber() - b.getMatchNumber())
                        .collect(Collectors.toList());

                UUID champion = null;

                for (Match m : playable) {
                    // Every match must be fully populated by the time it is
                    // reached — this is what would break if a feeder were wired
                    // into a slot its target does not have.
                    List<UUID> present = teamIds(m);
                    assertEquals(slots(m.getMatchType()), present.size(),
                            type + " field " + field + " reached round " + m.getRoundNumber()
                                    + " match " + m.getMatchNumber() + " with " + present.size()
                                    + " of " + slots(m.getMatchType()) + " slots filled");

                    // Slot A always wins — arbitrary but deterministic.
                    UUID winner = present.get(0);

                    if (m.getNextMatchId() == null) {
                        assertNull(champion, "two matches ended the bracket");
                        champion = winner;
                        continue;
                    }

                    Match next = byId.get(m.getNextMatchId());
                    switch (m.getNextMatchSlot()) {
                        case 1 -> next.setTeamARegistrationId(winner);
                        case 2 -> next.setTeamBRegistrationId(winner);
                        case 3 -> next.setTeamCRegistrationId(winner);
                        case 4 -> next.setTeamDRegistrationId(winner);
                        default -> throw new AssertionError("slot out of range");
                    }
                }

                assertNotNull(champion, type + " field " + field + " crowned nobody");
            }
        }
    }

    @Test
    @DisplayName("the worked 10-team Triple Threat bracket comes out as documented")
    void tenTeamTripleThreatShape() {

        List<UUID> teams = teams(10);
        List<Match> all = generator.generate(request(MatchType.TRIPLE_THREAT, teams));

        Map<Integer, List<Match>> byRound = new HashMap<>();
        for (Match m : all) {
            byRound.computeIfAbsent(m.getRoundNumber(), r -> new ArrayList<>()).add(m);
        }

        // 4 matches, then 2, then the final plus its consolation match.
        assertEquals(4, byRound.get(1).size());
        assertEquals(2, byRound.get(2).size());
        assertEquals(2, byRound.get(3).size());

        byRound.get(1).sort((a, b) -> a.getMatchNumber() - b.getMatchNumber());

        // Smallest matches first in the partition, so the top seeds get the
        // duels; laid out so that feeders group contiguously.
        assertEquals(List.of(teams.get(0), teams.get(7)), teamIds(byRound.get(1).get(0)));
        assertEquals(List.of(teams.get(3), teams.get(4), teams.get(9)), teamIds(byRound.get(1).get(1)));
        assertEquals(List.of(teams.get(1), teams.get(6)), teamIds(byRound.get(1).get(2)));
        assertEquals(List.of(teams.get(2), teams.get(5), teams.get(8)), teamIds(byRound.get(1).get(3)));

        assertEquals(MatchType.ONE_VS_ONE, byRound.get(1).get(0).getMatchType());
        assertEquals(MatchType.TRIPLE_THREAT, byRound.get(1).get(1).getMatchType());
    }

    // =====================================================
    // 1v1 MUST NOT REGRESS
    // =====================================================

    @Test
    @DisplayName("1v1 still builds a power-of-2 bracket with byes")
    void oneVsOneKeepsPowerOfTwoGeometry() {
        for (int field = 2; field <= 32; field++) {

            List<Match> all = generate(MatchType.ONE_VS_ONE, field);

            int bracketSize = 1;
            while (bracketSize < field) bracketSize *= 2;

            long roundOne = all.stream()
                    .filter(m -> m.getRoundNumber() != null && m.getRoundNumber() == 1)
                    .count();
            assertEquals(bracketSize / 2, roundOne,
                    "1v1 field " + field + " should still round up to " + bracketSize);

            for (Match m : all) {
                assertEquals(MatchType.ONE_VS_ONE, m.getMatchType());
            }
        }
    }

    @Test
    @DisplayName("a single entrant is champion by walkover, tagged as a plain 1v1")
    void loneEntrantIsAWalkover() {
        for (MatchType type : MatchType.values()) {
            List<Match> all = generate(type, 1);
            assertEquals(1, all.size());

            Match only = all.get(0);
            assertEquals(MatchStatus.COMPLETED, only.getStatus());
            assertTrue(Boolean.TRUE.equals(only.getIsBye()));
            assertTrue(Boolean.TRUE.equals(only.getAutoAdvanced()));
            assertNotNull(only.getWinnerRegistrationId());
            assertEquals(MatchType.ONE_VS_ONE, only.getMatchType(),
                    "a one-team match has one occupied slot whatever was requested");
        }
    }

    @Test
    @DisplayName("an empty field produces no bracket")
    void emptyFieldProducesNothing() {
        assertTrue(generate(MatchType.FATAL_FOUR, 0).isEmpty());
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private List<Match> generate(MatchType type, int field) {
        return generator.generate(request(type, teams(field)));
    }

    private GenerateBracketRequestDTO request(MatchType type, List<UUID> teams) {
        GenerateBracketRequestDTO request = new GenerateBracketRequestDTO();
        request.setEventSportId(UUID.randomUUID());
        request.setTournamentFormat(TournamentFormat.SINGLE_ELIMINATION);
        request.setMatchType(type);
        request.setTeamRegistrationIds(teams);
        return request;
    }

    /** Distinct, stably ordered ids so seed order is reproducible across runs. */
    private List<UUID> teams(int count) {
        List<UUID> ids = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            ids.add(new UUID(0L, i + 1L));
        }
        return ids;
    }

    private List<UUID> teamIds(Match m) {
        List<UUID> ids = new ArrayList<>(4);
        if (m.getTeamARegistrationId() != null) ids.add(m.getTeamARegistrationId());
        if (m.getTeamBRegistrationId() != null) ids.add(m.getTeamBRegistrationId());
        if (m.getTeamCRegistrationId() != null) ids.add(m.getTeamCRegistrationId());
        if (m.getTeamDRegistrationId() != null) ids.add(m.getTeamDRegistrationId());
        return ids;
    }

    private int countTeams(Match m) {
        return teamIds(m).size();
    }

    private int countSources(Match m, Map<UUID, Match> byId) {
        int count = 0;
        for (UUID id : List.of(
                orZero(m.getSourceMatchAId()), orZero(m.getSourceMatchBId()),
                orZero(m.getSourceMatchCId()), orZero(m.getSourceMatchDId()))) {
            if (!id.equals(NONE) && byId.containsKey(id)) count++;
        }
        return count;
    }

    private int countSourcesRaw(Match m) {
        int count = 0;
        if (m.getSourceMatchAId() != null) count++;
        if (m.getSourceMatchBId() != null) count++;
        if (m.getSourceMatchCId() != null) count++;
        if (m.getSourceMatchDId() != null) count++;
        return count;
    }

    private static final UUID NONE = new UUID(-1L, -1L);

    private UUID orZero(UUID id) {
        return id != null ? id : NONE;
    }

    private UUID sourceForSlot(Match m, int slot) {
        return switch (slot) {
            case 1 -> m.getSourceMatchAId();
            case 2 -> m.getSourceMatchBId();
            case 3 -> m.getSourceMatchCId();
            case 4 -> m.getSourceMatchDId();
            default -> null;
        };
    }

    private int slots(MatchType type) {
        if (type == null) return 2;
        return switch (type) {
            case TRIPLE_THREAT -> 3;
            case FATAL_FOUR    -> 4;
            default            -> 2;
        };
    }
}
