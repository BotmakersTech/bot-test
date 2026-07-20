package com.botleague.backend.events.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.team.enums.ControlMode;
import com.botleague.backend.team.enums.ControlType;

import jakarta.persistence.*;

/**
 * ONE ROBOT'S registration into ONE competition (one EventSports row).
 *
 * Each robot is its own row. A team can therefore have several registrations
 * (one per robot, possibly across different sports). This replaces the old
 * TeamRegistration + RegisteredRobot pair.
 *
 * The robot's actual specs are captured here so they can be validated against
 * the competition's constraints, and so they stay stable for the bracket later.
 */
@Entity
@Table(
    name = "sport_registrations",
    uniqueConstraints = @UniqueConstraint(
        // Keyed on robot_id, not team_id+robot_name — a robot rename could
        // otherwise double-register, or two unrelated robots sharing a name
        // could be wrongly blocked. robotId is a real FK to a persistent
        // Robot record, so it's the actual natural key here; the
        // application's own dedup/reactivation logic (registerRobot) was
        // already robot_id-based even before this constraint caught up.
        name = "uk_registration_robot",
        columnNames = {"event_sport_id", "robot_id"}
    ),
    indexes = {
        @Index(name = "idx_reg_event_sport", columnList = "event_sport_id"),
        @Index(name = "idx_reg_event", columnList = "event_id"),
        @Index(name = "idx_reg_team", columnList = "team_id"),
        @Index(name = "idx_reg_status", columnList = "status")
    }
)
public class SportRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Which competition (EventSports row) this robot is entering.
    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    // Denormalized event id for quick lookups / reporting.
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    // The owning team / participant. Nullable so individual entries are allowed too;
    // set nullable = false if every registration must belong to a team.
    @Column(name = "team_id")
    private UUID teamId;

    // Optional link to a persistent Robot record, if you keep robots in their own table.
    @Column(name = "robot_id")
    private UUID robotId;

    @Column(name = "robot_name", nullable = false, length = 100)
    private String robotName;

    // The robot's ACTUAL specs (used for validation + kept as a snapshot).
    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "length_cm")
    private Double lengthCm;

    @Column(name = "width_cm")
    private Double widthCm;

    @Column(name = "height_cm")
    private Double heightCm;

    // autonomy axis (MANUAL / AUTONOMOUS / HYBRID) — snapshotted from Robot at registration time
    @Enumerated(EnumType.STRING)
    @Column(name = "control_autonomy", length = 20)
    private ControlType controlType;

    // connection axis (WIRED / WIRELESS) — snapshotted from Robot; validated against EventSports
    @Enumerated(EnumType.STRING)
    @Column(name = "control_type", length = 20)
    private ControlMode controlMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    // Seed / bracket position. Null until the bracket is generated.
    @Column(name = "seed")
    private Integer seed;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =========================
    // LIFECYCLE
    // =========================

    @PrePersist
    public void onCreate() {
        this.registeredAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =========================
    // BUSINESS RULES
    // =========================

    /**
     * Validates this robot against the competition's constraints: weight, the
     * three dimensions, and control type. Limits that are null on the
     * COMPETITION are simply skipped (so a drone / project sport with no size
     * rule passes automatically) — but if the competition DOES have a limit
     * and the ROBOT's value for that same field is missing, this fails
     * closed rather than silently letting incomplete robot data bypass a
     * real, active limit.
     *
     * NOTE: age and "max bots per team" need data this row doesn't hold
     * (the participant's date of birth, and a count of the team's existing
     * registrations), so check those in your service:
     *   - eventSport.getAgeGroup()          vs the participant's age
     *   - eventSport.getMaxBotsPerTeam()     vs existing registrations for (team, competition)
     *   - eventSport.isRegistrationOpen(today) and eventSport.isFull()
     */
    public void validateAgainst(EventSports eventSport) {
        if (eventSport == null) {
            throw new IllegalArgumentException("Competition (EventSports) is required");
        }

        Double weightLimit = eventSport.getWeightLimitKg();
        if (weightLimit != null) {
            if (weightKg == null) {
                throw new IllegalArgumentException(
                    "This competition has a weight limit of " + weightLimit
                        + "kg, but the robot's weight was not provided.");
            }
            if (weightKg > weightLimit) {
                throw new IllegalArgumentException(
                    "Robot weight " + weightKg + "kg exceeds the limit of " + weightLimit + "kg");
            }
        }

        checkDimension("length", lengthCm, eventSport.getMaxLengthCm());
        checkDimension("width", widthCm, eventSport.getMaxWidthCm());
        checkDimension("height", heightCm, eventSport.getMaxHeightCm());

        ControlMode allowed = eventSport.getControlType();
        if (allowed != null && allowed != ControlMode.ANY) {
            if (controlMode != allowed) {
                throw new IllegalArgumentException(
                    "This competition requires " + allowed + " control, but the robot is "
                        + (controlMode == null ? "unspecified" : controlMode));
            }
        }
    }

    private void checkDimension(String name, Double value, Double max) {
        if (max == null) return; // competition doesn't constrain this dimension
        if (value == null) {
            throw new IllegalArgumentException(
                "This competition has a " + name + " limit of " + max
                    + "cm, but the robot's " + name + " was not provided.");
        }
        if (value > max) {
            throw new IllegalArgumentException(
                "Robot " + name + " " + value + "cm exceeds the limit of " + max + "cm");
        }
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public UUID getId() { return id; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public Double getLengthCm() { return lengthCm; }
    public void setLengthCm(Double lengthCm) { this.lengthCm = lengthCm; }

    public Double getWidthCm() { return widthCm; }
    public void setWidthCm(Double widthCm) { this.widthCm = widthCm; }

    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }

    public ControlType getControlType() { return controlType; }
    public void setControlType(ControlType controlType) { this.controlType = controlType; }

    public ControlMode getControlMode() { return controlMode; }
    public void setControlMode(ControlMode controlMode) { this.controlMode = controlMode; }

    public RegistrationStatus getStatus() { return status; }
    public void setStatus(RegistrationStatus status) { this.status = status; }

    public Integer getSeed() { return seed; }
    public void setSeed(Integer seed) { this.seed = seed; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}