package com.botleague.backend.chat.controller;

import com.botleague.backend.chat.dto.ChatMessageResponse;
import com.botleague.backend.chat.dto.ChatRoomListResponse;
import com.botleague.backend.chat.dto.ChatRoomResponse;
import com.botleague.backend.chat.entity.ChatRoom;
import com.botleague.backend.chat.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * GET /api/chat/rooms
     * Returns all chat rooms for the current user, grouped by type.
     */
    @GetMapping("/rooms")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatRoomListResponse> getMyChatRooms(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        ChatRoomListResponse response = chatService.getMyChatRooms(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chat/rooms/{roomId}/messages
     * Returns last 50 messages for a room.
     */
    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable UUID roomId,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        List<ChatMessageResponse> messages = chatService.getMessages(roomId, userId);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/chat/rooms/{roomId}/send
     * REST fallback for sending a message (also broadcasts via WebSocket).
     */
    @PostMapping("/rooms/{roomId}/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable UUID roomId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        ChatMessageResponse response = chatService.sendMessage(roomId, userId, content);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/chat/direct/{otherUserId}
     * Get or create a direct chat with another user.
     */
    @PostMapping("/direct/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ChatRoomResponse> getOrCreateDirectChat(
            @PathVariable UUID otherUserId,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        ChatRoom room = chatService.getOrCreateDirectChat(userId, otherUserId);

        ChatRoomResponse response = new ChatRoomResponse();
        response.setId(room.getId());
        response.setType(room.getType().name());
        response.setName(room.getName());
        response.setReferenceId(room.getReferenceId());
        response.setUnreadCount(0);
        response.setCanSend(true);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/chat/rooms/{roomId}/read
     * Updates the caller's lastReadAt so unread count resets to 0.
     */
    @PostMapping("/rooms/{roomId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markRoomRead(
            @PathVariable UUID roomId,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        chatService.markRoomRead(roomId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/chat/rooms/{roomId}/participants
     * Returns the active participant list for a room.
     */
    @GetMapping("/rooms/{roomId}/participants")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getParticipants(
            @PathVariable UUID roomId,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        List<Map<String, Object>> participants = chatService.getParticipants(roomId, userId);
        return ResponseEntity.ok(participants);
    }

    /**
     * DELETE /api/chat/messages/{messageId}
     * Permanent delete — only the sender may delete their own message, and it
     * disappears for every participant.
     */
    @DeleteMapping("/messages/{messageId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID messageId,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        chatService.deleteMessage(messageId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/chat/rooms/{roomId}/addable-members
     * Captain-only: team roster members not yet in this event team chat.
     */
    @GetMapping("/rooms/{roomId}/addable-members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getAddableMembers(
            @PathVariable UUID roomId,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        return ResponseEntity.ok(chatService.getAddableTeamMembers(roomId, userId));
    }

    /**
     * POST /api/chat/rooms/{roomId}/members
     * Captain-only: add a non-lineup team roster member to the event team chat.
     */
    @PostMapping("/rooms/{roomId}/members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> addMember(
            @PathVariable UUID roomId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        UUID userId = extractUserId(authentication);
        UUID targetUserId = UUID.fromString(body.get("userId"));
        chatService.addTeamMemberToEventTeamChat(roomId, userId, targetUserId);
        return ResponseEntity.ok().build();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}
