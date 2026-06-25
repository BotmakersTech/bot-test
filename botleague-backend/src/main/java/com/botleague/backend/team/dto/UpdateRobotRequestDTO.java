package com.botleague.backend.team.dto;

import java.util.Map;

import com.botleague.backend.team.enums.ControlMode;
import com.botleague.backend.team.enums.ControlType;
import com.botleague.backend.team.enums.RobotCategory;
import com.botleague.backend.team.enums.RobotStatus;

import jakarta.validation.constraints.Positive;

/**
 * Partial update — every field is optional. Only non-null fields are applied
 * by RobotService.updateRobotData(). Eligibility is recomputed whenever
 * sport/weight/dimensions change.
 */
public class UpdateRobotRequestDTO {

    private String robotName;

    private RobotCategory robotType;

    private String sport;

    private ControlType controlType;
    private ControlMode controlMode;

    private String weightClass;

    @Positive
    private Double weightKg;

    @Positive
    private Double lengthCm;

    @Positive
    private Double widthCm;

    @Positive
    private Double heightCm;

    private Map<String, String> attributes;

    private String description;

    private RobotStatus status;

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

    public RobotStatus getStatus() { return status; }
    public void setStatus(RobotStatus status) { this.status = status; }
}
