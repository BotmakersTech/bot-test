package com.botleague.backend.events.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.botleague.backend.events.enums.SpecConstraint;

/**
 * Pins the spec matrix for all 15 live (league, techsport) pairs.
 *
 * <p>The rule this protects: <b>a techsport validates its own spec and nothing
 * else</b>. Registration failures in this system have consistently come from a
 * sport being judged on a spec it never asked for (an RC Racing Car rejected on
 * weight class) or a spec going unchecked because it was filed under the wrong
 * constraint (Drone Soccer under DIMENSION, whose rows carry no length/width/
 * height at all, so a 100 cm drone entered a 12.5 cm competition).
 *
 * <p>The pairs and their gates come from the catalog:
 * Ignite runs Robo Sumo and Line Follower; Inferno and Apex swap those for
 * Robo War and RC Racing Car; all three run Robo Race, Robo Soccer and Drone Soccer.
 */
class SportSpecPolicyTest {

    private static final String IGNITE  = "JUNIOR_INNOVATORS";
    private static final String INFERNO = "YOUNG_ENGINEERS";
    private static final String APEX    = "ROBO_MINDS";

    private static Set<SpecConstraint> specs(String league, String sport) {
        return SportSpecPolicy.constraintsFor(league, sport);
    }

    @Test
    @DisplayName("Ignite — 5 techsports gate on exactly one spec each")
    void ignitePairs() {
        assertEquals(Set.of(SpecConstraint.WEIGHT),    specs(IGNITE, "Robo Sumo"));
        assertEquals(Set.of(SpecConstraint.WEIGHT),    specs(IGNITE, "Robo Race"));
        assertEquals(Set.of(SpecConstraint.WEIGHT),    specs(IGNITE, "Robo Soccer"));
        assertEquals(Set.of(SpecConstraint.DIAMETER),  specs(IGNITE, "Drone Soccer"));
        assertEquals(Set.of(SpecConstraint.DIMENSION), specs(IGNITE, "Line Follower"));
    }

    @Test
    @DisplayName("Inferno — Robo Race and Robo Soccer add dimension; RC Racing is scale-only")
    void infernoPairs() {
        assertEquals(Set.of(SpecConstraint.WEIGHT), specs(INFERNO, "Robo War"));
        assertEquals(Set.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION), specs(INFERNO, "Robo Race"));
        assertEquals(Set.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION), specs(INFERNO, "Robo Soccer"));
        assertEquals(Set.of(SpecConstraint.DIAMETER), specs(INFERNO, "Drone Soccer"));
        assertEquals(Set.of(SpecConstraint.SCALE),    specs(INFERNO, "RC Racing Car"));
    }

    @Test
    @DisplayName("Apex — same gates as Inferno")
    void apexPairs() {
        assertEquals(Set.of(SpecConstraint.WEIGHT), specs(APEX, "Robo War"));
        assertEquals(Set.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION), specs(APEX, "Robo Race"));
        assertEquals(Set.of(SpecConstraint.WEIGHT, SpecConstraint.DIMENSION), specs(APEX, "Robo Soccer"));
        assertEquals(Set.of(SpecConstraint.DIAMETER), specs(APEX, "Drone Soccer"));
        assertEquals(Set.of(SpecConstraint.SCALE),    specs(APEX, "RC Racing Car"));
    }

    @Test
    @DisplayName("a scale-gated sport is never judged on weight, and vice versa")
    void gatesDoNotLeak() {
        // AddSportModal writes the literal "Open" as weightClass for every
        // scale-gated techsport, so a weight check here would reject every robot.
        assertFalse(specs(APEX, "RC Racing Car").contains(SpecConstraint.WEIGHT));
        assertFalse(specs(APEX, "RC Racing Car").contains(SpecConstraint.DIMENSION));
        // Robo War rows carry dimension columns that are not its spec.
        assertFalse(specs(APEX, "Robo War").contains(SpecConstraint.DIMENSION));
        // Drone Soccer rows carry no L/W/H at all — diameter is the only gate.
        assertFalse(specs(IGNITE, "Drone Soccer").contains(SpecConstraint.DIMENSION));
    }

    @Test
    @DisplayName("legacy sport keys resolve to the same gate as the catalog name")
    void legacyKeysResolveIdentically() {
        assertEquals(specs(APEX, "Robo War"),     specs(APEX, "ROBOWAR_60KG"));
        assertEquals(specs(APEX, "RC Racing Car"), specs(APEX, "RC_RACING"));
        assertEquals(specs(IGNITE, "Drone Soccer"), specs(IGNITE, "DRONE_SOCCER"));
        assertEquals(specs(IGNITE, "Robo Sumo"),  specs(IGNITE, "ROBO_SUMO"));
    }

    @Test
    @DisplayName("an unknown pair falls back to weight/dimension/scale, never diameter")
    void unknownPairFallback() {
        Set<SpecConstraint> fallback = specs(APEX, "Some Future Sport");
        assertTrue(fallback.contains(SpecConstraint.WEIGHT));
        assertTrue(fallback.contains(SpecConstraint.DIMENSION));
        assertTrue(fallback.contains(SpecConstraint.SCALE));
        // Diameter is Drone Soccer's specific gate — applying it to an unknown
        // sport would reject robots for a spec that sport never asked for.
        assertFalse(fallback.contains(SpecConstraint.DIAMETER));
    }

    @Test
    @DisplayName("match format agrees with the spec matrix on every live sport")
    void matchFormatCoversEverySport() {
        // Timed-run sports.
        assertEquals("ROUND_TIME_TRIAL", MatchFormatPolicy.formatFor("Robo Race").name());
        assertEquals("ROUND_TIME_TRIAL", MatchFormatPolicy.formatFor("RC Racing Car").name());
        assertEquals("ROUND_TIME_TRIAL", MatchFormatPolicy.formatFor("Line Follower").name());
        // Bracket sports.
        assertEquals("BRACKET", MatchFormatPolicy.formatFor("Robo War").name());
        assertEquals("BRACKET", MatchFormatPolicy.formatFor("Robo Sumo").name());
        assertEquals("BRACKET", MatchFormatPolicy.formatFor("Robo Soccer").name());
        assertEquals("BRACKET", MatchFormatPolicy.formatFor("Drone Soccer").name());
        // Legacy keys route the same way.
        assertEquals("BRACKET", MatchFormatPolicy.formatFor("ROBOWAR_8KG").name());
        assertEquals("ROUND_TIME_TRIAL", MatchFormatPolicy.formatFor("RC_RACING").name());
    }
}
