package com.botleague.backend.achievement.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class AchievementResponseDTO {

    private UUID id;
    private UUID userId;
    private UUID eventId;
    private String type;
    private LocalDateTime unlockedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
}
