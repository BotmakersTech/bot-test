package com.botleague.backend.events.enums;

/**
 * Determines how registrations are handled per sport.
 *
 * TEAM_BASED  → One registration per team per event sport.
 *                Used for: Robo Soccer, Theme-based Tasking
 *                Lineup = multiple team members (players).
 *
 * ROBOT_BASED → A team may register multiple times per event sport,
 *                each with a different robot. Robot name must be unique
 *                within the event sport.
 *                Used for: RoboWar, Line Follower, RoboSumo,
 *                          Drone Racing, RC Racing, Aeromodelling, etc.
 *                Lineup = operator(s) assigned to that robot.
 */
public enum RegistrationType {

    TEAM_BASED,
    ROBOT_BASED
}