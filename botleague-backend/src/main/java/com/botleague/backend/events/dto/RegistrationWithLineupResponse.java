package com.botleague.backend.events.dto;

import java.util.List;
import java.util.UUID;

public class RegistrationWithLineupResponse {

    private UUID registrationId;
    private UUID robotId;
    private String robotName;
    private String status;
    private List<LineupResponse> lineup;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<LineupResponse> getLineup() { return lineup; }
    public void setLineup(List<LineupResponse> lineup) { this.lineup = lineup; }
}
