package com.botleague.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class ChangeEventStatusRequest {

    @NotBlank(message = "status is required")
    private String status;
    private String notes;

    public String getStatus()          { return status; }
    public void setStatus(String v)    { this.status = v; }

    public String getNotes()           { return notes; }
    public void setNotes(String v)     { this.notes = v; }
}
