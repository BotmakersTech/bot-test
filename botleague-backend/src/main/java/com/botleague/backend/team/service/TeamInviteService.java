package com.botleague.backend.team.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.dto.TeamInviteResponseDTO;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamInvite;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamInviteStatus;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamInviteRepository;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;

@Service
public class TeamInviteService {

    private final TeamInviteRepository teamInviteRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;

    public TeamInviteService(
            TeamInviteRepository teamInviteRepository,
            TeamMembershipRepository teamMembershipRepository,
            UserRepository userRepository,
            TeamRepository teamRepository,
            ChatService chatService,
            NotificationService notificationService
    ) {
        this.teamInviteRepository = teamInviteRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.chatService = chatService;
        this.notificationService = notificationService;
    }

    // =========================================================
    // SEND INVITE  (CAPTAIN + VICE CAPTAIN)
    // =========================================================
    @Transactional
    public TeamInviteResponseDTO sendInvite(
            String teamCode,
            String invitedBotLeagueUserId,
            TeamRole intendedRole,
            UUID invitedByUserId
    ) {
        Team team = teamRepository
                .findByTeamCode(teamCode)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        UUID teamId = team.getId();

        User invitedUser = userRepository
                .findByBotleagueId(invitedBotLeagueUserId)
                .orElseThrow(() -> ApiException.notFound("Invited user not found"));

        UUID invitedUserId = invitedUser.getId();

        if (invitedByUserId.equals(invitedUserId)) {
            throw ApiException.badRequest("You cannot invite yourself");
        }

        TeamMembership callerMembership = validateInvitePermission(teamId, invitedByUserId);

        if (intendedRole == TeamRole.CAPTAIN) {
            throw ApiException.badRequest("Cannot invite directly as captain — use transfer captain after they join");
        }
        if (intendedRole == TeamRole.VICE_CAPTAIN
                && callerMembership.getRoleInTeam() == TeamRole.VICE_CAPTAIN) {
            throw ApiException.forbidden("Vice captain cannot invite a member as vice captain");
        }

        // Reject if the user is already an active member of this team
        teamMembershipRepository
                .findByTeamIdAndUserIdAndStatus(teamId, invitedUserId, TeamMembershipStatus.ACTIVE)
                .ifPresent(m -> {
                    throw ApiException.conflict("User is already a member of this team");
                });

        // Block if a PENDING invite already exists
        if (teamInviteRepository.existsByTeamIdAndInvitedUserIdAndStatus(
                teamId, invitedUserId, TeamInviteStatus.PENDING)) {
            throw ApiException.conflict("Invite already sent and is still pending");
        }

        TeamInvite invite = new TeamInvite();
        invite.setTeamId(teamId);
        invite.setInvitedUserId(invitedUserId);
        invite.setInvitedBy(invitedByUserId);
        invite.setStatus(TeamInviteStatus.PENDING);
        invite.setIntendedRole(intendedRole);

        TeamInvite saved = teamInviteRepository.save(invite);

        // Notify the invited user
        User inviter = userRepository.findById(invitedByUserId).orElse(null);
        String inviterName = inviter != null ? buildDisplayName(inviter) : "Your captain";
        notificationService.systemNotify(
                "Team Invitation",
                inviterName + " has invited you to join " + team.getTeamName() + ". You have 7 days to respond.",
                NotificationType.TEAM_INVITE_RECEIVED,
                NotificationPriority.HIGH,
                NotificationTargetType.USER,
                invitedUserId,
                "/my-team"
        );

        return mapToResponse(saved, false);
    }

