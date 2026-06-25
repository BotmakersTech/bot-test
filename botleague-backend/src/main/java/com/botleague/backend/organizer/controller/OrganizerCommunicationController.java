package com.botleague.backend.organizer.controller;

import com.botleague.backend.admin.repository.UserEventAssignmentRepository;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.chat.entity.ChatRoom;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.organizer.dto.BroadcastAnnounceRequest;
import com.botleague.backend.role.service.UserRoleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Organizer-facing endpoints for event communication:
 *  - create / get the event announcement chat room
 *  - broadcast a notification + optional chat message to all registered teams
 */
@RestController
@RequestMapping("/api/organizer/events")
public class OrganizerCommunicationController {

    private final EventRepository eventRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;
    private final UserEventAssignmentRepository eventAssignmentRepo;
    private final UserRoleService userRoleService;

    public OrganizerCommunicationController(
            EventRepository eventRepository,
            ChatService chatService,
            NotificationService notificationService,
            UserEventAssignmentRepository eventAssignmentRepo,
            UserRoleService userRoleService) {
        this.eventRepository     = eventRepository;
        this.chatService         = chatService;
        this.notificationService = notificationService;
        this.eventAssignmentRepo = eventAssignmentRepo;
        this.userRoleService     = userRoleService;
    }

    /**
     * Ensure the event announcement chat room exists and return its ID.
     * Organizer is automatically added as a participant.
     */
    @PostMapping("/{eventId}/chat-room")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER')")
    public ResponseEntity<UUID> ensureAnnouncementRoom(
            Authentication authentication,
            @PathVariable UUID eventId) {

        UUID userId = extractUserId(authentication);
        validateEventAccess(userId, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        ChatRoom room = chatService.getOrCreateEventAnnouncementRoom(
                eventId, event.getEventName(), userId);

        return ResponseEntity.ok(room.getId());
    }

    /**
     * Broadcast an announcement to all teams registered in this event:
     *  1. Sends a push notification (targetType=EVENT)
     *  2. Optionally posts a message in the event announcement chat room
     */
    @PostMapping("/{eventId}/announce")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER')")
    public ResponseEntity<Void> broadcastAnnouncement(
            Authentication authentication,
            @PathVariable UUID eventId,
            @Valid @RequestBody BroadcastAnnounceRequest request) {

        UUID userId = extractUserId(authentication);
        validateEventAccess(userId, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        // 1. Push notification to all teams registered in this event
        notificationService.systemNotify(
                request.getTitle(),
                request.getMessage(),
                NotificationType.CUSTOM_ANNOUNCEMENT,
                NotificationPriority.HIGH,
                NotificationTargetType.EVENT,
                eventId,
                "/events/" + eventId);

        // 2. Optional chat message in the event announcement room
        if (request.getChatMessage() != null && !request.getChatMessage().isBlank()) {
            ChatRoom room = chatService.getOrCreateEventAnnouncementRoom(
                    eventId, event.getEventName(), userId);
            chatService.sendMessage(room.getId(), userId, request.getChatMessage());
        }

        return ResponseEntity.ok().build();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }

    private void validateEventAccess(UUID userId, UUID eventId) {
        // SUPER_ADMIN, ADMINISTRATOR, MANAGER have unrestricted event access — no assignment needed.
        // ORGANIZER must be explicitly assigned to the event.
        boolean isHigherRole = userRoleService.hasRole(userId, AccountType.SUPER_ADMIN)
                || userRoleService.hasRole(userId, AccountType.ADMINISTRATOR)
                || userRoleService.hasRole(userId, AccountType.MANAGER);
        if (isHigherRole) return;

        if (!eventAssignmentRepo.existsByUserIdAndEventId(userId, eventId)) {
            throw ApiException.forbidden("You are not assigned to this event");
        }
    }
}
