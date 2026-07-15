package com.botleague.backend.organizer.controller;

import com.botleague.backend.chat.entity.ChatRoom;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventRegistrationLineup;
import com.botleague.backend.events.repository.EventRegistrationLineupRepository;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.organizer.dto.BroadcastAnnounceRequest;
import com.botleague.backend.organizer.dto.OrganizerDTOs.AnnouncementRequest;
import com.botleague.backend.organizer.service.OrganizerCommunicationService;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final AuthorizationService authorizationService;
    private final TeamRepository teamRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final EventRegistrationLineupRepository lineupRepository;
    private final OrganizerCommunicationService communicationService;

    public OrganizerCommunicationController(
            EventRepository eventRepository,
            ChatService chatService,
            NotificationService notificationService,
            AuthorizationService authorizationService,
            TeamRepository teamRepository,
            TeamMembershipRepository teamMembershipRepository,
            EventRegistrationLineupRepository lineupRepository,
            OrganizerCommunicationService communicationService) {
        this.eventRepository     = eventRepository;
        this.chatService         = chatService;
        this.notificationService = notificationService;
        this.authorizationService = authorizationService;
        this.teamRepository = teamRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.lineupRepository = lineupRepository;
        this.communicationService = communicationService;
    }

    /**
     * Ensure the event announcement chat room exists and return its ID.
     * Organizer is automatically added as a participant.
     */
    @PostMapping("/{eventId}/chat-room")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
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
     * Ensure the team's event-wide chat room exists and return its ID, adding
     * the calling organizer as a participant. Unlike the internal auto-sync
     * (SportRegistrationService.syncEventTeamChat, which only ever adds the
     * event's original creator), this lets any organizer actually assigned to
     * the event join the room from their own inbox.
     */
    @PostMapping("/{eventId}/teams/{teamId}/chat-room")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<UUID> ensureTeamChatRoom(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID teamId) {

        UUID userId = extractUserId(authentication);
        validateEventAccess(userId, eventId);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        UUID captainId = teamMembershipRepository
                .findByTeamIdAndRoleInTeamAndStatus(team.getId(), TeamRole.CAPTAIN, TeamMembershipStatus.ACTIVE)
                .map(m -> m.getUserId())
                .orElse(null);

        List<UUID> lineupUserIds = lineupRepository
                .findByEventIdAndTeamIdAndIsActive(eventId, team.getId(), true)
                .stream()
                .map(EventRegistrationLineup::getTeamMembershipId)
                .distinct()
                .map(teamMembershipRepository::findById)
                .filter(Optional::isPresent)
                .map(o -> o.get().getUserId())
                .collect(Collectors.toList());

        ChatRoom room = chatService.getOrCreateEventTeamChat(
                team.getId(), eventId, event.getEventName(),
                captainId, lineupUserIds, userId);

        return ResponseEntity.ok(room.getId());
    }

    /**
     * Broadcast an announcement to all teams registered in this event:
     *  1. Sends a push notification (targetType=EVENT)
     *  2. Optionally posts a message in the event announcement chat room
     */
    @PostMapping("/{eventId}/announce")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
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

        // 3. Persist as a manageable EventAnnouncement record so organizers
        // can see, edit, pin, or delete broadcasts they already sent.
        AnnouncementRequest persistReq = new AnnouncementRequest();
        persistReq.title = request.getTitle();
        persistReq.body = request.getMessage();
        communicationService.createAnnouncement(eventId, userId, persistReq);

        return ResponseEntity.ok().build();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }

    private void validateEventAccess(UUID userId, UUID eventId) {
        authorizationService.assertCanManageEvent(userId, eventId);
    }
}
