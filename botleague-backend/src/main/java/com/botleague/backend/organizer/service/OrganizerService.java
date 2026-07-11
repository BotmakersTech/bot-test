package com.botleague.backend.organizer.service;

import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import com.botleague.backend.admin.repository.ResourceRoleAssignmentRepository;
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
            Set.of("SUPER_ADMIN", "ADMIN");

    private final ResourceRoleAssignmentRepository assignmentRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final RealtimePublisher realtimePublisher;

    public OrganizerService(
            ResourceRoleAssignmentRepository assignmentRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            RealtimePublisher realtimePublisher) {
        this.assignmentRepository = assignmentRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.realtimePublisher = realtimePublisher;
    }

    /** Every event this user has an approved EVENT_HEAD assignment on, or owns as ORGANISER. */
    private Set<UUID> myAssignedOrOwnedEventIds(UUID userId) {
        Set<UUID> ids = assignmentRepository.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_EVENT.equals(a.getScopeType())
                        && ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .map(ResourceRoleAssignment::getEventId)
                .collect(Collectors.toCollection(HashSet::new));
        eventRepository.findAllByDeletedAtIsNull().stream()
                .filter(e -> "ORGANISER".equals(e.getOwnerType()) && userId.equals(e.getOwnerId()))
                .forEach(e -> ids.add(e.getId()));
        return ids;
    }

    /**
     * Platform admins → ALL events.
     * EVENT_HEAD/ORGANISER → only their assigned/owned events.
     */
    public List<CreateEventResponseDTO> getMyEvents(UUID userId, List<String> userRoles) {
        if (hasFullAccess(userRoles)) {
            return eventRepository.findAllByDeletedAtIsNull()
                    .stream()
                    .map(this::toEventResponse)
                    .collect(Collectors.toList());
        }
        return myAssignedOrOwnedEventIds(userId).stream()
                .map(eventRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(this::toEventResponse)
                .collect(Collectors.toList());
    }

    /**
     * Platform admins → ALL sports.
     * EVENT_HEAD/ORGANISER → sports within their assigned/owned events, plus
     * any individual sport they hold an approved SPORT_HEAD assignment on.
     */
    public List<GetEventSportsDTO> getMySports(UUID userId, List<String> userRoles) {
        if (hasFullAccess(userRoles)) {
            return eventSportsRepository.findAll()
                    .stream()
                    .map(this::toSportResponse)
                    .collect(Collectors.toList());
        }
        Set<UUID> assignedEventIds = myAssignedOrOwnedEventIds(userId);
        Set<UUID> sportIds = eventSportsRepository.findByEventIdIn(assignedEventIds).stream()
                .map(EventSports::getId)
                .collect(Collectors.toCollection(HashSet::new));
        assignmentRepository.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_SPORT.equals(a.getScopeType())
                        && ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .forEach(a -> sportIds.add(a.getScopeId()));
        return eventSportsRepository.findAllById(sportIds).stream()
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
     * Status and sport specifications are NOT touched here.
     * ARCHIVED events are read-only for everyone.
     * LIVE / COMPLETED events are read-only for organisers too.
     */
    @Transactional
    public CreateEventResponseDTO updateEventInfo(UUID eventId, UUID requestingUserId,
                                                  List<String> userRoles, UpdateEventInfoDTO dto) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (!hasFullAccess(userRoles)
                && !myAssignedOrOwnedEventIds(requestingUserId).contains(eventId)) {
            throw new IllegalStateException("You are not assigned to this event.");
        }

        EventStatus status = event.getStatus();

        if (status == EventStatus.ARCHIVED) {
            throw new IllegalStateException("Archived events are read-only.");
        }
        if ((status == EventStatus.LIVE || status == EventStatus.COMPLETED)
                && !hasFullAccess(userRoles)) {
            throw new IllegalStateException(
                    "Organisers cannot edit events in " + status + " state.");
        }

        // Apply allowed info fields — never touches sport specs
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
