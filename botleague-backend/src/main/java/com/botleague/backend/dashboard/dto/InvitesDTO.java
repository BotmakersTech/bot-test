package com.botleague.backend.dashboard.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.team.enums.TeamInviteStatus;

public class InvitesDTO {

    private UUID inviteId;
    private UUID teamId;
    private String teamName;     // IMPORTANT for UI
    private UUID invitedBy;
    private String invitedByName; // Optional but useful
    private TeamInviteStatus status;
    private LocalDateTime expiresAt;

    // Getters & Setters

    public UUID getInviteId() {
        return inviteId;
    }

    public void setInviteId(UUID inviteId) {
        this.inviteId = inviteId;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public UUID getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(UUID invitedBy) {
        this.invitedBy = invitedBy;
    }

    public String getInvitedByName() {
        return invitedByName;
    }

    public void setInvitedByName(String invitedByName) {
        this.invitedByName = invitedByName;
    }

    public TeamInviteStatus getStatus() {
        return status;
    }

    public void setStatus(TeamInviteStatus status) {
        this.status = status;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}