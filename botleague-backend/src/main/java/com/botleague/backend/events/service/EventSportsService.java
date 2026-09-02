package com.botleague.backend.events.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.botleague.backend.events.dto.PrizePositionDTO;

import com.botleague.backend.catalog.service.LeagueService;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.common.service.GetFileService;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.events.dto.EventSportsRequestDTO;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.dto.UpdateSportsDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.CompetitionType;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.enums.SportMediaSlot;
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
    private final NotificationService notificationService;
    private final AuthorizationService authorizationService;
    private final LeagueService leagueService;
    private final GetFileService getFileService;

    private static final ObjectMapper JSON = new ObjectMapper();

    public EventSportsService(EventSportsRepository eventSportsRepository,
                              EventRepository eventRepository,
                              MatchRepository matchRepository,
                              ChatService chatService,
                              RealtimePublisher realtimePublisher,
                              NotificationService notificationService,
                              AuthorizationService authorizationService,
                              LeagueService leagueService,
                              GetFileService getFileService) {
        this.eventSportsRepository = eventSportsRepository;
        this.eventRepository = eventRepository;
        this.matchRepository = matchRepository;
        this.chatService = chatService;
        this.realtimePublisher = realtimePublisher;
        this.notificationService = notificationService;
        this.authorizationService = authorizationService;
        this.leagueService = leagueService;
        this.getFileService = getFileService;
    }

    /**
     * Platform admins/organiser owner can manage any of their events' sports;
     * EVENT_HEAD only their assigned events; SPORT_HEAD only their assigned
     * sport. assertCanManageSport is a strict superset of assertCanManageEvent
     * (it falls back to the event-level check first), so this one call covers
     * every caller tier.
     */
    private void assertCanManage(UUID eventId, UUID sportId, UUID callerId, List<String> callerRoles) {
        authorizationService.assertCanManageSport(callerId, sportId);
    }

    // =========================
    // CREATE SPORT
    // =========================
    @Transactional
    public EventSports addSport(EventSportsRequestDTO dto, SportEventStatus initialStatus) {

        validateCreateRequest(dto);

        Event event = getEventOrThrow(dto.getEventId());

        validateDuplicate(dto);

        validateTeamSize(dto.getMinTeamSize(), dto.getMaxTeamSize());

        // on CREATE the window must not start in the past
        validateRegistrationDates(
                dto.getRegistrationStartDate(),
                dto.getRegistrationEndDate(),
                true
        );

        EventSports entity = mapToEntity(dto);
        entity.setStatus(initialStatus);

        EventSports savedSport = eventSportsRepository.save(entity);

        // Create sport announcement channel
        try {
            chatService.createSportAnnouncementChannel(
                    savedSport.getId(),
                    savedSport.getSport(),
                    savedSport.getEventId(),
                    event.getEventName());
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
    public String updateSports(UpdateSportsDTO request, UUID callerId, List<String> callerRoles) {

        validateUpdateRequest(request);

        assertCanManage(request.getEventId(), request.getSportId(), callerId, callerRoles);

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
    public String updateSportsRegistration(UUID sportId, UUID eventId, UUID callerId, List<String> callerRoles) {
        return updateSportsRegistration(sportId, eventId, callerId, callerRoles, null);
    }

    @Transactional
    public String updateSportsRegistration(UUID sportId, UUID eventId, UUID callerId, List<String> callerRoles,
                                            LocalDate newRegistrationEndDate) {

        assertCanManage(eventId, sportId, callerId, callerRoles);

        EventSports sport = eventSportsRepository
                .findByIdAndEventId(sportId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        // India-wide platform — IST, not the server's local clock.
        LocalDate today = com.botleague.backend.common.utils.AppClock.today();

        com.botleague.backend.realtime.enums.RealtimeEventType realtimeType;
        if (sport.getStatus() == SportEventStatus.REGISTRATION_OPEN) {
            sport.setStatus(SportEventStatus.REGISTRATION_CLOSED);
            // Stamp actual close date only if no end date was pre-configured
            if (sport.getRegistrationEndDate() == null) {
                sport.setRegistrationEndDate(today);
            }
            realtimeType = com.botleague.backend.realtime.enums.RealtimeEventType.SPORT_REGISTRATION_CLOSED;
        } else if (sport.getStatus() == SportEventStatus.APPROVED
                || sport.getStatus() == SportEventStatus.REGISTRATION_CLOSED) {
            sport.setStatus(SportEventStatus.REGISTRATION_OPEN);
            // Reopening must ALWAYS produce a future-dated window — previously
            // this only back-filled when the end date was null, so reopening a
            // sport that already had a past end date (the common case: it was
            // set on close, or during initial creation) flipped status to
            // "open" in the UI while every registration attempt kept silently
            // failing the date check underneath.
            sport.setRegistrationEndDate(
                    newRegistrationEndDate != null ? newRegistrationEndDate : today.plusDays(7));
            realtimeType = com.botleague.backend.realtime.enums.RealtimeEventType.SPORT_REGISTRATION_OPENED;
        } else {
            throw new IllegalStateException(
                "Cannot open registration. Sport must be APPROVED or previously REGISTRATION_CLOSED. Current status: "
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
    // SPORT MEDIA — thumbnail + teaser video
    // SPORT_HEAD must be able to manage media for their own assigned sport,
    // so this asserts via assertCanManageSport directly (not the private
    // assertCanManage helper above, which only checks event-level access and
    // would incorrectly exclude SPORT_HEAD).
    // =========================
    @Transactional
    public void saveSportMediaSlot(UUID eventId, UUID sportId, SportMediaSlot slot, String key, String fileType, UUID callerId) {
        authorizationService.assertCanManageSport(callerId, sportId);
        validateSlotContentType(slot, fileType);

        EventSports sport = eventSportsRepository
                .findByIdAndEventId(sportId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        applySportSlot(sport, slot, key);
        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.pushSportUpdate(saved.getId(), saved.getEventId(), mapToResponse(saved));
    }

    @Transactional
    public void clearSportMediaSlot(UUID eventId, UUID sportId, SportMediaSlot slot, UUID callerId) {
        authorizationService.assertCanManageSport(callerId, sportId);

        EventSports sport = eventSportsRepository
                .findByIdAndEventId(sportId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        applySportSlot(sport, slot, null);
        EventSports saved = eventSportsRepository.save(sport);
        realtimePublisher.pushSportUpdate(saved.getId(), saved.getEventId(), mapToResponse(saved));
    }

    private void applySportSlot(EventSports sport, SportMediaSlot slot, String key) {
        switch (slot) {
            case THUMBNAIL -> sport.setSportThumbnailUrl(key);
            case TEASER -> sport.setSportTeaserVideoUrl(key);
        }
    }

    private void validateSlotContentType(SportMediaSlot slot, String fileType) {
        if (fileType == null) return;
        boolean expectsVideo = slot == SportMediaSlot.TEASER;
        boolean isVideo = fileType.startsWith("video");
        if (expectsVideo != isVideo) {
            throw ApiException.badRequest(
                    expectsVideo ? "Teaser slot requires a video file" : "Thumbnail slot requires an image file");
        }
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

        String eventName = eventRepository.findById(eventId)
                .map(Event::getEventName)
                .orElse("an event");
        String sportLabel = saved.getSport() != null ? saved.getSport().replace("_", " ") : "A sport";
        notificationService.systemNotify(
                "Sport Submitted for Approval",
                sportLabel + " for \"" + eventName + "\" is waiting for your approval.",
                NotificationType.SPORT_SUBMITTED_FOR_APPROVAL,
                NotificationPriority.HIGH,
                NotificationTargetType.PLATFORM_ADMINS,
                eventId,
                "/admin/event/" + eventId
        );

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
            entity.setAgeGroup(leagueService.validateAgeGroupCode(dto.getAgeGroup()));
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

        entity.setMapUrl(dto.getMapUrl());

        entity.setMinTeamSize(dto.getMinTeamSize());
        entity.setMaxTeamSize(dto.getMaxTeamSize());
        entity.setMaxTeams(dto.getMaxTeams());

        entity.setEntryFee(dto.getEntryFee());
        entity.setPrizeMoney(dto.getPrizeMoney());

        if (dto.getPrizeDistribution() != null) {
            validatePrizeDistribution(dto.getPrizeMoney(), dto.getPrizeDistribution());
            entity.setPrizeDistributionJson(serializePrizeDistribution(dto.getPrizeDistribution()));
        }

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
            sport.setAgeGroup(leagueService.validateAgeGroupCode(request.getAgeGroup()));
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
        if (request.getMapUrl() != null) {
            sport.setMapUrl(request.getMapUrl().isBlank() ? null : request.getMapUrl());
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
        // Validate against the pool value AFTER any prizeMoney change above.
        if (request.getPrizeDistribution() != null) {
            if (request.getPrizeDistribution().isEmpty()) {
                sport.setPrizeDistributionJson(null);
            } else {
                validatePrizeDistribution(sport.getPrizeMoney(), request.getPrizeDistribution());
                sport.setPrizeDistributionJson(serializePrizeDistribution(request.getPrizeDistribution()));
            }
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
        response.setSportThumbnailUrl(getFileService.resolveSportImage(sport.getSportThumbnailUrl()));
        response.setSportTeaserVideoUrl(getFileService.resolveSportImage(sport.getSportTeaserVideoUrl()));

        if (sport.getCompetitionType() != null) {
            response.setCompetitionType(sport.getCompetitionType().name());
        }

        response.setAgeGroup(sport.getAgeGroup());

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
        response.setMapUrl(sport.getMapUrl());
        response.setPrizeDistribution(parsePrizeDistribution(sport.getPrizeDistributionJson()));
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

    // Includes weightClass so one sport can have several weight classes
    // (e.g. RoboWar 1.5 / 8 / 15 / 30 / 60 kg) without the duplicate check
    // blocking the 2nd, 3rd, ... class. Scale-gated sports (RC Racing Car)
    // have no weight class at all — AddSportModal.tsx sends the literal
    // string "Open" for every one of them — so weightClass alone can't tell
    // two different scales apart; also compare extraRules["scale"] so a
    // second scale gets its own techsport the same way a second weight
    // class already does.
    private void validateDuplicate(EventSportsRequestDTO dto) {
        String ageGroupCode = (dto.getAgeGroup() != null && !dto.getAgeGroup().isBlank())
                ? dto.getAgeGroup().trim().toUpperCase()
                : null;

        List<EventSports> candidates = eventSportsRepository.findByEventIdAndSportAndAgeGroupAndWeightClass(
                dto.getEventId(),
                dto.getSport(),
                ageGroupCode,
                dto.getWeightClass()
        );

        String incomingScale = dto.getExtraRules() != null ? dto.getExtraRules().get("scale") : null;
        boolean duplicate = candidates.stream().anyMatch(existing -> {
            String existingScale = existing.getExtraRules() != null ? existing.getExtraRules().get("scale") : null;
            return java.util.Objects.equals(incomingScale, existingScale);
        });

        if (duplicate) {
            throw new IllegalStateException(
                    "Sport already exists for this event, age group, weight class and scale");
        }
    }

    private void validateTeamSize(Integer min, Integer max) {
        if (min != null && max != null && min > max) {
            throw new IllegalArgumentException("Min team size cannot be greater than max team size");
        }
    }

    // =========================
    // PRIZE DISTRIBUTION
    // =========================

    /**
     * The MONEY entries in the breakdown must add up exactly to the sport's
     * prize pool (prizeMoney). GOODIES entries carry a description, not money.
     */
    private void validatePrizeDistribution(BigDecimal prizeMoney, List<PrizePositionDTO> dist) {
        if (dist == null || dist.isEmpty()) {
            return;
        }
        BigDecimal moneySum = BigDecimal.ZERO;
        for (PrizePositionDTO p : dist) {
            String type = p.getType() == null ? "" : p.getType().trim().toUpperCase();
            if ("MONEY".equals(type)) {
                if (p.getAmount() == null || p.getAmount().signum() < 0) {
                    throw new IllegalArgumentException(
                            "Prize position " + p.getPosition() + ": a valid money amount is required.");
                }
                moneySum = moneySum.add(p.getAmount());
            } else if ("GOODIES".equals(type)) {
                if (p.getDescription() == null || p.getDescription().isBlank()) {
                    throw new IllegalArgumentException(
                            "Prize position " + p.getPosition() + ": describe what the winner receives.");
                }
            } else {
                throw new IllegalArgumentException(
                        "Prize position " + p.getPosition() + ": type must be MONEY or GOODIES.");
            }
        }
        BigDecimal pool = prizeMoney == null ? BigDecimal.ZERO : prizeMoney;
        if (moneySum.compareTo(pool) != 0) {
            throw new IllegalArgumentException(
                    "Prize distribution money (₹" + moneySum.toPlainString()
                    + ") must equal the prize pool (₹" + pool.toPlainString() + ").");
        }
    }

    private String serializePrizeDistribution(List<PrizePositionDTO> dist) {
        if (dist == null || dist.isEmpty()) {
            return null;
        }
        try {
            return JSON.writeValueAsString(dist);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not save the prize distribution.");
        }
    }

    private List<PrizePositionDTO> parsePrizeDistribution(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return JSON.readValue(json, new TypeReference<List<PrizePositionDTO>>() {});
        } catch (Exception e) {
            return null;
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

        if (enforceNotPast && start != null && start.isBefore(com.botleague.backend.common.utils.AppClock.today())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }
    }
}