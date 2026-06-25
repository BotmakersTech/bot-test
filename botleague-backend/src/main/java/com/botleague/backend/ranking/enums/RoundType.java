package com.botleague.backend.ranking.enums;

/**
 * Identifies the tournament round for point-award purposes.
 *
 * Point table:
 *   ROUND_1 / QUARTER_FINAL  →  Winner = 4 pts,  Loser = 1 pt
 *   SEMI_FINAL / THIRD_PLACE →  Winner = 6 pts,  Loser = 3 pts
 *   FINAL                    →  Winner = 8 pts,  Loser = 4 pts
 *   BYE / CANCELLED          →  0 pts (no competitive result)
 */
public enum RoundType {
    ROUND_1,
    QUARTER_FINAL,
    SEMI_FINAL,
    THIRD_PLACE,
    FINAL,
    BYE,
    CANCELLED;

    /** Points awarded to the winner of this round. */
    public int winnerPoints() {
        return switch (this) {
            case ROUND_1, QUARTER_FINAL  -> 4;
            case SEMI_FINAL, THIRD_PLACE -> 6;
            case FINAL                   -> 8;
            default                      -> 0;
        };
    }

    /** Points awarded to the loser of this round. */
    public int loserPoints() {
        return switch (this) {
            case ROUND_1, QUARTER_FINAL  -> 1;
            case SEMI_FINAL, THIRD_PLACE -> 3;
            case FINAL                   -> 4;
            default                      -> 0;
        };
    }
}
