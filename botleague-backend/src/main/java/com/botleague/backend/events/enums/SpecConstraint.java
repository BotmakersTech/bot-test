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
    SCALE,
    /**
     * Robot diameter must be ≤ the sport's diameter (Drone Soccer — 12.5 cm at
     * Ignite, 20 cm at Inferno and Apex). Drone Soccer rows carry no
     * length/width/height at all, so filing it under DIMENSION meant nothing
     * was ever checked and any drone could enter; the real spec lives at
     * LeagueSport.extraSpecs["diameterCm"] and rides onto the techsport as
     * EventSports.extraRules["diameterCm"], with the robot's own value at
     * Robot.attributes["diameterCm"] — the same shape SCALE already uses.
     */
    DIAMETER
}
