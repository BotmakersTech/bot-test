package com.botleague.backend.organizer.service;

import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import com.botleague.backend.admin.repository.ResourceRoleAssignmentRepository;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.EventStatus;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.organizer.dto.OrganizerDTOs.DashboardStatsResponse;
import com.botleague.backend.organizer.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Aggregates dashboard statistics for the organiser's assigned events.
 * Higher roles (MANAGER+) see stats across ALL events.
 */
@Service
@Transactional(readOnly = true)
public class OrganizerDashboardService {

    private static final Set<String> FULL_ACCESS_ROLES = Set.of("SUPER_ADMIN", "ADMIN");

    private final EventRepository                  eventRepository;
    private final EventSportsRepository            eventSportsRepository;
    private final ResourceRoleAssignmentRepository assignmentRepository;
    private final SportRegistrationRepository      registrationRepository;
    private final MatchRepository                  matchRepository;
    private final EventVolunteerRepository         volunteerRepository;
    private final EventJudgeRepository             judgeRepository;
    private final EventStaffRepository             staffRepository;
    private final EventIncidentRepository          incidentRepository;

    public OrganizerDashboardService(
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            ResourceRoleAssignmentRepository assignmentRepository,
            SportRegistrationRepository registrationRepository,
            MatchRepository matchRepository,
            EventVolunteerRepository volunteerRepository,
            EventJudgeRepository judgeRepository,
            EventStaffRepository staffRepository,
            EventIncidentRepository incidentRepository) {
        this.eventRepository      = eventRepository;
        this.eventSportsRepository= eventSportsRepository;
        this.assignmentRepository = assignmentRepository;
        this.registrationRepository = registrationRepository;
        this.matchRepository      = matchRepository;
        this.volunteerRepository  = volunteerRepository;
        this.judgeRepository      = judgeRepository;
        this.staffRepository      = staffRepository;
        this.incidentRepository   = incidentRepository;
    }

    public DashboardStatsResponse getStats(UUID userId, List<String> userRoles) {
        List<UUID> eventIds = resolveEventIds(userId, userRoles);

        // Collect all sport IDs for the resolved events
        List<UUID> sportIds = eventIds.stream()
                .flatMap(eid -> eventSportsRepository.findByEventId(eid).stream())
                .map(EventSports::getId)
                .collect(Collectors.toList());

        var events = eventRepository.findAllById(eventIds);

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.totalEvents     = events.size();
        stats.liveEvents      = (int) events.stream().filter(e -> EventStatus.LIVE.equals(e.getStatus())).count();
        stats.upcomingEvents  = (int) events.stream().filter(e -> EventStatus.PUBLISHED.equals(e.getStatus())).count();
        stats.completedEvents = (int) events.stream().filter(e -> EventStatus.COMPLETED.equals(e.getStatus())).count();

        // Registrations are keyed by sportId
        stats.totalRegistrations = sportIds.stream()
                .mapToLong(sid -> registrationRepository.countByEventSportId(sid)).sum();

        stats.pendingApprovals = sportIds.stream()
                .mapToLong(sid -> registrationRepository.countByEventSportIdAndStatus(sid,
                        com.botleague.backend.events.enums.RegistrationStatus.PENDING)).sum();

        // Matches are keyed by eventSportId
        stats.totalMatches = sportIds.stream()
                .mapToLong(sid -> matchRepository.findByEventSportIdAndDeletedAtIsNull(sid).size())
                .sum();

        stats.totalVolunteers = eventIds.stream()
                .mapToLong(id -> volunteerRepository.countByEventId(id)).sum();
        stats.totalJudges = eventIds.stream()
                .mapToLong(id -> judgeRepository.countByEventId(id)).sum();
        stats.totalStaff = eventIds.stream()
                .mapToLong(id -> staffRepository.countByEventId(id)).sum();
        stats.openIncidents = eventIds.stream()
                .mapToLong(id -> incidentRepository.countByEventIdAndStatus(id, "OPEN")).sum();

        return stats;
    }

    private List<UUID> resolveEventIds(UUID userId, List<String> userRoles) {
        if (userRoles.stream().anyMatch(FULL_ACCESS_ROLES::contains)) {
            return eventRepository.findAllByDeletedAtIsNull().stream()
                    .map(e -> e.getId()).collect(Collectors.toList());
        }
        Set<UUID> ids = assignmentRepository.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_EVENT.equals(a.getScopeType())
                        && ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .map(a -> a.getEventId())
                .collect(Collectors.toCollection(java.util.HashSet::new));
        // SPORT_HEAD holds no SCOPE_EVENT assignment — surface the parent
        // event of their assigned sport(s) instead so their dashboard isn't empty.
        assignmentRepository.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_SPORT.equals(a.getScopeType())
                        && ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .map(a -> eventSportsRepository.findById(a.getScopeId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(EventSports::getEventId)
                .forEach(ids::add);
        return new java.util.ArrayList<>(ids);
    }
}
