package com.botleague.backend.chat.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ChatMessageResponse {

    private UUID id;
    private UUID chatRoomId;
    private UUID senderId;
    private String senderName;
    private String senderPhotoUrl;
    private String content;
    private String attachmentUrl;
    private String attachmentFileType;
    private LocalDateTime sentAt;
    private boolean isDeleted;
    private boolean mine;
    private boolean system;

    public ChatMessageResponse() {}

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public boolean isMine() { return mine; }
    public void setMine(boolean mine) { this.mine = mine; }

    public boolean isSystem() { return system; }
    public void setSystem(boolean system) { this.system = system; }
}
