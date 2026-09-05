package com.botleague.backend.matches.tournament;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure, dependency-free geometry for multi-way single-elimination brackets —
 * Triple Threat (3 per match) and Fatal Four (4 per match).
 *
 * <h2>Why this exists</h2>
 * A 1v1 bracket has a natural shape: pad the field up to the next power of 2
 * and hand out byes. The obvious generalisation — pad up to the next power of
 * 3 or 4 — is a trap. 10 teams in Triple Threat would need a 27-slot bracket:
 * 17 of the 27 slots are byes, most first-round "matches" have a single real
 * competitor, and two thirds of the field advances without ever competing.
 *
 * <p>Instead, this planner drops the power-of-N requirement entirely. A round
 * is simply a <em>partition</em> of its competitors into matches of 2..N
 * competitors each. Byes then become unnecessary for every field of 2 or more.
 *
 * <h2>Round shape — the balanced partition</h2>
 * For {@code c} competitors and at most {@code N} per match, the fewest matches
 * that can hold them all is {@code k = ceil(c / N)} — fewer is impossible, since
 * {@code k - 1} matches seat at most {@code N(k-1) < c}. Having fixed {@code k},
 * the competitors are spread as evenly as possible across those {@code k}
 * matches: {@code c mod k} matches take {@code floor(c/k) + 1} competitors and
 * the rest take {@code floor(c/k)}.
 *
 * <p>Evenness is not cosmetic. In a knockout round a competitor's chance of
 * advancing is roughly {@code 1 / matchSize}, so a field split 4+4+4+3+2 hands
 * the two competitors in that last match a 50% shot while the eight in the
 * 4-ways get 25%. The balanced split of the same 17 competitors — 4+4+3+3+3 —
 * uses exactly as many matches but narrows that spread to 33% vs 25%.
 *
 * <p>Two properties make the scheme safe, and both hold for every {@code c >= 2}
 * at {@code N = 3} and {@code N = 4}:
 * <ul>
 *   <li><b>No undersized match.</b> {@code floor(c/k) >= 2}. Since
 *       {@code k = ceil(c/N)} implies {@code c >= N(k-1) + 1}, we get
 *       {@code floor(c/k) >= floor(N - (N-1)/k)}, which is at least 2 for
 *       every {@code k >= 1} once {@code N >= 3}. So a match never has to be
 *       filled out with a bye.</li>
 *   <li><b>No oversized match.</b> {@code c <= kN}, so {@code floor(c/k) <= N}
 *       and the {@code +1} matches stay within {@code N} as well.</li>
 * </ul>
 * Both proofs need {@code N >= 3}. At {@code N = 2} the first one fails —
 * {@code c = 5} would want three matches of 2, 2 and 1 — which is precisely why
 * 1v1 brackets need byes and keep their own power-of-2 generator.
 *
 * <h2>Whole-bracket shape</h2>
 * Each round produces exactly one winner per match, so the next round's field is
 * the current round's match count. Applying the partition repeatedly gives the
 * whole bracket up front. It always terminates: {@code ceil(c/N) < c} for every
 * {@code c >= 2}, so the field strictly shrinks to 1.
 *
 * <pre>
 *   17 competitors, Fatal Four:  4+4+3+3+3  -&gt;  3+2  -&gt;  2      (3 rounds)
 *   10 competitors, Triple:      2+2+3+3    -&gt;  2+2  -&gt;  2      (3 rounds)
 *    9 competitors, Triple:      3+3+3      -&gt;  3               (2 rounds)
 *   16 competitors, Fatal Four:  4+4+4+4    -&gt;  4               (2 rounds)
 * </pre>
 *
 * <p><b>The final is not always full-size.</b> Because each round is made as
 * compact as possible, the last round can come down to 2 or 3 competitors even
 * in a Fatal Four event — a Fatal Four field of 17..32 always ends in a 1v1
 * decider. Forcing a 4-way final instead would mean deliberately splitting
 * earlier rounds into far more, far smaller matches: 17 competitors would need a
 * first round of 3+2+2+2+2+2+2+2 to reach a 4-way final, making eleven of the
 * thirteen matches in the bracket 1v1s. Keeping the rounds compact is the better
 * trade, so a small final is an accepted, documented property rather than a bug.
 *
 * <h2>Seeding</h2>
 * See {@link #seatByRank}.
 */
public final class MultiWayBracketPlanner {

    /** Smallest legal match. Below this a "match" is a bye, not a contest. */
    public static final int MIN_COMPETITORS_PER_MATCH = 2;

    /**
     * Smallest max-slot count this planner supports. At 2 the balanced
     * partition would have to emit single-competitor matches (see class
     * javadoc), so 1v1 brackets stay on the power-of-2 generator.
     */
    public static final int MIN_SLOTS_PER_MATCH = 3;

    /** Largest max-slot count — bounded by Match's four team slots (A..D). */
    public static final int MAX_SLOTS_PER_MATCH = 4;

    private MultiWayBracketPlanner() {}

    // =====================================================
    // ONE ROUND
    // =====================================================

    /**
     * The shape of a single round: how many competitors each match holds.
     *
     * <p>Returned <b>ascending</b>, so the smallest matches come first. That
     * ordering is load-bearing for seeding — see {@link #seatByRank}.
     *
     * @param competitors      how many competitors enter this round; at least 2
     * @param maxSlotsPerMatch 3 for Triple Threat, 4 for Fatal Four
     * @return match sizes, ascending, summing to {@code competitors}; every
     *         entry is in {@code [2, maxSlotsPerMatch]}
     */
    public static int[] partition(int competitors, int maxSlotsPerMatch) {

        requireSupportedSlotCount(maxSlotsPerMatch);

        if (competitors < MIN_COMPETITORS_PER_MATCH) {
            throw new IllegalArgumentException(
                    "A round needs at least " + MIN_COMPETITORS_PER_MATCH
                            + " competitors, got: " + competitors);
        }

        // Fewest matches that can seat everyone — see the class javadoc for
        // why this is a true minimum and not merely a greedy choice.
        int matchCount = ceilDiv(competitors, maxSlotsPerMatch);

        int smallSize = competitors / matchCount;      // >= 2, proven in javadoc
        int largeCount = competitors % matchCount;     // this many take smallSize + 1
        int smallCount = matchCount - largeCount;

        int[] sizes = new int[matchCount];
        for (int i = 0; i < matchCount; i++) {
            sizes[i] = (i < smallCount) ? smallSize : smallSize + 1;
        }
        return sizes;
    }

    // =====================================================
    // WHOLE BRACKET
    // =====================================================

    /**
     * The shape of every round, round 1 first.
     *
     * <p>The last entry is always a single match — the final. A field of 0 or 1
     * has no rounds at all and yields an empty list; callers handle that
     * degenerate case themselves (a lone entrant is champion by walkover).
     *
     * @param competitors      size of the starting field
     * @param maxSlotsPerMatch 3 for Triple Threat, 4 for Fatal Four
     */
    public static List<int[]> planRounds(int competitors, int maxSlotsPerMatch) {

        requireSupportedSlotCount(maxSlotsPerMatch);

        List<int[]> rounds = new ArrayList<>();

        // Each match yields one winner, so the next round's field size is
        // simply this round's match count. ceil(c/N) < c for every c >= 2,
        // so this strictly shrinks and always lands on 1.
        int remaining = competitors;
        while (remaining > 1) {
            int[] sizes = partition(remaining, maxSlotsPerMatch);
            rounds.add(sizes);
            remaining = sizes.length;
        }
        return rounds;
    }

    // =====================================================
    // SEEDING
    // =====================================================

    /**
     * Distributes ranks {@code 1..competitors} across a round's matches.
     *
     * <p>"Rank" means strength order, 1 = strongest. In round 1 that is the
     * seed; in later rounds it is the strength order of the matches feeding in,
     * which this method itself establishes — the match holding rank 1 becomes
     * rank 1 of the next round, and so on, so the recursion is self-consistent.
     *
     * <h3>Serpentine allocation</h3>
     * Ranks are dealt out one pass left-to-right, the next right-to-left, and
     * so on, skipping any match already at capacity:
     * <pre>
     *   10 competitors, matches sized 2,2,3,3:
     *     pass 1  -&gt;  {1} {2} {3} {4}
     *     pass 2  -&gt;  {1,8} {2,7} {3,6} {4,5}
     *     pass 3  -&gt;  {1,8} {2,7} {3,6,9} {4,5,10}
     * </pre>
     * Dealing one rank per match per pass puts the top {@code k} seeds in
     * {@code k} distinct matches, and reversing each pass keeps the totals level
     * — a strong seed is paired with the weakest competitors of every later
     * band. With equal-sized matches the balance is exact: 16 competitors in
     * four Fatal Four matches give {1,8,9,16} {2,7,10,15} {3,6,11,14}
     * {4,5,12,13}, every match summing to 34.
     *
     * <p>The direction flips after <em>every</em> sweep, whether or not any
     * bucket was skipped in it. The alternative reading — flip only after a
     * sweep that touched every bucket — produces a different and slightly worse
     * draw, so the rule is stated here explicitly rather than left to the
     * reader. At 17 competitors in Fatal Four the implemented rule deals the
     * leftover ranks 16 and 17 right-to-left, giving rank 4 a field summing to
     * 38 and rank 5 a field summing to 37: the better-seeded match draws the
     * weaker field, which is the correct direction. Flipping only on full
     * sweeps reverses that.
     *
     * <p>The balance claim is worth stating precisely, because the tidy example
     * above is the best case rather than the general one. Totals come out
     * exactly level only when the match size is even, since that is when the
     * passes pair up: 16 competitors in four 4-ways give 34 four times, but 9
     * competitors in three 3-ways give 14, 15, 16 — a residual +1 gradient from
     * the odd third pass. Neither raw totals nor opponent sums are flat in
     * every case; the two just trade places. Measuring a match by its
     * <em>opponent</em> sum (its total less its own top seed, which is what
     * actually says how hard the draw is) the odd sizes are the flat ones —
     * 9 competitors give 13, 13, 13 and the three 3-ways at 17 give 21, 21, 21
     * — while the even sizes carry the gradient instead, 16 competitors giving
     * 33, 32, 31, 30.
     *
     * <p>What holds in <em>every</em> case, and is the property worth relying
     * on, is the direction: within a group of equally-sized matches the
     * opponent sum never increases as the seeding gets worse, so a
     * better-seeded match never draws a stronger field than a worse-seeded one.
     * That is asserted exhaustively in the planner's tests.
     *
     * <h3>Why the smallest matches go first</h3>
     * {@link #partition} returns sizes ascending, so rank 1 is dealt into the
     * <em>smallest</em> match of the round. When a round's matches are not all
     * the same size, competitors in the smaller ones have a better chance of
     * advancing, and standard bracket practice is to give that advantage to the
     * top seeds — the same convention as "byes go to the highest seeds first",
     * applied continuously rather than only at the extremes. At 10 competitors
     * in Triple Threat the two 1v1s are {1,8} and {2,7} while the 3-ways are
     * {3,6,9} and {4,5,10}, so the top two seeds get a 50% shot instead of 33%.
     *
     * <p>Note what that also does to the bottom of those small matches: seed 8
     * is dragged into a duel with the tournament favourite and advances less
     * often than seeds 9 and 10, who sit in 3-ways. That inversion is
     * structural — any round mixing 2-ways and 3-ways makes someone in a 2-way
     * better off than the top of a 3-way's tail — and it is accepted here as
     * the price of rewarding the top seeds, not overlooked.
     *
     * <p>Reversing the order — biggest matches to the top seeds — would invert
     * the reward for seeding, so it is deliberately not done. Flipping the
     * convention means sorting {@link #partition}'s output descending and
     * changing nothing else.
     *
     * <h3>Unseeded fields</h3>
     * The incoming order <em>is</em> the seeding. A caller with no meaningful
     * ranking should shuffle before calling, otherwise registration order
     * silently becomes seed order.
     *
     * @param competitors how many ranks to deal out
     * @param matchSizes  this round's shape, from {@link #partition}
     * @return one list per match, in {@code matchSizes} order, each holding its
     *         competitors' ranks in slot order (first entry = slot A)
     */
    public static List<List<Integer>> seatByRank(int competitors, int[] matchSizes) {

        if (matchSizes == null || matchSizes.length == 0) {
            throw new IllegalArgumentException("matchSizes required");
        }

        int capacity = 0;
        for (int size : matchSizes) {
            capacity += size;
        }
        if (capacity != competitors) {
            throw new IllegalArgumentException(
                    "matchSizes hold " + capacity + " competitors but " + competitors
                            + " were supplied — every competitor must get a slot");
        }

        List<List<Integer>> seats = new ArrayList<>(matchSizes.length);
        for (int size : matchSizes) {
            seats.add(new ArrayList<>(size));
        }

        int rank = 1;
        boolean leftToRight = true;

        while (rank <= competitors) {
            for (int step = 0; step < matchSizes.length && rank <= competitors; step++) {
                int i = leftToRight ? step : matchSizes.length - 1 - step;
                if (seats.get(i).size() < matchSizes[i]) {
                    seats.get(i).add(rank++);
                }
            }
            leftToRight = !leftToRight;
        }

        return seats;
    }

    // =====================================================
    // WHOLE-BRACKET PLAN
    // =====================================================

    /**
     * One match in a planned bracket, at a fixed display position in its round.
     *
     * <p>Round 1 matches carry {@link #seeds}; later rounds carry
     * {@link #feederPositions}. Both are in slot order, so index 0 is slot A.
     */
    public static final class PlannedMatch {

        private final int size;
        private final int[] seeds;
        private final int[] feederPositions;

        private PlannedMatch(int size, int[] seeds, int[] feederPositions) {
            this.size = size;
            this.seeds = seeds;
            this.feederPositions = feederPositions;
        }

        /** Competitors in this match: 2..maxSlotsPerMatch. */
        public int size() {
            return size;
        }

        /** Round 1 only: seed numbers (1 = top seed) in slot order; empty otherwise. */
        public int[] seeds() {
            return seeds.clone();
        }

        /**
         * Rounds 2+ only: display positions in the previous round whose winners
         * fill this match, in slot order; empty for round 1. Always a
         * contiguous ascending block — see {@link #plan}.
         */
        public int[] feederPositions() {
            return feederPositions.clone();
        }
    }

    /**
     * The complete bracket: every round in order, every match at its display
     * position within that round.
     *
     * <h3>Why the routing is not another serpentine</h3>
     * It is tempting to reapply {@link #seatByRank} at every round to decide
     * which matches feed which — it separates the strong matches perfectly. It
     * also makes the bracket <em>non-planar</em>. At 10 competitors in Triple
     * Threat it would send round-1 matches 0 and 3 into one semifinal and 1 and
     * 2 into the other; those two nestings share a midpoint, so every bracket
     * renderer either stacks the semifinals on top of each other or draws edges
     * straight through the other match's box. A tournament bracket has to be
     * drawable as a tree.
     *
     * <p>So the serpentine is applied once, to establish <em>ranks</em>, and
     * the matches are then laid out in the order that makes those ranks group
     * <em>contiguously</em>. Each match's feeders are an adjacent run of the
     * previous round, exactly as in a classic 1v1 bracket, where
     * {@code buildSeedOrder2} bakes the whole permutation into round 1 for the
     * same reason.
     *
     * <p>The construction runs backwards from the final. The final is rank 1 of
     * its round. Given a round's positions, the previous round's positions are
     * filled by walking the round in display order and writing each match's
     * serpentine-assigned feeder ranks into the next contiguous block. Because
     * the serpentine deals rank {@code i+1} to bucket {@code i}, and the
     * strongest competitor in a match wins under chalk, the winner of the rank-i
     * match is rank i of the next round — so ranks 1 and 2 are always dealt to
     * two different matches, and the top two seeds can only meet in the final.
     *
     * <pre>
     *   10 competitors, Triple Threat
     *     round 1  pos 0: {1,8}      pos 1: {4,5,10}   pos 2: {2,7}   pos 3: {3,6,9}
     *     round 2  pos 0: feeders 0,1                  pos 1: feeders 2,3
     *     round 3  pos 0: feeders 0,1                  (the final)
     *   Under chalk: 1 and 4 meet, 2 and 3 meet, then 1 plays 2 in the final.
     * </pre>
     *
     * @param competitors      size of the starting field; at least 2
     * @param maxSlotsPerMatch 3 for Triple Threat, 4 for Fatal Four
     * @return one list per round, round 1 first; the last round holds exactly
     *         one match
     */
    public static List<List<PlannedMatch>> plan(int competitors, int maxSlotsPerMatch) {

        List<int[]> sizesPerRound = planRounds(competitors, maxSlotsPerMatch);
        if (sizesPerRound.isEmpty()) {
            return List.of();
        }

        int roundCount = sizesPerRound.size();

        // rankAt[r][p] = which bucket of sizesPerRound.get(r) sits at display
        // position p of round r, as a 1-based rank (1 = the round's strongest
        // match). Built backwards from the final, which is its round's only
        // match and therefore rank 1.
        int[][] rankAt = new int[roundCount][];
        rankAt[roundCount - 1] = new int[] { 1 };

        for (int r = roundCount - 2; r >= 0; r--) {

            int[] nextSizes = sizesPerRound.get(r + 1);
            int feederCount = sizesPerRound.get(r).length;

            // Which feeder ranks belong together, by the same serpentine used
            // for seeding. Indexed by bucket, i.e. by rank - 1.
            List<List<Integer>> feederRanks = seatByRank(feederCount, nextSizes);

            int[] ranks = new int[feederCount];
            int position = 0;

            // Walk round r+1 in DISPLAY order and hand each match the next
            // contiguous block of round r. That contiguity is what keeps the
            // bracket planar.
            for (int q = 0; q < rankAt[r + 1].length; q++) {
                int bucket = rankAt[r + 1][q] - 1;
                for (int rank : feederRanks.get(bucket)) {
                    ranks[position++] = rank;
                }
            }
            rankAt[r] = ranks;
        }

        List<List<Integer>> firstRoundSeats = seatByRank(competitors, sizesPerRound.get(0));

        List<List<PlannedMatch>> plan = new ArrayList<>(roundCount);

        for (int r = 0; r < roundCount; r++) {

            int[] sizes = sizesPerRound.get(r);
            List<PlannedMatch> round = new ArrayList<>(rankAt[r].length);

            int feederPosition = 0;
            for (int p = 0; p < rankAt[r].length; p++) {

                int size = sizes[rankAt[r][p] - 1];

                if (r == 0) {
                    round.add(new PlannedMatch(size, toArray(firstRoundSeats.get(rankAt[r][p] - 1)), new int[0]));
                } else {
                    int[] feeders = new int[size];
                    for (int t = 0; t < size; t++) {
                        feeders[t] = feederPosition++;
                    }
                    round.add(new PlannedMatch(size, new int[0], feeders));
                }
            }
            plan.add(round);
        }

        verifyPlan(plan, competitors, maxSlotsPerMatch);
        return plan;
    }

    /**
     * Re-derives the invariants the rest of the bracket code relies on, rather
     * than trusting them. A silently malformed plan becomes a wrong champion
     * weeks later; failing here makes it a generation-time error.
     */
    private static void verifyPlan(List<List<PlannedMatch>> plan, int competitors, int maxSlotsPerMatch) {

        if (plan.get(plan.size() - 1).size() != 1) {
            throw new IllegalStateException(
                    "Bracket plan for " + competitors + " competitors does not end in a single final");
        }

        for (int r = 0; r < plan.size(); r++) {

            List<PlannedMatch> round = plan.get(r);
            int seated = 0;

            for (PlannedMatch match : round) {
                if (match.size < MIN_COMPETITORS_PER_MATCH || match.size > maxSlotsPerMatch) {
                    throw new IllegalStateException(
                            "Round " + (r + 1) + " has a match of " + match.size + " competitors,"
                                    + " outside [" + MIN_COMPETITORS_PER_MATCH + ", " + maxSlotsPerMatch + "]");
                }
                seated += match.size;
            }

            int expected = (r == 0) ? competitors : plan.get(r - 1).size();
            if (seated != expected) {
                throw new IllegalStateException(
                        "Round " + (r + 1) + " seats " + seated + " competitors but " + expected
                                + " arrive from the previous round");
            }
        }
    }

    private static int[] toArray(List<Integer> values) {
        int[] out = new int[values.size()];
        for (int i = 0; i < out.length; i++) {
            out[i] = values.get(i);
        }
        return out;
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private static int ceilDiv(int numerator, int denominator) {
        return (numerator + denominator - 1) / denominator;
    }

    private static void requireSupportedSlotCount(int maxSlotsPerMatch) {
        if (maxSlotsPerMatch < MIN_SLOTS_PER_MATCH || maxSlotsPerMatch > MAX_SLOTS_PER_MATCH) {
            throw new IllegalArgumentException(
                    "maxSlotsPerMatch must be between " + MIN_SLOTS_PER_MATCH
                            + " and " + MAX_SLOTS_PER_MATCH + " (1v1 brackets use the"
                            + " power-of-2 generator), got: " + maxSlotsPerMatch);
        }
    }
}
