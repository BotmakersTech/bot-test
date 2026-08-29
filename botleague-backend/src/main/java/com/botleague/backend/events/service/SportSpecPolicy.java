package com.botleague.backend.events.service;

import java.util.EnumSet;
import java.util.Set;

import com.botleague.backend.events.enums.SpecConstraint;

/**
 * The single source of truth for "which physical spec actually gates
 * registration for this (league, sport)". A robot only needs to satisfy the
 * constraint(s) listed here — nothing else on the EventSports row is enforced.
 *
 * <pre>
 *   League   Sport            Constraint
 *   Ignite   Robo Sumo        Weight
 *   Ignite   Robo Race        Weight
 *   Ignite   Robo Soccer      Weight
 *   Ignite   Drone Soccer     Dimension
 *   Ignite   Line Follower    Dimension
 *   Inferno  Robo War         Weight
 *   Inferno  Robo Race        Weight + Dimension
 *   Inferno  Robo Soccer      Weight + Dimension
 *   Inferno  Drone Soccer     Dimension
 *   Inferno  RC Racing Car    Scale
 *   Apex     Robo War         Weight
 *   Apex     Robo Race        Weight + Dimension
 *   Apex     Robo Soccer      Weight + Dimension
 *   Apex     Drone Soccer     Dimension
 *   Apex     RC Racing Car    Scale
 * </pre>
 *
 * A (league, sport) that isn't in the table falls back to "enforce whatever
 * limits the row happens to carry" — i.e. all three — so future/custom sports
 * are still validated against their own data.
 */
public final class SportSpecPolicy {

    private SportSpecPolicy() {}

    private static final Set<SpecConstraint> WEIGHT      = EnumSet.of(SpecConstraint.WEIGHT);
    private static final Set<SpecConstraint> DIMENSION   = EnumSet.of(SpecConstraint.DIMENSION);
    private static final Set<SpecConstraint> SCALE       = EnumSet.of(SpecConstraint.SCALE);
    private static final Set<SpecConstraint> WEIGHT_DIM  = EnumSet.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION);
    private static final Set<SpecConstraint> ALL         = EnumSet.allOf(SpecConstraint.class);

    /**
     * @param ageGroupCode EventSports.ageGroup — JUNIOR_INNOVATORS | YOUNG_ENGINEERS | ROBO_MINDS
     * @param sportName    EventSports.sport — the catalog display name ("Robo War"), a legacy
     *                     key ("ROBOWAR_15KG"), or a canonical token; all fold to the same shape
     */
    public static Set<SpecConstraint> constraintsFor(String ageGroupCode, String sportName) {
        String league = norm(ageGroupCode);
        String sport  = sportKey(sportName);

        switch (league) {
            case "JUNIORINNOVATORS": // Ignite
                switch (sport) {
                    case "ROBOSUMO":     return WEIGHT;
                    case "ROBORACE":     return WEIGHT;
                    case "ROBOSOCCER":   return WEIGHT;
                    case "DRONESOCCER":  return DIMENSION;
                    case "LINEFOLLOWER": return DIMENSION;
                    default: break;
                }
                break;
            case "YOUNGENGINEERS":   // Inferno
                switch (sport) {
                    case "ROBOWAR":      return WEIGHT;
                    case "ROBORACE":     return WEIGHT_DIM;
                    case "ROBOSOCCER":   return WEIGHT_DIM;
                    case "DRONESOCCER":  return DIMENSION;
                    case "RCRACINGCAR":  return SCALE;
                    default: break;
                }
                break;
            case "ROBOMINDS":        // Apex
                switch (sport) {
                    case "ROBOWAR":      return WEIGHT;
                    case "ROBORACE":     return WEIGHT_DIM;
                    case "ROBOSOCCER":   return WEIGHT_DIM;
                    case "DRONESOCCER":  return DIMENSION;
                    case "RCRACINGCAR":  return SCALE;
                    default: break;
                }
                break;
            default: break;
        }
        return ALL;
    }

    /** UPPER, digits kept, every run of non-alphanumerics dropped. */
    private static String norm(String s) {
        return s == null ? "" : s.toUpperCase().replaceAll("[^A-Z0-9]+", "");
    }

    /**
     * Fold any sport identifier down to one of the canonical keys used above.
     * Handles the catalog display name ("Robo War"), the legacy per-class keys
     * ("ROBOWAR_1_5KG"), and canonical tokens ("ROBO_WAR").
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
