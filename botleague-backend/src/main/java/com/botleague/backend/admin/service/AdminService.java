package com.botleague.backend.admin.service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import java.time.LocalDateTime;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.botleague.backend.admin.dto.AdminAllEventResponse;
import com.botleague.backend.admin.dto.AdminEventSportResponse;
import com.botleague.backend.admin.dto.AdminRegisteredTeamResponse;
import com.botleague.backend.admin.dto.AdminRegistrationLineupResponse;
import com.botleague.backend.admin.dto.ChangeEventStatusRequest;
import com.botleague.backend.admin.dto.UpdateEventRequest;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.enums.EventStatus;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.entity.EventRegistrationLineup;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.ControlType;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.repository.EventRegistrationLineupRepository;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;

@Service
public class AdminService {

    // ── Allowed lifecycle transitions ─────────────────────────────────────────
    private static final Map<EventStatus, Set<EventStatus>> ALLOWED_TRANSITIONS;
    static {
        ALLOWED_TRANSITIONS = new EnumMap<>(EventStatus.class);
        ALLOWED_TRANSITIONS.put(EventStatus.DRAFT,      EnumSet.of(EventStatus.PUBLISHED));
        ALLOWED_TRANSITIONS.put(EventStatus.PUBLISHED,  EnumSet.of(EventStatus.LIVE, EventStatus.ARCHIVED));
        ALLOWED_TRANSITIONS.put(EventStatus.LIVE,       EnumSet.of(EventStatus.COMPLETED));
        ALLOWED_TRANSITIONS.put(EventStatus.COMPLETED,  EnumSet.of(EventStatus.ARCHIVED));
        ALLOWED_TRANSITIONS.put(EventStatus.ARCHIVED,   EnumSet.noneOf(EventStatus.class));
    }

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final EventRepository                   eventRepository;
    private final EventSportsRepository             eventSportRepository;
    private final SportRegistrationRepository       sportRegistrationRepository;
    private final EventRegistrationLineupRepository lineupRepository;
    private final TeamRepository                    teamRepository;
    private final TeamMembershipRepository          teamMembershipRepository;
    private final UserRepository                    userRepository;
    private final MatchRepository                   matchRepository;
    private final NotificationService               notificationService;
    private final AuditLogService                   auditLogService;
    private final RealtimePublisher                 realtimePublisher;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public AdminService(
            EventRepository                   eventRepository,
            EventSportsRepository             eventSportRepository,
            SportRegistrationRepository       sportRegistrationRepository,
            EventRegistrationLineupRepository lineupRepository,
            TeamRepository                    teamRepository,
            TeamMembershipRepository          teamMembershipRepository,
            UserRepository                    userRepository,
            MatchRepository                   matchRepository,
            NotificationService               notificationService,
            AuditLogService                   auditLogService,
            RealtimePublisher                 realtimePublisher
    ) {
        this.eventRepository             = eventRepository;
        this.eventSportRepository        = eventSportRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.lineupRepository            = lineupRepository;
        this.teamRepository              = teamRepository;
        this.teamMembershipRepository    = teamMembershipRepository;
        this.userRepository              = userRepository;
        this.matchRepository             = matchRepository;
        this.notificationService         = notificationService;
        this.auditLogService             = auditLogService;
        this.realtimePublisher           = realtimePublisher;
    }

    // =====================================================
    // GET ALL EVENTS
    // =====================================================

    public List<AdminAllEventResponse> getAllEvents() {
        List<Event> events = eventRepository.findAll();

        List<AdminAllEventResponse> response = new ArrayList<>();

        for (Event event : events) {
            AdminAllEventResponse dto = mapToResponse(event);

            List<EventSports> sports = eventSportRepository.findByEventId(event.getId());
            List<AdminEventSportResponse> sportDtos = new ArrayList<>();
            for (EventSports sport : sports) {
                sportDtos.add(mapSport(sport));
            }
            dto.setSports(sportDtos);

            response.add(dto);
        }

        return response;
    }

