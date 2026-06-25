package com.botleague.backend.matches.enums;
 
public enum TournamentFormat {
 
    /**
     * Classic single-elimination bracket.
     * One loss = out.
     * Supports a separate 3rd-place match (leaderboard_position = 3).
     */
    SINGLE_ELIMINATION,
 
    /**
     * Double-elimination bracket.
     * Teams move to the losers bracket after their first loss.
     * A second loss eliminates them.
     * Ends with a grand final; may include a bracket-reset rematch.
     * 1v1 matches only in this format.
     */
    DOUBLE_ELIMINATION
}