package com.botleague.backend.matches.enums;
 
public enum MatchType {
 
    /**
     * Standard head-to-head match.
     * Uses team_a and team_b slots only.
     * Compatible with both SINGLE_ELIMINATION and DOUBLE_ELIMINATION.
     */
    ONE_VS_ONE,
 
    /**
     * Three-way match.
     * Uses team_a, team_b, team_c slots.
     * Finish positions (1st / 2nd / 3rd) determine advancement.
     * Compatible with SINGLE_ELIMINATION only.
     */
    TRIPLE_THREAT,
 
    /**
     * Four-way match.
     * Uses team_a, team_b, team_c, team_d slots.
     * Finish positions (1st / 2nd / 3rd / 4th) determine advancement.
     * Compatible with SINGLE_ELIMINATION only.
     */
    FATAL_FOUR
}