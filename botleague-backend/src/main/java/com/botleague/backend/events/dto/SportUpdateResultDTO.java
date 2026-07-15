package com.botleague.backend.events.dto;

/** Response for PATCH /events/{eventId}/sports/{sportId} — distinguishes an immediate apply from a held-for-approval submission. */
public class SportUpdateResultDTO {

    public static final String APPLIED = "APPLIED";
    public static final String PENDING_APPROVAL = "PENDING_APPROVAL";

    private String status;
    private String message;

    public SportUpdateResultDTO() {}

    public SportUpdateResultDTO(String status, String message) {
        this.status = status;
        this.message = message;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
