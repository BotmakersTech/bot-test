// ======================================================
// DTO
// LineupResponse.java
// ======================================================

package com.botleague.backend.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.events.enums.LineupRole;
import com.botleague.backend.team.enums.TeamRole;

public class LineupResponse {

    private UUID lineupId;

    // SportRegistration.id — robot's competition entry this lineup belongs to
    private UUID sportRegistrationId;

    // Robot.id — direct person ↔ robot binding
    private UUID robotId;

    // TeamMembership.id — the person assigned
    private UUID teamMembershipId;

    // Enriched member info (resolved from TeamMembership → User)
    private UUID userId;
    private String memberName;      // firstName + lastName (or username as fallback)
    private String botleagueId;
    private TeamRole teamRole;      // CAPTAIN / MEMBER

    // Denorm fields from the registration (for fast reads without joins)
    private UUID eventId;
    private UUID eventSportId;
    private UUID teamId;

    // DRIVER / SECONDARY_DRIVER / BUILD_HEAD
    private LineupRole lineupRole;

    private Boolean isActive;

    private LocalDateTime createdAt;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getLineupId() {
        return lineupId;
    }

    public void setLineupId(UUID lineupId) {
        this.lineupId = lineupId;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }

    public TeamRole getTeamRole() { return teamRole; }
    public void setTeamRole(TeamRole teamRole) { this.teamRole = teamRole; }

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

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getEventSportId() {
        return eventSportId;
    }

    public void setEventSportId(UUID eventSportId) {
        this.eventSportId = eventSportId;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public LineupRole getLineupRole() {
        return lineupRole;
    }

    public void setLineupRole(LineupRole lineupRole) {
        this.lineupRole = lineupRole;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}