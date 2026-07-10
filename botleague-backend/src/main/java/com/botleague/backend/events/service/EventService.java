package com.botleague.backend.events.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import com.botleague.backend.admin.repository.UserEventAssignmentRepository;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.events.dto.CreateEventRequestDTO;
import com.botleague.backend.events.dto.CreateEventResponseDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.enums.EventStatus;
import com.botleague.backend.events.enums.EventTier;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.role.service.UserRoleService;
import com.botleague.backend.team.entity.RobotMedia;
import com.botleague.backend.team.enums.MediaType;
import com.botleague.backend.common.exception.ResourceNotFoundException;

@Service
public class EventService {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final EventRepository eventRepository;

    private final BotleagueIdService botleagueIdService;

    private final UserRoleService userRoleService;

    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ChatService chatService;
    private final UserEventAssignmentRepository eventAssignmentRepository;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public EventService(
            EventRepository eventRepository,
            BotleagueIdService botleagueIdService,
            UserRoleService userRoleService,
            NotificationService notificationService,
            AuditLogService auditLogService,
            ChatService chatService,
            UserEventAssignmentRepository eventAssignmentRepository
    ) {

        this.eventRepository = eventRepository;
        this.botleagueIdService = botleagueIdService;
        this.userRoleService = userRoleService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.chatService = chatService;
        this.eventAssignmentRepository = eventAssignmentRepository;
    }

    // =====================================================
    // CREATE EVENT
    // =====================================================

