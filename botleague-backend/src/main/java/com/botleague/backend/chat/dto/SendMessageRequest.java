package com.botleague.backend.chat.dto;

import java.util.UUID;

public class SendMessageRequest {

    private UUID chatRoomId;
    private String content;

    public SendMessageRequest() {}

    public SendMessageRequest(UUID chatRoomId, String content) {
        this.chatRoomId = chatRoomId;
        this.content = content;
    }

    public UUID getChatRoomId() { return chatRoomId; }
    public void setChatRoomId(UUID chatRoomId) { this.chatRoomId = chatRoomId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
