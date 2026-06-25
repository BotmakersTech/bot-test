// ======================================================
// DTO
// EventRegistrationResponse.java
// ======================================================

package com.botleague.backend.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.events.enums.ControlMode;
import com.botleague.backend.events.enums.ControlType;
import com.botleague.backend.events.enums.RegistrationStatus;

public class EventRegistrationResponse {

    private UUID registrationId;

    private UUID eventId;

    private UUID eventSportId;

    private UUID teamId;

    // Human-readable names resolved at query time
    private String teamName;
    private String sportName;
    private String eventName;

    // Robot.id — stored on SportRegistration at registration time
    private UUID botId;

    // Snapshot of robot name at registration time
    private String robotName;

    // RegistrationStatus: REGISTERED / PENDING / CANCELLED
    private RegistrationStatus status;

    // Physical spec snapshot — copied from Robot at registration time
    private Double weightKg;
    private Double lengthCm;
    private Double widthCm;
    private Double heightCm;

    // autonomy axis: MANUAL / AUTONOMOUS / HYBRID
    private ControlType controlType;

    // connection axis: WIRED / WIRELESS
    private ControlMode controlMode;

    private LocalDateTime createdAt;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(UUID registrationId) {
        this.registrationId = registrationId;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getEventSportId() {
        return eventSportId;
    }

    public void setEventSportId(UUID eventSportId) {
        this.eventSportId = eventSportId;
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

    public String getSportName() {
        return sportName;
    }

    public void setSportName(String sportName) {
        this.sportName = sportName;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public UUID getBotId() {
        return botId;
    }

    public void setBotId(UUID botId) {
        this.botId = botId;
    }

    /** Alias for botId — both names are serialized so the frontend can use either. */
    public UUID getRobotId() {
        return botId;
    }

    public String getRobotName() {
        return robotName;
    }

    public void setRobotName(String robotName) {
        this.robotName = robotName;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
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

    public ControlMode getControlMode() {
        return controlMode;
    }

    public void setControlMode(ControlMode controlMode) {
        this.controlMode = controlMode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}