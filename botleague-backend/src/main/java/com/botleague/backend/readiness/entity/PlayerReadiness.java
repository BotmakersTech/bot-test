package com.botleague.backend.readiness.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "player_readiness",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_readiness_match_user",
        columnNames = {"match_id", "user_id"}
    )
)
public class PlayerReadiness {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID id;

    @Column(name = "match_id", nullable = false)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID matchId;

    @Column(name = "user_id", nullable = false)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID userId;

    @Column(name = "registration_id")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private UUID registrationId;

    @Column(name = "ready", nullable = false)
    private boolean ready;

    @Column(name = "arrived_at_venue", nullable = false)
    private boolean arrivedAtVenue;

    @Column(name = "robot_checked", nullable = false)
    private boolean robotChecked;

    @Column(name = "battery_charged", nullable = false)
    private boolean batteryCharged;

    @Column(name = "equipment_verified", nullable = false)
    private boolean equipmentVerified;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }

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

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
