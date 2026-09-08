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
 *   Ignite   Drone Soccer     Diameter   (12.5 cm)
 *   Ignite   Line Follower    Dimension
 *   Inferno  Robo War         Weight
 *   Inferno  Robo Race        Weight + Dimension
 *   Inferno  Robo Soccer      Weight + Dimension
 *   Inferno  Drone Soccer     Diameter   (20 cm)
 *   Inferno  RC Racing Car    Scale
 *   Apex     Robo War         Weight
 *   Apex     Robo Race        Weight + Dimension
 *   Apex     Robo Soccer      Weight + Dimension
 *   Apex     Drone Soccer     Diameter   (20 cm)
 *   Apex     RC Racing Car    Scale
 * </pre>
 *
 * A (league, sport) that isn't in the table falls back to "enforce whatever
 * limits the row happens to carry" — weight, dimension and scale — so
 * future/custom sports are still validated against their own data.
 */
public final class SportSpecPolicy {

    private SportSpecPolicy() {}

    private static final Set<SpecConstraint> WEIGHT      = EnumSet.of(SpecConstraint.WEIGHT);
    private static final Set<SpecConstraint> DIMENSION   = EnumSet.of(SpecConstraint.DIMENSION);
    private static final Set<SpecConstraint> SCALE       = EnumSet.of(SpecConstraint.SCALE);
    private static final Set<SpecConstraint> DIAMETER    = EnumSet.of(SpecConstraint.DIAMETER);
    private static final Set<SpecConstraint> WEIGHT_DIM  = EnumSet.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION);
    /**
     * Fallback for a (league, sport) with no row below: enforce every spec the
     * techsport actually carries a value for. DIAMETER is deliberately excluded
     * — it's Drone Soccer's specific gate, and applying it to an unknown sport
     * would reject robots for a spec that sport never asked for.
     */
    private static final Set<SpecConstraint> ALL         =
            EnumSet.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION, SpecConstraint.SCALE);

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
                    case "DRONESOCCER":  return DIAMETER;
                    case "LINEFOLLOWER": return DIMENSION;
                    default: break;
                }
                break;
            case "YOUNGENGINEERS":   // Inferno
                switch (sport) {
                    case "ROBOWAR":      return WEIGHT;
                    case "ROBORACE":     return WEIGHT_DIM;
                    case "ROBOSOCCER":   return WEIGHT_DIM;
                    case "DRONESOCCER":  return DIAMETER;
                    case "RCRACINGCAR":  return SCALE;
                    default: break;
                }
                break;
            case "ROBOMINDS":        // Apex
                switch (sport) {
                    case "ROBOWAR":      return WEIGHT;
                    case "ROBORACE":     return WEIGHT_DIM;
                    case "ROBOSOCCER":   return WEIGHT_DIM;
                    case "DRONESOCCER":  return DIAMETER;
                    case "RCRACINGCAR":  return SCALE;
                    default: break;
                }
                break;
            default: break;
        }
        return ALL;
    }

    private static String norm(String s) {
        return SportKeys.norm(s);
    }

    private static String sportKey(String sportName) {
        return SportKeys.of(sportName);
    }
}
