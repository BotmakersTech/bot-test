package com.botleague.backend.events.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.events.enums.LineupRole;

import jakarta.persistence.*;

/**
 * One team membership's role for ONE specific robot in ONE competition.
 *
 * Relationship model:
 *
 *   Team ──< SportRegistration ──< EventRegistrationLineup >── TeamMembership
 *                (robot entry)          (person + role)              (person)
 *                     │
 *                  robotId  ◄─── direct binding: membership ↔ robot is explicit
 *
 * Why robotId is here:
 *   Teams can register MULTIPLE robots in the same competition
 *   (Young Engineers / Robo Minds when maxBotsPerTeam is null).
 *   Each robot gets its own SportRegistration. Storing robotId here
 *   answers "who operates Robot X?" with a single indexed query.
 *
 * Unique constraint:
 *   (sport_registration_id, robot_id, team_membership_id)
 *   → one person can hold only ONE role per robot per competition.
 *   → the same person CAN operate different robots in different competitions.
 *
 * Role guide:
 *   OPERATOR     – primary driver/controller           (all robot sports)
 *   CO_OPERATOR  – second controller if format allows  (all robot sports)
 *   TECHNICIAN   – pit/maintenance, not controlling    (all robot sports)
 *   PRESENTER    – demonstrates the project            (Project Based only)
 *   BUILDER      – built the project                   (Project Based only)
 *   PLAYER / CAPTAIN / SUBSTITUTE – reserved for future non-robot sports
 */
@Entity
@Table(
    name = "event_registration_lineups",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_lineup_robot_membership",
            columnNames = { "sport_registration_id", "robot_id", "team_membership_id" }
        )
    },
    indexes = {
        @Index(name = "idx_lineup_sport_reg",    columnList = "sport_registration_id"),
        @Index(name = "idx_lineup_robot",         columnList = "robot_id"),
        @Index(name = "idx_lineup_membership",    columnList = "team_membership_id"),
        @Index(name = "idx_lineup_event_sport",   columnList = "event_sport_id"),
        @Index(name = "idx_lineup_team",          columnList = "team_id")
    }
)
public class EventRegistrationLineup {

    // =====================================================
    // PRIMARY KEY
    // =====================================================

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // =====================================================
    // CORE RELATIONS
    // =====================================================

    /**
     * The robot registration (SportRegistration.id) this entry belongs to.
     * One SportRegistration = one robot entered into one competition.
     */
    @Column(name = "sport_registration_id", nullable = false)
    private UUID sportRegistrationId;

    /**
     * Direct robot binding — copied from SportRegistration.robotId.
     * Stored here so "who operates Robot X?" needs no join.
     * Must always equal the robotId on the parent SportRegistration.
     */
    @Column(name = "robot_id", nullable = false)
    private UUID robotId;

    /**
     * The person assigned to this robot.
     * References TeamMembership.id  (com.botleague.backend.team.entity.TeamMembership).
     * NOT TeamMember — your project uses TeamMembership.
     */
    @Column(name = "team_membership_id", nullable = false)
    private UUID teamMembershipId;

    // =====================================================
    // DENORMALISED KEYS (fast lookups without joins)
    // =====================================================

    /** Copied from SportRegistration.eventSportId at creation time. */
    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    /** Copied from SportRegistration.eventId at creation time. */
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    /** Copied from SportRegistration.teamId at creation time. */
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    // =====================================================
    // ROLE
    // =====================================================

    /**
     * The membership's role for this robot in this competition.
     * Stored as STRING — DB column is human-readable.
     *
     * Robot sports  → OPERATOR, CO_OPERATOR, TECHNICIAN
     * Project Based → PRESENTER, BUILDER
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "lineup_role", nullable = false, length = 20)
    private LineupRole lineupRole = LineupRole.OPERATOR;

    // =====================================================
    // STATUS
    // =====================================================

    /**
     * false = member removed from lineup (soft-delete).
     * Row kept for audit; not counted as active assignment.
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // =====================================================
    // AUDIT
    // =====================================================

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =====================================================
    // LIFECYCLE
    // =====================================================

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getId() { return id; }

    public UUID getSportRegistrationId() { return sportRegistrationId; }
    public void setSportRegistrationId(UUID sportRegistrationId) {
        this.sportRegistrationId = sportRegistrationId;
    }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) {
        this.robotId = robotId;
    }

    public UUID getTeamMembershipId() { return teamMembershipId; }
    public void setTeamMembershipId(UUID teamMembershipId) {
        this.teamMembershipId = teamMembershipId;
    }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) {
        this.eventSportId = eventSportId;
    }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public LineupRole getLineupRole() { return lineupRole; }
    public void setLineupRole(LineupRole lineupRole) {
        this.lineupRole = lineupRole;
    }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}