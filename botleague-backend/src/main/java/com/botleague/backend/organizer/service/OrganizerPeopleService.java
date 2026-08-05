package com.botleague.backend.organizer.service;

import com.botleague.backend.organizer.dto.OrganizerDTOs.*;
import com.botleague.backend.organizer.entity.*;
import com.botleague.backend.organizer.enums.VolunteerStatus;
import com.botleague.backend.organizer.repository.*;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.role.service.UserRoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.botleague.backend.common.exception.ResourceNotFoundException;

/**
 * Manages volunteers, judges, staff, and arenas for organiser events.
 */
@Service
@Transactional
public class OrganizerPeopleService {

    private final EventArenaRepository     arenaRepo;
    private final EventVolunteerRepository volunteerRepo;
    private final EventJudgeRepository     judgeRepo;
    private final EventStaffRepository     staffRepo;
    private final EventRepository          eventRepo;
    private final UserRoleService          userRoleService;
    private final NotificationService      notificationService;

    public OrganizerPeopleService(
            EventArenaRepository     arenaRepo,
            EventVolunteerRepository volunteerRepo,
            EventJudgeRepository     judgeRepo,
            EventStaffRepository     staffRepo,
            EventRepository          eventRepo,
            UserRoleService          userRoleService,
            NotificationService      notificationService) {
        this.arenaRepo     = arenaRepo;
        this.volunteerRepo = volunteerRepo;
        this.judgeRepo     = judgeRepo;
        this.staffRepo     = staffRepo;
        this.eventRepo     = eventRepo;
        this.userRoleService = userRoleService;
        this.notificationService = notificationService;
    }

