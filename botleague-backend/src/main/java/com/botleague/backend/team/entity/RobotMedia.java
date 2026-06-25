package com.botleague.backend.team.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.team.enums.MediaType;

import jakarta.persistence.*;

@Entity
@Table(name = "robot_media", indexes = {
        @Index(name = "idx_media_robot_id", columnList = "robot_id")
})
public class RobotMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "robot_id", nullable = false)
    private UUID robotId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    private MediaType mediaType;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Without this, createdAt is null on insert and
    // findFirst...OrderByCreatedAtDesc cannot reliably pick the latest image.
    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public MediaType getMediaType() { return mediaType; }
    public void setMediaType(MediaType mediaType) { this.mediaType = mediaType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}