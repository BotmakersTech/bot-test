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
}
