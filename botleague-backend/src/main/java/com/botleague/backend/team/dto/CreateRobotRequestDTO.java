package com.botleague.backend.team.dto;

import java.util.Map;

import com.botleague.backend.team.enums.ControlMode;
import com.botleague.backend.team.enums.ControlType;
import com.botleague.backend.team.enums.RobotCategory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class CreateRobotRequestDTO {

    @NotBlank
    @Size(max = 100, message = "Robot name must be at most 100 characters")
    private String robotName;

    // Broad robot type — user selects from 9 predefined types.
    // Age category is NOT accepted here; the server computes it via RobotEligibilityService.
    @NotNull
    private RobotCategory robotType;

    // Specific competition/sport (e.g. ROBOWAR_1_5KG, ROBO_SOCCER, DRONE_RACING).
    @NotBlank
    private String sport;

    // ---- control (two axes from the form) ----
    @NotNull
    private ControlType controlType;   // MANUAL / AUTONOMOUS / HYBRID

    @NotNull
    private ControlMode controlMode;   // WIRED / WIRELESS

    // ---- weight ----
    // weightClass is auto-derived from sport for RoboWar; optional for other sports.
    private String weightClass;

    @Positive
    private Double weightKg;

    // ---- dimensions (cm) ----
    @Positive
    private Double lengthCm;

    @Positive
    private Double widthCm;

    @Positive
    private Double heightCm;

    // ---- sport-specific fields ----
    // Combat : {"weaponType":"SPINNER"}
    // Drone  : {"droneType":"FPV","frameSizeCm":"20"}
    // RC     : {"vehicleType":"NITRO","scaleClass":"1:8"}
    // Aircraft: {"aircraftType":"FIXED_WING"}
    private Map<String, String> attributes;

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    private String description;

    // getters & setters

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
