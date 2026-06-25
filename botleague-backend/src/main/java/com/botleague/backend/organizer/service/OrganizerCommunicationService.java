package com.botleague.backend.organizer.service;

import com.botleague.backend.organizer.dto.OrganizerDTOs.*;
import com.botleague.backend.organizer.entity.EventAnnouncement;
import com.botleague.backend.organizer.entity.EventIncident;
import com.botleague.backend.organizer.repository.EventAnnouncementRepository;
import com.botleague.backend.organizer.repository.EventIncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages event announcements and incident reports for the organiser portal.
 */
@Service
@Transactional
public class OrganizerCommunicationService {

    private final EventAnnouncementRepository announcementRepo;
    private final EventIncidentRepository     incidentRepo;

    public OrganizerCommunicationService(
            EventAnnouncementRepository announcementRepo,
            EventIncidentRepository     incidentRepo) {
        this.announcementRepo = announcementRepo;
        this.incidentRepo     = incidentRepo;
    }

    // ── ANNOUNCEMENTS ────────────────────────────────────────────────────────

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
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        if (req.title      != null) a.setTitle(req.title);
        if (req.body       != null) a.setBody(req.body);
        if (req.targetType != null) a.setTargetType(req.targetType);
        if (req.isPinned   != null) a.setIsPinned(req.isPinned);
        return toAnnouncementResponse(announcementRepo.save(a));
    }

    public void deleteAnnouncement(UUID announcementId) {
        announcementRepo.deleteById(announcementId);
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
                .orElseThrow(() -> new RuntimeException("Incident not found"));
        if (req.status          != null) i.setStatus(req.status.toUpperCase());
        if (req.resolutionNotes != null) i.setResolutionNotes(req.resolutionNotes);
        if ("RESOLVED".equalsIgnoreCase(req.status) || "CLOSED".equalsIgnoreCase(req.status)) {
            i.setResolvedAt(LocalDateTime.now());
        }
        return toIncidentResponse(incidentRepo.save(i));
    }

    public void deleteIncident(UUID incidentId) {
        incidentRepo.deleteById(incidentId);
    }

    // ── MAPPERS ──────────────────────────────────────────────────────────────

    private AnnouncementResponse toAnnouncementResponse(EventAnnouncement a) {
        AnnouncementResponse r = new AnnouncementResponse();
        r.id = a.getId(); r.eventId = a.getEventId(); r.title = a.getTitle();
        r.body = a.getBody(); r.targetType = a.getTargetType();
        r.targetSportId = a.getTargetSportId(); r.isPinned = a.getIsPinned();
        r.sentAt = a.getSentAt(); r.createdAt = a.getCreatedAt();
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
