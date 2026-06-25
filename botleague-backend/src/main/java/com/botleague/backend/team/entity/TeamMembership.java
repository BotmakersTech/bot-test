package com.botleague.backend.team.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;

@Entity
@Table(
        name = "team_memberships",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"team_id", "user_id"})
        }
)
public class TeamMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_in_team", nullable = false)
    private TeamRole  roleInTeam; // CAPTAIN / MEMBER

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamMembershipStatus status;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
    
    @Column(name = "left_at")
    private LocalDateTime leftAt;

    public LocalDateTime getLeftAt() {
		return leftAt;
	}

	public void setLeftAt(LocalDateTime leftAt) {
		this.leftAt = leftAt;
	}

	public void setJoinedAt(LocalDateTime joinedAt) {
		this.joinedAt = joinedAt;
	}

	public TeamMembership() {}

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        if (status == null) {
            status = TeamMembershipStatus.ACTIVE;
        }
    }

    // getters and setters

    public UUID getId() {
        return id;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public TeamRole  getRoleInTeam() {
        return roleInTeam;
    }

    public void setRoleInTeam(TeamRole  roleInTeam) {
        this.roleInTeam = roleInTeam;
    }

    public TeamMembershipStatus getStatus() {
        return status;
    }

    public void setStatus(TeamMembershipStatus  status) {
        this.status = status;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
}