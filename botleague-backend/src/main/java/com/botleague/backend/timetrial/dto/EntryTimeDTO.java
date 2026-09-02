package com.botleague.backend.timetrial.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/** One bot's time entry within a RecordRoundTimesRequestDTO. */
public class EntryTimeDTO {

    @NotNull(message = "registrationId is required")
    private UUID registrationId;

    /** Milliseconds. Ignored if dnf=true. */
    private Long timeMillis;

    private Boolean dnf = false;

    private String notes;

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public Long getTimeMillis() { return timeMillis; }
    public void setTimeMillis(Long timeMillis) { this.timeMillis = timeMillis; }

    public Boolean getDnf() { return dnf; }
    public void setDnf(Boolean dnf) { this.dnf = dnf; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
