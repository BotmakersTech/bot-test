package com.botleague.backend.organizer.dto;

public class UpdateRegistrationStatusRequest {

    private String status;
    private String reason;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
