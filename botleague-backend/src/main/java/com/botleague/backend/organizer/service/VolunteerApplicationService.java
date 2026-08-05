package com.botleague.backend.organizer.service;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.organizer.dto.OrganizerDTOs.VolunteerApplicationRequest;
import com.botleague.backend.organizer.dto.OrganizerDTOs.VolunteerAssignmentResponse;
import com.botleague.backend.organizer.dto.OrganizerDTOs.VolunteerResponse;
import com.botleague.backend.organizer.entity.EventVolunteer;
import com.botleague.backend.organizer.enums.VolunteerStatus;
import com.botleague.backend.organizer.repository.EventVolunteerRepository;
import com.botleague.backend.role.service.UserRoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Self-service volunteer applications — the "user applies, organiser
 * approves" half of the workflow. Organiser-side review lives in
 * OrganizerPeopleService.decideVolunteerApplication, which shares the same
 * EventVolunteer rows this service creates.
 */
@Service
@Transactional
public class VolunteerApplicationService {

    private final EventVolunteerRepository volunteerRepo;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final UserRoleService userRoleService;
    private final NotificationService notificationService;
    private final AuthorizationService authorizationService;

    public VolunteerApplicationService(
            EventVolunteerRepository volunteerRepo,
            EventRepository eventRepository,
            UserRepository userRepository,
            UserRoleService userRoleService,
            NotificationService notificationService,
            AuthorizationService authorizationService) {
        this.volunteerRepo = volunteerRepo;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.userRoleService = userRoleService;
        this.notificationService = notificationService;
        this.authorizationService = authorizationService;
    }

    @Transactional(readOnly = true)
    public VolunteerResponse getMyApplication(UUID eventId, UUID userId) {
        return volunteerRepo.findByEventIdAndUserId(eventId, userId)
                .map(this::toResponse)
                .orElse(null);
    }

    /** Every volunteer application/assignment this user has ever made, across all events, newest first. */
    @Transactional(readOnly = true)
    public List<VolunteerAssignmentResponse> getMyAssignments(UUID userId) {
        return volunteerRepo.findByUserId(userId).stream()
                .sorted(Comparator.comparing(EventVolunteer::getCreatedAt).reversed())
                .map(v -> {
                    VolunteerAssignmentResponse r = new VolunteerAssignmentResponse();
                    r.id = v.getId();
                    r.eventId = v.getEventId();
                    eventRepository.findById(v.getEventId()).ifPresent(e -> {
                        r.eventName = e.getEventName();
                        r.eventCity = e.getCity();
                        r.eventStartDate = e.getStartDate();
                        r.eventEndDate = e.getEndDate();
                    });
                    r.dutyStation = v.getDutyStation();
                    r.shift = v.getShift();
                    r.checkedInAt = v.getCheckedInAt();
                    r.checkedOutAt = v.getCheckedOutAt();
                    r.status = v.getStatus() != null ? v.getStatus().name() : null;
                    r.appliedAt = v.getAppliedAt();
                    r.decidedAt = v.getDecidedAt();
                    return r;
                })
                .collect(Collectors.toList());
    }

    public VolunteerResponse apply(UUID eventId, UUID userId, VolunteerApplicationRequest req) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (!event.isVolunteersNeeded()) {
            throw ApiException.badRequest("This event is not accepting volunteer applications.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean eligible = user.getAccountType() == AccountType.VOLUNTEER
                || userRoleService.hasRole(userId, AccountType.VOLUNTEER);
        if (!eligible) {
            throw ApiException.forbidden("Only accounts registered as a Volunteer can apply to volunteer.");
        }

        volunteerRepo.findByEventIdAndUserId(eventId, userId).ifPresent(existing -> {
            if (existing.getStatus() != VolunteerStatus.REJECTED) {
                throw ApiException.conflict("You already have a volunteer application for this event.");
            }
            // A previously-rejected applicant may re-apply — remove the old
            // row so the new one starts a clean PENDING review cycle.
            volunteerRepo.delete(existing);
        });

        EventVolunteer v = new EventVolunteer();
        v.setEventId(eventId);
        v.setUserId(userId);
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "")
                + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();
        v.setName(fullName.isBlank() ? "Volunteer applicant" : fullName);
        v.setEmail(user.getEmail());
        v.setPhone(user.getPhone());
        v.setShift(req != null ? req.shift : null);
        v.setNotes(req != null ? req.notes : null);
        v.setStatus(VolunteerStatus.PENDING);
        v.setAppliedAt(LocalDateTime.now());

        EventVolunteer saved = volunteerRepo.save(v);

        for (UUID managerId : authorizationService.findApprovedEventHeadUserIds(eventId)) {
            notificationService.systemNotify(
                    "New volunteer application",
                    v.getName() + " applied to volunteer for " + event.getEventName() + ".",
                    NotificationType.CUSTOM_ANNOUNCEMENT,
                    NotificationPriority.MEDIUM,
                    NotificationTargetType.USER,
                    managerId,
                    "/organizer/volunteers?eventId=" + eventId
            );
        }
        if ("ORGANISER".equals(event.getOwnerType()) && event.getOwnerId() != null) {
            notificationService.systemNotify(
                    "New volunteer application",
                    v.getName() + " applied to volunteer for " + event.getEventName() + ".",
                    NotificationType.CUSTOM_ANNOUNCEMENT,
                    NotificationPriority.MEDIUM,
                    NotificationTargetType.USER,
                    event.getOwnerId(),
                    "/organizer/volunteers?eventId=" + eventId
            );
        }

        return toResponse(saved);
    }

    private VolunteerResponse toResponse(EventVolunteer v) {
        VolunteerResponse r = new VolunteerResponse();
        r.id = v.getId();
        r.eventId = v.getEventId();
        r.userId = v.getUserId();
        r.name = v.getName();
        r.email = v.getEmail();
        r.phone = v.getPhone();
        r.dutyStation = v.getDutyStation();
        r.shift = v.getShift();
        r.notes = v.getNotes();
        r.checkedInAt = v.getCheckedInAt();
        r.checkedOutAt = v.getCheckedOutAt();
        r.status = v.getStatus() != null ? v.getStatus().name() : null;
        r.appliedAt = v.getAppliedAt();
        r.decidedAt = v.getDecidedAt();
        r.createdAt = v.getCreatedAt();
        return r;
    }
}
