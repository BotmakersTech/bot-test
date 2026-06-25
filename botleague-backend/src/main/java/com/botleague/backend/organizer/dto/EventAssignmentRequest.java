package com.botleague.backend.organizer.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class EventAssignmentRequest {

    @NotNull
    private UUID userId;

    @NotNull
    private UUID eventId;

    public UUID getUserId()  { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
}
