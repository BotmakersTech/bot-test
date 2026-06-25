package com.botleague.backend.ranking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One entry per team per event sport.
 *
 * Tracks cumulative performance within a single event sport competition
 * (e.g., "Team Alpha in Delhi Robotics League - RoboWar 1.5 KG").
 *
 * Finalized = true once the sport bracket is fully complete.
 * On finalisation, global_rankings are updated by RankingEngineService.
 */
@Entity
@Table(
    name = "event_leaderboard_entries",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_leaderboard_team_sport",
        columnNames = {"event_sport_id", "team_id"}
    ),
    indexes = {
        @Index(name = "idx_lb_event_sport", columnList = "event_sport_id"),
        @Index(name = "idx_lb_team",        columnList = "team_id"),
        @Index(name = "idx_lb_points",      columnList = "event_sport_id, points_earned DESC"),
        @Index(name = "idx_lb_finalized",   columnList = "event_sport_id, is_finalized")
    }
)
public class EventLeaderboardEntry {

    @Id
    private UUID id;

    // ── Context ─────────────────────────────────────────────────────────────

    @Column(name = "event_id",       nullable = false) private UUID eventId;
    @Column(name = "event_sport_id", nullable = false) private UUID eventSportId;
    @Column(name = "team_id",        nullable = false) private UUID teamId;

    /** Display snapshot — denormalised so queries are fast. */
    @Column(name = "team_name",   length = 120) private String teamName;
    @Column(name = "robot_name",  length = 120) private String robotName;

    // ── Classification ───────────────────────────────────────────────────────

    @Column(name = "sport",          length = 80)  private String sport;
    @Column(name = "age_group",      length = 40)  private String ageGroup;
    @Column(name = "weight_class",   length = 40)  private String weightClass;

    // ── Event-level stats ────────────────────────────────────────────────────

    @Column(name = "points_earned",   nullable = false) private Integer pointsEarned   = 0;
    @Column(name = "matches_played",  nullable = false) private Integer matchesPlayed  = 0;
    @Column(name = "wins",            nullable = false) private Integer wins            = 0;
    @Column(name = "losses",          nullable = false) private Integer losses          = 0;

    /** Final position in this event sport (1 = champion, null = still in progress). */
    @Column(name = "event_rank") private Integer eventRank;

    /** True once the whole bracket is complete and global rankings have been updated. */
    @Column(name = "is_finalized", nullable = false) private Boolean isFinalized = false;

    // ── Timestamps ───────────────────────────────────────────────────────────

    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at")                   private LocalDateTime updatedAt;

    @PrePersist  public void onCreate() { if (id==null) id=UUID.randomUUID(); createdAt=updatedAt=LocalDateTime.now(); }
    @PreUpdate   public void onUpdate() { updatedAt = LocalDateTime.now(); }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId()                    { return id; }
    public void setId(UUID id)             { this.id = id; }
    public UUID getEventId()               { return eventId; }
    public void setEventId(UUID v)         { this.eventId = v; }
    public UUID getEventSportId()          { return eventSportId; }
    public void setEventSportId(UUID v)    { this.eventSportId = v; }
    public UUID getTeamId()                { return teamId; }
    public void setTeamId(UUID v)          { this.teamId = v; }
    public String getTeamName()            { return teamName; }
    public void setTeamName(String v)      { this.teamName = v; }
    public String getRobotName()           { return robotName; }
    public void setRobotName(String v)     { this.robotName = v; }
    public String getSport()               { return sport; }
    public void setSport(String v)         { this.sport = v; }
    public String getAgeGroup()            { return ageGroup; }
    public void setAgeGroup(String v)      { this.ageGroup = v; }
    public String getWeightClass()         { return weightClass; }
    public void setWeightClass(String v)   { this.weightClass = v; }
    public Integer getPointsEarned()       { return pointsEarned; }
    public void setPointsEarned(Integer v) { this.pointsEarned = v; }
    public Integer getMatchesPlayed()      { return matchesPlayed; }
    public void setMatchesPlayed(Integer v){ this.matchesPlayed = v; }
    public Integer getWins()               { return wins; }
    public void setWins(Integer v)         { this.wins = v; }
    public Integer getLosses()             { return losses; }
    public void setLosses(Integer v)       { this.losses = v; }
    public Integer getEventRank()          { return eventRank; }
    public void setEventRank(Integer v)    { this.eventRank = v; }
    public Boolean getIsFinalized()        { return isFinalized; }
    public void setIsFinalized(Boolean v)  { this.isFinalized = v; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
    public LocalDateTime getUpdatedAt()    { return updatedAt; }
}
