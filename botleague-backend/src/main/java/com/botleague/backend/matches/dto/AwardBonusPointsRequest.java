package com.botleague.backend.matches.dto;

import java.util.UUID;

/**
 * POST /v1/leaderboard/event-sport/{eventSportId}/bonus
 * points may be negative (a penalty). registrationId must be one of the
 * teams currently in this sport's bracket.
 */
public class AwardBonusPointsRequest {

    private UUID registrationId;
    private Integer points;
    private String reason;

    public UUID getRegistrationId()          { return registrationId; }
    public void setRegistrationId(UUID v)    { this.registrationId = v; }
    public Integer getPoints()               { return points; }
    public void setPoints(Integer v)         { this.points = v; }
    public String getReason()                { return reason; }
    public void setReason(String v)          { this.reason = v; }
}
