package com.botleague.backend.achievement.entity;

import com.botleague.backend.achievement.enums.AchievementType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "achievements",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_achievement_user_event_type",
        columnNames = {"user_id", "event_id", "type"}
    )
)
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID userId;

    @Column(name = "event_id")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private AchievementType type;

    @Column(name = "unlocked_at", nullable = false)
    private LocalDateTime unlockedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public AchievementType getType() { return type; }
    public void setType(AchievementType type) { this.type = type; }

    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
}
