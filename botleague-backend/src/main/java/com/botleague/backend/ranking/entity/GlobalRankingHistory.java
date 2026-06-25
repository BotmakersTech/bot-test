package com.botleague.backend.ranking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Snapshot of rank changes whenever global rankings are recalculated.
 * Allows ranking history queries ("where was Team Alpha ranked last month?")
 * and rank-change notifications (moved up 3 positions).
 */
@Entity
@Table(
    name = "global_ranking_history",
    indexes = {
        @Index(name = "idx_grh_team",   columnList = "team_id"),
        @Index(name = "idx_grh_sport",  columnList = "sport, age_group, weight_class"),
        @Index(name = "idx_grh_event",  columnList = "triggered_by_event_id"),
        @Index(name = "idx_grh_time",   columnList = "recorded_at DESC")
    }
)
public class GlobalRankingHistory {

    @Id
    private UUID id;

    @Column(name = "team_id",          nullable = false) private UUID   teamId;
    @Column(name = "team_name",        length = 120)     private String teamName;
    @Column(name = "sport",            length = 80)      private String sport;
    @Column(name = "age_group",        length = 40)      private String ageGroup;
    @Column(name = "weight_class",     length = 40)      private String weightClass;

    @Column(name = "old_rank")         private Integer oldRank;
    @Column(name = "new_rank")         private Integer newRank;
    @Column(name = "points_before")    private Integer pointsBefore;
    @Column(name = "points_after")     private Integer pointsAfter;
    @Column(name = "rank_delta")       private Integer rankDelta;      // positive = moved up

    /** The event that triggered this recalculation (null = manual). */
    @Column(name = "triggered_by_event_id") private UUID triggeredByEventId;

    @Column(name = "recorded_at", nullable = false) private LocalDateTime recordedAt;

    @PrePersist public void onCreate() { if (id==null) id=UUID.randomUUID(); recordedAt=LocalDateTime.now(); }

    // Getters & Setters
    public UUID getId()                         { return id; }
    public void setId(UUID id)                  { this.id = id; }
    public UUID getTeamId()                     { return teamId; }
    public void setTeamId(UUID v)               { this.teamId = v; }
    public String getTeamName()                 { return teamName; }
    public void setTeamName(String v)           { this.teamName = v; }
    public String getSport()                    { return sport; }
    public void setSport(String v)              { this.sport = v; }
    public String getAgeGroup()                 { return ageGroup; }
    public void setAgeGroup(String v)           { this.ageGroup = v; }
    public String getWeightClass()              { return weightClass; }
    public void setWeightClass(String v)        { this.weightClass = v; }
    public Integer getOldRank()                 { return oldRank; }
    public void setOldRank(Integer v)           { this.oldRank = v; }
    public Integer getNewRank()                 { return newRank; }
    public void setNewRank(Integer v)           { this.newRank = v; }
    public Integer getPointsBefore()            { return pointsBefore; }
    public void setPointsBefore(Integer v)      { this.pointsBefore = v; }
    public Integer getPointsAfter()             { return pointsAfter; }
    public void setPointsAfter(Integer v)       { this.pointsAfter = v; }
    public Integer getRankDelta()               { return rankDelta; }
    public void setRankDelta(Integer v)         { this.rankDelta = v; }
    public UUID getTriggeredByEventId()         { return triggeredByEventId; }
    public void setTriggeredByEventId(UUID v)   { this.triggeredByEventId = v; }
    public LocalDateTime getRecordedAt()        { return recordedAt; }
}
