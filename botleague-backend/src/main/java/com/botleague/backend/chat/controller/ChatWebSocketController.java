package com.botleague.backend.chat.controller;

import com.botleague.backend.chat.dto.ChatMessageResponse;
import com.botleague.backend.chat.dto.SendMessageRequest;
import com.botleague.backend.chat.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;

    public ChatWebSocketController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * WebSocket endpoint: /app/chat/send
     * Clients send: STOMP SEND /app/chat/send
     * Body: { "chatRoomId": "...", "content": "..." }
     *
     * sendMessage() already broadcasts to /topic/chat/{chatRoomId}
     * via SimpMessagingTemplate — no need to @SendTo here.
     */
    @MessageMapping("/chat/send")
    public void handleMessage(
            @Payload SendMessageRequest request,
            Principal principal) {

        if (principal == null) {
            // Unauthenticated WebSocket connection — silently drop
            return;
        }

        UUID senderId = UUID.fromString(principal.getName());
        chatService.sendMessage(request.getChatRoomId(), senderId, request.getContent());
    }
}
