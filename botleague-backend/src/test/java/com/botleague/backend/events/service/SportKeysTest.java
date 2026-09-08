package com.botleague.backend.events.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * SportKeys is what registration uses to decide whether a robot was built for
 * the competition it's entering. Two naming worlds are live in the same columns
 * today — the catalog display name ("Robo Sumo") and legacy keys ("ROBO_SUMO",
 * "ROBOWAR_1_5KG") — and every previous attempt to match them with a name
 * allowlist drifted into a registration outage. These cases pin the folding.
 */
class SportKeysTest {

    @Test
    @DisplayName("catalog display name and legacy key fold to the same sport")
    void catalogNameMatchesLegacyKey() {
        assertTrue(SportKeys.sameSport("ROBOWAR_1_5KG", "Robo War"));
        assertTrue(SportKeys.sameSport("ROBOWAR_60KG", "Robo War"));
        assertTrue(SportKeys.sameSport("ROBO_WAR_OPEN", "Robo War"));
        assertTrue(SportKeys.sameSport("ROBO_SUMO", "Robo Sumo"));
        assertTrue(SportKeys.sameSport("LINE_FOLLOWER_AUTO", "Line Follower"));
        assertTrue(SportKeys.sameSport("RC_RACING", "RC Racing Car"));
        assertTrue(SportKeys.sameSport("ROBO_RACE", "Robo Race"));
        assertTrue(SportKeys.sameSport("ROBO_SOCCER", "Robo Soccer"));
        // The regression that took Drone Soccer registration down entirely.
        assertTrue(SportKeys.sameSport("DRONE_SOCCER", "Drone Soccer"));
    }

    @Test
    @DisplayName("sports that merely share a word stay distinct")
    void similarSportsDoNotCollide() {
        // Both are RC vehicles but gated on different specs — Robo Race on
        // weight/dimension, RC Racing Car on scale. Mixing them let Robo Race
        // robots appear in RC Racing Car registration.
        assertNotEquals(SportKeys.of("Robo Race"), SportKeys.of("RC Racing Car"));
        assertFalse(SportKeys.sameSport("ROBO_RACE", "RC Racing Car"));
        // "Drone Soccer" contains "Soccer" — it must not fold into Robo Soccer.
        assertNotEquals(SportKeys.of("Drone Soccer"), SportKeys.of("Robo Soccer"));
        // Legacy non-catalog sports must not be swallowed by the broad rules.
        assertNotEquals(SportKeys.of("PLUG_N_PLAY_SOCCER"), SportKeys.of("Robo Soccer"));
        assertNotEquals(SportKeys.of("DRONE_RACING"), SportKeys.of("Robo Race"));
    }

    @Test
    @DisplayName("spelling and punctuation never change the answer")
    void spellingIsIrrelevant() {
        assertEquals(SportKeys.of("Robo War"), SportKeys.of("robo-war"));
        assertEquals(SportKeys.of("Robo War"), SportKeys.of("ROBO_WAR"));
        assertEquals(SportKeys.of("RC Racing Car"), SportKeys.of("rc_racing_car"));
    }

    @Test
    @DisplayName("an empty or unknown sport never matches something real")
    void emptyNeverMatches() {
        assertFalse(SportKeys.sameSport(null, "Robo War"));
        assertFalse(SportKeys.sameSport("", "Robo War"));
        // An unrecognised sport still compares equal to itself rather than
        // colliding with a real one.
        assertTrue(SportKeys.sameSport("SOME_CUSTOM_SPORT", "Some Custom Sport"));
        assertFalse(SportKeys.sameSport("SOME_CUSTOM_SPORT", "Robo War"));
    }
}