    // =========================================================
    // ACCEPT INVITE
    // =========================================================
    @Transactional
    public TeamInviteResponseDTO acceptInvite(UUID inviteId, UUID currentUserId) {
        TeamInvite invite = teamInviteRepository
                .findWithLockById(inviteId)
                .orElseThrow(() -> ApiException.notFound("Invite not found"));

        validateInviteOwner(invite, currentUserId);
        validatePending(invite);

        if (invite.isExpired()) {
            invite.setStatus(TeamInviteStatus.EXPIRED);
            teamInviteRepository.save(invite);
            throw new ApiException(HttpStatus.GONE, "Invite has expired");
        }

        // Guard: profile must be complete before joining a team
        User joiningUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        java.util.List<String> missingFields = new java.util.ArrayList<>();
        if (joiningUser.getFirstName() == null || joiningUser.getFirstName().isBlank()
                || joiningUser.getLastName() == null || joiningUser.getLastName().isBlank())
            missingFields.add("Full Name");
        if (joiningUser.getDateOfBirth() == null)
            missingFields.add("Date of Birth");
        if (joiningUser.getUsername() == null || joiningUser.getUsername().isBlank())
            missingFields.add("Username");
        if (joiningUser.getProfilePhotoUrl() == null || joiningUser.getProfilePhotoUrl().isBlank())
            missingFields.add("Profile Picture");
        if (!missingFields.isEmpty()) {
            throw ApiException.badRequest(
                "PROFILE_INCOMPLETE: Please complete your profile before joining a team. Missing: "
                + String.join(", ", missingFields));
        }

        // Guard: user must not already be active in ANY team
        boolean alreadyInTeam = teamMembershipRepository
                .existsByUserIdAndStatus(currentUserId, TeamMembershipStatus.ACTIVE);
        if (alreadyInTeam) {
            throw ApiException.conflict("You already belong to an active team");
        }

        UUID teamId = invite.getTeamId();

        // Detect rejoin: membership record exists with a terminal status (LEFT / REMOVED)
        boolean isRejoin = teamMembershipRepository
                .findByTeamIdAndUserId(teamId, currentUserId)
                .map(m -> m.getStatus() != TeamMembershipStatus.ACTIVE)
                .orElse(false);

        TeamRole resolvedRole = invite.getIntendedRole() != null ? invite.getIntendedRole() : TeamRole.MEMBER;

        // The invite may have sat pending for up to 7 days — someone else could have
        // become vice-captain in the meantime via assignRole. Demote them the same
        // way assignRole does before handing the role to the newly-accepting member.
        if (resolvedRole == TeamRole.VICE_CAPTAIN) {
            teamMembershipRepository
                    .findByTeamIdAndRoleInTeamAndStatus(teamId, TeamRole.VICE_CAPTAIN, TeamMembershipStatus.ACTIVE)
                    .ifPresent(existing -> {
                        if (!existing.getUserId().equals(currentUserId)) {
                            existing.setRoleInTeam(TeamRole.MEMBER);
                            teamMembershipRepository.save(existing);
                        }
                    });
        }

        // Upsert membership (reuse existing row if present — the unique(team_id, user_id) ensures one row per pair)
        TeamMembership membership = teamMembershipRepository
                .findByTeamIdAndUserId(teamId, currentUserId)
                .orElse(new TeamMembership());
        membership.setTeamId(teamId);
        membership.setUserId(currentUserId);
        membership.setRoleInTeam(resolvedRole);
        membership.setStatus(TeamMembershipStatus.ACTIVE);
        membership.setJoinedAt(LocalDateTime.now());
        membership.setLeftAt(null);
        teamMembershipRepository.save(membership);

        // ── CRITICAL: clean up old invite history before accepting ──────────
        // The UNIQUE(team_id, invited_user_id, status) constraint would block
        // a second ACCEPTED row on re-join. Purge all OTHER invite records for
        // this (team, user) pair so only this one (now ACCEPTED) survives.
        teamInviteRepository.deleteOtherInviteHistory(teamId, currentUserId, inviteId);

        invite.setStatus(TeamInviteStatus.ACCEPTED);
        teamInviteRepository.save(invite);

        // Cancel pending invites from other teams that this user received
        cancelOtherPendingInvites(currentUserId, teamId);

        // Add/reactivate member in team chat
        chatService.addMemberToTeamChat(teamId, currentUserId);

        // Notify the captain who sent the invite
        User joiner = userRepository.findById(currentUserId).orElse(null);
        String joinerName = joiner != null ? buildDisplayName(joiner) : "A member";
        Team team = teamRepository.findById(teamId).orElse(null);
        String teamName = team != null ? team.getTeamName() : "your team";

        notificationService.systemNotify(
                isRejoin ? "Member Rejoined" : "New Member Joined",
                joinerName + (isRejoin ? " has rejoined " : " has joined ") + teamName + "!",
                NotificationType.TEAM_INVITE_ACCEPTED,
                NotificationPriority.MEDIUM,
                NotificationTargetType.USER,
                invite.getInvitedBy(),
                "/my-team"
        );

        return mapToResponse(invite, isRejoin);
    }

    // =========================================================
    // REJECT INVITE
    // =========================================================
    @Transactional
    public TeamInviteResponseDTO rejectInvite(UUID inviteId, UUID currentUserId) {
        TeamInvite invite = teamInviteRepository
                .findWithLockById(inviteId)
                .orElseThrow(() -> ApiException.notFound("Invite not found"));

        validateInviteOwner(invite, currentUserId);
        validatePending(invite);

        invite.setStatus(TeamInviteStatus.REJECTED);
        teamInviteRepository.save(invite);

        // Notify the person who sent the invite
        User rejecter = userRepository.findById(currentUserId).orElse(null);
        String rejecterName = rejecter != null ? buildDisplayName(rejecter) : "Someone";
        Team team = teamRepository.findById(invite.getTeamId()).orElse(null);
        String teamName = team != null ? team.getTeamName() : "your team";

        notificationService.systemNotify(
                "Invitation Declined",
                rejecterName + " has declined the invitation to join " + teamName + ".",
                NotificationType.TEAM_INVITE_REJECTED,
                NotificationPriority.LOW,
                NotificationTargetType.USER,
                invite.getInvitedBy(),
                "/my-team"
        );

        return mapToResponse(invite, false);
    }

