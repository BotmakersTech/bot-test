package com.botleague.backend.events.service;

import com.botleague.backend.events.enums.MatchFormatKind;

/**
 * The single source of truth for "which match-generation system this sport uses" —
 * elimination bracket (combat/team sports) vs. round-wise time trial (timed-run sports).
 *
 * <pre>
 *   Sport            Format
 *   Robo War         Bracket
 *   Robo Sumo        Bracket
 *   Drone Soccer     Bracket
 *   Robo Soccer      Bracket
 *   Robo Race        Round Time Trial
 *   RC Racing Car    Round Time Trial
 *   Line Follower    Round Time Trial
 * </pre>
 *
 * Unlike SportSpecPolicy, this doesn't vary by league/age-group — the same sport
 * always uses the same match format regardless of which league it's run under.
 * A sport that isn't in the table falls back to BRACKET, the existing default
 * behavior, so an unrecognized/custom sport never silently loses its bracket.
 */
public final class MatchFormatPolicy {

    private MatchFormatPolicy() {}

    public static MatchFormatKind formatFor(String sportName) {
        switch (sportKey(sportName)) {
            case "ROBORACE":
            case "RCRACINGCAR":
            case "LINEFOLLOWER":
                return MatchFormatKind.ROUND_TIME_TRIAL;
            default:
                return MatchFormatKind.BRACKET;
        }
    }

    /** Shared with SportSpecPolicy and the registration sport check — see SportKeys. */
    private static String sportKey(String sportName) {
        return SportKeys.of(sportName);
    }
}
