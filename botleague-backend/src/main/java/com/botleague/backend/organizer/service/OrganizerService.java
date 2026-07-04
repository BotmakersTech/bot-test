package com.botleague.backend.organizer.service;

import com.botleague.backend.admin.repository.UserEventAssignmentRepository;
import com.botleague.backend.events.dto.CreateEventResponseDTO;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.EventStatus;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.organizer.dto.UpdateEventInfoDTO;
import com.botleague.backend.realtime.service.RealtimePublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import com.botleague.backend.common.exception.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class OrganizerService {

    private static final Set<String> FULL_ACCESS_ROLES =
            Set.of("SUPER_ADMIN", "ADMINISTRATOR", "MANAGER");

    private final UserEventAssignmentRepository eventAssignmentRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final RealtimePublisher realtimePublisher;

    public OrganizerService(
            UserEventAssignmentRepository eventAssignmentRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            RealtimePublisher realtimePublisher) {
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.realtimePublisher = realtimePublisher;
    }

    /**
     * SUPER_ADMIN / ADMINISTRATOR / MANAGER → ALL events.
     * ORGANIZER → only explicitly assigned events.
     */
    public List<CreateEventResponseDTO> getMyEvents(UUID userId, List<String> userRoles) {
        if (hasFullAccess(userRoles)) {
            return eventRepository.findAllByDeletedAtIsNull()
                    .stream()
                    .map(this::toEventResponse)
                    .collect(Collectors.toList());
        }
        return eventAssignmentRepository.findByUserId(userId).stream()
                .map(a -> eventRepository.findById(a.getEventId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(this::toEventResponse)
                .collect(Collectors.toList());
    }

    /**
     * SUPER_ADMIN / ADMINISTRATOR / MANAGER → ALL sports.
     * ORGANIZER → sports within their assigned events only.
     */
    public List<GetEventSportsDTO> getMySports(UUID userId, List<String> userRoles) {
        if (hasFullAccess(userRoles)) {
            return eventSportsRepository.findAll()
                    .stream()
                    .map(this::toSportResponse)
                    .collect(Collectors.toList());
        }
        // ORGANIZER — sports within assigned events only
        Set<UUID> assignedEventIds = new HashSet<>(
                eventAssignmentRepository.findByUserId(userId).stream()
                        .map(a -> a.getEventId())
                        .collect(Collectors.toList()));
        return eventSportsRepository.findByEventIdIn(assignedEventIds).stream()
                .map(this::toSportResponse)
                .collect(Collectors.toList());
    }

    /** Returns all non-deleted events for use in admin pickers. */
    public List<CreateEventResponseDTO> getAllEventsForAdmin() {
        return eventRepository.findAllByDeletedAtIsNull()
                .stream()
                .map(this::toEventResponse)
                .collect(Collectors.toList());
    }

    /**
     * ORGANIZER-safe event update — only descriptive / venue / timeline fields.
     * Tier, status, and sport specifications are NOT touched here.
     * ARCHIVED events are read-only for everyone.
     * LIVE / COMPLETED events are read-only for organisers too.
     */
    @Transactional
    public CreateEventResponseDTO updateEventInfo(UUID eventId, UUID requestingUserId,
                                                  List<String> userRoles, UpdateEventInfoDTO dto) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        EventStatus status = event.getStatus();

        if (status == EventStatus.ARCHIVED) {
            throw new IllegalStateException("Archived events are read-only.");
        }
        if ((status == EventStatus.LIVE || status == EventStatus.COMPLETED)
                && !hasFullAccess(userRoles)) {
            throw new IllegalStateException(
                    "Organisers cannot edit events in " + status + " state.");
        }

        // Apply allowed info fields — never touches tier or sport specs
        if (dto.getEventName()        != null) event.setEventName(dto.getEventName());
        if (dto.getEventDescription() != null) event.setEventDescription(dto.getEventDescription());
        if (dto.getEventLogoUrl()     != null) event.setEventLogoUrl(dto.getEventLogoUrl());
        if (dto.getOrganizationName() != null) event.setOrganizationName(dto.getOrganizationName());
        if (dto.getOrganizationUrl()  != null) event.setOrganizationUrl(dto.getOrganizationUrl());
        if (dto.getVenueName()        != null) event.setVenueName(dto.getVenueName());
        if (dto.getVenueAddress()     != null) event.setVenueAddress(dto.getVenueAddress());
        if (dto.getCity()             != null) event.setCity(dto.getCity());
        if (dto.getState()            != null) event.setState(dto.getState());
        if (dto.getCountry()          != null) event.setCountry(dto.getCountry());
        if (dto.getStartDate()        != null) event.setStartDate(dto.getStartDate());
        if (dto.getEndDate()          != null) event.setEndDate(dto.getEndDate());

        CreateEventResponseDTO saved = toEventResponse(eventRepository.save(event));
        realtimePublisher.pushEventUpdate(eventId, saved);
        return saved;
    }

    /** Returns all sports within an event for the sport-assignment picker. */
    public List<GetEventSportsDTO> getSportsByEvent(UUID eventId) {
        return eventSportsRepository.findByEventId(eventId)
                .stream()
                .map(this::toSportResponse)
                .collect(Collectors.toList());
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private boolean hasFullAccess(List<String> roles) {
        return roles.stream().anyMatch(FULL_ACCESS_ROLES::contains);
    }

    private CreateEventResponseDTO toEventResponse(Event e) {
        CreateEventResponseDTO dto = new CreateEventResponseDTO();
        dto.setId(e.getId());
        dto.setEventCode(e.getEventCode());
        dto.setEventName(e.getEventName());
        dto.setEventDescription(e.getEventDescription());
        dto.setEventLogoUrl(e.getEventLogoUrl());
        dto.setOrganizationName(e.getOrganizationName());
        dto.setVenueName(e.getVenueName());
        dto.setCity(e.getCity());
        dto.setState(e.getState());
        dto.setCountry(e.getCountry());
        dto.setStartDate(e.getStartDate());
        dto.setEndDate(e.getEndDate());
        dto.setStatus(e.getStatus() != null ? e.getStatus().name() : null);
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }

    private GetEventSportsDTO toSportResponse(EventSports es) {
        GetEventSportsDTO dto = new GetEventSportsDTO();
        dto.setId(es.getId());
        dto.setEventId(es.getEventId());
        dto.setSport(es.getSport());
        dto.setAgeGroup(es.getAgeGroup() != null ? es.getAgeGroup().name() : null);
        dto.setWeightClass(es.getWeightClass());
        dto.setStatus(es.getStatus() != null ? es.getStatus().name() : null);
        dto.setBracketGenerated(es.isBracketGenerated());
        dto.setRejectionReason(es.getRejectionReason());
        dto.setRegisteredTeamsCount(es.getRegisteredTeamsCount());
        dto.setMaxTeams(es.getMaxTeams());
        dto.setRegistrationStartDate(es.getRegistrationStartDate());
        dto.setRegistrationEndDate(es.getRegistrationEndDate());
        return dto;
    }
}
