package com.botleague.backend.chat.dto;

import java.util.UUID;

public class ChatRoomResponse {

    private UUID id;
    private String type;
    private String name;
    private UUID referenceId;
    private int unreadCount;
    private ChatMessageResponse lastMessage;
    private boolean canSend;

    public ChatRoomResponse() {}

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getReferenceId() { return referenceId; }
    public void setReferenceId(UUID referenceId) { this.referenceId = referenceId; }

    public int getUnreadCount() { return unreadCount; }
    public void setUnreadCount(int unreadCount) { this.unreadCount = unreadCount; }

    public ChatMessageResponse getLastMessage() { return lastMessage; }
    public void setLastMessage(ChatMessageResponse lastMessage) { this.lastMessage = lastMessage; }

    public boolean isCanSend() { return canSend; }
    public void setCanSend(boolean canSend) { this.canSend = canSend; }
}
