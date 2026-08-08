package com.botleague.backend.matches.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "match_judge_assignments",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"match_id", "judge_user_id"})
    },
    indexes = {
        @Index(name = "idx_mja_match", columnList = "match_id"),
        @Index(name = "idx_mja_judge", columnList = "judge_user_id")
    }
)
public class MatchJudgeAssignment {

    @Id
    private UUID id;

    @Column(name = "match_id", nullable = false)
    private UUID matchId;

    @Column(name = "judge_user_id", nullable = false)
    private UUID judgeUserId;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        this.assignedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getMatchId() { return matchId; }
    public void setMatchId(UUID matchId) { this.matchId = matchId; }
    public UUID getJudgeUserId() { return judgeUserId; }
    public void setJudgeUserId(UUID judgeUserId) { this.judgeUserId = judgeUserId; }
    public UUID getAssignedBy() { return assignedBy; }
    public void setAssignedBy(UUID assignedBy) { this.assignedBy = assignedBy; }
    public LocalDateTime getAssignedAt() { return assignedAt; }
}
