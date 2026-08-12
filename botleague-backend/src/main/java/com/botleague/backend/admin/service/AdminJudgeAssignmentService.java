package com.botleague.backend.admin.service;

import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.EventSportOptionResponse;
import com.botleague.backend.admin.dto.AdminJudgeAssignmentDTOs.JudgeEventAssignmentResponse;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.matches.service.MatchService;
import com.botleague.backend.organizer.dto.OrganizerDTOs.JudgeRequest;
import com.botleague.backend.organizer.entity.EventJudge;
import com.botleague.backend.organizer.repository.EventJudgeRepository;
import com.botleague.backend.organizer.service.OrganizerPeopleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Bridges the real JUDGE-role users an admin sees in "Judge Ecosystem" to the
 * event_judges roster. Scoring rights are granted sport-wide: onboard the
 * judge to an event, then assign them a single sport within that event —
 * that grant covers every match in the sport, including matches generated
 * afterward, rather than requiring a per-match pick.
 */
@Service
@Transactional
public class AdminJudgeAssignmentService {

    private final EventJudgeRepository judgeRepo;
    private final EventRepository eventRepo;
    private final EventSportsRepository eventSportsRepo;
    private final MatchService matchService;
    private final OrganizerPeopleService peopleService;

    public AdminJudgeAssignmentService(
            EventJudgeRepository judgeRepo,
            EventRepository eventRepo,
            EventSportsRepository eventSportsRepo,
            MatchService matchService,
            OrganizerPeopleService peopleService) {
        this.judgeRepo = judgeRepo;
        this.eventRepo = eventRepo;
        this.eventSportsRepo = eventSportsRepo;
        this.matchService = matchService;
        this.peopleService = peopleService;
    }

    @Transactional(readOnly = true)
    public List<JudgeEventAssignmentResponse> getAssignments(UUID judgeUserId) {
        return judgeRepo.findByUserId(judgeUserId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private JudgeEventAssignmentResponse toResponse(EventJudge ej) {
        JudgeEventAssignmentResponse r = new JudgeEventAssignmentResponse();
        r.eventJudgeId = ej.getId();
        r.eventId = ej.getEventId();
        r.eventName = eventRepo.findById(ej.getEventId()).map(Event::getEventName).orElse("Unknown event");
        r.scoringRights = ej.getScoringRights();
        r.createdAt = ej.getCreatedAt();
        r.assignedSportId = ej.getAssignedSportId();
        r.assignedSportName = ej.getAssignedSportId() == null ? null
                : eventSportsRepo.findById(ej.getAssignedSportId()).map(EventSports::getSport).orElse(null);
        return r;
    }

    public JudgeEventAssignmentResponse assignToEvent(UUID judgeUserId, UUID eventId) {
        if (judgeRepo.findByEventIdAndUserId(eventId, judgeUserId).isEmpty()) {
            JudgeRequest req = new JudgeRequest();
            req.userId = judgeUserId;
            req.scoringRights = true;
            peopleService.createJudge(eventId, req);
        }
        return judgeRepo.findByEventIdAndUserId(eventId, judgeUserId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalStateException("Assignment not found immediately after creation"));
    }

    public void removeFromEvent(UUID judgeUserId, UUID eventJudgeId) {
        EventJudge ej = judgeRepo.findById(eventJudgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (!judgeUserId.equals(ej.getUserId())) {
            throw ApiException.badRequest("Assignment does not belong to this judge");
        }
        // Dropping event membership drops the sport-wide scoring grant with it —
        // scoringRights/assignedSportId live on this same row.
        judgeRepo.deleteById(eventJudgeId);
    }

    @Transactional(readOnly = true)
    public List<EventSportOptionResponse> getEventSports(UUID eventId) {
        return eventSportsRepo.findByEventId(eventId).stream().map(sport -> {
            EventSportOptionResponse r = new EventSportOptionResponse();
            r.eventSportId = sport.getId();
            r.sportName = sport.getSport();
            r.matchCount = matchService.getMatchesByEventSport(sport.getId()).size();
            return r;
        }).collect(Collectors.toList());
    }

    /** Grants this judge sport-wide scoring rights over eventSportId; pass null to clear the grant. */
    public JudgeEventAssignmentResponse assignSport(UUID judgeUserId, UUID eventJudgeId, UUID eventSportId) {
        EventJudge ej = judgeRepo.findById(eventJudgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (!judgeUserId.equals(ej.getUserId())) {
            throw ApiException.badRequest("Assignment does not belong to this judge");
        }
        if (eventSportId != null) {
            EventSports sport = eventSportsRepo.findById(eventSportId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sport not found"));
            if (!ej.getEventId().equals(sport.getEventId())) {
                throw ApiException.badRequest("That sport does not belong to this judge's event");
            }
        }
        ej.setAssignedSportId(eventSportId);
        ej.setScoringRights(true);
        return toResponse(judgeRepo.save(ej));
    }

    public JudgeEventAssignmentResponse unassignSport(UUID judgeUserId, UUID eventJudgeId) {
        return assignSport(judgeUserId, eventJudgeId, null);
    }
}
