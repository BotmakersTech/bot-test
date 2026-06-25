package com.botleague.backend.team.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.dto.GetInvitedPlayersResponseDTO;
import com.botleague.backend.team.dto.TeamMemberResponseDTO;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamInviteRepository;
import com.botleague.backend.team.enums.TeamInviteStatus;

@Service
@Transactional
public class TeamMembershipService {

    private final TeamMembershipRepository teamMembershipRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final TeamInviteRepository teamInviteRepository;
    private final NotificationService notificationService;

    public TeamMembershipService(
            TeamMembershipRepository teamMembershipRepository,
            UserRepository userRepository,
            ChatService chatService,
            TeamInviteRepository teamInviteRepository,
            NotificationService notificationService) {
        this.teamMembershipRepository = teamMembershipRepository;
        this.userRepository = userRepository;
        this.chatService = chatService;
        this.teamInviteRepository = teamInviteRepository;
        this.notificationService = notificationService;
    }

    // ================= ASSIGN CAPTAIN ON TEAM CREATION =================

    public void assignCaptainOnCreate(UUID teamId, UUID userId) {

        validateUserExists(userId);

        TeamMembership membership = new TeamMembership();
        membership.setTeamId(teamId);
        membership.setUserId(userId);
        membership.setRoleInTeam(TeamRole.CAPTAIN);
        membership.setStatus(TeamMembershipStatus.ACTIVE);

        teamMembershipRepository.save(membership);
    }

    // ================= VALIDATE TEAM ADMIN =================

    @Transactional(readOnly = true)
    public void validateTeamAdmin(UUID userId, UUID teamId) {

        TeamMembership membership = getActiveMembership(teamId, userId);

        TeamRole role = membership.getRoleInTeam();

        if (role != TeamRole.CAPTAIN && role != TeamRole.VICE_CAPTAIN) {
            throw ApiException.forbidden("Only captain or vice captain can perform this action");
        }
    }

    // ================= ASSIGN ROLE (CAPTAIN ONLY) =================

