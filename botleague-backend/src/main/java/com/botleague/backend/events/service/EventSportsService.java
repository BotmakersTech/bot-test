package com.botleague.backend.events.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.events.dto.EventSportsRequestDTO;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.dto.UpdateSportsDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.CompetitionType;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.team.enums.ControlMode;

@Service
public class EventSportsService {

    private final EventSportsRepository eventSportsRepository;
    private final EventRepository eventRepository;
    private final MatchRepository matchRepository;
    private final ChatService chatService;
    private final RealtimePublisher realtimePublisher;

    public EventSportsService(EventSportsRepository eventSportsRepository,
                              EventRepository eventRepository,
                              MatchRepository matchRepository,
                              ChatService chatService,
                              RealtimePublisher realtimePublisher) {
        this.eventSportsRepository = eventSportsRepository;
        this.eventRepository = eventRepository;
        this.matchRepository = matchRepository;
        this.chatService = chatService;
        this.realtimePublisher = realtimePublisher;
    }

    // =========================
    // CREATE SPORT
    // =========================
    @Transactional
    public EventSports addSport(EventSportsRequestDTO dto) {

        validateCreateRequest(dto);

        getEventOrThrow(dto.getEventId());

        validateDuplicate(dto);

        validateTeamSize(dto.getMinTeamSize(), dto.getMaxTeamSize());

        // on CREATE the window must not start in the past
        validateRegistrationDates(
                dto.getRegistrationStartDate(),
                dto.getRegistrationEndDate(),
                true
        );

        EventSports entity = mapToEntity(dto);

        EventSports savedSport = eventSportsRepository.save(entity);

        // Create sport announcement channel
        try {
            chatService.createSportAnnouncementChannel(
                    savedSport.getId(),
                    savedSport.getSport(),
                    savedSport.getEventId());
        } catch (Exception ignored) {
            // Chat creation failure must not roll back the sport creation
        }

        realtimePublisher.pushSportUpdate(savedSport.getId(), savedSport.getEventId(),
                mapToResponse(savedSport));

        return savedSport;
    }

