package com.botleague.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.botleague.backend.events.enums.ControlType;
import com.botleague.backend.events.enums.RegistrationStatus;

public class AdminRegisteredTeamResponse {

    private UUID id;

    // SportRegistration stores teamId; resolved to teamName at query time
    private UUID teamId;
    private String teamName;

    // Robot details — snapshot saved at registration time
    private UUID robotId;
    private String robotName;

    // Physical spec snapshot
    private Double weightKg;
    private Double lengthCm;
    private Double widthCm;
    private Double heightCm;
    private ControlType controlType;

    private RegistrationStatus status;

    private LocalDateTime registrationDate;

    private List<AdminRegistrationLineupResponse> lineup;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public UUID getRobotId() {
        return robotId;
    }

    public void setRobotId(UUID robotId) {
        this.robotId = robotId;
    }

    public String getRobotName() {
        return robotName;
    }

    public void setRobotName(String robotName) {
        this.robotName = robotName;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public Double getLengthCm() {
        return lengthCm;
    }

    public void setLengthCm(Double lengthCm) {
        this.lengthCm = lengthCm;
    }

    public Double getWidthCm() {
        return widthCm;
    }

    public void setWidthCm(Double widthCm) {
        this.widthCm = widthCm;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Double heightCm) {
        this.heightCm = heightCm;
    }

    public ControlType getControlType() {
        return controlType;
    }

    public void setControlType(ControlType controlType) {
        this.controlType = controlType;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
    }

    public LocalDateTime getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDateTime registrationDate) {
        this.registrationDate = registrationDate;
    }

    public List<AdminRegistrationLineupResponse> getLineup() {
        return lineup;
    }

    public void setLineup(List<AdminRegistrationLineupResponse> lineup) {
        this.lineup = lineup;
    }
}