package com.botleague.backend.ranking.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.events.enums.AgeCategory;

import jakarta.persistence.*;

/**
 * Accumulated ranking record — one row per (team|user, sport, scope, season).
 *
 * scope values:  "NATIONAL" | "STATE" | "EVENT"
 * entityType:    "TEAM" | "USER"
 *
 * Points are updated by admins or automatically when match results are recorded.
 */
@Entity
@Table(
    name = "rankings",
    indexes = {
        @Index(name = "idx_rank_pool",   columnList = "category, sport, weight_class, scope"),
        @Index(name = "idx_rank_team",   columnList = "team_id"),
        @Index(name = "idx_rank_robot",  columnList = "robot_id"),
        @Index(name = "idx_rank_user",   columnList = "user_id"),
        @Index(name = "idx_rank_event",  columnList = "event_id"),
        @Index(name = "idx_rank_points", columnList = "total_points DESC"),
        @Index(name = "idx_rank_sport",  columnList = "sport, scope, weight_class")
    }
)
public class Ranking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ── Who ───────────────────────────────────────────────────

    @Column(name = "entity_type", nullable = false, length = 10)
    private String entityType;     // "TEAM" or "USER"

    /** The ranked entity for TEAM-scope rows — one Ranking row per robot per pool. Null for USER rows. */
    @Column(name = "robot_id")
    private UUID robotId;

    @Column(name = "robot_name", length = 120)
    private String robotName;      // denormalized display snapshot

    /** Denormalized — the robot's owning team. */
    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;    // team name or user's full name

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(length = 20)
    private String state;          // for state-scope filtering

    @Column(length = 60)
    private String city;

    // ── What ──────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private AgeCategory category;

    @Column(nullable = false, length = 80)
    private String sport;          // competition type name, e.g. "LINE_FOLLOWER"

    @Column(nullable = false, length = 20)
    private String scope;          // "NATIONAL", "STATE", "EVENT"

    @Column(name = "event_id")
    private UUID eventId;          // null for NATIONAL / STATE

    /** Weight class within the sport (e.g. "1.5KG", "3KG", "15KG"). Null = open/any. */
    @Column(name = "weight_class", length = 20)
    private String weightClass;

    @Column(nullable = false, length = 10)
    private String season;         // e.g. "2025-26"

    // ── Stats ─────────────────────────────────────────────────

    @Column(name = "total_points", nullable = false)
    private int totalPoints = 0;

    @Column(name = "events_played", nullable = false)
    private int eventsPlayed = 0;

    @Column(name = "matches_played", nullable = false)
    private int matchesPlayed = 0;

    @Column(nullable = false)
    private int wins = 0;

    @Column(nullable = false)
    private int losses = 0;

    /** Computed on save: wins / matchesPlayed * 100 (stored for fast sort). */
    @Column(name = "win_percentage")
    private double winPercentage = 0.0;

    @Column(name = "gold_medals", nullable = false)
    private int goldMedals = 0;

    @Column(name = "silver_medals", nullable = false)
    private int silverMedals = 0;

    @Column(name = "bronze_medals", nullable = false)
    private int bronzeMedals = 0;

    // ── Rank tracking ─────────────────────────────────────────

    /** Current computed rank within the pool (recalculated after each update). */
    @Column(name = "current_rank")
    private Integer currentRank;

    /** Rank from the previous recalculation (used to show +/- change). */
    @Column(name = "previous_rank")
    private Integer previousRank;

    /** Last event this team participated in. */
    @Column(name = "last_event_id")
    private UUID lastEventId;

    @Column(name = "last_event_date")
    private java.time.LocalDate lastEventDate;

    // ── Audit ─────────────────────────────────────────────────

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * updateGlobalRankings()/fullRecalculate() do read-modify-write
     * accumulation (totalPoints += x etc.) — without this, two concurrent
     * admin-triggered pushes/recalcs for the same robot can lose an update
     * (part of audit finding B-6).
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt   = now;
        this.lastUpdated = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    // ── getters / setters ─────────────────────────────────────

    public UUID getId() { return id; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public AgeCategory getCategory() { return category; }
    public void setCategory(AgeCategory category) { this.category = category; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public int getEventsPlayed() { return eventsPlayed; }
    public void setEventsPlayed(int eventsPlayed) { this.eventsPlayed = eventsPlayed; }

    public int getWins() { return wins; }
    public void setWins(int wins) { this.wins = wins; }

    public int getLosses() { return losses; }
    public void setLosses(int losses) { this.losses = losses; }

    public int getGoldMedals() { return goldMedals; }
    public void setGoldMedals(int goldMedals) { this.goldMedals = goldMedals; }

    public int getSilverMedals() { return silverMedals; }
    public void setSilverMedals(int silverMedals) { this.silverMedals = silverMedals; }

    public int getBronzeMedals() { return bronzeMedals; }
    public void setBronzeMedals(int bronzeMedals) { this.bronzeMedals = bronzeMedals; }

    public String getWeightClass()                      { return weightClass; }
    public void setWeightClass(String v)                { this.weightClass = v; }
    public int getMatchesPlayed()                       { return matchesPlayed; }
    public void setMatchesPlayed(int v)                 { this.matchesPlayed = v; }
    public double getWinPercentage()                    { return winPercentage; }
    public void setWinPercentage(double v)              { this.winPercentage = v; }
    public Integer getCurrentRank()                     { return currentRank; }
    public void setCurrentRank(Integer v)               { this.currentRank = v; }
    public Integer getPreviousRank()                    { return previousRank; }
    public void setPreviousRank(Integer v)              { this.previousRank = v; }
    public UUID getLastEventId()                        { return lastEventId; }
    public void setLastEventId(UUID v)                  { this.lastEventId = v; }
    public java.time.LocalDate getLastEventDate()       { return lastEventDate; }
    public void setLastEventDate(java.time.LocalDate v) { this.lastEventDate = v; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public LocalDateTime getCreatedAt()   { return createdAt; }
    public Long getVersion()              { return version; }
}
