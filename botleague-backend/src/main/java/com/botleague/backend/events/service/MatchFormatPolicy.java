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

    /** UPPER, digits kept, every run of non-alphanumerics dropped. */
    private static String norm(String s) {
        return s == null ? "" : s.toUpperCase().replaceAll("[^A-Z0-9]+", "");
    }

    /**
     * Fold any sport identifier down to one of the canonical keys used above.
     * Mirrors SportSpecPolicy.sportKey() exactly — same display names, legacy
     * keys, and canonical tokens all need to resolve to the same shape here.
     */
    private static String sportKey(String sportName) {
        String n = norm(sportName);
        if (n.contains("ROBOWAR") || n.contains("ROBOTWAR") || n.contains("COMBAT")) return "ROBOWAR";
        if (n.contains("ROBOSUMO") || n.contains("SUMO")) return "ROBOSUMO";
        if (n.contains("LINEFOLLOWER") || n.contains("LINEFOLLOW")) return "LINEFOLLOWER";
        if (n.contains("DRONESOCCER") || n.contains("DRONE")) return "DRONESOCCER";
        if (n.contains("RCRACING") || n.contains("RCROBO") || n.contains("RCCAR")) return "RCRACINGCAR";
        if (n.contains("ROBOSOCCER") || n.contains("SOCCER")) return "ROBOSOCCER";
        // "Robo Race" / "Robo Racing" — kept last so "RC Racing" is matched first above.
        if (n.contains("ROBORACE") || n.contains("ROBORACING") || n.contains("RACE")) return "ROBORACE";
        return n;
    }
}
