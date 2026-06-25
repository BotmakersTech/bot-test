package com.botleague.backend.readiness.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ReadinessResponse {

    private UUID id;
    private UUID matchId;
    private UUID userId;
    private UUID registrationId;
    private boolean ready;
    private boolean arrivedAtVenue;
    private boolean robotChecked;
    private boolean batteryCharged;
    private boolean equipmentVerified;
    private int readinessPercent;
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getMatchId() { return matchId; }
    public void setMatchId(UUID matchId) { this.matchId = matchId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public boolean isReady() { return ready; }
    public void setReady(boolean ready) { this.ready = ready; }

    public boolean isArrivedAtVenue() { return arrivedAtVenue; }
    public void setArrivedAtVenue(boolean arrivedAtVenue) { this.arrivedAtVenue = arrivedAtVenue; }

    public boolean isRobotChecked() { return robotChecked; }
    public void setRobotChecked(boolean robotChecked) { this.robotChecked = robotChecked; }

    public boolean isBatteryCharged() { return batteryCharged; }
    public void setBatteryCharged(boolean batteryCharged) { this.batteryCharged = batteryCharged; }

    public boolean isEquipmentVerified() { return equipmentVerified; }
    public void setEquipmentVerified(boolean equipmentVerified) { this.equipmentVerified = equipmentVerified; }

    public int getReadinessPercent() { return readinessPercent; }
    public void setReadinessPercent(int readinessPercent) { this.readinessPercent = readinessPercent; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
