package com.botleague.backend.organizer.service;

import com.botleague.backend.admin.entity.UserEventAssignment;
import com.botleague.backend.admin.entity.UserSportAssignment;
import com.botleague.backend.admin.repository.UserEventAssignmentRepository;
import com.botleague.backend.admin.repository.UserSportAssignmentRepository;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.organizer.dto.AssignmentResponse;
import com.botleague.backend.organizer.dto.EventAssignmentRequest;
import com.botleague.backend.organizer.dto.SportAssignmentRequest;
import com.botleague.backend.role.service.UserRoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrganizerAssignmentService {

    private final UserEventAssignmentRepository eventAssignmentRepo;
    private final UserSportAssignmentRepository sportAssignmentRepo;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final UserRoleService userRoleService;

    public OrganizerAssignmentService(
            UserEventAssignmentRepository eventAssignmentRepo,
            UserSportAssignmentRepository sportAssignmentRepo,
            UserRepository userRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            UserRoleService userRoleService) {
        this.eventAssignmentRepo  = eventAssignmentRepo;
        this.sportAssignmentRepo  = sportAssignmentRepo;
        this.userRepository       = userRepository;
        this.eventRepository      = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.userRoleService      = userRoleService;
    }

    // ── Event assignments ──────────────────────────────────────────────────────

    public AssignmentResponse assignUserToEvent(EventAssignmentRequest req, UUID assignedBy) {
        UUID userId  = req.getUserId();
        UUID eventId = req.getEventId();

        userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        if (eventAssignmentRepo.existsByUserIdAndEventId(userId, eventId)) {
            throw ApiException.conflict("User is already assigned to this event");
        }

        UserEventAssignment assignment = new UserEventAssignment();
        assignment.setUserId(userId);
        assignment.setEventId(eventId);
        assignment.setAssignedBy(assignedBy);
        UserEventAssignment saved = eventAssignmentRepo.save(assignment);

        // Assigning someone to an event as organizer grants them the ORGANIZER
        // role if they don't already hold it — idempotent, no-op if present.
        userRoleService.ensureOrganiserRole(userId);

        return toEventAssignmentResponse(saved, event);
    }

    public void unassignUserFromEvent(UUID userId, UUID eventId) {
        if (!eventAssignmentRepo.existsByUserIdAndEventId(userId, eventId)) {
            throw ApiException.notFound("Assignment not found");
        }
        eventAssignmentRepo.deleteByUserIdAndEventId(userId, eventId);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForEvent(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));
        return eventAssignmentRepo.findByEventId(eventId).stream()
                .map(a -> toEventAssignmentResponse(a, event))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForUser(UUID userId) {
        return eventAssignmentRepo.findByUserId(userId).stream()
                .map(a -> {
                    Event event = eventRepository.findById(a.getEventId()).orElse(null);
                    return toEventAssignmentResponse(a, event);
                })
                .collect(Collectors.toList());
    }

    // ── Sport assignments ──────────────────────────────────────────────────────

    public AssignmentResponse assignUserToSport(SportAssignmentRequest req, UUID assignedBy) {
        UUID userId       = req.getUserId();
        UUID eventSportId = req.getEventSportId();

        userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        EventSports sport = eventSportsRepository.findById(eventSportId)
                .orElseThrow(() -> ApiException.notFound("Sport not found"));

        if (sportAssignmentRepo.existsByUserIdAndEventSportId(userId, eventSportId)) {
            throw ApiException.conflict("User is already assigned to this sport");
        }

        UserSportAssignment assignment = new UserSportAssignment();
        assignment.setUserId(userId);
        assignment.setEventSportId(eventSportId);
        assignment.setEventId(sport.getEventId());
        assignment.setAssignedBy(assignedBy);
        UserSportAssignment saved = sportAssignmentRepo.save(assignment);

        return toSportAssignmentResponse(saved, sport);
    }

    public void unassignUserFromSport(UUID userId, UUID eventSportId) {
        if (!sportAssignmentRepo.existsByUserIdAndEventSportId(userId, eventSportId)) {
            throw ApiException.notFound("Assignment not found");
        }
        sportAssignmentRepo.deleteByUserIdAndEventSportId(userId, eventSportId);
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForSport(UUID eventSportId) {
        EventSports sport = eventSportsRepository.findById(eventSportId)
                .orElseThrow(() -> ApiException.notFound("Sport not found"));
        return sportAssignmentRepo.findByEventSportId(eventSportId).stream()
                .map(a -> toSportAssignmentResponse(a, sport))
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AssignmentResponse toEventAssignmentResponse(UserEventAssignment a, Event event) {
        User user = userRepository.findById(a.getUserId()).orElse(null);
        AssignmentResponse resp = new AssignmentResponse();
        resp.setId(a.getId());
        resp.setUserId(a.getUserId());
        resp.setUsername(user != null ? user.getUsername() : null);
        resp.setUserDisplayName(user != null && user.getFirstName() != null
                ? user.getFirstName() + (user.getLastName() != null ? " " + user.getLastName() : "")
                : (user != null ? user.getUsername() : null));
        resp.setUserEmail(user != null ? user.getEmail() : null);
        resp.setEventId(a.getEventId());
        resp.setEventName(event != null ? event.getEventName() : null);
        resp.setEventCode(event != null ? event.getEventCode() : null);
        resp.setAssignedBy(a.getAssignedBy());
        resp.setAssignedAt(a.getAssignedAt());
        resp.setAssignmentType("EVENT");
        return resp;
    }

    private AssignmentResponse toSportAssignmentResponse(UserSportAssignment a, EventSports sport) {
        User user = userRepository.findById(a.getUserId()).orElse(null);
        AssignmentResponse resp = new AssignmentResponse();
        resp.setId(a.getId());
        resp.setUserId(a.getUserId());
        resp.setUsername(user != null ? user.getUsername() : null);
        resp.setUserDisplayName(user != null && user.getFirstName() != null
                ? user.getFirstName() + (user.getLastName() != null ? " " + user.getLastName() : "")
                : (user != null ? user.getUsername() : null));
        resp.setUserEmail(user != null ? user.getEmail() : null);
        resp.setEventSportId(a.getEventSportId());
        resp.setEventId(a.getEventId());
        resp.setSportName(sport != null ? sport.getSport() : null);
        resp.setAssignedBy(a.getAssignedBy());
        resp.setAssignedAt(a.getAssignedAt());
        resp.setAssignmentType("SPORT");
        return resp;
    }
}
