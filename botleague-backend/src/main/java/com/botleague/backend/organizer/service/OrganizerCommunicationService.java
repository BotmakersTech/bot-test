package com.botleague.backend.organizer.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.botleague.backend.chat.entity.ChatRoom;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.organizer.dto.OrganizerDTOs.*;
import com.botleague.backend.organizer.dto.SportAnnounceRequest;
import com.botleague.backend.organizer.entity.EventAnnouncement;
import com.botleague.backend.organizer.entity.EventIncident;
import com.botleague.backend.organizer.entity.SupportContact;
import com.botleague.backend.organizer.repository.EventAnnouncementRepository;
import com.botleague.backend.organizer.repository.EventIncidentRepository;
import com.botleague.backend.organizer.repository.SupportContactRepository;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages event announcements (event-wide and sport-scoped), support
 * contacts, and incident reports for the organiser portal.
 */
@Service
@Transactional
public class OrganizerCommunicationService {

    private final EventAnnouncementRepository announcementRepo;
    private final EventIncidentRepository     incidentRepo;
    private final SupportContactRepository    supportContactRepo;
    private final EventRepository             eventRepository;
    private final EventSportsRepository       eventSportsRepository;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamMembershipRepository    teamMembershipRepository;
    private final ChatService                 chatService;
    private final NotificationService         notificationService;
    private final ObjectMapper                objectMapper;

