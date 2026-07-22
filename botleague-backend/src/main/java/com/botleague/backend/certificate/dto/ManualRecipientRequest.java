package com.botleague.backend.certificate.dto;

import java.util.UUID;

/** One explicit recipient for a MANUAL_SELECT certificate type's generation trigger. */
public class ManualRecipientRequest {

    private UUID recipientUserId;
    private String recipientName; // required when recipientUserId is null (role-based recipient)
    private UUID teamId;
    private UUID robotId;
    private String robotName;
    private Integer positionRank;

    public UUID getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(UUID recipientUserId) { this.recipientUserId = recipientUserId; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public Integer getPositionRank() { return positionRank; }
    public void setPositionRank(Integer positionRank) { this.positionRank = positionRank; }
}