    public void assignRole(
            UUID targetUserId,
            TeamRole role,
            Authentication authentication) {

        UUID currentUserId = extractUserId(authentication);

        TeamMembership captain = teamMembershipRepository
                .findByUserIdAndStatus(currentUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active team"));

        if (captain.getRoleInTeam() != TeamRole.CAPTAIN) {
            throw ApiException.forbidden("Only captain can assign role");
        }

        TeamMembership target = getActiveMembership(captain.getTeamId(), targetUserId);

        if (targetUserId.equals(currentUserId)) {
            throw ApiException.badRequest("Captain cannot assign own role");
        }

        if (role == TeamRole.CAPTAIN) {
            throw ApiException.badRequest("Use transfer captain API");
        }

        if (role == TeamRole.VICE_CAPTAIN) {
            teamMembershipRepository
                    .findByTeamIdAndRoleInTeamAndStatus(
                            captain.getTeamId(),
                            TeamRole.VICE_CAPTAIN,
                            TeamMembershipStatus.ACTIVE)
                    .ifPresent(existing -> {
                        if (!existing.getUserId().equals(targetUserId)) {
                            existing.setRoleInTeam(TeamRole.MEMBER);
                            teamMembershipRepository.save(existing);
                        }
                    });
        }

        UUID teamId = captain.getTeamId();

        target.setRoleInTeam(role);
        teamMembershipRepository.save(target);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        String displayName = targetUser.getFirstName() != null
                ? targetUser.getFirstName() : targetUser.getUsername();
        String roleLabel = role.name().replace("_", " ");

        notificationService.teamNotifyExcluding(
                teamId, currentUserId,
                "Team Role Updated",
                displayName + " has been assigned as " + roleLabel + ".",
                NotificationType.TEAM_ROLE_ASSIGNED,
                NotificationPriority.MEDIUM,
                "/team");
    }

    // ================= TRANSFER CAPTAIN =================

    public void transferCaptain(
            UUID newCaptainId,
            Authentication authentication) {

        UUID currentUserId = extractUserId(authentication);

        TeamMembership currentCaptain = teamMembershipRepository
                .findByUserIdAndStatus(currentUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active team"));

        if (currentCaptain.getRoleInTeam() != TeamRole.CAPTAIN) {
            throw ApiException.forbidden("Only captain can transfer");
        }

        TeamMembership newCaptain = getActiveMembership(
                currentCaptain.getTeamId(), newCaptainId);

        if (newCaptain.getRoleInTeam() == TeamRole.CAPTAIN) {
            throw ApiException.badRequest("Already captain");
        }

        UUID teamId = currentCaptain.getTeamId();

        currentCaptain.setRoleInTeam(TeamRole.MEMBER);
        newCaptain.setRoleInTeam(TeamRole.CAPTAIN);

        teamMembershipRepository.save(currentCaptain);
        teamMembershipRepository.save(newCaptain);

        User newCaptainUser = userRepository.findById(newCaptainId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        String newCaptainName = newCaptainUser.getFirstName() != null
                ? newCaptainUser.getFirstName() : newCaptainUser.getUsername();

        notificationService.teamNotifyExcluding(
                teamId, currentUserId,
                "New Team Captain",
                newCaptainName + " is now the team captain.",
                NotificationType.CAPTAIN_TRANSFERRED,
                NotificationPriority.HIGH,
                "/team");
    }

    // ================= LEAVE TEAM =================

    public void leaveTeam(Authentication authentication) {

        UUID currentUserId = extractUserId(authentication);

        TeamMembership membership = teamMembershipRepository
                .findByUserIdAndStatus(currentUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active team"));

        UUID teamId = membership.getTeamId();

        if (membership.getRoleInTeam() == TeamRole.CAPTAIN) {

            Optional<TeamMembership> viceCaptain = teamMembershipRepository
                    .findByTeamIdAndRoleInTeamAndStatus(
                            teamId, TeamRole.VICE_CAPTAIN, TeamMembershipStatus.ACTIVE);

            if (viceCaptain.isPresent()) {
                TeamMembership vice = viceCaptain.get();
                vice.setRoleInTeam(TeamRole.CAPTAIN);
                teamMembershipRepository.save(vice);
                markLeft(membership);
                cancelPendingInvitesSentBy(currentUserId, teamId);
                chatService.removeMemberFromTeamChat(teamId, currentUserId, "left the team.");
                return;
            }

            List<TeamMembership> others = teamMembershipRepository
                    .findByTeamIdAndStatusAndUserIdNot(
                            teamId, TeamMembershipStatus.ACTIVE, membership.getUserId());

            if (others.isEmpty()) {
                markLeft(membership);
                cancelPendingInvitesSentBy(currentUserId, teamId);
                chatService.removeMemberFromTeamChat(teamId, currentUserId, "left the team.");
                return;
            }

            throw ApiException.badRequest("Promote another member to captain before leaving");
        }

        markLeft(membership);
        cancelPendingInvitesSentBy(currentUserId, teamId);
        chatService.removeMemberFromTeamChat(teamId, currentUserId, "left the team.");
    }

    // ================= REMOVE MEMBER (CAPTAIN ONLY) =================

    public void removeMember(
            UUID targetUserId,
            Authentication authentication) {

        UUID currentUserId = extractUserId(authentication);

        TeamMembership captain = teamMembershipRepository
                .findByUserIdAndStatus(currentUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active team"));

        if (captain.getRoleInTeam() != TeamRole.CAPTAIN) {
            throw ApiException.forbidden("Only captain can remove");
        }

        TeamMembership target = teamMembershipRepository
                .findByUserIdAndStatus(targetUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("Target not found"));

        if (!captain.getTeamId().equals(target.getTeamId())) {
            throw ApiException.forbidden("Different team");
        }

        if (currentUserId.equals(targetUserId)) {
            throw ApiException.badRequest("Captain cannot remove self");
        }

        if (target.getRoleInTeam() == TeamRole.CAPTAIN) {
            throw ApiException.badRequest("Cannot remove captain");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        String displayName = targetUser.getFirstName() != null
                ? targetUser.getFirstName() : targetUser.getUsername();
        UUID teamId = captain.getTeamId();

        target.setStatus(TeamMembershipStatus.REMOVED);
        target.setLeftAt(LocalDateTime.now());
        teamMembershipRepository.save(target);

        cancelPendingInvitesSentBy(targetUserId, teamId);
        chatService.removeMemberFromTeamChat(teamId, targetUserId, "was removed from the team.");

        notificationService.teamNotifyExcluding(
                teamId, currentUserId,
                "Team Member Removed",
                displayName + " has been removed from the team.",
                NotificationType.TEAM_MEMBER_REMOVED,
                NotificationPriority.MEDIUM,
                "/team");
    }

    // ================= GET TEAM ID =================

    @Transactional(readOnly = true)
    public UUID getTeamIdByUserId(UUID userId) {

        TeamMembership membership = teamMembershipRepository
                .findByUserIdAndStatus(userId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("User not in active team"));

        return membership.getTeamId();
    }

    // ================= GET INVITES =================

    @Transactional(readOnly = true)
    public GetInvitedPlayersResponseDTO getInvites(Authentication authentication) {

        UUID currentUserId = extractUserId(authentication);

        TeamMembership membership = teamMembershipRepository
                .findByUserIdAndStatus(currentUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active team"));

        if (membership.getRoleInTeam() != TeamRole.CAPTAIN) {
            throw ApiException.forbidden("Only captain can view invites");
        }

        List<TeamMembership> invited = teamMembershipRepository
                .findByTeamIdAndStatus(membership.getTeamId(), TeamMembershipStatus.INVITED);

        List<TeamMemberResponseDTO> players = invited.stream()
                .map(this::mapResponse)
                .toList();

        GetInvitedPlayersResponseDTO dto = new GetInvitedPlayersResponseDTO();
        dto.setInvitedPlayers(players);
        return dto;
    }

    // ================= HELPERS =================

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }

    private TeamMembership getActiveMembership(UUID teamId, UUID userId) {
        return teamMembershipRepository
                .findByTeamIdAndUserIdAndStatus(teamId, userId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("Membership not found"));
    }

    private void markLeft(TeamMembership membership) {
        membership.setStatus(TeamMembershipStatus.LEFT);
        membership.setLeftAt(LocalDateTime.now());
        teamMembershipRepository.save(membership);
    }

    private void validateUserExists(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw ApiException.notFound("User not found");
        }
    }

    // Cancel pending invites that this user sent (e.g., when they leave or are removed)
    private void cancelPendingInvitesSentBy(UUID userId, UUID teamId) {
        teamInviteRepository
                .findByTeamIdAndInvitedByAndStatus(teamId, userId, TeamInviteStatus.PENDING)
                .forEach(invite -> {
                    invite.setStatus(TeamInviteStatus.CANCELLED);
                    teamInviteRepository.save(invite);
                });
    }

    private TeamMemberResponseDTO mapResponse(TeamMembership membership) {
        User user = userRepository.findById(membership.getUserId())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        TeamMemberResponseDTO dto = new TeamMemberResponseDTO();
        dto.setUserId(user.getId());
        dto.setBotleagueId(user.getBotleagueId());
        dto.setUsername(user.getUsername());
        dto.setTeamRole(membership.getRoleInTeam());
        return dto;
    }
}