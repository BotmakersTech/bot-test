package com.botleague.backend.organizer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_judges", indexes = {
    @Index(name = "idx_judge_event",    columnList = "event_id"),
    @Index(name = "idx_judge_sport",    columnList = "assigned_sport_id")
})
public class EventJudge {

    @Id
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    /** Nullable — judge may not be a registered platform user */
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", length = 120)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "credentials", columnDefinition = "TEXT")
    private String credentials;

    @Column(name = "assigned_sport_id")
    private UUID assignedSportId;

    @Column(name = "assigned_arena", length = 100)
    private String assignedArena;

    /** Whether this judge can submit scores in the match system */
    @Column(name = "scoring_rights", nullable = false)
    private Boolean scoringRights = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCredentials() { return credentials; }
    public void setCredentials(String credentials) { this.credentials = credentials; }
    public UUID getAssignedSportId() { return assignedSportId; }
    public void setAssignedSportId(UUID assignedSportId) { this.assignedSportId = assignedSportId; }
    public String getAssignedArena() { return assignedArena; }
    public void setAssignedArena(String assignedArena) { this.assignedArena = assignedArena; }
    public Boolean getScoringRights() { return scoringRights; }
    public void setScoringRights(Boolean scoringRights) { this.scoringRights = scoringRights; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
