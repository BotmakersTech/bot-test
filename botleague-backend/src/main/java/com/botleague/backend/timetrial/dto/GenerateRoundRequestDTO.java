package com.botleague.backend.timetrial.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public class GenerateRoundRequestDTO {

    @NotNull(message = "eventSportId is required")
    private UUID eventSportId;

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }
}
