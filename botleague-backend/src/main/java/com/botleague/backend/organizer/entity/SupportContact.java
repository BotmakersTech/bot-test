package com.botleague.backend.organizer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "support_contacts", indexes = {
    @Index(name = "idx_support_contact_event", columnList = "event_id"),
    @Index(name = "idx_support_contact_sport", columnList = "event_sport_id")
})
public class SupportContact {

    @Id
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    /** Null = event-wide contact; set = specific to one sport within the event. */
    @Column(name = "event_sport_id")
    private UUID eventSportId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", length = 120)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    /** e.g. "Registration Desk", "Technical Support" */
    @Column(name = "role_label", length = 100)
    private String roleLabel;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

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
    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRoleLabel() { return roleLabel; }
    public void setRoleLabel(String roleLabel) { this.roleLabel = roleLabel; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
