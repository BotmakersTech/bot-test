package com.botleague.backend.chat.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chat_room_id", nullable = false)
    private UUID chatRoomId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "sender_name", nullable = false)
    private String senderName;

    /**
     * Snapshot of the sender's resolved profile photo at send time — same
     * denormalization pattern as senderName, so reading a room's messages
     * stays a single query (no per-message user lookup). Like senderName,
     * this intentionally does NOT retroactively update on old messages if
     * the sender later changes their avatar.
     */
    @Column(name = "sender_photo_url")
    private String senderPhotoUrl;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "attachment_file_type")
    private String attachmentFileType;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem = false;

    @PrePersist
    protected void onCreate() {
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now();
        }
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }

    public UUID getChatRoomId() { return chatRoomId; }
    public void setChatRoomId(UUID chatRoomId) { this.chatRoomId = chatRoomId; }

    public UUID getSenderId() { return senderId; }
    public void setSenderId(UUID senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderPhotoUrl() { return senderPhotoUrl; }
    public void setSenderPhotoUrl(String senderPhotoUrl) { this.senderPhotoUrl = senderPhotoUrl; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentFileType() { return attachmentFileType; }
    public void setAttachmentFileType(String attachmentFileType) { this.attachmentFileType = attachmentFileType; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean system) { isSystem = system; }
}
