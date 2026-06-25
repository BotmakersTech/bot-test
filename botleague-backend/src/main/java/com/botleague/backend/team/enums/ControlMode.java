package com.botleague.backend.team.enums;

/**
 * How the robot is connected/driven - the "Control mode" in the create form.
 * Separate from ControlType (MANUAL / AUTONOMOUS / HYBRID), which is the autonomy axis.
 * ANY is used only by EventSports when a competition allows either mode.
 */
public enum ControlMode {
    WIRED,
    WIRELESS,
    ANY
}