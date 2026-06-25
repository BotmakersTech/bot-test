package com.botleague.backend.team.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.team.enums.ControlMode;
import com.botleague.backend.team.enums.ControlType;
import com.botleague.backend.team.enums.RobotCategory;
import com.botleague.backend.team.enums.RobotStatus;

public class RobotResponseDTO {

    private UUID id;
    private String robotCode;
    private String robotName;
    private String robotIMG;

    // Broad robot type (COMBAT_ROBOT, SOCCER_ROBOT, …)
    private RobotCategory robotType;

    // Specific competition/sport (ROBOWAR_1_5KG, ROBO_SOCCER, …)
    private String sport;

    // Computed eligible age categories — never user-provided, always derived by EligibilityEngine
    private List<AgeCategory> eligibleCategories;

    // ---- control (two axes) ----
    private ControlType controlType;
    private ControlMode controlMode;

    // ---- weight + size ----
    private String weightClass;
    private Double weightKg;
    private Double lengthCm;
    private Double widthCm;
    private Double heightCm;

    // ---- sport-specific fields ----
    private Map<String, String> attributes;

    private String description;
    private RobotStatus status;
    private UUID teamId;
    private String teamName;
    private String teamCode;
    private LocalDateTime createdAt;

    // getters & setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getRobotCode() { return robotCode; }
    public void setRobotCode(String robotCode) { this.robotCode = robotCode; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public String getRobotIMG() { return robotIMG; }
    public void setRobotIMG(String robotIMG) { this.robotIMG = robotIMG; }

    public RobotCategory getRobotType() { return robotType; }
    public void setRobotType(RobotCategory robotType) { this.robotType = robotType; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public List<AgeCategory> getEligibleCategories() { return eligibleCategories; }
    public void setEligibleCategories(List<AgeCategory> eligibleCategories) { this.eligibleCategories = eligibleCategories; }

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public RobotStatus getStatus() { return status; }
    public void setStatus(RobotStatus status) { this.status = status; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getTeamCode() { return teamCode; }
    public void setTeamCode(String teamCode) { this.teamCode = teamCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
