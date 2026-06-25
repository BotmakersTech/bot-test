package com.botleague.backend.matches.enums;
 
public enum BracketSide {
 
    /**
     * Winners bracket — teams that have not yet lost.
     * Used in DOUBLE_ELIMINATION.
     */
    WINNERS,
 
    /**
     * Losers bracket — teams that have exactly one loss.
     * Used in DOUBLE_ELIMINATION.
     */
    LOSERS,
 
    /**
     * The grand final between the winners-bracket finalist
     * and the losers-bracket finalist.
     * Used in DOUBLE_ELIMINATION.
     */
    GRAND_FINAL,
 
    /**
     * The 3rd-place match between the two semi-final losers.
     * Used in SINGLE_ELIMINATION (and optionally DOUBLE_ELIMINATION).
     * leaderboard_position = 3 is set on this match.
     */
    THIRD_PLACE
}