    // =====================================================
    // GET EVENT BY ID
    // =====================================================

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public AdminAllEventResponse getEventById(UUID eventId) {
        Event event = eventRepository
                .findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        AdminAllEventResponse dto = mapToResponse(event);

        // =============================================
        // GET SPORTS
        // =============================================

        List<EventSports> sports =
                eventSportRepository.findByEventId(eventId);

        List<AdminEventSportResponse> sportDtos = new ArrayList<>();

        for (EventSports sport : sports) {

            AdminEventSportResponse sportDto = mapSport(sport);

            // =========================================
            // GET TEAM REGISTRATIONS
            // Uses SportRegistrationRepository.
            // findByEventSportIdAndStatus() — same
            // method name, now returns SportRegistration.
            // =========================================

            List<SportRegistration> registrations =
                    sportRegistrationRepository
                            .findByEventSportIdAndStatus(
                                    sport.getId(),
                                    RegistrationStatus.REGISTERED
                            );

            List<AdminRegisteredTeamResponse> registrationDtos = new ArrayList<>();

            for (SportRegistration registration : registrations) {

                AdminRegisteredTeamResponse registrationDto =
                        mapRegistration(registration);

                // =====================================
                // GET LINEUP
                // Lineup rows are keyed on
                // sportRegistrationId, not
                // eventRegistrationId.
                // =====================================

                List<EventRegistrationLineup> lineup =
                        lineupRepository
                                .findBySportRegistrationIdAndIsActive(
                                        registration.getId(), true
                                );

                List<AdminRegistrationLineupResponse> lineupDtos =
                        lineup.stream()
                                .map(this::mapLineup)
                                .toList();

                registrationDto.setLineup(lineupDtos);
                registrationDtos.add(registrationDto);
            }

            sportDto.setRegistrations(registrationDtos);
            sportDtos.add(sportDto);
        }

        dto.setSports(sportDtos);

        return dto;
    }

    // =====================================================
    // UPDATE EVENT
    // =====================================================

    public AdminAllEventResponse updateEvent(UUID eventId, UpdateEventRequest request) {
        Event event = eventRepository
                .findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        EventStatus status   = event.getStatus();
        boolean     isAdmin  = isAdminOrAbove();

        // ARCHIVED is always read-only
        if (status == EventStatus.ARCHIVED) {
            throw new IllegalStateException("Archived events cannot be edited.");
        }
        // LIVE / COMPLETED: only ADMINISTRATOR or SUPER_ADMIN may edit
        if ((status == EventStatus.LIVE || status == EventStatus.COMPLETED) && !isAdmin) {
            throw new IllegalStateException("Only administrators can edit events in " + status + " state.");
        }

        boolean fullEdit = isAdmin || status == EventStatus.DRAFT;

        // Basic fields — always allowed when editing is permitted
        if (request.getEventName()        != null) event.setEventName(request.getEventName());
        if (request.getEventDescription() != null) event.setEventDescription(request.getEventDescription());
        if (request.getEventLogoUrl()     != null) event.setEventLogoUrl(request.getEventLogoUrl());
        if (request.getOrganizationName() != null) event.setOrganizationName(request.getOrganizationName());

        // Extended fields — only in DRAFT (or if admin)
        if (fullEdit) {
            if (request.getOrganizationUrl()  != null) event.setOrganizationUrl(request.getOrganizationUrl());
            if (request.getVenueName()        != null) event.setVenueName(request.getVenueName());
            if (request.getVenueAddress()     != null) event.setVenueAddress(request.getVenueAddress());
            if (request.getCity()             != null) event.setCity(request.getCity());
            if (request.getState()            != null) event.setState(request.getState());
            if (request.getCountry()          != null) event.setCountry(request.getCountry());
            if (request.getStartDate()        != null) event.setStartDate(request.getStartDate());
            if (request.getEndDate()          != null) event.setEndDate(request.getEndDate());
        }

        Event saved = eventRepository.save(event);
        auditLogService.log("EVENT_UPDATED", "EVENT", saved.getId(), saved.getEventName(), null, null);
        realtimePublisher.pushEventUpdate(saved.getId(), mapToResponse(saved));
        return mapToResponse(saved);
    }

    // =====================================================
    // SOFT DELETE EVENT
    // =====================================================

    public void softDeleteEvent(UUID eventId) {
        Event event = eventRepository
                .findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        event.setDeletedAt(LocalDateTime.now());
        eventRepository.save(event);
        auditLogService.log("EVENT_DELETED", "EVENT", event.getId(), event.getEventName(), null, null);
    }

    // =====================================================
    // CHANGE EVENT STATUS
    // =====================================================

