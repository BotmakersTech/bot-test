package com.botleague.backend.events.dto;

import java.util.UUID;

import com.botleague.backend.team.enums.BotType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EventRegistrationRequestDTO {

    @NotNull(message = "Event sport ID is required")
    private UUID eventSportId;

    @NotNull(message = "Team ID is required")
    private UUID teamId;
    
    @NotNull(message = "Team ID is required")
    private UUID botId;

    @NotBlank(message = "Robot name is required")
    private String robotName;

    private BotType botType;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getEventSportId() {
        return eventSportId;
    }

    public void setEventSportId(UUID eventSportId) {
        this.eventSportId = eventSportId;
    }

    public UUID getTeamId() {
        return teamId;
    }

    
    public UUID getBotId() {
		return botId;
	}

	public void setBotId(UUID botId) {
		this.botId = botId;
	}

	public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public String getRobotName() {
        return robotName;
    }

    public void setRobotName(String robotName) {
        this.robotName = robotName;
    }

    public BotType getBotType() {
        return botType;
    }

    public void setBotType(BotType botType) {
        this.botType = botType;
    }
}