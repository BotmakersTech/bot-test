package com.botleague.backend.chat.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * "Delete for me" — hides a message from one user's view only. Every other
 * participant still sees the message normally. One row per (message, user).
 */
@Entity
@Table(name = "chat_message_deletions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"message_id", "user_id"})
})
public class ChatMessageDeletion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "deleted_at", nullable = false, updatable = false)
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.deletedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public UUID getMessageId() { return messageId; }
    public void setMessageId(UUID messageId) { this.messageId = messageId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
}
