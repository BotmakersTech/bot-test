package com.botleague.backend.events.enums;

/**
 * The physical spec(s) that actually gate robot registration for a given
 * (league, sport) pairing. Everything else on the EventSports row is
 * informational only — see SportSpecPolicy for the matrix and the rationale.
 */
public enum SpecConstraint {
    /** Robot weight must be ≤ the sport's weight limit / weight-class ceiling. */
    WEIGHT,
    /** Robot length/width/height must each be ≤ the sport's limit (when the robot provides one). */
    DIMENSION,
    /** Robot scale must equal the sport's required scale (RC Racing Car). */
    SCALE
}
