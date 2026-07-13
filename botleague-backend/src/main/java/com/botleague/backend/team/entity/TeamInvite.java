package com.botleague.backend.team.entity;

import com.botleague.backend.team.enums.TeamInviteStatus;
import com.botleague.backend.team.enums.TeamRole;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "team_invites",
        indexes = {
                @Index(name = "idx_team_invites_team", columnList = "team_id"),
                @Index(name = "idx_team_invites_user", columnList = "invited_user_id"),
                @Index(name = "idx_team_invites_status", columnList = "status"),
                @Index(
                        name = "idx_team_invites_team_user_status",
                        columnList = "team_id, invited_user_id, status"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_team_invite_pending",
                        columnNames = {
                                "team_id",
                                "invited_user_id",
                                "status"
                        }
                )
        }
)
public class TeamInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "team_id", nullable = false, updatable = false)
    private UUID teamId;

    @Column(name = "invited_user_id", nullable = false, updatable = false)
    private UUID invitedUserId;

    @Column(name = "invited_by", nullable = false, updatable = false)
    private UUID invitedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TeamInviteStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "intended_role", length = 20)
    private TeamRole intendedRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public TeamInvite() {}

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (expiresAt == null) {
            expiresAt = now.plusDays(7);
        }

        if (status == null) {
            status = TeamInviteStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public UUID getTeamId() {
		return teamId;
	}

	public void setTeamId(UUID teamId) {
		this.teamId = teamId;
	}

	public UUID getInvitedUserId() {
		return invitedUserId;
	}

	public void setInvitedUserId(UUID invitedUserId) {
		this.invitedUserId = invitedUserId;
	}

	public UUID getInvitedBy() {
		return invitedBy;
	}

	public void setInvitedBy(UUID invitedBy) {
		this.invitedBy = invitedBy;
	}

	public TeamInviteStatus getStatus() {
		return status;
	}

	public void setStatus(TeamInviteStatus status) {
		this.status = status;
	}

	public TeamRole getIntendedRole() {
		return intendedRole;
	}

	public void setIntendedRole(TeamRole intendedRole) {
		this.intendedRole = intendedRole;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(LocalDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}

    // getters/setters
    
    
}