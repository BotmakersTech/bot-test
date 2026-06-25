package com.botleague.backend.team.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.botleague.backend.events.enums.AgeCategory;

/**
 * Derives eligible age categories for a robot from its sport + physical specs.
 * Age categories are never user-selected; this engine computes them from rules.
 *
 * Rule: a robot qualifies for a category when ALL applicable constraints
 * (maxWeightKg, maxLengthCm, maxWidthCm, maxHeightCm) are satisfied.
 * A null limit means "no constraint" — the robot passes regardless of its value.
 * A null robot value means "not provided" — the constraint is treated as satisfied
 * so the robot is not disqualified for missing optional dimensions.
 */
@Service
public class RobotEligibilityService {

    private static final Map<String, List<EligibilityRule>> SPORT_RULES = new HashMap<>();

    static {
        // ── Soccer ──────────────────────────────────────────────────────────────────
        SPORT_RULES.put("ROBO_SOCCER", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, 3.0,  30.0, 30.0, 30.0),
            new EligibilityRule(AgeCategory.ROBO_MINDS,      5.0,  45.0, 45.0, 45.0)
        ));
        SPORT_RULES.put("PLUG_N_PLAY_SOCCER", List.of(
            new EligibilityRule(AgeCategory.JUNIOR_INNOVATORS, 1.0, 20.0, 20.0, 20.0)
        ));

        // ── Sumo ────────────────────────────────────────────────────────────────────
        SPORT_RULES.put("ROBO_SUMO", List.of(
            new EligibilityRule(AgeCategory.JUNIOR_INNOVATORS, 1.0, 20.0, 20.0, 20.0)
        ));

        // ── Line Follower ────────────────────────────────────────────────────────────
        SPORT_RULES.put("LINE_FOLLOWER", List.of(
            new EligibilityRule(AgeCategory.JUNIOR_INNOVATORS, 1.0, 20.0, 20.0, 20.0)
        ));
        SPORT_RULES.put("LINE_FOLLOWER_AUTO", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, 1.5, null, null, null)
        ));

        // ── Task ─────────────────────────────────────────────────────────────────────
        SPORT_RULES.put("MANUAL_TASK", List.of(
            new EligibilityRule(AgeCategory.JUNIOR_INNOVATORS, 1.0, 20.0, 20.0, 20.0)
        ));
        SPORT_RULES.put("THEME_BASED_TASKING", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, 3.0, null, null, null),
            new EligibilityRule(AgeCategory.ROBO_MINDS,      5.0, 45.0, 45.0, 45.0)
        ));

        // ── Combat / RoboWar (each weight class is its own sport) ───────────────────
        SPORT_RULES.put("ROBOWAR_1_5KG", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, 1.5, null, null, null),
            new EligibilityRule(AgeCategory.ROBO_MINDS,      1.5, null, null, null)
        ));
        SPORT_RULES.put("ROBOWAR_8KG", List.of(
            new EligibilityRule(AgeCategory.ROBO_MINDS, 8.0, null, null, null)
        ));
        SPORT_RULES.put("ROBOWAR_15KG", List.of(
            new EligibilityRule(AgeCategory.ROBO_MINDS, 15.0, null, null, null)
        ));
        SPORT_RULES.put("ROBOWAR_30KG", List.of(
            new EligibilityRule(AgeCategory.ROBO_MINDS, 30.0, null, null, null)
        ));
        SPORT_RULES.put("ROBOWAR_60KG", List.of(
            new EligibilityRule(AgeCategory.ROBO_MINDS, 60.0, null, null, null)
        ));

        // ── Drone ────────────────────────────────────────────────────────────────────
        SPORT_RULES.put("DRONE_RACING", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, null, null, null, null),
            new EligibilityRule(AgeCategory.ROBO_MINDS,      null, null, null, null)
        ));
        SPORT_RULES.put("DRONE_SOCCER", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, null, 30.0, 30.0, 30.0),
            new EligibilityRule(AgeCategory.ROBO_MINDS,      null, null, null, null)
        ));

        // ── RC Vehicle ───────────────────────────────────────────────────────────────
        SPORT_RULES.put("RC_RACING", List.of(
            new EligibilityRule(AgeCategory.YOUNG_ENGINEERS, null, null, null, null),
            new EligibilityRule(AgeCategory.ROBO_MINDS,      null, null, null, null)
        ));

        // ── Aircraft ─────────────────────────────────────────────────────────────────
        SPORT_RULES.put("AEROMODELLING", List.of(
            new EligibilityRule(AgeCategory.ROBO_MINDS, null, null, null, null)
        ));

        // ── Innovation ───────────────────────────────────────────────────────────────
        SPORT_RULES.put("PROJECT_BASED", List.of(
            new EligibilityRule(AgeCategory.JUNIOR_INNOVATORS, null, null, null, null)
        ));
    }

    /**
     * Returns the list of age categories this robot qualifies for, in order
     * (JUNIOR_INNOVATORS → YOUNG_ENGINEERS → ROBO_MINDS).
     */
    public List<AgeCategory> computeEligibleCategories(
            String sport,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm) {

        List<EligibilityRule> rules = SPORT_RULES.getOrDefault(sport, List.of());
        List<AgeCategory> eligible = new ArrayList<>();

        for (EligibilityRule rule : rules) {
            if (withinLimit(weightKg, rule.maxWeightKg())
                    && withinLimit(lengthCm, rule.maxLengthCm())
                    && withinLimit(widthCm, rule.maxWidthCm())
                    && withinLimit(heightCm, rule.maxHeightCm())) {
                eligible.add(rule.category());
            }
        }

        return eligible;
    }

    /** Primary category — first eligible (most junior), or null if none. */
    public AgeCategory primaryCategory(
            String sport,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm) {

        List<AgeCategory> list = computeEligibleCategories(sport, weightKg, lengthCm, widthCm, heightCm);
        return list.isEmpty() ? null : list.get(0);
    }

    /** Derive the weight-class label from the sport key for RoboWar sports. */
    public static String weightClassFromSport(String sport) {
        return switch (sport) {
            case "ROBOWAR_1_5KG" -> "1.5KG";
            case "ROBOWAR_8KG"   -> "8KG";
            case "ROBOWAR_15KG"  -> "15KG";
            case "ROBOWAR_30KG"  -> "30KG";
            case "ROBOWAR_60KG"  -> "60KG";
            default              -> null;
        };
    }

    private boolean withinLimit(Double value, Double limit) {
        return limit == null || value == null || value <= limit;
    }

    record EligibilityRule(AgeCategory category, Double maxWeightKg,
                           Double maxLengthCm, Double maxWidthCm, Double maxHeightCm) {}
}
