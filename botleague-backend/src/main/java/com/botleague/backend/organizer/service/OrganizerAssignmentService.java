package com.botleague.backend.organizer.service;

import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import com.botleague.backend.admin.repository.ResourceRoleAssignmentRepository;
import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.organizer.dto.AssignmentResponse;
import com.botleague.backend.organizer.dto.EventAssignmentRequest;
import com.botleague.backend.organizer.dto.SportAssignmentRequest;
import com.botleague.backend.role.service.UserRoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Resource-scoped role assignment: assigning/unassigning EVENT_HEAD and
 * SPORT_HEAD to a specific event/sport, backed by the unified
 * resource_role_assignments table. This is the single write path for both —
 * it used to be split across this service and UserManagementService, which
 * left the two out of sync (one granted the underlying role, the other didn't).
 */
@Service
@Transactional
public class OrganizerAssignmentService {

    private final ResourceRoleAssignmentRepository assignmentRepo;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final UserRoleService userRoleService;
    private final AuthorizationService authorizationService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public OrganizerAssignmentService(
            ResourceRoleAssignmentRepository assignmentRepo,
            UserRepository userRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            UserRoleService userRoleService,
            AuthorizationService authorizationService,
            NotificationService notificationService,
            AuditLogService auditLogService) {
        this.assignmentRepo = assignmentRepo;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.userRoleService = userRoleService;
        this.authorizationService = authorizationService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    // ── Event assignments (EVENT_HEAD) ──────────────────────────────────────────

    public AssignmentResponse assignUserToEvent(EventAssignmentRequest req, UUID assignedBy) {
        UUID userId  = req.getUserId();
        UUID eventId = req.getEventId();

        userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        if (assignmentRepo.existsByUserIdAndScopeTypeAndScopeIdAndStatus(
                userId, ResourceRoleAssignment.SCOPE_EVENT, eventId, ResourceRoleAssignment.STATUS_APPROVED)) {
            throw ApiException.conflict("User is already assigned to this event");
        }

        ResourceRoleAssignment assignment = new ResourceRoleAssignment();
        assignment.setUserId(userId);
        assignment.setScopeType(ResourceRoleAssignment.SCOPE_EVENT);
        assignment.setScopeId(eventId);
        assignment.setEventId(eventId);
        assignment.setRoleType("EVENT_HEAD");
        assignment.setOwnerChain(event.getOwnerType());
        assignment.setStatus(ResourceRoleAssignment.STATUS_APPROVED);
        assignment.setAssignedBy(assignedBy);
        assignment.setApprovedBy(assignedBy);
        assignment.setApprovedAt(LocalDateTime.now());
        ResourceRoleAssignment saved = assignmentRepo.save(assignment);

        // Assigning someone as EVENT_HEAD grants them the role if they don't
        // already hold it — idempotent, no-op if present.
        userRoleService.ensureEventHeadRole(userId);

        notificationService.systemNotify(
                "You've been made EVENT_HEAD",
                "You were assigned as EVENT_HEAD for \"" + event.getEventName() + "\".",
                NotificationType.ROLE_ASSIGNED, NotificationPriority.HIGH,
                NotificationTargetType.USER, userId,
                "/organizer/events/" + eventId
        );
        auditLogService.log("ROLE_ASSIGNED", "EVENT", eventId, event.getEventName(), null, "EVENT_HEAD:" + userId);

        return toResponse(saved, event, null);
    }

    public void unassignUserFromEvent(UUID userId, UUID eventId) {
        assignmentRepo.findByUserIdAndScopeTypeAndScopeId(userId, ResourceRoleAssignment.SCOPE_EVENT, eventId)
                .orElseThrow(() -> ApiException.notFound("Assignment not found"));
        assignmentRepo.deleteByUserIdAndScopeTypeAndScopeId(userId, ResourceRoleAssignment.SCOPE_EVENT, eventId);

        // Revoke the EVENT_HEAD role only if this user holds no other approved
        // event assignment — keeps the role in sync with actual assignments.
        long remaining = assignmentRepo.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_EVENT.equals(a.getScopeType())
                        && ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .count();
        if (remaining == 0) {
            userRoleService.revokeRole(userId, AccountType.EVENT_HEAD);
        }
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForEvent(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ApiException.notFound("Event not found"));
        return assignmentRepo.findByEventIdAndScopeType(eventId, ResourceRoleAssignment.SCOPE_EVENT).stream()
                .map(a -> toResponse(a, event, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForUser(UUID userId) {
        return assignmentRepo.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_EVENT.equals(a.getScopeType()))
                .map(a -> {
                    Event event = eventRepository.findById(a.getEventId()).orElse(null);
                    return toResponse(a, event, null);
                })
                .collect(Collectors.toList());
    }

    // ── Sport assignments (SPORT_HEAD) ──────────────────────────────────────────
    // Two-step: ADMIN/ORGANISER initiates (PENDING_APPROVAL), the event's
    // EVENT_HEAD (or ADMIN/ORGANISER) approves — mirrors the sport-approval
    // precedent in EventSportsService. The SPORT_HEAD role is only granted
    // on approval.

    public AssignmentResponse assignUserToSport(SportAssignmentRequest req, UUID assignedBy) {
        UUID userId       = req.getUserId();
        UUID eventSportId = req.getEventSportId();

        userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        EventSports sport = eventSportsRepository.findById(eventSportId)
                .orElseThrow(() -> ApiException.notFound("Sport not found"));
        Event event = eventRepository.findById(sport.getEventId())
                .orElseThrow(() -> ApiException.notFound("Event not found"));

        ResourceRoleAssignment assignment = assignmentRepo
                .findByUserIdAndScopeTypeAndScopeId(userId, ResourceRoleAssignment.SCOPE_SPORT, eventSportId)
                .orElse(null);

        if (assignment != null && ResourceRoleAssignment.STATUS_APPROVED.equals(assignment.getStatus())) {
            throw ApiException.conflict("User is already assigned to this sport");
        }

        if (assignment == null) {
            assignment = new ResourceRoleAssignment();
            assignment.setUserId(userId);
            assignment.setScopeType(ResourceRoleAssignment.SCOPE_SPORT);
            assignment.setScopeId(eventSportId);
        }
        // Re-submitting a previously rejected assignment reuses the same row
        // instead of colliding with the unique (user, scope, role) constraint.
        assignment.setEventId(sport.getEventId());
        assignment.setRoleType("SPORT_HEAD");
        assignment.setOwnerChain(event.getOwnerType());
        assignment.setStatus(ResourceRoleAssignment.STATUS_PENDING_APPROVAL);
        assignment.setAssignedBy(assignedBy);
        assignment.setApprovedBy(null);
        assignment.setApprovedAt(null);
        assignment.setRejectionReason(null);
        ResourceRoleAssignment saved = assignmentRepo.save(assignment);

        // Notify every EVENT_HEAD/ORGANISER-owner of this event that a
        // SPORT_HEAD assignment needs their approval.
        for (UUID approverId : eventApproverIds(event)) {
            notificationService.systemNotify(
                    "Sport-head assignment pending approval",
                    "A SPORT_HEAD assignment for " + sport.getSport() + " in \"" + event.getEventName()
                            + "\" is waiting for your approval.",
                    NotificationType.SPORT_SUBMITTED_FOR_APPROVAL, NotificationPriority.HIGH,
                    NotificationTargetType.USER, approverId,
                    "/organizer/events/" + event.getId() + "/sports/" + eventSportId
            );
        }

        return toResponse(saved, event, sport);
    }

    /** EVENT_HEADs assigned to the event, plus the organiser owner if applicable. */
    private java.util.Set<UUID> eventApproverIds(Event event) {
        java.util.Set<UUID> ids = assignmentRepo.findByEventIdAndScopeType(event.getId(), ResourceRoleAssignment.SCOPE_EVENT)
                .stream()
                .filter(a -> ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .map(ResourceRoleAssignment::getUserId)
                .collect(Collectors.toCollection(java.util.HashSet::new));
        if ("ORGANISER".equals(event.getOwnerType()) && event.getOwnerId() != null) {
            ids.add(event.getOwnerId());
        }
        return ids;
    }

    public AssignmentResponse approveSportAssignment(UUID assignmentId, UUID approverId) {
        ResourceRoleAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> ApiException.notFound("Assignment not found"));

        if (!ResourceRoleAssignment.SCOPE_SPORT.equals(assignment.getScopeType())) {
            throw ApiException.badRequest("Not a sport assignment");
        }
        authorizationService.assertCanManageEvent(approverId, assignment.getEventId());

        if (!ResourceRoleAssignment.STATUS_PENDING_APPROVAL.equals(assignment.getStatus())) {
            throw ApiException.conflict("Only PENDING_APPROVAL assignments can be approved");
        }

        assignment.setStatus(ResourceRoleAssignment.STATUS_APPROVED);
        assignment.setApprovedBy(approverId);
        assignment.setApprovedAt(LocalDateTime.now());
        ResourceRoleAssignment saved = assignmentRepo.save(assignment);

        userRoleService.ensureSportHeadRole(saved.getUserId());

        EventSports sport = eventSportsRepository.findById(saved.getScopeId()).orElse(null);
        Event event = eventRepository.findById(saved.getEventId()).orElse(null);

        notificationService.systemNotify(
                "Sport-head assignment approved",
                "You're now SPORT_HEAD for " + (sport != null ? sport.getSport() : "a sport")
                        + (event != null ? " in \"" + event.getEventName() + "\"." : "."),
                NotificationType.ROLE_ASSIGNMENT_APPROVED, NotificationPriority.HIGH,
                NotificationTargetType.USER, saved.getUserId(),
                "/organizer/my-sports"
        );
        auditLogService.log("ROLE_ASSIGNMENT_APPROVED", "SPORT", saved.getScopeId(),
                sport != null ? sport.getSport() : null, "PENDING_APPROVAL", "APPROVED:" + saved.getUserId());

        return toResponse(saved, event, sport);
    }

    public AssignmentResponse rejectSportAssignment(UUID assignmentId, String reason, UUID approverId) {
        ResourceRoleAssignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> ApiException.notFound("Assignment not found"));

        if (!ResourceRoleAssignment.SCOPE_SPORT.equals(assignment.getScopeType())) {
            throw ApiException.badRequest("Not a sport assignment");
        }
        authorizationService.assertCanManageEvent(approverId, assignment.getEventId());

        if (!ResourceRoleAssignment.STATUS_PENDING_APPROVAL.equals(assignment.getStatus())) {
            throw ApiException.conflict("Only PENDING_APPROVAL assignments can be rejected");
        }

        assignment.setStatus(ResourceRoleAssignment.STATUS_REJECTED);
        assignment.setRejectionReason(reason);
        ResourceRoleAssignment saved = assignmentRepo.save(assignment);

        EventSports sport = eventSportsRepository.findById(saved.getScopeId()).orElse(null);
        Event event = eventRepository.findById(saved.getEventId()).orElse(null);

        notificationService.systemNotify(
                "Sport-head assignment rejected",
                "Your SPORT_HEAD assignment for " + (sport != null ? sport.getSport() : "a sport")
                        + " was rejected" + (reason != null && !reason.isBlank() ? ": " + reason : "."),
                NotificationType.ROLE_ASSIGNMENT_REJECTED, NotificationPriority.HIGH,
                NotificationTargetType.USER, saved.getUserId(),
                event != null ? "/organizer/events/" + event.getId() : null
        );
        auditLogService.log("ROLE_ASSIGNMENT_REJECTED", "SPORT", saved.getScopeId(),
                sport != null ? sport.getSport() : null, "PENDING_APPROVAL", "REJECTED:" + saved.getUserId(), reason);

        return toResponse(saved, event, sport);
    }

    public void unassignUserFromSport(UUID userId, UUID eventSportId) {
        assignmentRepo.findByUserIdAndScopeTypeAndScopeId(userId, ResourceRoleAssignment.SCOPE_SPORT, eventSportId)
                .orElseThrow(() -> ApiException.notFound("Assignment not found"));
        assignmentRepo.deleteByUserIdAndScopeTypeAndScopeId(userId, ResourceRoleAssignment.SCOPE_SPORT, eventSportId);

        long remaining = assignmentRepo.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_SPORT.equals(a.getScopeType())
                        && ResourceRoleAssignment.STATUS_APPROVED.equals(a.getStatus()))
                .count();
        if (remaining == 0) {
            userRoleService.revokeRole(userId, AccountType.SPORT_HEAD);
        }
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForSport(UUID eventSportId) {
        EventSports sport = eventSportsRepository.findById(eventSportId)
                .orElseThrow(() -> ApiException.notFound("Sport not found"));
        Event event = eventRepository.findById(sport.getEventId()).orElse(null);
        return assignmentRepo.findByScopeTypeAndScopeId(ResourceRoleAssignment.SCOPE_SPORT, eventSportId).stream()
                .map(a -> toResponse(a, event, sport))
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AssignmentResponse toResponse(ResourceRoleAssignment a, Event event, EventSports sport) {
        User user = userRepository.findById(a.getUserId()).orElse(null);
        AssignmentResponse resp = new AssignmentResponse();
        resp.setId(a.getId());
        resp.setUserId(a.getUserId());
        resp.setUsername(user != null ? user.getUsername() : null);
        resp.setUserDisplayName(user != null && user.getFirstName() != null
                ? user.getFirstName() + (user.getLastName() != null ? " " + user.getLastName() : "")
                : (user != null ? user.getUsername() : null));
        resp.setUserEmail(user != null ? user.getEmail() : null);
        resp.setEventId(a.getEventId());
        resp.setEventName(event != null ? event.getEventName() : null);
        resp.setEventCode(event != null ? event.getEventCode() : null);
        resp.setAssignedBy(a.getAssignedBy());
        resp.setAssignedAt(a.getAssignedAt());
        resp.setAssignmentType(a.getScopeType());
        resp.setRoleType(a.getRoleType());
        resp.setOwnerChain(a.getOwnerChain());
        resp.setStatus(a.getStatus());
        resp.setRejectionReason(a.getRejectionReason());
        if (ResourceRoleAssignment.SCOPE_SPORT.equals(a.getScopeType())) {
            resp.setEventSportId(a.getScopeId());
            resp.setSportName(sport != null ? sport.getSport() : null);
        }
        return resp;
    }
}
