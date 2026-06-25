package com.botleague.backend.organizer.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SportAssignmentRequest {

    @NotNull
    private UUID userId;

    @NotNull
    private UUID eventSportId;

    public UUID getUserId()       { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }
}
