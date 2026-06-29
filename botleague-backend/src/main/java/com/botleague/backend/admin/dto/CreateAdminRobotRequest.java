package com.botleague.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class CreateAdminRobotRequest {

    @NotBlank  private String robotName;
    @NotNull   private UUID   teamId;
    @NotBlank  private String robotType;   // RobotCategory enum name
    @NotBlank  private String sport;       // e.g. ROBOWAR_1_5KG, ROBO_SOCCER
    @NotBlank  private String ageCategory; // JUNIOR_INNOVATORS | YOUNG_ENGINEERS | ROBO_MINDS
    @NotBlank  private String controlType; // MANUAL | AUTONOMOUS | HYBRID
    private String controlMode;            // WIRED | WIRELESS
    private String weightClass;
    private Double weightKg;
    private Double lengthCm;
    private Double widthCm;
    private Double heightCm;
    private String description;

    public String getRobotName()          { return robotName; }
    public void   setRobotName(String v)  { this.robotName = v; }
    public UUID   getTeamId()             { return teamId; }
    public void   setTeamId(UUID v)       { this.teamId = v; }
    public String getRobotType()          { return robotType; }
    public void   setRobotType(String v)  { this.robotType = v; }
    public String getSport()              { return sport; }
    public void   setSport(String v)      { this.sport = v; }
    public String getAgeCategory()        { return ageCategory; }
    public void   setAgeCategory(String v){ this.ageCategory = v; }
    public String getControlType()        { return controlType; }
    public void   setControlType(String v){ this.controlType = v; }
    public String getControlMode()        { return controlMode; }
    public void   setControlMode(String v){ this.controlMode = v; }
    public String getWeightClass()        { return weightClass; }
    public void   setWeightClass(String v){ this.weightClass = v; }
    public Double getWeightKg()           { return weightKg; }
    public void   setWeightKg(Double v)   { this.weightKg = v; }
    public Double getLengthCm()           { return lengthCm; }
    public void   setLengthCm(Double v)   { this.lengthCm = v; }
    public Double getWidthCm()            { return widthCm; }
    public void   setWidthCm(Double v)    { this.widthCm = v; }
    public Double getHeightCm()           { return heightCm; }
    public void   setHeightCm(Double v)   { this.heightCm = v; }
    public String getDescription()        { return description; }
    public void   setDescription(String v){ this.description = v; }
}
