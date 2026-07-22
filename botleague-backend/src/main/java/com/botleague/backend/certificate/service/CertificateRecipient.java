package com.botleague.backend.certificate.service;

import java.util.UUID;

/**
 * One resolved target for a single generation run — a real user (individual
 * team member) or, for MANUAL_SELECT, a role-based recipient identified only
 * by name. Every field here is a point-in-time snapshot, matching what
 * IssuedCertificate persists.
 */
public class CertificateRecipient {

    private final UUID recipientUserId;
    private final String recipientName;
    private final UUID teamId;
    private final String teamName;
    private final UUID robotId;
    private final String robotName;
    private final String instituteName;
    private final Integer positionRank;

    public CertificateRecipient(UUID recipientUserId, String recipientName, UUID teamId, String teamName,
                                 UUID robotId, String robotName, String instituteName, Integer positionRank) {
        this.recipientUserId = recipientUserId;
        this.recipientName = recipientName;
        this.teamId = teamId;
        this.teamName = teamName;
        this.robotId = robotId;
        this.robotName = robotName;
        this.instituteName = instituteName;
        this.positionRank = positionRank;
    }

    public UUID getRecipientUserId() { return recipientUserId; }
    public String getRecipientName() { return recipientName; }
    public UUID getTeamId() { return teamId; }
    public String getTeamName() { return teamName; }
    public UUID getRobotId() { return robotId; }
    public String getRobotName() { return robotName; }
    public String getInstituteName() { return instituteName; }
    public Integer getPositionRank() { return positionRank; }
}
