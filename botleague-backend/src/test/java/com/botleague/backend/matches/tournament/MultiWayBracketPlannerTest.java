package com.botleague.backend.matches.tournament;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.botleague.backend.matches.tournament.MultiWayBracketPlanner.PlannedMatch;

/**
 * The planner is pure arithmetic with no Spring context, so these are exhaustive
 * rather than sampled: every field size from 2 to 300 is checked at both Triple
 * Threat and Fatal Four. The properties asserted here are the ones the rest of
 * the bracket code silently depends on — a regression in any of them surfaces as
 * a wrong champion, not as a compile error.
 */
class MultiWayBracketPlannerTest {

    private static final int MAX_FIELD = 300;
    private static final int[] SLOT_COUNTS = { 3, 4 };

    // =====================================================
    // PARTITION
    // =====================================================

    @Test
    @DisplayName("every match holds 2..S competitors, and the sizes sum to the field")
    void partitionStaysWithinBounds() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                int[] sizes = MultiWayBracketPlanner.partition(field, slots);

                int total = 0;
                for (int size : sizes) {
                    assertTrue(size >= 2 && size <= slots,
                            "field " + field + " S=" + slots + " produced a match of " + size);
                    total += size;
                }
                assertEquals(field, total, "sizes must account for every competitor");
            }
        }
    }

    @Test
    @DisplayName("the match count is the provable minimum, ceil(field / S)")
    void partitionUsesFewestMatches() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                assertEquals((field + slots - 1) / slots,
                        MultiWayBracketPlanner.partition(field, slots).length,
                        "field " + field + " S=" + slots);
            }
        }
    }

    @Test
    @DisplayName("sizes differ by at most 1 and are returned smallest-first")
    void partitionIsBalancedAndAscending() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                int[] sizes = MultiWayBracketPlanner.partition(field, slots);

                for (int i = 1; i < sizes.length; i++) {
                    assertTrue(sizes[i] >= sizes[i - 1],
                            "field " + field + " S=" + slots + " is not ascending");
                }
                assertTrue(sizes[sizes.length - 1] - sizes[0] <= 1,
                        "field " + field + " S=" + slots + " spread more than 1");
            }
        }
    }

    @Test
    @DisplayName("a field below 2, or an unsupported slot count, is rejected rather than fudged")
    void partitionRejectsDegenerateInput() {
        assertThrows(IllegalArgumentException.class, () -> MultiWayBracketPlanner.partition(1, 3));
        assertThrows(IllegalArgumentException.class, () -> MultiWayBracketPlanner.partition(0, 4));
        // S=2 would need single-competitor matches; 1v1 keeps the power-of-2 generator.
        assertThrows(IllegalArgumentException.class, () -> MultiWayBracketPlanner.partition(10, 2));
        assertThrows(IllegalArgumentException.class, () -> MultiWayBracketPlanner.partition(10, 5));
    }

    // =====================================================
    // ROUND CHAIN
    // =====================================================

    @Test
    @DisplayName("every field converges to exactly one final, with no degenerate round")
    void roundsTerminateInASingleFinal() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                List<int[]> rounds = MultiWayBracketPlanner.planRounds(field, slots);

                assertTrue(rounds.size() >= 1, "field " + field + " produced no rounds");
                assertEquals(1, rounds.get(rounds.size() - 1).length,
                        "field " + field + " S=" + slots + " does not end in one match");

                int arriving = field;
                for (int[] sizes : rounds) {
                    int seated = 0;
                    for (int size : sizes) {
                        seated += size;
                    }
                    assertEquals(arriving, seated, "a round dropped or invented competitors");
                    arriving = sizes.length;
                }
                assertEquals(1, arriving, "the chain must end with one survivor");
            }
        }
    }

    @Test
    @DisplayName("a field of 0 or 1 needs no rounds at all")
    void degenerateFieldsHaveNoRounds() {
        assertTrue(MultiWayBracketPlanner.planRounds(1, 3).isEmpty());
        assertTrue(MultiWayBracketPlanner.planRounds(0, 4).isEmpty());
    }

    @Test
    @DisplayName("eliminations across the whole bracket total field - 1")
    void bracketAccountingBalances() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                int eliminated = 0;
                for (int[] sizes : MultiWayBracketPlanner.planRounds(field, slots)) {
                    for (int size : sizes) {
                        eliminated += size - 1;
                    }
                }
                assertEquals(field - 1, eliminated, "field " + field + " S=" + slots);
            }
        }
    }

    // =====================================================
    // SEEDING
    // =====================================================

    @Test
    @DisplayName("seating deals every rank exactly once, filling each match to capacity")
    void seatingIsATotalBijection() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                int[] sizes = MultiWayBracketPlanner.partition(field, slots);
                List<List<Integer>> seats = MultiWayBracketPlanner.seatByRank(field, sizes);

                Set<Integer> seen = new HashSet<>();
                for (int i = 0; i < sizes.length; i++) {
                    assertEquals(sizes[i], seats.get(i).size(), "match " + i + " was not filled");
                    for (int rank : seats.get(i)) {
                        assertTrue(seen.add(rank), "rank " + rank + " was dealt twice");
                    }
                }
                assertEquals(field, seen.size());
            }
        }
    }

    @Test
    @DisplayName("the top k seeds land in k distinct matches, k = the round's match count")
    void topSeedsAreSplitAcrossMatches() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                int[] sizes = MultiWayBracketPlanner.partition(field, slots);
                List<List<Integer>> seats = MultiWayBracketPlanner.seatByRank(field, sizes);

                // Pass 1 deals one rank per match left to right, so match i must
                // open with rank i + 1.
                for (int i = 0; i < sizes.length; i++) {
                    assertEquals(i + 1, seats.get(i).get(0).intValue(),
                            "field " + field + " S=" + slots + " match " + i);
                }
            }
        }
    }

    @Test
    @DisplayName("known-good draws are reproduced exactly")
    void seatingMatchesWorkedExamples() {
        assertSeats(9, 3, "1,6,7 | 2,5,8 | 3,4,9");
        assertSeats(10, 3, "1,8 | 2,7 | 3,6,9 | 4,5,10");
        assertSeats(16, 4, "1,8,9,16 | 2,7,10,15 | 3,6,11,14 | 4,5,12,13");
        assertSeats(17, 4, "1,10,11 | 2,9,12 | 3,8,13 | 4,7,14,17 | 5,6,15,16");
    }

    @Test
    @DisplayName("a better-seeded match never draws a stronger field than a worse-seeded one of the same size")
    void drawDifficultyIsMonotoneWithinASizeBand() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                int[] sizes = MultiWayBracketPlanner.partition(field, slots);
                List<List<Integer>> seats = MultiWayBracketPlanner.seatByRank(field, sizes);

                // A match's "opponent sum" is its total less its own top seed —
                // how hard the draw is, rather than how strong its own leader
                // is. Higher rank numbers mean weaker competitors, so a HIGHER
                // opponent sum is an EASIER draw. Neither this nor the raw total
                // is flat across all sizes (odd sizes flatten this one, even
                // sizes flatten the total), but the ordering always holds: going
                // down the seeding within one size band, the draw never gets
                // easier.
                int bandSize = -1;
                int previous = Integer.MAX_VALUE;
                for (int i = 0; i < sizes.length; i++) {
                    int sum = 0;
                    for (int rank : seats.get(i)) {
                        sum += rank;
                    }
                    int opponentSum = sum - seats.get(i).get(0);

                    if (bandSize != sizes[i]) {
                        bandSize = sizes[i];
                    } else {
                        assertTrue(opponentSum <= previous,
                                "field " + field + " S=" + slots + " match " + i
                                        + " is worse seeded but draws an easier field ("
                                        + opponentSum + " vs " + previous + ")");
                    }
                    previous = opponentSum;
                }
            }
        }
    }

    // =====================================================
    // WHOLE-BRACKET PLAN
    // =====================================================

    @Test
    @DisplayName("feeders form contiguous ascending blocks, so the bracket is planar")
    void feedersAreContiguous() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                List<List<PlannedMatch>> plan = MultiWayBracketPlanner.plan(field, slots);

                for (int r = 1; r < plan.size(); r++) {
                    int expected = 0;
                    for (PlannedMatch match : plan.get(r)) {
                        int[] feeders = match.feederPositions();
                        assertEquals(match.size(), feeders.length, "a match must be fed to capacity");
                        for (int feeder : feeders) {
                            assertEquals(expected++, feeder,
                                    "field " + field + " S=" + slots + " round " + (r + 1)
                                            + " has non-contiguous feeders — the bracket would not draw as a tree");
                        }
                    }
                    assertEquals(plan.get(r - 1).size(), expected,
                            "every match of the previous round must feed exactly one match");
                }
            }
        }
    }

    @Test
    @DisplayName("under chalk the top two seeds cannot meet before the final")
    void topTwoSeedsMeetOnlyInTheFinal() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {

                List<List<PlannedMatch>> plan = MultiWayBracketPlanner.plan(field, slots);

                // Chalk: the best-ranked competitor in a match always wins.
                List<Integer> survivors = new ArrayList<>();
                for (PlannedMatch match : plan.get(0)) {
                    int best = Integer.MAX_VALUE;
                    boolean holdsBothLeaders = false;
                    int leaders = 0;
                    for (int seed : match.seeds()) {
                        best = Math.min(best, seed);
                        if (seed <= 2) {
                            leaders++;
                        }
                    }
                    holdsBothLeaders = leaders == 2;
                    if (holdsBothLeaders && plan.size() > 1) {
                        throw new AssertionError("field " + field + " S=" + slots
                                + ": seeds 1 and 2 share a round-1 match");
                    }
                    survivors.add(best);
                }

                for (int r = 1; r < plan.size(); r++) {
                    List<Integer> next = new ArrayList<>();
                    for (PlannedMatch match : plan.get(r)) {
                        int best = Integer.MAX_VALUE;
                        int leaders = 0;
                        for (int feeder : match.feederPositions()) {
                            int survivor = survivors.get(feeder);
                            best = Math.min(best, survivor);
                            if (survivor <= 2) {
                                leaders++;
                            }
                        }
                        boolean isFinalRound = r == plan.size() - 1;
                        if (leaders == 2 && !isFinalRound) {
                            throw new AssertionError("field " + field + " S=" + slots
                                    + ": seeds 1 and 2 meet in round " + (r + 1)
                                    + " of " + plan.size());
                        }
                        next.add(best);
                    }
                    survivors = next;
                }

                assertEquals(1, survivors.size());
                assertEquals(1, survivors.get(0).intValue(), "the top seed must win under chalk");
            }
        }
    }

    @Test
    @DisplayName("every competitor is seeded into exactly one round-1 match")
    void everyCompetitorGetsExactlyOneSlot() {
        for (int slots : SLOT_COUNTS) {
            for (int field = 2; field <= MAX_FIELD; field++) {
                Set<Integer> seen = new HashSet<>();
                for (PlannedMatch match : MultiWayBracketPlanner.plan(field, slots).get(0)) {
                    assertEquals(match.size(), match.seeds().length);
                    for (int seed : match.seeds()) {
                        assertTrue(seen.add(seed), "seed " + seed + " was placed twice");
                    }
                }
                assertEquals(field, seen.size(), "field " + field + " S=" + slots);
            }
        }
    }

    @Test
    @DisplayName("the worked 10-competitor Triple Threat bracket is laid out as documented")
    void tenCompetitorTripleThreatPlan() {
        List<List<PlannedMatch>> plan = MultiWayBracketPlanner.plan(10, 3);

        assertEquals(3, plan.size());

        assertArrayEquals(new int[] { 1, 8 }, plan.get(0).get(0).seeds());
        assertArrayEquals(new int[] { 4, 5, 10 }, plan.get(0).get(1).seeds());
        assertArrayEquals(new int[] { 2, 7 }, plan.get(0).get(2).seeds());
        assertArrayEquals(new int[] { 3, 6, 9 }, plan.get(0).get(3).seeds());

        assertArrayEquals(new int[] { 0, 1 }, plan.get(1).get(0).feederPositions());
        assertArrayEquals(new int[] { 2, 3 }, plan.get(1).get(1).feederPositions());

        assertEquals(1, plan.get(2).size());
        assertArrayEquals(new int[] { 0, 1 }, plan.get(2).get(0).feederPositions());
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private static void assertSeats(int field, int slots, String expected) {
        List<List<Integer>> seats =
                MultiWayBracketPlanner.seatByRank(field, MultiWayBracketPlanner.partition(field, slots));

        StringBuilder actual = new StringBuilder();
        for (int i = 0; i < seats.size(); i++) {
            if (i > 0) {
                actual.append(" | ");
            }
            for (int j = 0; j < seats.get(i).size(); j++) {
                if (j > 0) {
                    actual.append(',');
                }
                actual.append(seats.get(i).get(j));
            }
        }
        assertEquals(expected, actual.toString(), "field " + field + " S=" + slots);
    }
}
