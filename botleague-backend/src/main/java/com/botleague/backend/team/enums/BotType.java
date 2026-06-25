package com.botleague.backend.team.enums;

/**
 * Type of bot/vehicle a team brings to a sport.
 *
 * Covers all competition categories:
 *
 *  ROBOT      → RoboWar, RoboSumo, Line Follower, Theme-based Tasking,
 *               Plug N Play, Manual Task, Robo Soccer
 *  DRONE      → Drone Racing, Drone Soccer, FPV Drone Racing
 *  RC_CAR     → RC Racing, Robo Racing
 *  AEROMODEL  → Aeromodelling
 */
public enum BotType {

    /**
     * Ground robot (combat, sumo, line following, soccer, task-based)
     */
    ROBOT,

    /**
     * Aerial drone (racing, soccer, FPV)
     */
    DRONE,

    /**
     * Radio-controlled car (electric or nitro)
     */
    RC_CAR,

    /**
     * Fixed-wing or free-flight aeromodel
     */
    AEROMODEL
}