    public AdminAllEventResponse changeEventStatus(UUID eventId, ChangeEventStatusRequest request) {
        Event event = eventRepository
                .findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        EventStatus oldStatus;
        EventStatus newStatus;
        try {
            newStatus = EventStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown status: " + request.getStatus());
        }
        oldStatus = event.getStatus();

        Set<EventStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(oldStatus, EnumSet.noneOf(EventStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(
                "Invalid transition: " + oldStatus + " → " + newStatus +
                ". Allowed: " + allowed
            );
        }

        // ── Status gates ─────────────────────────────────────────────────────
        if (newStatus == EventStatus.PUBLISHED) {
            validatePublishPrerequisites(eventId);
        }
        if (newStatus == EventStatus.LIVE) {
            validateGoLivePrerequisites(eventId);
        }

        event.setStatus(newStatus);
        Event saved = eventRepository.save(event);
        auditLogService.log("EVENT_STATUS_CHANGED", "EVENT", saved.getId(),
                saved.getEventName(), oldStatus.name(), newStatus.name());
        realtimePublisher.pushEventStatusChange(saved.getId(), mapToResponse(saved));
        dispatchEventStatusNotification(saved, newStatus);
        return mapToResponse(saved);
    }

    private void dispatchEventStatusNotification(Event event, EventStatus status) {
        switch (status) {
            case PUBLISHED -> notificationService.systemNotify(
                    event.getEventName() + " is now Published!",
                    "A new event has been published. Check it out and register your team!",
                    NotificationType.EVENT_CREATED, NotificationPriority.HIGH,
                    NotificationTargetType.ALL_USERS, null,
                    "/events/" + event.getId()
            );
            case LIVE -> notificationService.systemNotify(
                    event.getEventName() + " is now LIVE!",
                    "The competition has started! Check the live leaderboard.",
                    NotificationType.EVENT_CREATED, NotificationPriority.HIGH,
                    NotificationTargetType.ALL_USERS, null,
                    "/events/" + event.getId()
            );
            default -> { /* no auto-notification for DRAFT, COMPLETED, ARCHIVED */ }
        }
    }

    // ── Publish prerequisite validation ──────────────────────────────────────

    // PUBLISH: only needs sports to exist and all be admin-approved.
    // Brackets and scheduling are checked at LIVE transition instead.
    private void validatePublishPrerequisites(UUID eventId) {
        List<com.botleague.backend.events.entity.EventSports> sports =
                eventSportRepository.findByEventId(eventId);

        if (sports.isEmpty()) {
            throw new IllegalStateException(
                "Cannot publish: the event has no sports configured.");
        }

        List<String> blockers = new ArrayList<>();

        for (com.botleague.backend.events.entity.EventSports sport : sports) {
            String label = sport.getSport()
                + (sport.getWeightClass() != null ? " (" + sport.getWeightClass() + ")" : "");

            if (sport.getStatus() == SportEventStatus.DRAFT
                    || sport.getStatus() == SportEventStatus.PENDING_APPROVAL) {
                blockers.add(label + ": not yet approved by admin");
            }
        }

        if (!blockers.isEmpty()) {
            throw new IllegalStateException(
                "Cannot publish event. Unmet prerequisites:\n• " +
                String.join("\n• ", blockers));
        }
    }

    // LIVE: requires registration closed, bracket generated, and all matches scheduled.
    private void validateGoLivePrerequisites(UUID eventId) {
        List<com.botleague.backend.events.entity.EventSports> sports =
                eventSportRepository.findByEventId(eventId);

        List<String> blockers = new ArrayList<>();

        for (com.botleague.backend.events.entity.EventSports sport : sports) {
            String label = sport.getSport()
                + (sport.getWeightClass() != null ? " (" + sport.getWeightClass() + ")" : "");

            if (sport.getStatus() != SportEventStatus.REGISTRATION_CLOSED) {
                blockers.add(label + ": registration is not closed");
                continue;
            }
            if (!sport.isBracketGenerated()) {
                blockers.add(label + ": tournament bracket not generated");
                continue;
            }
            long unscheduled = matchRepository
                    .findByEventSportIdAndDeletedAtIsNull(sport.getId())
                    .stream()
                    .filter(m -> !Boolean.TRUE.equals(m.getIsBye())
                              && m.getScheduledAt() == null)
                    .count();
            if (unscheduled > 0) {
                blockers.add(label + ": " + unscheduled + " match(es) not yet scheduled");
            }
        }

        if (!blockers.isEmpty()) {
            throw new IllegalStateException(
                "Cannot go live. Unmet prerequisites:\n• " +
                String.join("\n• ", blockers));
        }
    }

    // ── Security helper ───────────────────────────────────────────────────────
    private boolean isAdminOrAbove() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a ->
            "ROLE_ADMINISTRATOR".equals(a.getAuthority()) ||
            "ROLE_SUPER_ADMIN".equals(a.getAuthority())
        );
    }

    // =====================================================
    // MAP EVENT
    // =====================================================

    private AdminAllEventResponse mapToResponse(Event event) {

        AdminAllEventResponse dto = new AdminAllEventResponse();

        dto.setId(event.getId());
        dto.setEventCode(event.getEventCode());
        dto.setEventName(event.getEventName());
        dto.setEventDescription(event.getEventDescription());
        dto.setStatus(event.getStatus() != null ? event.getStatus().name() : null);
        dto.setEventLogoUrl(event.getEventLogoUrl());
        dto.setCity(event.getCity());
        dto.setState(event.getState());
        dto.setCountry(event.getCountry());
        dto.setVenueName(event.getVenueName());
        dto.setVenueAddress(event.getVenueAddress());
        dto.setStartDate(event.getStartDate());
        dto.setEndDate(event.getEndDate());
        dto.setOrganizationName(event.getOrganizationName());
        dto.setOrganizationUrl(event.getOrganizationUrl());
        dto.setApprovedAt(event.getApprovedAt());
        dto.setApprovedBy(event.getApprovedBy());
        dto.setRejectionReason(event.getRejectionReason());
        dto.setCreatedBy(event.getCreatedBy());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        dto.setDeletedAt(event.getDeletedAt());

        return dto;
    }

    // =====================================================
    // MAP SPORT
    // =====================================================

    private AdminEventSportResponse mapSport(EventSports sport) {

        AdminEventSportResponse dto = new AdminEventSportResponse();

        dto.setId(sport.getId());
        dto.setSport(sport.getSport());
        dto.setSportsInfo(sport.getSportsDescription());   // getSportsDescription(), not getSportsDescripction()
        dto.setStatus(sport.getStatus() != null ? sport.getStatus().name() : null);
        dto.setFormatType(sport.getFormatType());
        if (sport.getAgeGroup() != null) dto.setAgeGroup(sport.getAgeGroup().name());
        dto.setWeightClass(sport.getWeightClass());
        dto.setEntryFee(sport.getEntryFee());
        dto.setMaxTeams(sport.getMaxTeams());
        dto.setMinTeamSize(sport.getMinTeamSize());
        dto.setMaxTeamSize(sport.getMaxTeamSize());
        dto.setRegisteredTeamsCount(sport.getRegisteredTeamsCount());
        dto.setPrizeMoney(sport.getPrizeMoney());
        dto.setRegistrationStartDate(sport.getRegistrationStartDate());
        dto.setRegistrationEndDate(sport.getRegistrationEndDate());
        dto.setBracketGenerated(sport.isBracketGenerated());
        dto.setCreatedAt(sport.getCreatedAt());
        dto.setUpdatedAt(sport.getUpdatedAt());

        return dto;
    }

    // =====================================================
    // MAP TEAM REGISTRATION
    // =====================================================

    private AdminRegisteredTeamResponse mapRegistration(
            SportRegistration registration
    ) {

        AdminRegisteredTeamResponse dto = new AdminRegisteredTeamResponse();

        dto.setId(registration.getId());
        dto.setTeamId(registration.getTeamId());
        dto.setRobotId(registration.getRobotId());
        dto.setRobotName(registration.getRobotName());
        dto.setStatus(registration.getStatus());
        dto.setRegistrationDate(registration.getUpdatedAt());

        // Resolve team name
        if (registration.getTeamId() != null) {
            teamRepository.findById(registration.getTeamId())
                    .ifPresent(t -> dto.setTeamName(t.getTeamName()));
        }

        // Physical spec snapshot saved at registration time
        dto.setWeightKg(registration.getWeightKg());
        dto.setLengthCm(registration.getLengthCm());
        dto.setWidthCm(registration.getWidthCm());
        dto.setHeightCm(registration.getHeightCm());
        if (registration.getControlType() != null) {
            dto.setControlType(ControlType.valueOf(registration.getControlType().name()));
        }

        return dto;
    }

    // =====================================================
    // MAP LINEUP
    // =====================================================

    private AdminRegistrationLineupResponse mapLineup(
            EventRegistrationLineup lineup
    ) {

        AdminRegistrationLineupResponse dto =
                new AdminRegistrationLineupResponse();

        dto.setId(lineup.getId());
        dto.setEventRegistrationId(lineup.getSportRegistrationId());
        dto.setTeamMemberId(lineup.getTeamMembershipId());

        // Resolve member name via TeamMembership → User
        if (lineup.getTeamMembershipId() != null) {
            teamMembershipRepository.findById(lineup.getTeamMembershipId())
                    .ifPresent(tm -> userRepository.findById(tm.getUserId())
                            .ifPresent(u -> {
                                String first = u.getFirstName() != null ? u.getFirstName() : "";
                                String last  = u.getLastName()  != null ? u.getLastName()  : "";
                                dto.setFullName((first + " " + last).trim());
                            }));
        }

        if (lineup.getLineupRole() != null) {
            dto.setRole(lineup.getLineupRole().name());
        }
        dto.setIsActive(lineup.getIsActive());
        dto.setCreatedAt(lineup.getCreatedAt());

        return dto;
    }

}