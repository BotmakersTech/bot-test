// ======================================================
// DTO
// LineupRequest.java
// ======================================================

package com.botleague.backend.events.dto;

import java.util.UUID;

import com.botleague.backend.events.enums.LineupRole;

import jakarta.validation.constraints.NotNull;

public class LineupRequest {

    // SportRegistration.id — the robot's competition entry
    @NotNull
    private UUID sportRegistrationId;

    // Robot.id — must match the robot on the SportRegistration
    @NotNull
    private UUID robotId;

    // TeamMembership.id — the person being assigned (not TeamMember.id)
    @NotNull
    private UUID teamMembershipId;

    // OPERATOR / CO_OPERATOR / TECHNICIAN / PRESENTER / BUILDER
    @NotNull
    private LineupRole lineupRole;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getSportRegistrationId() {
        return sportRegistrationId;
    }

    public void setSportRegistrationId(UUID sportRegistrationId) {
        this.sportRegistrationId = sportRegistrationId;
    }

    public UUID getRobotId() {
        return robotId;
    }

    public void setRobotId(UUID robotId) {
        this.robotId = robotId;
    }

    public UUID getTeamMembershipId() {
        return teamMembershipId;
    }

    public void setTeamMembershipId(UUID teamMembershipId) {
        this.teamMembershipId = teamMembershipId;
    }

    public LineupRole getLineupRole() {
        return lineupRole;
    }

    public void setLineupRole(LineupRole lineupRole) {
        this.lineupRole = lineupRole;
    }
}