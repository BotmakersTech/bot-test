package com.botleague.backend.events.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.events.dto.CreateEventRequestDTO;
import com.botleague.backend.events.dto.CreateEventResponseDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.enums.EventMediaSlot;
import com.botleague.backend.events.enums.EventStatus;
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
    private final AuthorizationService authorizationService;

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
            AuthorizationService authorizationService
    ) {

        this.eventRepository = eventRepository;
        this.botleagueIdService = botleagueIdService;
        this.userRoleService = userRoleService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.chatService = chatService;
        this.authorizationService = authorizationService;
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
        // OWNERSHIP
        // An ORGANISER/EVENT_HEAD creating their own event owns it
        // (enables AuthorizationService.isOrganiserOwner downstream).
        // Platform admins keep the default BOTLEAGUE-owned/no-owner event,
        // even if they also happen to hold an ORGANISER/EVENT_HEAD role.
        // =============================================

        List<String> callerRoles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .collect(Collectors.toList());

        boolean isPlatformAdmin = callerRoles.contains("SUPER_ADMIN") || callerRoles.contains("ADMIN");
        boolean isOrganiserCaller = callerRoles.contains("ORGANISER") || callerRoles.contains("EVENT_HEAD");

        if (!isPlatformAdmin && isOrganiserCaller) {
            event.setOwnerType("ORGANISER");
            event.setOwnerId(userId);
        }

        // =============================================
        // DEFAULT STATUS
        // =============================================

        event.setStatus(EventStatus.DRAFT);

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

        userRoleService.ensureEventHeadRole(
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

    // =====================================================
    // GET COMPLETED EVENTS (public "previous events" listing)
    // =====================================================

    public List<CreateEventResponseDTO> getCompletedEvents() {
        return eventRepository
                .findByStatusInAndDeletedAtIsNull(
                        List.of(EventStatus.COMPLETED, EventStatus.ARCHIVED)
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
    // EVENT MEDIA SLOTS — thumbnail + up to 2 teaser videos
    // =====================================================

    public void saveEventMediaSlot(
            UUID eventId,
            EventMediaSlot slot,
            String key,
            String fileType,
            Authentication authentication
    ) {
        assertCanManageEventMedia(eventId, authentication);
        validateSlotContentType(slot, fileType);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        applyEventSlot(event, slot, key);
        eventRepository.save(event);
    }

    public void clearEventMediaSlot(UUID eventId, EventMediaSlot slot, Authentication authentication) {
        assertCanManageEventMedia(eventId, authentication);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        applyEventSlot(event, slot, null);
        eventRepository.save(event);
    }

    private void applyEventSlot(Event event, EventMediaSlot slot, String key) {
        switch (slot) {
            case THUMBNAIL -> event.setEventThumbnailUrl(key);
            case TEASER_1 -> event.setTeaserVideo1Url(key);
            case TEASER_2 -> event.setTeaserVideo2Url(key);
        }
    }

    private void validateSlotContentType(EventMediaSlot slot, String fileType) {
        if (fileType == null) return;
        boolean expectsVideo = slot == EventMediaSlot.TEASER_1 || slot == EventMediaSlot.TEASER_2;
        boolean isVideo = fileType.startsWith("video");
        if (expectsVideo != isVideo) {
            throw ApiException.badRequest(
                    expectsVideo ? "Teaser slot requires a video file" : "Thumbnail slot requires an image file");
        }
    }

    // =====================================================
    // AUTHORIZATION — EVENT MEDIA (logo/upload-url)
    // -------------------------------------------------------
    // Delegates to the centralized AuthorizationService: platform admins,
    // the organiser owner, or an approved EVENT_HEAD assignment on this event.
    // =====================================================

    public void assertCanManageEventMedia(UUID eventId, Authentication authentication) {
        UUID userId = extractUserId(authentication);
        authorizationService.assertCanManageEvent(userId, eventId);
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

        response.setEventThumbnailUrl(
                event.getEventThumbnailUrl()
        );

        response.setTeaserVideo1Url(
                event.getTeaserVideo1Url()
        );

        response.setTeaserVideo2Url(
                event.getTeaserVideo2Url()
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

        response.setCreatedAt(
                event.getCreatedAt()
        );

        return response;
    }
    
    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}