    // =========================================================
    // REVOKE INVITE  (CAPTAIN + VICE CAPTAIN)
    // =========================================================
    @Transactional
    public TeamInviteResponseDTO revokeInvite(UUID inviteId, UUID currentUserId) {
        TeamInvite invite = teamInviteRepository
                .findWithLockById(inviteId)
                .orElseThrow(() -> ApiException.notFound("Invite not found"));

        validateInvitePermission(invite.getTeamId(), currentUserId);
        validatePending(invite);

        invite.setStatus(TeamInviteStatus.CANCELLED);
        teamInviteRepository.save(invite);

        // Notify the person whose invite was revoked
        Team team = teamRepository.findById(invite.getTeamId()).orElse(null);
        String teamName = team != null ? team.getTeamName() : "a team";

        notificationService.systemNotify(
                "Invitation Revoked",
                "Your invitation to join " + teamName + " has been cancelled.",
                NotificationType.TEAM_INVITE_REVOKED,
                NotificationPriority.LOW,
                NotificationTargetType.USER,
                invite.getInvitedUserId(),
                null
        );

        return mapToResponse(invite, false);
    }

    // =========================================================
    // GET MY INVITES
    // =========================================================
    public List<TeamInviteResponseDTO> getMyInvites(UUID userId) {
        return teamInviteRepository
                .findByInvitedUserIdAndStatus(userId, TeamInviteStatus.PENDING)
                .stream()
                .filter(invite -> !invite.isExpired())
                .map(invite -> mapToResponse(invite, false))
                .collect(Collectors.toList());
    }

    // =========================================================
    // CANCEL ALL PENDING INVITES SENT BY A USER (on leave / remove)
    // =========================================================
    @Transactional
    public void cancelPendingInvitesSentBy(UUID userId, UUID teamId) {
        teamInviteRepository
                .findByTeamIdAndInvitedByAndStatus(teamId, userId, TeamInviteStatus.PENDING)
                .forEach(invite -> {
                    invite.setStatus(TeamInviteStatus.CANCELLED);
                    teamInviteRepository.save(invite);

                    // Notify the invited person that the invite was cancelled
                    Team team = teamRepository.findById(teamId).orElse(null);
                    String teamName = team != null ? team.getTeamName() : "a team";
                    notificationService.systemNotify(
                            "Invitation Cancelled",
                            "Your invitation to join " + teamName + " has been cancelled because the sender left the team.",
                            NotificationType.TEAM_INVITE_REVOKED,
                            NotificationPriority.LOW,
                            NotificationTargetType.USER,
                            invite.getInvitedUserId(),
                            null
                    );
                });
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private TeamMembership validateInvitePermission(UUID teamId, UUID userId) {
        TeamMembership membership = teamMembershipRepository
                .findByTeamIdAndUserIdAndStatus(teamId, userId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.forbidden("Not a team member"));

        if (membership.getRoleInTeam() != TeamRole.CAPTAIN
                && membership.getRoleInTeam() != TeamRole.VICE_CAPTAIN) {
            throw ApiException.forbidden("Only captains and vice-captains can manage invites");
        }

        return membership;
    }

    private void validateInviteOwner(TeamInvite invite, UUID userId) {
        if (!invite.getInvitedUserId().equals(userId)) {
            throw ApiException.forbidden("This invite does not belong to you");
        }
    }

    private void validatePending(TeamInvite invite) {
        if (invite.getStatus() != TeamInviteStatus.PENDING) {
            throw ApiException.conflict("Invite is no longer pending (status: " + invite.getStatus() + ")");
        }
    }

    private void cancelOtherPendingInvites(UUID userId, UUID acceptedTeamId) {
        teamInviteRepository
                .findByInvitedUserIdAndStatus(userId, TeamInviteStatus.PENDING)
                .stream()
                .filter(i -> !i.getTeamId().equals(acceptedTeamId))
                .forEach(i -> {
                    i.setStatus(TeamInviteStatus.CANCELLED);
                    teamInviteRepository.save(i);
                });
    }

    private TeamInviteResponseDTO mapToResponse(TeamInvite invite, boolean wasRejoin) {
        TeamInviteResponseDTO dto = new TeamInviteResponseDTO();
        dto.setInviteId(invite.getId());
        dto.setTeamId(invite.getTeamId());
        dto.setInvitedUserId(invite.getInvitedUserId());
        dto.setInvitedBy(invite.getInvitedBy());
        dto.setStatus(invite.getStatus());
        dto.setExpiresAt(invite.getExpiresAt());
        dto.setCreatedAt(invite.getCreatedAt());
        dto.setWasRejoin(wasRejoin);

        teamRepository.findById(invite.getTeamId()).ifPresent(t -> {
            dto.setTeamName(t.getTeamName());
            dto.setTeamCode(t.getTeamCode());
        });

        userRepository.findById(invite.getInvitedBy()).ifPresent(u ->
                dto.setInviterName(buildDisplayName(u)));

        return dto;
    }

    private String buildDisplayName(User user) {
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        } else if (user.getFirstName() != null) {
            return user.getFirstName();
        } else if (user.getUsername() != null) {
            return user.getUsername();
        }
        return "User";
    }
}
