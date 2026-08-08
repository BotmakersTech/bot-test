package com.botleague.backend.admin.service;

import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.JudgeEventAssignmentResponse;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.SportMatchesResponse;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.matches.dto.MatchResponseDTO;
import com.botleague.backend.matches.entity.MatchJudgeAssignment;
import com.botleague.backend.matches.repository.MatchJudgeAssignmentRepository;
import com.botleague.backend.matches.service.MatchService;
import com.botleague.backend.organizer.dto.OrganizerDTOs.JudgeRequest;
import com.botleague.backend.organizer.entity.EventJudge;
import com.botleague.backend.organizer.repository.EventJudgeRepository;
import com.botleague.backend.organizer.service.OrganizerPeopleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Bridges the real JUDGE-role users an admin sees in "Judge Ecosystem" to the
 * event_judges roster (event-level onboarding) and match_judge_assignments
 * (the actual per-match scoring grant) — the two-step "assign event, then
 * assign matches" flow described in the Judge Ecosystem UI.
 */
@Service
@Transactional
public class AdminJudgeAssignmentService {

    private final EventJudgeRepository judgeRepo;
    private final EventRepository eventRepo;
    private final EventSportsRepository eventSportsRepo;
    private final MatchJudgeAssignmentRepository matchJudgeAssignmentRepo;
    private final MatchService matchService;
    private final OrganizerPeopleService peopleService;

    public AdminJudgeAssignmentService(
            EventJudgeRepository judgeRepo,
            EventRepository eventRepo,
            EventSportsRepository eventSportsRepo,
            MatchJudgeAssignmentRepository matchJudgeAssignmentRepo,
            MatchService matchService,
            OrganizerPeopleService peopleService) {
        this.judgeRepo = judgeRepo;
        this.eventRepo = eventRepo;
        this.eventSportsRepo = eventSportsRepo;
        this.matchJudgeAssignmentRepo = matchJudgeAssignmentRepo;
        this.matchService = matchService;
        this.peopleService = peopleService;
    }

    @Transactional(readOnly = true)
    public List<JudgeEventAssignmentResponse> getAssignments(UUID judgeUserId) {
        List<UUID> allAssignedMatchIds = matchJudgeAssignmentRepo.findByJudgeUserId(judgeUserId).stream()
                .map(MatchJudgeAssignment::getMatchId)
                .collect(Collectors.toList());

        return judgeRepo.findByUserId(judgeUserId).stream().map(ej -> {
            JudgeEventAssignmentResponse r = new JudgeEventAssignmentResponse();
            r.eventJudgeId = ej.getId();
            r.eventId = ej.getEventId();
            r.eventName = eventRepo.findById(ej.getEventId()).map(Event::getEventName).orElse("Unknown event");
            r.scoringRights = ej.getScoringRights();
            r.createdAt = ej.getCreatedAt();
            Set<UUID> eventMatchIds = matchIdsForEvent(ej.getEventId());
            r.assignedMatchIds = allAssignedMatchIds.stream().filter(eventMatchIds::contains).collect(Collectors.toList());
            return r;
        }).collect(Collectors.toList());
    }

    public JudgeEventAssignmentResponse assignToEvent(UUID judgeUserId, UUID eventId) {
        if (judgeRepo.findByEventIdAndUserId(eventId, judgeUserId).isEmpty()) {
            JudgeRequest req = new JudgeRequest();
            req.userId = judgeUserId;
            req.scoringRights = true;
            peopleService.createJudge(eventId, req);
        }
        return getAssignments(judgeUserId).stream()
                .filter(a -> eventId.equals(a.eventId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Assignment not found immediately after creation"));
    }

    public void removeFromEvent(UUID judgeUserId, UUID eventJudgeId) {
        EventJudge ej = judgeRepo.findById(eventJudgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (!judgeUserId.equals(ej.getUserId())) {
            throw ApiException.badRequest("Assignment does not belong to this judge");
        }
        // Dropping event membership must also drop match-level scoring rights for
        // that event — otherwise a removed judge keeps the ability to score
        // matches nobody can see them assigned to anymore.
        Set<UUID> eventMatchIds = matchIdsForEvent(ej.getEventId());
        matchJudgeAssignmentRepo.findByJudgeUserId(judgeUserId).stream()
                .filter(mja -> eventMatchIds.contains(mja.getMatchId()))
                .forEach(matchJudgeAssignmentRepo::delete);
        judgeRepo.deleteById(eventJudgeId);
    }

    @Transactional(readOnly = true)
    public List<SportMatchesResponse> getEventMatches(UUID eventId) {
        return eventSportsRepo.findByEventId(eventId).stream().map(sport -> {
            SportMatchesResponse r = new SportMatchesResponse();
            r.eventSportId = sport.getId();
            r.sportName = sport.getSport();
            r.matches = matchService.getMatchesByEventSport(sport.getId());
            return r;
        }).collect(Collectors.toList());
    }

    public void assignMatch(UUID judgeUserId, UUID eventJudgeId, UUID matchId, UUID assignedByUserId) {
        EventJudge ej = judgeRepo.findById(eventJudgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (!judgeUserId.equals(ej.getUserId())) {
            throw ApiException.badRequest("Assignment does not belong to this judge");
        }
        if (matchJudgeAssignmentRepo.existsByMatchIdAndJudgeUserId(matchId, judgeUserId)) return;
        MatchJudgeAssignment mja = new MatchJudgeAssignment();
        mja.setMatchId(matchId);
        mja.setJudgeUserId(judgeUserId);
        mja.setAssignedBy(assignedByUserId);
        matchJudgeAssignmentRepo.save(mja);
    }

    public void unassignMatch(UUID judgeUserId, UUID matchId) {
        matchJudgeAssignmentRepo.deleteByMatchIdAndJudgeUserId(matchId, judgeUserId);
    }

    private Set<UUID> matchIdsForEvent(UUID eventId) {
        return eventSportsRepo.findByEventId(eventId).stream()
                .flatMap(sport -> matchService.getMatchesByEventSport(sport.getId()).stream())
                .map(MatchResponseDTO::getMatchId)
                .collect(Collectors.toSet());
    }
}
