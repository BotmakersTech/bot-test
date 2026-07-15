package com.botleague.backend.events.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.events.dto.SportChangeRequestResponseDTO;
import com.botleague.backend.events.dto.SportUpdateResultDTO;
import com.botleague.backend.events.dto.UpdateSportsDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportChangeRequest;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportChangeRequestRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;

/**
 * Gates edits to an already-approved sport's specs behind an approval chain:
 * SPORT_HEAD's edits need EVENT_HEAD/ORGANISER approval; EVENT_HEAD/ORGANISER's
 * edits need ADMIN approval. Edits to a DRAFT/PENDING_APPROVAL sport, and any
 * edit made by a platform admin, still apply instantly via
 * {@link EventSportsService#updateSports} — unchanged from before this
 * feature existed.
 */
@Service
public class SportChangeRequestService {

    /** Requester only had sport-level authority — routes to EVENT_HEAD/ORGANISER for approval. */
    private static final String TIER_SPORT_HEAD = "SPORT_HEAD";
    /** Requester had event-level authority (EVENT_HEAD or organiser-owner) — routes to ADMIN. */
    private static final String TIER_EVENT_MANAGER = "EVENT_HEAD_OR_ORGANISER";

    private final SportChangeRequestRepository changeRequestRepository;
    private final EventSportsRepository eventSportsRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventSportsService eventSportsService;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public SportChangeRequestService(
            SportChangeRequestRepository changeRequestRepository,
            EventSportsRepository eventSportsRepository,
            EventRepository eventRepository,
            UserRepository userRepository,
            EventSportsService eventSportsService,
            AuthorizationService authorizationService,
            NotificationService notificationService,
            ObjectMapper objectMapper) {
        this.changeRequestRepository = changeRequestRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.eventSportsService = eventSportsService;
        this.authorizationService = authorizationService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SportUpdateResultDTO submitOrApply(UpdateSportsDTO dto, UUID callerId, List<String> callerRoles) {

        if (dto.getEventId() == null || dto.getSportId() == null) {
            throw new IllegalArgumentException("EventId and SportId are required");
        }

        // Authorize up front — same check updateSports() will re-run for the
        // direct-apply path, but a caller with no rights to this sport at all
        // must not be able to create a pending change request either.
        authorizationService.assertCanManageSport(callerId, dto.getSportId());

        EventSports sport = eventSportsRepository
                .findByIdAndEventId(dto.getSportId(), dto.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Sport not found"));

        boolean isPlatformAdmin = authorizationService.isPlatformAdmin(callerId);
        boolean sportNotYetLive = sport.getStatus() == SportEventStatus.DRAFT
                || sport.getStatus() == SportEventStatus.PENDING_APPROVAL;

        if (isPlatformAdmin || sportNotYetLive) {
            eventSportsService.updateSports(dto, callerId, callerRoles);
            return new SportUpdateResultDTO(SportUpdateResultDTO.APPLIED, "Sport updated successfully");
        }

        if (changeRequestRepository.findFirstByEventSportIdAndStatus(dto.getSportId(), SportChangeRequest.STATUS_PENDING).isPresent()) {
            throw ApiException.conflict("A change request is already pending review for this sport. Wait for it to be resolved before submitting another.");
        }

        boolean hasEventLevelAuthority = authorizationService.canManageEvent(callerId, dto.getEventId());
        String tier = hasEventLevelAuthority ? TIER_EVENT_MANAGER : TIER_SPORT_HEAD;

        SportChangeRequest request = new SportChangeRequest();
        request.setEventSportId(dto.getSportId());
        request.setEventId(dto.getEventId());
        request.setRequestedBy(callerId);
        request.setRequesterTier(tier);
        request.setProposedChangesJson(serialize(dto));
        request.setStatus(SportChangeRequest.STATUS_PENDING);
        SportChangeRequest saved = changeRequestRepository.save(request);

        notifyApprovers(saved, sport);

        return new SportUpdateResultDTO(SportUpdateResultDTO.PENDING_APPROVAL,
                "Change submitted for approval — it will not take effect until reviewed.");
    }

    @Transactional
    public SportChangeRequestResponseDTO approve(UUID changeRequestId, UUID approverId) {
        SportChangeRequest request = loadPending(changeRequestId);
        assertCanReview(request, approverId);

        UpdateSportsDTO dto = deserialize(request.getProposedChangesJson());
        dto.setEventId(request.getEventId());
        dto.setSportId(request.getEventSportId());
        eventSportsService.updateSports(dto, approverId, List.of());

        request.setStatus(SportChangeRequest.STATUS_APPROVED);
        request.setReviewedBy(approverId);
        request.setReviewedAt(LocalDateTime.now());
        SportChangeRequest saved = changeRequestRepository.save(request);

        EventSports sport = eventSportsRepository.findById(saved.getEventSportId()).orElse(null);
        String sportLabel = sport != null && sport.getSport() != null ? sport.getSport().replace("_", " ") : "A sport";
        notificationService.systemNotify(
                "Sport change approved",
                "Your requested change to " + sportLabel + " has been approved and is now live.",
                NotificationType.SPORT_CHANGE_APPROVED,
                NotificationPriority.MEDIUM,
                NotificationTargetType.USER,
                saved.getRequestedBy(),
                "/organizer/events/" + saved.getEventId() + "/sports/" + saved.getEventSportId()
        );

        return toResponse(saved);
    }

    @Transactional
    public SportChangeRequestResponseDTO reject(UUID changeRequestId, UUID approverId, String reason) {
        SportChangeRequest request = loadPending(changeRequestId);
        assertCanReview(request, approverId);

        request.setStatus(SportChangeRequest.STATUS_REJECTED);
        request.setReviewedBy(approverId);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(reason);
        SportChangeRequest saved = changeRequestRepository.save(request);

        EventSports sport = eventSportsRepository.findById(saved.getEventSportId()).orElse(null);
        String sportLabel = sport != null && sport.getSport() != null ? sport.getSport().replace("_", " ") : "A sport";
        notificationService.systemNotify(
                "Sport change rejected",
                "Your requested change to " + sportLabel + " was rejected"
                        + (reason != null && !reason.isBlank() ? ": " + reason : "."),
                NotificationType.SPORT_CHANGE_REJECTED,
                NotificationPriority.MEDIUM,
                NotificationTargetType.USER,
                saved.getRequestedBy(),
                "/organizer/events/" + saved.getEventId() + "/sports/" + saved.getEventSportId()
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SportChangeRequestResponseDTO> getForSport(UUID sportId, UUID callerId, String status) {
        authorizationService.assertCanManageSport(callerId, sportId);
        return changeRequestRepository.findByEventSportIdAndStatus(sportId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SportChangeRequestResponseDTO> getForEvent(UUID eventId, UUID callerId, String status) {
        authorizationService.assertCanViewEvent(callerId, eventId);
        return changeRequestRepository.findByEventIdAndStatus(eventId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // =========================
    // HELPERS
    // =========================

    private SportChangeRequest loadPending(UUID changeRequestId) {
        SportChangeRequest request = changeRequestRepository.findById(changeRequestId)
                .orElseThrow(() -> ApiException.notFound("Change request not found"));
        if (!SportChangeRequest.STATUS_PENDING.equals(request.getStatus())) {
            throw ApiException.conflict("Only PENDING change requests can be reviewed. Current status: " + request.getStatus());
        }
        return request;
    }

    /** SPORT_HEAD-tier requests need EVENT_HEAD/ORGANISER/ADMIN sign-off; EVENT_HEAD/ORGANISER-tier requests need ADMIN sign-off. */
    private void assertCanReview(SportChangeRequest request, UUID approverId) {
        if (TIER_SPORT_HEAD.equals(request.getRequesterTier())) {
            authorizationService.assertCanManageEvent(approverId, request.getEventId());
        } else {
            authorizationService.assertIsPlatformAdmin(approverId);
        }
    }

    private void notifyApprovers(SportChangeRequest request, EventSports sport) {
        String eventName = eventRepository.findById(request.getEventId()).map(Event::getEventName).orElse("an event");
        String sportLabel = sport.getSport() != null ? sport.getSport().replace("_", " ") : "A sport";
        String title = "Sport change awaiting approval";
        String message = sportLabel + " in \"" + eventName + "\" has a proposed edit awaiting your approval.";
        String actionUrl = "/organizer/events/" + request.getEventId() + "/sports/" + request.getEventSportId();

        if (TIER_SPORT_HEAD.equals(request.getRequesterTier())) {
            for (UUID approverId : resolveEventManagers(request.getEventId())) {
                notificationService.systemNotify(title, message, NotificationType.SPORT_CHANGE_REQUESTED,
                        NotificationPriority.HIGH, NotificationTargetType.USER, approverId, actionUrl);
            }
        } else {
            notificationService.systemNotify(title, message, NotificationType.SPORT_CHANGE_REQUESTED,
                    NotificationPriority.HIGH, NotificationTargetType.PLATFORM_ADMINS, request.getEventId(), actionUrl);
        }
    }

    /** EVENT_HEAD(s) with an approved event-level assignment, plus the organiser-owner if the event has one. */
    private List<UUID> resolveEventManagers(UUID eventId) {
        java.util.LinkedHashSet<UUID> managerIds = new java.util.LinkedHashSet<>();
        eventRepository.findById(eventId).ifPresent(event -> {
            if ("ORGANISER".equals(event.getOwnerType()) && event.getOwnerId() != null) {
                managerIds.add(event.getOwnerId());
            }
        });
        authorizationService.findApprovedEventHeadUserIds(eventId).forEach(managerIds::add);
        return List.copyOf(managerIds);
    }

    private String serialize(UpdateSportsDTO dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize proposed sport changes", e);
        }
    }

    private UpdateSportsDTO deserialize(String json) {
        try {
            return objectMapper.readValue(json, UpdateSportsDTO.class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize proposed sport changes", e);
        }
    }

    private String userName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(this::displayName).orElse(null);
    }

    private String displayName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return !full.isBlank() ? full : user.getUsername();
    }

    private SportChangeRequestResponseDTO toResponse(SportChangeRequest r) {
        SportChangeRequestResponseDTO dto = new SportChangeRequestResponseDTO();
        dto.setId(r.getId());
        dto.setEventSportId(r.getEventSportId());
        dto.setEventId(r.getEventId());
        eventSportsRepository.findById(r.getEventSportId())
                .ifPresent(sport -> dto.setSportName(sport.getSport()));
        dto.setRequestedBy(r.getRequestedBy());
        dto.setRequestedByName(userName(r.getRequestedBy()));
        dto.setRequesterTier(r.getRequesterTier());
        dto.setProposedChanges(deserialize(r.getProposedChangesJson()));
        dto.setStatus(r.getStatus());
        dto.setReviewedBy(r.getReviewedBy());
        dto.setReviewedByName(userName(r.getReviewedBy()));
        dto.setReviewedAt(r.getReviewedAt());
        dto.setRejectionReason(r.getRejectionReason());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
