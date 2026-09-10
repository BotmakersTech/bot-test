package com.botleague.backend.ranking.util;

/**
 * Shared math used across the ranking module — previously recomputed
 * independently in 3 places (RankingEngineService twice, RankingQueryService
 * once) with no shared source of truth.
 */
public final class RankingMath {

    private RankingMath() {}

    public static double winPercentage(int wins, int matchesPlayed) {
        return matchesPlayed > 0 ? (wins * 100.0 / matchesPlayed) : 0.0;
    }

    /**
     * Points a robot earns for finishing a round-wise time-trial sport in a
     * given final placement (1 = winner).
     *
     * A bracket sport has no explicit placement→points table — a competitor's
     * total just accumulates per match from {@link com.botleague.backend.ranking.enums.RoundType}
     * (ROUND_1/QF win 4, SEMI/THIRD win 6, FINAL win 8, losses 1/3/4). Played
     * out over a standard 8-robot single-elimination bracket that lands the
     * finishers on roughly:
     *   1st = 18, 2nd = 14, 3rd = 13, 4th = 10, 5th–8th = 1.
     *
     * Time trials have no per-match rounds to accumulate from, so we award the
     * equivalent total directly off final placement, keeping the global pool on
     * the same scale as bracket sports (podium-weighted, everyone who finished
     * gets something). Top 3 also collect gold/silver/bronze in
     * updateGlobalRankings, exactly like a bracket podium.
     */
    public static int timeTrialPlacementPoints(int placement) {
        if (placement <= 0) return 0;
        return switch (placement) {
            case 1 -> 18;
            case 2 -> 14;
            case 3 -> 13;
            case 4 -> 10;
            case 5, 6, 7, 8 -> 5;
            default -> 2;
        };
    }
}
