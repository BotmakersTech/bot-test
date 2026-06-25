package com.botleague.backend.team.entity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.botleague.backend.events.enums.AgeCategory;   // shared with EventSports.ageGroup
import com.botleague.backend.team.converter.StringMapJsonConverter;
import com.botleague.backend.team.enums.ControlMode;
import com.botleague.backend.team.enums.ControlType;
import com.botleague.backend.team.enums.RobotCategory;
import com.botleague.backend.team.enums.RobotStatus;

import jakarta.persistence.*;

@Entity
@Table(name = "robots", indexes = {
        @Index(name = "idx_team_id", columnList = "team_id"),
        @Index(name = "idx_robot_age_category", columnList = "age_category"),
        @Index(name = "idx_robot_category", columnList = "category")
})
public class Robot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "robot_code", unique = true, nullable = false, length = 50)
    private String robotCode;

    @Column(name = "robot_name", nullable = false)
    private String robotName;

    @Column(columnDefinition = "TEXT")
    private String description;

    // The age category the robot is built for: Junior Innovators (8-12),
    // Young Engineers (12-18), Robo Minds (18+). Same enum as EventSports.ageGroup
    // so registration can compare them directly.
    @Enumerated(EnumType.STRING)
    @Column(name = "age_category", nullable = false, length = 50)
    private AgeCategory ageCategory;

    // Broad robot type (COMBAT_ROBOT, SOCCER_ROBOT, DRONE, …).
    // Stored in the "category" column for backward compatibility.
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private RobotCategory robotType;

    // Specific sport/competition (ROBOWAR_1_5KG, ROBO_SOCCER, DRONE_RACING, …).
    @Column(name = "sport", length = 50)
    private String sport;

    // -------------------------------------------------------
    // CONTROL - TWO SEPARATE AXES (both come from the form)
    //   controlType = autonomy   : MANUAL / AUTONOMOUS / HYBRID
    //   controlMode = connection : WIRED / WIRELESS
    // -------------------------------------------------------

    @Enumerated(EnumType.STRING)
    @Column(name = "control_type", nullable = false)
    private ControlType controlType;    // autonomy axis

    @Enumerated(EnumType.STRING)
    @Column(name = "control_mode")
    private ControlMode controlMode;    // wired / wireless

    // -------------------------------------------------------
    // WEIGHT
    //   weightClass = display label ("1.5kg", "Featherweight")
    //   weightKg    = numeric value used to validate against EventSports limits
    // -------------------------------------------------------

    @Column(name = "weight_class", length = 50)
    private String weightClass;

    @Column(name = "weight_kg")
    private Double weightKg;

    // -------------------------------------------------------
    // PHYSICAL DIMENSIONS (cm) - used for constraint checks
    // -------------------------------------------------------

    @Column(name = "length_cm")
    private Double lengthCm;

    @Column(name = "width_cm")
    private Double widthCm;

    @Column(name = "height_cm")
    private Double heightCm;

    // -------------------------------------------------------
    // SPORT-SPECIFIC FIELDS (one place, any sport)
    //   Drone Racing : {"droneType":"FPV","frameSizeCm":"20"}
    //   Drone Soccer : {"diameterCm":"20"}
    //   RC Racing    : {"vehicleType":"NITRO","scaleClass":"1:8"}
    //   Aeromodelling: {"aircraftType":"FIXED_WING"}
    // Photos are NOT stored here - they live in the RobotMedia table.
    // -------------------------------------------------------

    @Convert(converter = StringMapJsonConverter.class)
    @Column(name = "attributes", columnDefinition = "TEXT")
    private Map<String, String> attributes = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RobotStatus status = RobotStatus.ACTIVE;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // =========================
    // LIFECYCLE HOOKS
    // =========================

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // convenience accessors for the sport-specific fields
    public void putAttribute(String key, String value) { this.attributes.put(key, value); }
    public String getAttribute(String key) { return this.attributes.get(key); }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getRobotCode() { return robotCode; }
    public void setRobotCode(String robotCode) { this.robotCode = robotCode; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public AgeCategory getAgeCategory() { return ageCategory; }
    public void setAgeCategory(AgeCategory ageCategory) { this.ageCategory = ageCategory; }

    public RobotCategory getRobotType() { return robotType; }
    public void setRobotType(RobotCategory robotType) { this.robotType = robotType; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public ControlType getControlType() { return controlType; }
    public void setControlType(ControlType controlType) { this.controlType = controlType; }

    public ControlMode getControlMode() { return controlMode; }
    public void setControlMode(ControlMode controlMode) { this.controlMode = controlMode; }

    public String getWeightClass() { return weightClass; }
    public void setWeightClass(String weightClass) { this.weightClass = weightClass; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public Double getLengthCm() { return lengthCm; }
    public void setLengthCm(Double lengthCm) { this.lengthCm = lengthCm; }

    public Double getWidthCm() { return widthCm; }
    public void setWidthCm(Double widthCm) { this.widthCm = widthCm; }

    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }

    public Map<String, String> getAttributes() { return attributes; }
    public void setAttributes(Map<String, String> attributes) { this.attributes = attributes; }

    public RobotStatus getStatus() { return status; }
    public void setStatus(RobotStatus status) { this.status = status; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}