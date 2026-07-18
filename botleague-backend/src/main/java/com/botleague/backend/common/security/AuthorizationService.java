package com.botleague.backend.common.security;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import com.botleague.backend.admin.repository.ResourceRoleAssignmentRepository;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.organizer.repository.EventJudgeRepository;
import com.botleague.backend.role.repository.UserRoleRepository;

/**
 * Single source of truth for "can this user manage this resource" — replaces
 * the scope-check logic that used to be duplicated independently across
 * EventService, AdminService, EventSportsService, MatchService and
 * OrganizerCommunicationController.
 *
 * Resolution order for event/sport management is always:
 *   platform admin (SUPER_ADMIN/ADMIN) > organiser owner (events.owner_type=ORGANISER,
 *   owner_id=userId) > an APPROVED resource_role_assignments row scoped to the resource.
 */
@Service
public class AuthorizationService {

    private final UserRoleRepository userRoleRepository;
    private final ResourceRoleAssignmentRepository resourceRoleAssignmentRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final EventJudgeRepository eventJudgeRepository;

    public AuthorizationService(
            UserRoleRepository userRoleRepository,
            ResourceRoleAssignmentRepository resourceRoleAssignmentRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            EventJudgeRepository eventJudgeRepository) {
        this.userRoleRepository = userRoleRepository;
        this.resourceRoleAssignmentRepository = resourceRoleAssignmentRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.eventJudgeRepository = eventJudgeRepository;
    }

    // ── Checks ───────────────────────────────────────────────────────────

    public boolean isPlatformAdmin(UUID userId) {
        return userRoleRepository.existsByUserIdAndRoleType(userId, AccountType.SUPER_ADMIN)
                || userRoleRepository.existsByUserIdAndRoleType(userId, AccountType.ADMIN);
    }

    public boolean isOrganiserOwner(UUID userId, UUID eventId) {
        if (userId == null || eventId == null) return false;
        return eventRepository.findById(eventId)
                .map(e -> "ORGANISER".equals(e.getOwnerType()) && userId.equals(e.getOwnerId()))
                .orElse(false);
    }

    public boolean canManageEvent(UUID userId, UUID eventId) {
        if (isPlatformAdmin(userId)) return true;
        if (isOrganiserOwner(userId, eventId)) return true;
        if (eventId == null) return false;
        return resourceRoleAssignmentRepository.existsByUserIdAndScopeTypeAndScopeIdAndStatus(
                userId, ResourceRoleAssignment.SCOPE_EVENT, eventId, ResourceRoleAssignment.STATUS_APPROVED);
    }

    /**
     * Read-only visibility: everything canManageEvent() allows, plus a
     * SPORT_HEAD who holds no event-level assignment but has an approved
     * assignment on a sport within this event. Deliberately NOT folded into
     * canManageEvent() — that method is also the write-gate for event media,
     * sponsors, announcements, and assignment approval, none of which a
     * sport-scoped-only user should be able to touch.
     */
    public boolean canViewEvent(UUID userId, UUID eventId) {
        if (canManageEvent(userId, eventId)) return true;
        if (eventId == null) return false;
        return eventSportsRepository.findByEventId(eventId).stream()
                .anyMatch(sport -> resourceRoleAssignmentRepository.existsByUserIdAndScopeTypeAndScopeIdAndStatus(
                        userId, ResourceRoleAssignment.SCOPE_SPORT, sport.getId(), ResourceRoleAssignment.STATUS_APPROVED));
    }

    public boolean canManageSport(UUID userId, UUID eventSportId) {
        if (eventSportId == null) return false;
        UUID eventId = resolveEventIdForSport(eventSportId);
        if (eventId != null && canManageEvent(userId, eventId)) return true;
        return resourceRoleAssignmentRepository.existsByUserIdAndScopeTypeAndScopeIdAndStatus(
                userId, ResourceRoleAssignment.SCOPE_SPORT, eventSportId, ResourceRoleAssignment.STATUS_APPROVED);
    }

    /**
     * A JUDGE may only score a match if they hold an EventJudge assignment
     * for THIS event (linked to their own user account) with scoringRights
     * still true, and — when that assignment is scoped to a specific sport —
     * only for that sport. Previously any account with the global JUDGE role
     * could score any match on the platform, which also meant revoking
     * scoringRights on misconduct did nothing. Anyone who can manage the
     * sport outright (admin/organiser/sport-head) can always score.
     */
    public boolean canScoreMatch(UUID userId, UUID eventSportId) {
        if (eventSportId == null) return false;
        if (canManageSport(userId, eventSportId)) return true;
        if (!userRoleRepository.existsByUserIdAndRoleType(userId, AccountType.JUDGE)) return false;

        UUID eventId = resolveEventIdForSport(eventSportId);
        if (eventId == null) return false;

        return eventJudgeRepository.findByEventId(eventId).stream()
                .anyMatch(judge -> userId.equals(judge.getUserId())
                        && Boolean.TRUE.equals(judge.getScoringRights())
                        && (judge.getAssignedSportId() == null || eventSportId.equals(judge.getAssignedSportId())));
    }

    /** Deliberately excludes SPORT_HEAD and JUDGE — a submitter shouldn't self-approve. */
    public boolean canApproveMatchResult(UUID userId, UUID eventSportId) {
        if (eventSportId == null) return false;
        UUID eventId = resolveEventIdForSport(eventSportId);
        return eventId != null && canManageEvent(userId, eventId);
    }

    private UUID resolveEventIdForSport(UUID eventSportId) {
        return eventSportsRepository.findById(eventSportId).map(EventSports::getEventId).orElse(null);
    }

    /** Users holding an APPROVED EVENT_HEAD assignment on this event. */
    public java.util.List<UUID> findApprovedEventHeadUserIds(UUID eventId) {
        return resourceRoleAssignmentRepository
                .findByEventIdAndScopeTypeAndRoleTypeAndStatus(
                        eventId, ResourceRoleAssignment.SCOPE_EVENT, "EVENT_HEAD", ResourceRoleAssignment.STATUS_APPROVED)
                .stream()
                .map(ResourceRoleAssignment::getUserId)
                .collect(java.util.stream.Collectors.toList());
    }

    // ── Asserts (throw 403) ─────────────────────────────────────────────

    public void assertCanManageEvent(UUID userId, UUID eventId) {
        if (!canManageEvent(userId, eventId)) {
            throw ApiException.forbidden("Insufficient role or event assignment required");
        }
    }

    public void assertCanViewEvent(UUID userId, UUID eventId) {
        if (!canViewEvent(userId, eventId)) {
            throw ApiException.forbidden("Insufficient role or event assignment required");
        }
    }

    public void assertCanManageSport(UUID userId, UUID eventSportId) {
        if (!canManageSport(userId, eventSportId)) {
            throw ApiException.forbidden("Insufficient role or sport assignment required");
        }
    }

    public void assertCanScoreMatch(UUID userId, UUID eventSportId) {
        if (!canScoreMatch(userId, eventSportId)) {
            throw ApiException.forbidden("Insufficient role or event assignment required");
        }
    }

    public void assertCanApproveMatchResult(UUID userId, UUID eventSportId) {
        if (!canApproveMatchResult(userId, eventSportId)) {
            throw ApiException.forbidden("Only the event's head, owner, or an admin can approve match results");
        }
    }

    public void assertIsPlatformAdmin(UUID userId) {
        if (!isPlatformAdmin(userId)) {
            throw ApiException.forbidden("Admin access required");
        }
    }
}
