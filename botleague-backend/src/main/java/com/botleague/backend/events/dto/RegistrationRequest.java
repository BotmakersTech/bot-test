
package com.botleague.backend.events.dto;

import java.util.UUID;

/**
 * Request DTO for registering a bot
 * into an event sport.
 */
public class RegistrationRequest {

    private UUID eventSportId;

    private UUID teamId;

    /**
     * Existing Bot to register.
     */
    private UUID botId;

    /** The authenticated user triggering the registration (set by the controller). */
    private UUID callerId;

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

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public UUID getBotId() {
        return botId;
    }

    public void setBotId(UUID botId) {
        this.botId = botId;
    }

    public UUID getCallerId() {
        return callerId;
    }

    public void setCallerId(UUID callerId) {
        this.callerId = callerId;
    }
}