    public CreateEventResponseDTO createEvent(
            CreateEventRequestDTO request,
            Authentication authentication
    ) {

        // =============================================
        // VALIDATE DUPLICATE
        // =============================================

        if (eventRepository
                .existsByEventNameAndDeletedAtIsNull(
                        request.getEventName()
                )) {

            throw ApiException.conflict(
                    "Event name already exists"
            );
        }

        // =============================================
        // AUTH USER
        // =============================================

        UUID userId = extractUserId(authentication);

        // =============================================
        // GENERATE EVENT CODE
        // =============================================

        String eventCode =
                botleagueIdService
                        .generateBotLeagueEventId();

        // =============================================
        // CREATE ENTITY
        // =============================================

        Event event = new Event();

        event.setEventCode(eventCode);

        event.setEventName(
                request.getEventName()
        );

        event.setEventDescription(
                request.getEventDescription()
        );

        event.setEventLogoUrl(
                request.getEventLogoUrl()
        );

        event.setOrganizationName(
                request.getOrganizationName()
        );

        event.setOrganizationUrl(
                request.getOrganizationUrl()
        );

        event.setVenueName(
                request.getVenueName()
        );

        event.setVenueAddress(
                request.getVenueAddress()
        );

        event.setCity(
                request.getCity()
        );

        event.setState(
                request.getState()
        );

        event.setCountry(
                request.getCountry()
        );

        event.setStartDate(
                request.getStartDate()
        );

        event.setEndDate(
                request.getEndDate()
        );

        event.setCreatedBy(userId);

        // =============================================
        // DEFAULT STATUS + TIER
        // =============================================

        event.setStatus(EventStatus.DRAFT);

        if (request.getTier() != null && !request.getTier().isBlank()) {
            try {
                event.setTier(EventTier.valueOf(request.getTier().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                event.setTier(EventTier.B_TIER);
            }
        } else {
            event.setTier(EventTier.B_TIER);
        }

        // =============================================
        // SAVE
        // =============================================

        Event savedEvent =
                eventRepository.save(event);

        auditLogService.log("EVENT_CREATED", "EVENT", savedEvent.getId(),
                savedEvent.getEventName(), null, "DRAFT");

        // =============================================
        // ENSURE ORGANISER ROLE
        // =============================================

        userRoleService.ensureOrganiserRole(
                userId
        );

        // =============================================
        // RESPONSE
        // =============================================

        return mapToResponse(savedEvent);
    }

    // =====================================================
    // GET ALL EVENTS
    // =====================================================

    public List<CreateEventResponseDTO>
    getAllEvents() {

        return eventRepository
                .findAll()
                .stream()
                .filter(event ->
                        event.getDeletedAt() == null
                )
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public CreateEventResponseDTO makeEventLive(UUID eventId) {
        Event event = eventRepository
                .findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        event.setStatus(EventStatus.PUBLISHED);
        Event saved = eventRepository.save(event);
        auditLogService.log("EVENT_PUBLISHED", "EVENT", saved.getId(),
                saved.getEventName(), "DRAFT", "PUBLISHED");
        notificationService.systemNotify(
                saved.getEventName() + " is now Live!",
                "A new event has been published. Check it out and register your team!",
                NotificationType.EVENT_CREATED,
                NotificationPriority.HIGH,
                NotificationTargetType.ALL_USERS,
                null,
                "/events/" + saved.getId()
        );

        // Create event announcement channel (idempotent)
        try {
            chatService.createEventAnnouncementChannel(saved.getId(), saved.getEventName());
        } catch (Exception ignored) {
            // Chat creation failure must not roll back the event publish
        }

        return mapToResponse(saved);
    }

    // =====================================================
    // GET LIVE EVENTS
    // =====================================================

    public List<CreateEventResponseDTO> getLiveEvents() {
        return eventRepository
                .findByStatusInAndDeletedAtIsNull(
                        List.of(EventStatus.PUBLISHED, EventStatus.LIVE)
                )
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public void saveMedia(

            UUID eventId,

            String key,

            MediaType mediaType,

            Authentication authentication
    ) {

        assertCanManageEventMedia(eventId, authentication);

        // =====================================================
        // GET EVENT
        // =====================================================

        Event event =
                eventRepository
                        .findById(eventId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Event not found"
                                )
                        );

        // =====================================================
        // SET EVENT LOGO
        // =====================================================

        event.setEventLogoUrl(key);

        // =====================================================
        // SAVE EVENT
        // =====================================================

        eventRepository.save(event);
    }

    // =====================================================
    // AUTHORIZATION — EVENT MEDIA (logo/upload-url)
    // -------------------------------------------------------
    // SUPER_ADMIN / ADMINISTRATOR / MANAGER can manage any event's media.
    // ORGANIZER / SUB_ORGANIZER can only manage media for events they are
    // explicitly assigned to. Everyone else is rejected.
    // =====================================================

    public void assertCanManageEventMedia(UUID eventId, Authentication authentication) {
        UUID userId = extractUserId(authentication);

        if (userRoleService.hasRole(userId, AccountType.SUPER_ADMIN)
                || userRoleService.hasRole(userId, AccountType.ADMINISTRATOR)
                || userRoleService.hasRole(userId, AccountType.MANAGER)) {
            return;
        }

        if ((userRoleService.hasRole(userId, AccountType.ORGANIZER)
                || userRoleService.hasRole(userId, AccountType.SUB_ORGANIZER))
                && eventAssignmentRepository.existsByUserIdAndEventId(userId, eventId)) {
            return;
        }

        throw ApiException.forbidden("You do not have permission to manage media for this event");
    }

    // =====================================================
    // GET EVENT BY ID
    // =====================================================

    public CreateEventResponseDTO
    getEventById(UUID eventId) {

        Event event =
                eventRepository
                        .findById(eventId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Event not found"
                                ));

        return mapToResponse(event);
    }

    // =====================================================
    // ENTITY → DTO
    // =====================================================

    private CreateEventResponseDTO mapToResponse(Event event) {

        CreateEventResponseDTO response =
                new CreateEventResponseDTO();

        response.setId(
                event.getId()
        );

        response.setEventCode(
                event.getEventCode()
        );

        response.setEventName(
                event.getEventName()
        );

        response.setEventDescription(
                event.getEventDescription()
        );

        response.setEventLogoUrl(
                event.getEventLogoUrl()
        );

        response.setOrganizationName(
                event.getOrganizationName() != null
                        ? event.getOrganizationName()
                        : null
        );

        response.setVenueName(
                event.getVenueName()
        );

        response.setCity(
                event.getCity()
        );

        response.setState(
                event.getState()
        );

        response.setCountry(
                event.getCountry()
        );

        response.setStartDate(
                event.getStartDate()
        );

        response.setEndDate(
                event.getEndDate()
        );

        response.setStatus(
                event.getStatus().name()
        );

        response.setTier(
                event.getTier() != null ? event.getTier().name() : null
        );

        response.setCreatedAt(
                event.getCreatedAt()
        );

        return response;
    }
    
    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}