    // =========================
    // UPDATE SPORT
    // =========================
    @Transactional
    public String updateSports(UpdateSportsDTO request) {

        validateUpdateRequest(request);

        // Existence check only — no status restriction on updates so that
        // super admins can edit sport data at any event stage.
        getEventOrThrow(request.getEventId());

        EventSports sport = eventSportsRepository
                .findByIdAndEventId(request.getSportId(), request.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        applyUpdates(sport, request);

        validateTeamSize(sport.getMinTeamSize(), sport.getMaxTeamSize());

        // on UPDATE don't reject a start date already in the past
        validateRegistrationDates(
                sport.getRegistrationStartDate(),
                sport.getRegistrationEndDate(),
                false
        );

        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.pushSportUpdate(saved.getId(), saved.getEventId(),
                mapToResponse(saved));

        return "Sport updated successfully";
    }

    // =========================
    // TOGGLE REGISTRATION
    // =========================
    @Transactional
    public String updateSportsRegistration(UUID sportId, UUID eventId) {

        EventSports sport = eventSportsRepository
                .findByIdAndEventId(sportId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        com.botleague.backend.realtime.enums.RealtimeEventType realtimeType;
        if (sport.getStatus() == SportEventStatus.REGISTRATION_OPEN) {
            sport.setStatus(SportEventStatus.REGISTRATION_CLOSED);
            // Stamp actual close date only if no end date was pre-configured
            if (sport.getRegistrationEndDate() == null) {
                sport.setRegistrationEndDate(LocalDate.now());
            }
            realtimeType = com.botleague.backend.realtime.enums.RealtimeEventType.SPORT_REGISTRATION_CLOSED;
        } else if (sport.getStatus() == SportEventStatus.APPROVED) {
            sport.setStatus(SportEventStatus.REGISTRATION_OPEN);
            // Only default end date if organiser hasn't configured one
            if (sport.getRegistrationEndDate() == null) {
                sport.setRegistrationEndDate(LocalDate.now().plusDays(7));
            }
            realtimeType = com.botleague.backend.realtime.enums.RealtimeEventType.SPORT_REGISTRATION_OPENED;
        } else {
            throw new IllegalStateException(
                "Sport must be APPROVED by an admin before registration can be opened. Current status: "
                + sport.getStatus());
        }

        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.toTopic("/topic/sports/" + saved.getId(), realtimeType,
                mapToResponse(saved));
        if (saved.getEventId() != null) {
            realtimePublisher.toTopic("/topic/events/" + saved.getEventId(), realtimeType,
                    mapToResponse(saved));
        }

        return saved.getStatus().name();
    }

    // =========================
    // SUBMIT FOR APPROVAL
    // =========================
    @Transactional
    public GetEventSportsDTO submitForApproval(UUID sportId, UUID eventId) {
        EventSports sport = eventSportsRepository
                .findByIdAndEventId(sportId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        if (sport.getStatus() != SportEventStatus.DRAFT) {
            throw new IllegalStateException(
                "Only DRAFT sports can be submitted for approval. Current status: " + sport.getStatus());
        }

        sport.setStatus(SportEventStatus.PENDING_APPROVAL);
        sport.setRejectionReason(null);
        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.pushSportUpdate(saved.getId(), saved.getEventId(), mapToResponse(saved));
        return mapToResponse(saved);
    }

    // =========================
    // APPROVE SPORT (Admin)
    // =========================
    @Transactional
    public GetEventSportsDTO approveSport(UUID sportId) {
        EventSports sport = eventSportsRepository
                .findById(sportId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        if (sport.getStatus() != SportEventStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                "Only PENDING_APPROVAL sports can be approved. Current status: " + sport.getStatus());
        }

        sport.setStatus(SportEventStatus.APPROVED);
        sport.setRejectionReason(null);
        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.pushSportUpdate(saved.getId(), saved.getEventId(), mapToResponse(saved));
        return mapToResponse(saved);
    }

    // =========================
    // REJECT SPORT (Admin)
    // =========================
    @Transactional
    public GetEventSportsDTO rejectSport(UUID sportId, String reason) {
        EventSports sport = eventSportsRepository
                .findById(sportId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        if (sport.getStatus() != SportEventStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                "Only PENDING_APPROVAL sports can be rejected. Current status: " + sport.getStatus());
        }

        sport.setStatus(SportEventStatus.DRAFT);
        sport.setRejectionReason(reason);
        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.pushSportUpdate(saved.getId(), saved.getEventId(), mapToResponse(saved));
        return mapToResponse(saved);
    }

    // =========================
    // READ
    // =========================
    @Transactional(readOnly = true)
    public List<GetEventSportsDTO> getEventSports(UUID eventId) {

        List<EventSports> sports = eventSportsRepository.findByEventId(eventId);

        return sports.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================
    // MAPPERS
    // =========================
    private EventSports mapToEntity(EventSportsRequestDTO dto) {

        EventSports entity = new EventSports();

        entity.setEventId(dto.getEventId());
        entity.setSport(dto.getSport());

        if (dto.getCompetitionType() != null && !dto.getCompetitionType().isBlank()) {
            entity.setCompetitionType(CompetitionType.valueOf(dto.getCompetitionType().toUpperCase()));
        }
        if (dto.getAgeGroup() != null && !dto.getAgeGroup().isBlank()) {
            entity.setAgeGroup(AgeCategory.valueOf(dto.getAgeGroup().toUpperCase()));
        }

        entity.setSportsDescription(dto.getSportData());

        // physical constraints (any may be null depending on the sport)
        entity.setWeightClass(dto.getWeightClass());
        entity.setWeightLimitKg(dto.getWeightLimitKg());
        entity.setMaxLengthCm(dto.getMaxLengthCm());
        entity.setMaxWidthCm(dto.getMaxWidthCm());
        entity.setMaxHeightCm(dto.getMaxHeightCm());

        if (dto.getControlType() != null && !dto.getControlType().isBlank()) {
            entity.setControlType(ControlMode.valueOf(dto.getControlType().toUpperCase()));
        }
        entity.setMaxBotsPerTeam(dto.getMaxBotsPerTeam());

        if (dto.getExtraRules() != null) {
            entity.setExtraRules(dto.getExtraRules());
        }

        entity.setMinTeamSize(dto.getMinTeamSize());
        entity.setMaxTeamSize(dto.getMaxTeamSize());
        entity.setMaxTeams(dto.getMaxTeams());

        entity.setEntryFee(dto.getEntryFee());
        entity.setPrizeMoney(dto.getPrizeMoney());

        entity.setFormatType(dto.getFormatType());

        entity.setRegistrationStartDate(dto.getRegistrationStartDate());
        entity.setRegistrationEndDate(dto.getRegistrationEndDate());

        return entity;
    }

    private void applyUpdates(EventSports sport, UpdateSportsDTO request) {

        if (request.getSport() != null) {
            sport.setSport(request.getSport());
        }
        if (request.getCompetitionType() != null && !request.getCompetitionType().isBlank()) {
            sport.setCompetitionType(CompetitionType.valueOf(request.getCompetitionType().toUpperCase()));
        }
        if (request.getSportsDescripction() != null) {
            sport.setSportsDescription(request.getSportsDescripction());
        }
        if (request.getAgeGroup() != null && !request.getAgeGroup().isBlank()) {
            sport.setAgeGroup(AgeCategory.valueOf(request.getAgeGroup().toUpperCase()));
        }

        if (request.getWeightClass() != null) {
            sport.setWeightClass(request.getWeightClass());
        }
        if (request.getWeightLimitKg() != null) {
            sport.setWeightLimitKg(request.getWeightLimitKg());
        }
        if (request.getMaxLengthCm() != null) {
            sport.setMaxLengthCm(request.getMaxLengthCm());
        }
        if (request.getMaxWidthCm() != null) {
            sport.setMaxWidthCm(request.getMaxWidthCm());
        }
        if (request.getMaxHeightCm() != null) {
            sport.setMaxHeightCm(request.getMaxHeightCm());
        }
        if (request.getControlType() != null && !request.getControlType().isBlank()) {
            sport.setControlType(ControlMode.valueOf(request.getControlType().toUpperCase()));
        }
        if (request.getMaxBotsPerTeam() != null) {
            sport.setMaxBotsPerTeam(request.getMaxBotsPerTeam());
        }
        if (request.getExtraRules() != null) {
            sport.setExtraRules(request.getExtraRules());
        }

        if (request.getMinTeamSize() != null) {
            sport.setMinTeamSize(request.getMinTeamSize());
        }
        if (request.getMaxTeamSize() != null) {
            sport.setMaxTeamSize(request.getMaxTeamSize());
        }
        if (request.getMaxTeams() != null) {
            sport.setMaxTeams(request.getMaxTeams());
        }

        if (request.getEntryFee() != null) {
            sport.setEntryFee(request.getEntryFee());
        }
        if (request.getPrizeMoney() != null) {
            sport.setPrizeMoney(request.getPrizeMoney());
        }

        if (request.getFormatType() != null) {
            sport.setFormatType(request.getFormatType());
        }

        if (request.getRegistrationStartDate() != null) {
            sport.setRegistrationStartDate(request.getRegistrationStartDate());
        }
        if (request.getRegistrationEndDate() != null) {
            sport.setRegistrationEndDate(request.getRegistrationEndDate());
        }
    }

    private GetEventSportsDTO mapToResponse(EventSports sport) {

        GetEventSportsDTO response = new GetEventSportsDTO();

        response.setId(sport.getId());
        response.setEventId(sport.getEventId());
        response.setSport(sport.getSport());
        response.setSportsDescription(sport.getSportsDescription());

        if (sport.getCompetitionType() != null) {
            response.setCompetitionType(sport.getCompetitionType().name());
        }

        if (sport.getAgeGroup() != null) response.setAgeGroup(sport.getAgeGroup().name());

        // physical constraints
        response.setWeightClass(sport.getWeightClass());
        response.setWeightLimitKg(sport.getWeightLimitKg());
        response.setMaxLengthCm(sport.getMaxLengthCm());
        response.setMaxWidthCm(sport.getMaxWidthCm());
        response.setMaxHeightCm(sport.getMaxHeightCm());

        if (sport.getControlType() != null) {
            response.setControlType(sport.getControlType().name());
        }

        response.setMaxBotsPerTeam(sport.getMaxBotsPerTeam());
        response.setExtraRules(sport.getExtraRules());

        response.setMinTeamSize(sport.getMinTeamSize());
        response.setMaxTeamSize(sport.getMaxTeamSize());
        response.setMaxTeams(sport.getMaxTeams());
        response.setRegisteredTeamsCount(sport.getRegisteredTeamsCount());

        response.setEntryFee(sport.getEntryFee());
        response.setPrizeMoney(sport.getPrizeMoney());
        response.setFormatType(sport.getFormatType());

        response.setRegistrationStartDate(sport.getRegistrationStartDate());
        response.setRegistrationEndDate(sport.getRegistrationEndDate());

        response.setStatus(sport.getStatus().name());
        response.setBracketGenerated(sport.isBracketGenerated());
        response.setRejectionReason(sport.getRejectionReason());
        response.setCreatedAt(sport.getCreatedAt());

        return response;
    }

    // =========================
    // VALIDATIONS
    // =========================
    private void validateCreateRequest(EventSportsRequestDTO dto) {
        if (dto.getEventId() == null) {
            throw new IllegalArgumentException("EventId is required");
        }
        if (dto.getSport() == null || dto.getSport().isBlank()) {
            throw new IllegalArgumentException("Sport is required");
        }
        if (dto.getAgeGroup() == null || dto.getAgeGroup().isBlank()) {
            throw new IllegalArgumentException("AgeGroup is required");
        }
    }

    private void validateUpdateRequest(UpdateSportsDTO request) {
        if (request.getEventId() == null || request.getSportId() == null) {
            throw new IllegalArgumentException("EventId and SportId are required");
        }
    }

    private Event getEventOrThrow(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    }

    private void validateEventNotActive(Event event) {
        // No restriction — admins can modify sports at any event status
    }

    // Now includes weightClass so one sport can have several weight classes
    // (e.g. RoboWar 1.5 / 8 / 15 / 30 / 60 kg) without the duplicate check
    // blocking the 2nd, 3rd, ... class.
    private void validateDuplicate(EventSportsRequestDTO dto) {
        AgeCategory ageCategory = (dto.getAgeGroup() != null && !dto.getAgeGroup().isBlank())
                ? AgeCategory.valueOf(dto.getAgeGroup().toUpperCase())
                : null;
        boolean exists = eventSportsRepository.existsByEventIdAndSportAndAgeGroupAndWeightClass(
                dto.getEventId(),
                dto.getSport(),
                ageCategory,
                dto.getWeightClass()
        );

        if (exists) {
            throw new IllegalStateException(
                    "Sport already exists for this event, age group and weight class");
        }
    }

    private void validateTeamSize(Integer min, Integer max) {
        if (min != null && max != null && min > max) {
            throw new IllegalArgumentException("Min team size cannot be greater than max team size");
        }
    }

    private void validateRegistrationDates(LocalDate start, LocalDate end, boolean enforceNotPast) {

        if (start != null && end != null) {
            if (end.isBefore(start)) {
                throw new IllegalArgumentException("Registration end date must be after start date");
            }
            if (end.isEqual(start)) {
                throw new IllegalArgumentException("Start and end date cannot be same");
            }
        }

        if (enforceNotPast && start != null && start.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }
    }
}