    public OrganizerCommunicationService(
            EventAnnouncementRepository announcementRepo,
            EventIncidentRepository     incidentRepo,
            SupportContactRepository    supportContactRepo,
            EventRepository             eventRepository,
            EventSportsRepository       eventSportsRepository,
            SportRegistrationRepository sportRegistrationRepository,
            TeamMembershipRepository    teamMembershipRepository,
            ChatService                 chatService,
            NotificationService         notificationService,
            ObjectMapper                objectMapper) {
        this.announcementRepo = announcementRepo;
        this.incidentRepo     = incidentRepo;
        this.supportContactRepo = supportContactRepo;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.chatService = chatService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    // ── ANNOUNCEMENTS (event-wide, legacy CRUD) ─────────────────────────────

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements(UUID eventId) {
        return announcementRepo.findByEventIdOrderByCreatedAtDesc(eventId)
                .stream().map(this::toAnnouncementResponse).collect(Collectors.toList());
    }

    public AnnouncementResponse createAnnouncement(UUID eventId, UUID createdBy, AnnouncementRequest req) {
        EventAnnouncement a = new EventAnnouncement();
        a.setEventId(eventId);
        a.setCreatedBy(createdBy);
        a.setTitle(req.title);
        a.setBody(req.body);
        a.setTargetType(req.targetType != null ? req.targetType : "ALL");
        a.setTargetSportId(req.targetSportId);
        a.setIsPinned(req.isPinned != null ? req.isPinned : false);
        a.setSentAt(LocalDateTime.now());
        return toAnnouncementResponse(announcementRepo.save(a));
    }

    public AnnouncementResponse updateAnnouncement(UUID announcementId, AnnouncementRequest req) {
        EventAnnouncement a = announcementRepo.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        if (req.title      != null) a.setTitle(req.title);
        if (req.body       != null) a.setBody(req.body);
        if (req.targetType != null) a.setTargetType(req.targetType);
        if (req.isPinned   != null) a.setIsPinned(req.isPinned);
        return toAnnouncementResponse(announcementRepo.save(a));
    }

    public void deleteAnnouncement(UUID announcementId) {
        EventAnnouncement a = announcementRepo.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));
        announcementRepo.delete(a);
    }

    // ── SPORT ANNOUNCEMENTS (one-way organiser -> sport participants) ──────

    /**
     * Sends a one-way announcement to a sport's participants — either every
     * registered team, or a hand-picked subset. Notifies (in-app notification)
     * and posts into the sport's read-only SPORT_ANNOUNCEMENT chat room, then
     * persists an audit record.
     */
    public AnnouncementResponse sendSportAnnouncement(UUID eventId, UUID sportId, UUID senderId, SportAnnounceRequest req) {
        EventSports sport = eventSportsRepository.findById(sportId)
                .orElseThrow(() -> ApiException.notFound("Sport not found"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        boolean specific = "SPECIFIC_TEAMS".equals(req.getTargetType());
        List<UUID> teamIds = null;
        Set<UUID> recipientUserIds;

        if (specific) {
            if (req.getTeamIds() == null || req.getTeamIds().isEmpty()) {
                throw ApiException.badRequest("Select at least one participant to send to");
            }
            teamIds = req.getTeamIds().stream().map(UUID::fromString).collect(Collectors.toList());
            recipientUserIds = new LinkedHashSet<>();
            for (UUID teamId : teamIds) {
                teamMembershipRepository.findByTeamIdAndStatus(teamId, TeamMembershipStatus.ACTIVE)
                        .stream().map(TeamMembership::getUserId).forEach(recipientUserIds::add);
            }
        } else {
            recipientUserIds = new LinkedHashSet<>(notificationService.resolveSportRecipients(sportId));
        }

        String title = req.getTitle() != null && !req.getTitle().isBlank()
                ? req.getTitle()
                : sport.getSport().replace("_", " ") + " Announcement";
        String actionUrl = "/events/" + eventId + "/sports/" + sportId;

        // 1. Notify
        if (specific) {
            for (UUID userId : recipientUserIds) {
                notificationService.systemNotify(title, req.getMessage(), NotificationType.CUSTOM_ANNOUNCEMENT,
                        NotificationPriority.HIGH, NotificationTargetType.USER, userId, actionUrl);
            }
        } else {
            notificationService.systemNotify(title, req.getMessage(), NotificationType.CUSTOM_ANNOUNCEMENT,
                    NotificationPriority.HIGH, NotificationTargetType.SPORT, sportId, actionUrl);
        }

        // 2. Post into the sport's read-only announcement chat room.
        // Deliberately ALL-only: the room is one shared, persistent board per
        // sport, so a SPECIFIC_TEAMS message posted there would stay visible
        // to every team ever onboarded from a past ALL send, not just the
        // teams targeted this time. Specific-team sends still notify + show
        // up (correctly team-filtered) in the sport's Announcements tab —
        // they just don't get echoed into the shared chat room.
        if (!specific) {
            ChatRoom room = chatService.createSportAnnouncementChannel(
                    sportId, sport.getSport(), eventId, event.getEventName());
            for (UUID userId : recipientUserIds) {
                chatService.addParticipant(room.getId(), userId, false);
            }
            chatService.addParticipant(room.getId(), senderId, true);
            chatService.sendMessage(room.getId(), senderId, title + "\n\n" + req.getMessage());
        }

        // 3. Persist audit record
        EventAnnouncement a = new EventAnnouncement();
        a.setEventId(eventId);
        a.setCreatedBy(senderId);
        a.setTitle(title);
        a.setBody(req.getMessage());
        a.setTargetType(req.getTargetType());
        a.setTargetSportId(sportId);
        a.setTargetTeamIdsJson(specific ? serializeTeamIds(teamIds) : null);
        a.setAttachmentUrl(req.getAttachmentUrl());
        a.setAttachmentKey(req.getAttachmentKey());
        a.setAttachmentFileType(req.getAttachmentFileType());
        a.setIsPinned(false);
        a.setSentAt(LocalDateTime.now());
        return toAnnouncementResponse(announcementRepo.save(a));
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getSportAnnouncementsForOrganizer(UUID sportId) {
        return announcementRepo.findByTargetSportIdOrderByCreatedAtDesc(sportId)
                .stream().map(this::toAnnouncementResponse).collect(Collectors.toList());
    }

    /** Competitor-facing read — restricted to the sport's registered participants (or an organiser previewing). */
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getSportAnnouncementsForParticipant(UUID sportId, UUID callerId) {
        Set<UUID> callerTeamIds = teamMembershipRepository.findByUserId(callerId).stream()
                .filter(m -> m.getStatus() == TeamMembershipStatus.ACTIVE)
                .map(TeamMembership::getTeamId)
                .collect(Collectors.toSet());

        return announcementRepo.findByTargetSportIdOrderByCreatedAtDesc(sportId).stream()
                .filter(a -> {
                    if (!"SPECIFIC_TEAMS".equals(a.getTargetType())) return true;
                    List<UUID> targeted = deserializeTeamIds(a.getTargetTeamIdsJson());
                    return targeted.stream().anyMatch(callerTeamIds::contains);
                })
                .map(this::toAnnouncementResponse)
                .collect(Collectors.toList());
    }

    /** True if the caller is an active member of a team with a REGISTERED registration in this sport. */
    @Transactional(readOnly = true)
    public boolean isRegisteredParticipant(UUID sportId, UUID callerId) {
        Set<UUID> registeredTeamIds = sportRegistrationRepository
                .findByEventSportIdAndStatus(sportId, RegistrationStatus.REGISTERED)
                .stream().map(SportRegistration::getTeamId).filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        return teamMembershipRepository.findByUserId(callerId).stream()
                .filter(m -> m.getStatus() == TeamMembershipStatus.ACTIVE)
                .anyMatch(m -> registeredTeamIds.contains(m.getTeamId()));
    }

    private String serializeTeamIds(List<UUID> teamIds) {
        try {
            return objectMapper.writeValueAsString(teamIds);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize target team ids", e);
        }
    }

    private List<UUID> deserializeTeamIds(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<UUID>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    // ── SUPPORT CONTACTS ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SupportContactResponse> getSupportContacts(UUID eventId, UUID sportId) {
        List<SupportContact> contacts = sportId != null
                ? supportContactRepo.findByEventSportIdOrderByDisplayOrderAsc(sportId)
                : supportContactRepo.findByEventIdAndEventSportIdIsNullOrderByDisplayOrderAsc(eventId);
        return contacts.stream().map(this::toSupportContactResponse).collect(Collectors.toList());
    }

    /** Sport-scoped read with a fallback to the event-wide list when the sport has none of its own. */
    @Transactional(readOnly = true)
    public List<SupportContactResponse> getSupportContactsForSport(UUID eventId, UUID sportId) {
        List<SupportContact> sportContacts = supportContactRepo.findByEventSportIdOrderByDisplayOrderAsc(sportId);
        List<SupportContact> source = !sportContacts.isEmpty()
                ? sportContacts
                : supportContactRepo.findByEventIdAndEventSportIdIsNullOrderByDisplayOrderAsc(eventId);
        return source.stream().map(this::toSupportContactResponse).collect(Collectors.toList());
    }

    public SupportContactResponse createSupportContact(UUID eventId, SupportContactRequest req) {
        SupportContact c = new SupportContact();
        c.setEventId(eventId);
        c.setEventSportId(req.eventSportId);
        c.setName(req.name);
        c.setEmail(req.email);
        c.setPhone(req.phone);
        c.setRoleLabel(req.roleLabel);
        c.setDisplayOrder(req.displayOrder != null ? req.displayOrder : 0);
        return toSupportContactResponse(supportContactRepo.save(c));
    }

    public SupportContactResponse updateSupportContact(UUID contactId, SupportContactRequest req) {
        SupportContact c = supportContactRepo.findById(contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Support contact not found"));
        if (req.name != null) c.setName(req.name);
        if (req.email != null) c.setEmail(req.email);
        if (req.phone != null) c.setPhone(req.phone);
        if (req.roleLabel != null) c.setRoleLabel(req.roleLabel);
        if (req.displayOrder != null) c.setDisplayOrder(req.displayOrder);
        return toSupportContactResponse(supportContactRepo.save(c));
    }

    public void deleteSupportContact(UUID contactId) {
        SupportContact c = supportContactRepo.findById(contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Support contact not found"));
        supportContactRepo.delete(c);
    }

    /** Null if event-wide — used by the controller to decide event- vs sport-scoped authorization. */
    @Transactional(readOnly = true)
    public UUID getSupportContactEventSportId(UUID contactId) {
        return supportContactRepo.findById(contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Support contact not found"))
                .getEventSportId();
    }

    // ── INCIDENTS ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidents(UUID eventId) {
        return incidentRepo.findByEventIdOrderByCreatedAtDesc(eventId)
                .stream().map(this::toIncidentResponse).collect(Collectors.toList());
    }

    public IncidentResponse createIncident(UUID eventId, UUID reportedBy, IncidentRequest req) {
        EventIncident i = new EventIncident();
        i.setEventId(eventId);
        i.setReportedBy(reportedBy);
        i.setTitle(req.title);
        i.setDescription(req.description);
        i.setSeverity(req.severity != null ? req.severity.toUpperCase() : "LOW");
        i.setArenaName(req.arenaName);
        return toIncidentResponse(incidentRepo.save(i));
    }

    public IncidentResponse updateIncident(UUID incidentId, IncidentUpdateRequest req) {
        EventIncident i = incidentRepo.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        if (req.status          != null) i.setStatus(req.status.toUpperCase());
        if (req.resolutionNotes != null) i.setResolutionNotes(req.resolutionNotes);
        if ("RESOLVED".equalsIgnoreCase(req.status) || "CLOSED".equalsIgnoreCase(req.status)) {
            i.setResolvedAt(LocalDateTime.now());
        }
        return toIncidentResponse(incidentRepo.save(i));
    }

    public void deleteIncident(UUID incidentId) {
        EventIncident i = incidentRepo.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        incidentRepo.delete(i);
    }

    // ── MAPPERS ──────────────────────────────────────────────────────────────

    private AnnouncementResponse toAnnouncementResponse(EventAnnouncement a) {
        AnnouncementResponse r = new AnnouncementResponse();
        r.id = a.getId(); r.eventId = a.getEventId(); r.title = a.getTitle();
        r.body = a.getBody(); r.targetType = a.getTargetType();
        r.targetSportId = a.getTargetSportId(); r.isPinned = a.getIsPinned();
        r.targetTeamIds = deserializeTeamIds(a.getTargetTeamIdsJson());
        r.attachmentUrl = a.getAttachmentUrl(); r.attachmentFileType = a.getAttachmentFileType();
        if (a.getTargetSportId() != null) {
            eventSportsRepository.findById(a.getTargetSportId())
                    .ifPresent(s -> r.sportName = s.getSport());
        }
        r.sentAt = a.getSentAt(); r.createdAt = a.getCreatedAt();
        return r;
    }

    private SupportContactResponse toSupportContactResponse(SupportContact c) {
        SupportContactResponse r = new SupportContactResponse();
        r.id = c.getId(); r.eventId = c.getEventId(); r.eventSportId = c.getEventSportId();
        r.name = c.getName(); r.email = c.getEmail(); r.phone = c.getPhone();
        r.roleLabel = c.getRoleLabel(); r.displayOrder = c.getDisplayOrder();
        return r;
    }

    private IncidentResponse toIncidentResponse(EventIncident i) {
        IncidentResponse r = new IncidentResponse();
        r.id = i.getId(); r.eventId = i.getEventId(); r.title = i.getTitle();
        r.description = i.getDescription(); r.severity = i.getSeverity();
        r.status = i.getStatus(); r.arenaName = i.getArenaName();
        r.resolutionNotes = i.getResolutionNotes(); r.resolvedAt = i.getResolvedAt();
        r.createdAt = i.getCreatedAt();
        return r;
    }
}
