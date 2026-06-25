package com.botleague.backend.events.enums;

/**
 * The KIND of competition. Drives which constraints matter and how the UI
 * collects them. The human-readable name still lives in EventSports.sport.
 */
public enum CompetitionType {
    PROJECT_BASED,       // judged project, usually no physical limits
    PLUG_N_PLAY,         // e.g. Race + Soccer with a single bot
    LINE_FOLLOWER,       // autonomous line following
    MANUAL_TASK,         // driver-controlled task
    THEME_BASED_TASK,    // theme / mission based tasking
    ROBO_SUMO,
    ROBO_SOCCER,
    ROBO_WAR,            // combat; often several weight classes
    DRONE_RACING,        // FPV / line-of-sight
    DRONE_SOCCER,
    RC_RACING,           // nitro / electric, scale classes
    AEROMODELLING,
    OTHER
}