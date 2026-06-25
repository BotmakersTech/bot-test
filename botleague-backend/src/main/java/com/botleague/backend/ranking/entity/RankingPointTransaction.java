package com.botleague.backend.ranking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable audit record of every point award.
 *
 * Written once per team per match result.
 * Used to:
 *  - Recalculate rankings from scratch if scores change
 *  - Display per-event point breakdown to teams
 *  - Investigate ranking disputes
 */
@Entity
@Table(
    name = "ranking_point_transactions",
    indexes = {
        @Index(name = "idx_rpt_team",      columnList = "team_id"),
        @Index(name = "idx_rpt_match",     columnList = "match_id"),
        @Index(name = "idx_rpt_sport",     columnList = "event_sport_id"),
        @Index(name = "idx_rpt_event",     columnList = "event_id"),
        @Index(name = "idx_rpt_created",   columnList = "created_at DESC")
    }
)
public class RankingPointTransaction {

    @Id
    private UUID id;

    // ── Context ─────────────────────────────────────────────────────────────

    @Column(name = "team_id",        nullable = false) private UUID    teamId;
    @Column(name = "event_id",       nullable = false) private UUID    eventId;
    @Column(name = "match_id",       nullable = false) private UUID    matchId;
    @Column(name = "event_sport_id", nullable = false) private UUID    eventSportId;

    // ── Classification ───────────────────────────────────────────────────────

    @Column(name = "sport",        length = 80) private String sport;
    @Column(name = "age_group",    length = 40) private String ageGroup;
    @Column(name = "weight_class", length = 40) private String weightClass;

    // ── Result ───────────────────────────────────────────────────────────────

    /** RoundType name: ROUND_1, QUARTER_FINAL, SEMI_FINAL, THIRD_PLACE, FINAL, BYE, CANCELLED */
    @Column(name = "round_type",     nullable = false, length = 20) private String roundType;
    @Column(name = "is_winner",      nullable = false)              private Boolean isWinner;
    @Column(name = "points_awarded", nullable = false)              private Integer pointsAwarded;

    /** Registration ID of the opponent for head-to-head records. */
    @Column(name = "opponent_registration_id") private UUID opponentRegistrationId;

    // ── Voiding (for corrections) ─────────────────────────────────────────────

    /** If true, this transaction has been reversed (score correction etc). */
    @Column(name = "is_voided", nullable = false) private Boolean isVoided = false;

    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    @PrePersist public void onCreate() { if (id==null) id=UUID.randomUUID(); createdAt=LocalDateTime.now(); }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId()                              { return id; }
    public void setId(UUID id)                       { this.id = id; }
    public UUID getTeamId()                          { return teamId; }
    public void setTeamId(UUID v)                    { this.teamId = v; }
    public UUID getEventId()                         { return eventId; }
    public void setEventId(UUID v)                   { this.eventId = v; }
    public UUID getMatchId()                         { return matchId; }
    public void setMatchId(UUID v)                   { this.matchId = v; }
    public UUID getEventSportId()                    { return eventSportId; }
    public void setEventSportId(UUID v)              { this.eventSportId = v; }
    public String getSport()                         { return sport; }
    public void setSport(String v)                   { this.sport = v; }
    public String getAgeGroup()                      { return ageGroup; }
    public void setAgeGroup(String v)                { this.ageGroup = v; }
    public String getWeightClass()                   { return weightClass; }
    public void setWeightClass(String v)             { this.weightClass = v; }
    public String getRoundType()                     { return roundType; }
    public void setRoundType(String v)               { this.roundType = v; }
    public Boolean getIsWinner()                     { return isWinner; }
    public void setIsWinner(Boolean v)               { this.isWinner = v; }
    public Integer getPointsAwarded()                { return pointsAwarded; }
    public void setPointsAwarded(Integer v)          { this.pointsAwarded = v; }
    public UUID getOpponentRegistrationId()          { return opponentRegistrationId; }
    public void setOpponentRegistrationId(UUID v)    { this.opponentRegistrationId = v; }
    public Boolean getIsVoided()                     { return isVoided; }
    public void setIsVoided(Boolean v)               { this.isVoided = v; }
    public LocalDateTime getCreatedAt()              { return createdAt; }
}
