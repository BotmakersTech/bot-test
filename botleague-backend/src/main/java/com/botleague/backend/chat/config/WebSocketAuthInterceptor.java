package com.botleague.backend.chat.config;

import java.util.List;
import java.util.UUID;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import com.botleague.backend.chat.repository.ChatParticipantRepository;
import com.botleague.backend.common.security.JwtService;

/**
 * Rejects (rather than silently passing through) any STOMP CONNECT with a
 * missing/invalid JWT, and gates every /topic/chat/{roomId} SUBSCRIBE on
 * active room membership — mirroring the same active-participant check
 * ChatService already applies to send/read over REST. Other /topic/**
 * destinations (matches, sports, events, rankings, registrations, teams)
 * are intentionally public/spectator-facing (see SecurityConfig) and are
 * not gated here.
 */
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final String CHAT_TOPIC_PREFIX = "/topic/chat/";

    private final JwtService jwtService;
    private final ChatParticipantRepository chatParticipantRepository;

    public WebSocketAuthInterceptor(JwtService jwtService, ChatParticipantRepository chatParticipantRepository) {
        this.jwtService = jwtService;
        this.chatParticipantRepository = chatParticipantRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            UsernamePasswordAuthenticationToken auth = authenticate(accessor);
            if (auth == null) {
                throw new MessagingException("Unauthorized: missing or invalid token");
            }
            accessor.setUser(auth);
            return message;
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith(CHAT_TOPIC_PREFIX)) {
                String roomIdPart = destination.substring(CHAT_TOPIC_PREFIX.length());
                UUID roomId;
                try {
                    roomId = UUID.fromString(roomIdPart);
                } catch (IllegalArgumentException e) {
                    throw new MessagingException("Invalid chat room id");
                }

                UUID userId = currentUserId(accessor);
                if (userId == null
                        || !chatParticipantRepository.existsByChatRoomIdAndUserIdAndIsActiveTrue(roomId, userId)) {
                    throw new MessagingException("Forbidden: not an active participant of this chat room");
                }
            }
        }

        return message;
    }

    private UsernamePasswordAuthenticationToken authenticate(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            if (!jwtService.isValid(token)) {
                return null;
            }
            String userId = jwtService.extractUserId(token);
            return new UsernamePasswordAuthenticationToken(userId, null, List.of());
        } catch (Exception e) {
            return null;
        }
    }

    private UUID currentUserId(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null || accessor.getUser().getName() == null) {
            return null;
        }
        try {
            return UUID.fromString(accessor.getUser().getName());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
