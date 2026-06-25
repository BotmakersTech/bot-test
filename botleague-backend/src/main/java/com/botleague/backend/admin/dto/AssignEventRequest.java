package com.botleague.backend.admin.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class AssignEventRequest {

    @NotNull
    private UUID eventId;

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
}
