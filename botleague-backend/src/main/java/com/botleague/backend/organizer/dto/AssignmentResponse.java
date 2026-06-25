package com.botleague.backend.organizer.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class AssignmentResponse {

    private UUID   id;
    private UUID   userId;
    private String username;
    private String userDisplayName;
    private String userEmail;
    private String assignmentType;   // "EVENT" or "SPORT"

    // event assignment fields
    private UUID   eventId;
    private String eventName;
    private String eventCode;

    // sport assignment fields
    private UUID   eventSportId;
    private String sportName;

    private UUID          assignedBy;
    private LocalDateTime assignedAt;

    public UUID   getId()              { return id; }
    public void   setId(UUID id)       { this.id = id; }

    public UUID   getUserId()          { return userId; }
    public void   setUserId(UUID v)    { this.userId = v; }

    public String getUsername()        { return username; }
    public void   setUsername(String v){ this.username = v; }

    public String getUserDisplayName()         { return userDisplayName; }
    public void   setUserDisplayName(String v) { this.userDisplayName = v; }

    public String getUserEmail()         { return userEmail; }
    public void   setUserEmail(String v) { this.userEmail = v; }

    public String getAssignmentType()         { return assignmentType; }
    public void   setAssignmentType(String v) { this.assignmentType = v; }

    public UUID   getEventId()          { return eventId; }
    public void   setEventId(UUID v)    { this.eventId = v; }

    public String getEventName()         { return eventName; }
    public void   setEventName(String v) { this.eventName = v; }

    public String getEventCode()         { return eventCode; }
    public void   setEventCode(String v) { this.eventCode = v; }

    public UUID   getEventSportId()      { return eventSportId; }
    public void   setEventSportId(UUID v){ this.eventSportId = v; }

    public String getSportName()         { return sportName; }
    public void   setSportName(String v) { this.sportName = v; }

    public UUID          getAssignedBy()       { return assignedBy; }
    public void          setAssignedBy(UUID v) { this.assignedBy = v; }

    public LocalDateTime getAssignedAt()            { return assignedAt; }
    public void          setAssignedAt(LocalDateTime v) { this.assignedAt = v; }
}
