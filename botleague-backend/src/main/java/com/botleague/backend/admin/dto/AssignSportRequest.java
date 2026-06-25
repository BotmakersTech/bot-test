package com.botleague.backend.admin.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class AssignSportRequest {

    @NotNull
    private UUID eventSportId;

    @NotNull
    private UUID eventId;

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
}
