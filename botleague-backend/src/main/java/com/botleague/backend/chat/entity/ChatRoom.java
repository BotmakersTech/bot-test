package com.botleague.backend.chat.entity;

import com.botleague.backend.chat.enums.ChatRoomType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_rooms")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ChatRoomType type;

    @Column(nullable = false)
    private String name;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "secondary_reference_id")
    private UUID secondaryReferenceId;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }

    public ChatRoomType getType() { return type; }
    public void setType(ChatRoomType type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getReferenceId() { return referenceId; }
    public void setReferenceId(UUID referenceId) { this.referenceId = referenceId; }

    public UUID getSecondaryReferenceId() { return secondaryReferenceId; }
    public void setSecondaryReferenceId(UUID secondaryReferenceId) { this.secondaryReferenceId = secondaryReferenceId; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
