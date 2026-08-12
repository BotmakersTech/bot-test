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
import com.botleague.backend.ranking.repository.EventLeaderboardEntryRepository;
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
    private final EventLeaderboardEntryRepository eventLeaderboardEntryRepository;
    private final EventJudgeRepository eventJudgeRepository;

    public AuthorizationService(
            UserRoleRepository userRoleRepository,
            ResourceRoleAssignmentRepository resourceRoleAssignmentRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            EventLeaderboardEntryRepository eventLeaderboardEntryRepository,
            EventJudgeRepository eventJudgeRepository) {
        this.userRoleRepository = userRoleRepository;
        this.resourceRoleAssignmentRepository = resourceRoleAssignmentRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.eventLeaderboardEntryRepository = eventLeaderboardEntryRepository;
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

    // ── Active-event guard (audit finding B-16) ─────────────────────────────
    //
    // Even a cascaded soft-delete on Match/SportRegistration doesn't fully
    // close this hole by itself: submitMatchResult/completeMatch/
    // approveMatchResult/registerRobot/cancelRegistration/updateRegistrationStatus
    // all load their target via a plain findById(), which does NOT filter
    // deletedAt (only the custom findByXAndDeletedAtIsNull() methods do). So
    // a "deleted" or cancelled event's matches/registrations could still be
    // mutated through those endpoints even after being cascaded. This is the
    // actual fix — called at the top of each of those methods.

    public void assertEventActiveForSport(UUID eventSportId) {
        if (eventSportId == null) return;

        EventSports sport = eventSportsRepository.findById(eventSportId).orElse(null);
        if (sport == null) return; // let the caller's own not-found handling take over

        com.botleague.backend.events.entity.Event event = eventRepository.findById(sport.getEventId()).orElse(null);
        if (event == null) return;

        if (event.getDeletedAt() != null) {
            throw ApiException.conflict("This event has been deleted — no further action can be taken on it.");
        }
        if (event.getStatus() == com.botleague.backend.events.enums.EventStatus.ARCHIVED
                || event.getStatus() == com.botleague.backend.events.enums.EventStatus.CANCELLED) {
            throw ApiException.conflict(
                    "This event is " + event.getStatus() + " — no further action can be taken on it.");
        }
    }

    // ── Certificate lifecycle gate ──────────────────────────────────────
    //
    // Certificates must not be generated off an in-progress leaderboard — a
    // WINNER certificate handed out before results are official could hand
    // out the wrong name if a result is later corrected on appeal. Mirrors
    // assertEventActiveForSport's shape: a focused guard called at the top
    // of the one write path it protects (certificate generation triggers).

    public void assertLeaderboardFinalizedForCertificates(UUID eventSportId) {
        if (eventSportId == null) return;
        boolean hasFinalizedEntries = eventLeaderboardEntryRepository
                .existsByEventSportIdAndIsFinalized(eventSportId, Boolean.TRUE);
        if (!hasFinalizedEntries) {
            throw ApiException.conflict(
                    "This sport's rankings have not been finalized yet — certificates cannot be generated until results are official.");
        }
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
     * A JUDGE scores at sport granularity: an admin assigns them to a sport
     * (event_judges.assigned_sport_id + scoring_rights=true), which grants
     * scoring on every match in that sport — including matches generated
     * later — not just one hand-picked match. Anyone who can manage the
     * sport outright (admin/organiser/sport-head) can always score too.
     * Whether the match is currently locked is a separate, orthogonal check
     * enforced at the mutation endpoints, not here.
     */
    public boolean canScoreMatch(UUID userId, UUID eventSportId, UUID matchId) {
        if (eventSportId == null) return false;
        if (canManageSport(userId, eventSportId)) return true;
        if (matchId == null) return false;
        if (!userRoleRepository.existsByUserIdAndRoleType(userId, AccountType.JUDGE)) return false;

        return eventJudgeRepository.existsByAssignedSportIdAndUserIdAndScoringRightsTrue(eventSportId, userId);
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

    public void assertCanScoreMatch(UUID userId, UUID eventSportId, UUID matchId) {
        if (!canScoreMatch(userId, eventSportId, matchId)) {
            throw ApiException.forbidden("You are not assigned to judge this match");
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