    // ── ARENA ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ArenaResponse> getArenas(UUID eventId) {
        return arenaRepo.findByEventIdAndIsActive(eventId, true).stream().map(this::toArenaResponse).collect(Collectors.toList());
    }

    public ArenaResponse createArena(UUID eventId, ArenaRequest req) {
        EventArena a = new EventArena();
        a.setEventId(eventId);
        a.setArenaName(req.arenaName);
        a.setCapacity(req.capacity);
        a.setLocationNotes(req.locationNotes);
        a.setSportType(req.sportType);
        return toArenaResponse(arenaRepo.save(a));
    }

    public ArenaResponse updateArena(UUID arenaId, ArenaRequest req) {
        EventArena a = arenaRepo.findById(arenaId).orElseThrow(() -> new ResourceNotFoundException("Arena not found"));
        if (req.arenaName    != null) a.setArenaName(req.arenaName);
        if (req.capacity     != null) a.setCapacity(req.capacity);
        if (req.locationNotes!= null) a.setLocationNotes(req.locationNotes);
        if (req.sportType    != null) a.setSportType(req.sportType);
        return toArenaResponse(arenaRepo.save(a));
    }

    public void deleteArena(UUID arenaId) {
        EventArena a = arenaRepo.findById(arenaId).orElseThrow(() -> new ResourceNotFoundException("Arena not found"));
        a.setIsActive(false);
        arenaRepo.save(a);
    }

    // ── VOLUNTEER ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VolunteerResponse> getVolunteers(UUID eventId) {
        return volunteerRepo.findByEventId(eventId).stream().map(this::toVolunteerResponse).collect(Collectors.toList());
    }

    public VolunteerResponse createVolunteer(UUID eventId, VolunteerRequest req) {
        EventVolunteer v = new EventVolunteer();
        v.setEventId(eventId);
        v.setName(req.name);
        v.setEmail(req.email);
        v.setPhone(req.phone);
        v.setDutyStation(req.dutyStation);
        v.setShift(req.shift);
        v.setNotes(req.notes);
        return toVolunteerResponse(volunteerRepo.save(v));
    }

    public VolunteerResponse updateVolunteer(UUID volunteerId, VolunteerRequest req) {
        EventVolunteer v = volunteerRepo.findById(volunteerId).orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));
        if (req.name        != null) v.setName(req.name);
        if (req.email       != null) v.setEmail(req.email);
        if (req.phone       != null) v.setPhone(req.phone);
        if (req.dutyStation != null) v.setDutyStation(req.dutyStation);
        if (req.shift       != null) v.setShift(req.shift);
        if (req.notes       != null) v.setNotes(req.notes);
        return toVolunteerResponse(volunteerRepo.save(v));
    }

    public VolunteerResponse checkInVolunteer(UUID volunteerId) {
        EventVolunteer v = volunteerRepo.findById(volunteerId).orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));
        v.setCheckedInAt(LocalDateTime.now());
        return toVolunteerResponse(volunteerRepo.save(v));
    }

    public VolunteerResponse checkOutVolunteer(UUID volunteerId) {
        EventVolunteer v = volunteerRepo.findById(volunteerId).orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));
        v.setCheckedOutAt(LocalDateTime.now());
        return toVolunteerResponse(volunteerRepo.save(v));
    }

    public void deleteVolunteer(UUID volunteerId) {
        volunteerRepo.deleteById(volunteerId);
    }

    /**
     * Organiser decision on a self-service volunteer application.
     * Approving auto-grants the platform-wide VOLUNTEER role (idempotent —
     * the applicant already holds it in practice since only VOLUNTEER-role
     * accounts can apply, but this keeps the grant authoritative rather than
     * assumed) and notifies the applicant either way.
     */
    public VolunteerResponse decideVolunteerApplication(UUID volunteerId, VolunteerStatus decision, UUID deciderId, String reason) {
        if (decision != VolunteerStatus.APPROVED && decision != VolunteerStatus.REJECTED) {
            throw ApiException.badRequest("Decision must be APPROVED or REJECTED");
        }
        EventVolunteer v = volunteerRepo.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));
        if (v.getStatus() != VolunteerStatus.PENDING) {
            throw ApiException.badRequest("This application has already been decided.");
        }

        v.setStatus(decision);
        v.setDecidedAt(LocalDateTime.now());
        v.setDecidedBy(deciderId);
        EventVolunteer saved = volunteerRepo.save(v);

        if (decision == VolunteerStatus.APPROVED && v.getUserId() != null) {
            userRoleService.assignRole(v.getUserId(), AccountType.VOLUNTEER);
        }

        if (v.getUserId() != null) {
            String eventName = eventRepo.findById(v.getEventId()).map(e -> e.getEventName()).orElse("the event");
            boolean approved = decision == VolunteerStatus.APPROVED;
            notificationService.systemNotify(
                    approved ? "Volunteer application approved" : "Volunteer application update",
                    approved
                            ? "You're confirmed as a volunteer for " + eventName + ". Check your duty station and shift."
                            : "Your volunteer application for " + eventName + " was not approved"
                                    + (reason != null && !reason.isBlank() ? ": " + reason : "."),
                    NotificationType.CUSTOM_UPDATE,
                    NotificationPriority.MEDIUM,
                    NotificationTargetType.USER,
                    v.getUserId(),
                    "/volunteer/event"
            );
        }

        return toVolunteerResponse(saved);
    }

    // ── JUDGE ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<JudgeResponse> getJudges(UUID eventId) {
        return judgeRepo.findByEventId(eventId).stream().map(this::toJudgeResponse).collect(Collectors.toList());
    }

    public JudgeResponse createJudge(UUID eventId, JudgeRequest req) {
        EventJudge j = new EventJudge();
        j.setEventId(eventId);
        j.setName(req.name);
        j.setEmail(req.email);
        j.setPhone(req.phone);
        j.setCredentials(req.credentials);
        j.setAssignedSportId(req.assignedSportId);
        j.setAssignedArena(req.assignedArena);
        j.setScoringRights(req.scoringRights != null ? req.scoringRights : true);
        j.setNotes(req.notes);
        return toJudgeResponse(judgeRepo.save(j));
    }

    public JudgeResponse updateJudge(UUID judgeId, JudgeRequest req) {
        EventJudge j = judgeRepo.findById(judgeId).orElseThrow(() -> new ResourceNotFoundException("Judge not found"));
        if (req.name            != null) j.setName(req.name);
        if (req.email           != null) j.setEmail(req.email);
        if (req.phone           != null) j.setPhone(req.phone);
        if (req.credentials     != null) j.setCredentials(req.credentials);
        if (req.assignedSportId != null) j.setAssignedSportId(req.assignedSportId);
        if (req.assignedArena   != null) j.setAssignedArena(req.assignedArena);
        if (req.scoringRights   != null) j.setScoringRights(req.scoringRights);
        if (req.notes           != null) j.setNotes(req.notes);
        return toJudgeResponse(judgeRepo.save(j));
    }

    public void deleteJudge(UUID judgeId) {
        judgeRepo.deleteById(judgeId);
    }

    // ── STAFF ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StaffResponse> getStaff(UUID eventId) {
        return staffRepo.findByEventId(eventId).stream().map(this::toStaffResponse).collect(Collectors.toList());
    }

    public StaffResponse createStaff(UUID eventId, StaffRequest req) {
        EventStaff s = new EventStaff();
        s.setEventId(eventId);
        s.setName(req.name);
        s.setEmail(req.email);
        s.setPhone(req.phone);
        s.setStaffType(req.staffType);
        s.setDutyDescription(req.dutyDescription);
        s.setShift(req.shift);
        return toStaffResponse(staffRepo.save(s));
    }

    public StaffResponse updateStaff(UUID staffId, StaffRequest req) {
        EventStaff s = staffRepo.findById(staffId).orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        if (req.name            != null) s.setName(req.name);
        if (req.email           != null) s.setEmail(req.email);
        if (req.phone           != null) s.setPhone(req.phone);
        if (req.staffType       != null) s.setStaffType(req.staffType);
        if (req.dutyDescription != null) s.setDutyDescription(req.dutyDescription);
        if (req.shift           != null) s.setShift(req.shift);
        return toStaffResponse(staffRepo.save(s));
    }

    public StaffResponse checkInStaff(UUID staffId) {
        EventStaff s = staffRepo.findById(staffId).orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        s.setCheckedInAt(LocalDateTime.now());
        return toStaffResponse(staffRepo.save(s));
    }

    public StaffResponse checkOutStaff(UUID staffId) {
        EventStaff s = staffRepo.findById(staffId).orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        s.setCheckedOutAt(LocalDateTime.now());
        return toStaffResponse(staffRepo.save(s));
    }

    public void deleteStaff(UUID staffId) {
        staffRepo.deleteById(staffId);
    }

    // ── MAPPERS ──────────────────────────────────────────────────────────────

    private ArenaResponse toArenaResponse(EventArena a) {
        ArenaResponse r = new ArenaResponse();
        r.id = a.getId(); r.eventId = a.getEventId(); r.arenaName = a.getArenaName();
        r.capacity = a.getCapacity(); r.locationNotes = a.getLocationNotes();
        r.sportType = a.getSportType(); r.isActive = a.getIsActive(); r.createdAt = a.getCreatedAt();
        return r;
    }

    private VolunteerResponse toVolunteerResponse(EventVolunteer v) {
        VolunteerResponse r = new VolunteerResponse();
        r.id = v.getId(); r.eventId = v.getEventId(); r.userId = v.getUserId(); r.name = v.getName();
        r.email = v.getEmail(); r.phone = v.getPhone(); r.dutyStation = v.getDutyStation();
        r.shift = v.getShift(); r.notes = v.getNotes();
        r.checkedInAt = v.getCheckedInAt(); r.checkedOutAt = v.getCheckedOutAt();
        r.status = v.getStatus() != null ? v.getStatus().name() : null;
        r.appliedAt = v.getAppliedAt(); r.decidedAt = v.getDecidedAt();
        r.createdAt = v.getCreatedAt();
        return r;
    }

    private JudgeResponse toJudgeResponse(EventJudge j) {
        JudgeResponse r = new JudgeResponse();
        r.id = j.getId(); r.eventId = j.getEventId(); r.name = j.getName();
        r.email = j.getEmail(); r.phone = j.getPhone(); r.credentials = j.getCredentials();
        r.assignedSportId = j.getAssignedSportId(); r.assignedArena = j.getAssignedArena();
        r.scoringRights = j.getScoringRights(); r.notes = j.getNotes(); r.createdAt = j.getCreatedAt();
        return r;
    }

    private StaffResponse toStaffResponse(EventStaff s) {
        StaffResponse r = new StaffResponse();
        r.id = s.getId(); r.eventId = s.getEventId(); r.name = s.getName();
        r.email = s.getEmail(); r.phone = s.getPhone(); r.staffType = s.getStaffType();
        r.dutyDescription = s.getDutyDescription(); r.shift = s.getShift();
        r.checkedInAt = s.getCheckedInAt(); r.checkedOutAt = s.getCheckedOutAt();
        r.createdAt = s.getCreatedAt();
        return r;
    }
}
