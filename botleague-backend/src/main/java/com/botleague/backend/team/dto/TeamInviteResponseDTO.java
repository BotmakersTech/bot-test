package com.botleague.backend.team.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.team.enums.TeamInviteStatus;

public class TeamInviteResponseDTO {

    private UUID inviteId;
    private UUID teamId;
    private String teamName;
    private String teamCode;
    private UUID invitedUserId;
    private UUID invitedBy;
    private String inviterName;
    private TeamInviteStatus status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private boolean wasRejoin;

    public TeamInviteResponseDTO() {}

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getInviteId() { return inviteId; }
    public void setInviteId(UUID inviteId) { this.inviteId = inviteId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getTeamCode() { return teamCode; }
    public void setTeamCode(String teamCode) { this.teamCode = teamCode; }

    public UUID getInvitedUserId() { return invitedUserId; }
    public void setInvitedUserId(UUID invitedUserId) { this.invitedUserId = invitedUserId; }

    public UUID getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UUID invitedBy) { this.invitedBy = invitedBy; }

    public String getInviterName() { return inviterName; }
    public void setInviterName(String inviterName) { this.inviterName = inviterName; }

    public TeamInviteStatus getStatus() { return status; }
    public void setStatus(TeamInviteStatus status) { this.status = status; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isWasRejoin() { return wasRejoin; }
    public void setWasRejoin(boolean wasRejoin) { this.wasRejoin = wasRejoin; }
}
