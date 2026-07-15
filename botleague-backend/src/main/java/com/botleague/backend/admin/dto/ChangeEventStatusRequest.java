package com.botleague.backend.admin.dto;

public class ChangeEventStatusRequest {

    private String status;
    private String notes;

    public String getStatus()          { return status; }
    public void setStatus(String v)    { this.status = v; }

    public String getNotes()           { return notes; }
    public void setNotes(String v)     { this.notes = v; }
}
