package com.botleague.backend.matches.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A discretionary point award (or penalty) against one registration's
 * standing in a single sport's leaderboard — not tied to a specific match
 * (contrast with the separate, per-match ranking_point_transactions table
 * used by the unrelated global-ranking system). LeaderboardService sums
 * these per registrationId and folds the total into pointsFor.
 */
@Entity
@Table(
    name = "ranking_bonus_points",
    indexes = {
        @Index(name = "idx_rbp_event_sport",  columnList = "event_sport_id"),
        @Index(name = "idx_rbp_registration", columnList = "registration_id")
    }
)
public class RankingBonusPoint {

    @Id
    private UUID id;

    @Column(name = "event_sport_id", nullable = false)  private UUID eventSportId;
    @Column(name = "registration_id", nullable = false) private UUID registrationId;

    @Column(nullable = false) private Integer points;
    @Column private String reason;

    @Column(name = "awarded_by") private UUID awardedBy;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = LocalDateTime.now();
    }

    public UUID getId()                            { return id; }
    public void setId(UUID id)                      { this.id = id; }
    public UUID getEventSportId()                   { return eventSportId; }
    public void setEventSportId(UUID v)             { this.eventSportId = v; }
    public UUID getRegistrationId()                 { return registrationId; }
    public void setRegistrationId(UUID v)           { this.registrationId = v; }
    public Integer getPoints()                      { return points; }
    public void setPoints(Integer v)                { this.points = v; }
    public String getReason()                       { return reason; }
    public void setReason(String v)                 { this.reason = v; }
    public UUID getAwardedBy()                      { return awardedBy; }
    public void setAwardedBy(UUID v)                { this.awardedBy = v; }
    public LocalDateTime getCreatedAt()             { return createdAt; }
}
