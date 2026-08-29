package com.botleague.backend.admin.service;

import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.botleague.backend.admin.dto.AdminTeamDetail;
import com.botleague.backend.admin.dto.AdminTeamMemberDTO;
import com.botleague.backend.admin.dto.AdminTeamSummary;
import com.botleague.backend.admin.dto.ChangeTeamStatusRequest;
import com.botleague.backend.admin.dto.CreateAdminTeamRequest;
import com.botleague.backend.admin.dto.PagedResponse;
import com.botleague.backend.admin.dto.UpdateTeamRequest;
import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.events.service.SportRegistrationLineupService;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamInvite;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamInviteStatus;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.RobotRepository;
import com.botleague.backend.team.repository.TeamInviteRepository;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;
import com.botleague.backend.team.service.RobotService;
import com.botleague.backend.sponsor.repository.TeamSponsorRepository;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;
@Service
public class AdminTeamService {

    // Registrations already in one of these states don't need to be touched
    // when the parent team is deleted — they're already inactive.
    private static final Set<RegistrationStatus> TERMINAL_REGISTRATION_STATUSES =
            EnumSet.of(RegistrationStatus.WITHDRAWN, RegistrationStatus.REJECTED, RegistrationStatus.CANCELLED);

    private final TeamRepository teamRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final UserRepository userRepository;
    private final BotleagueIdService botleagueIdService;
    private final ChatService chatService;
    private final RobotRepository robotRepository;
    private final RobotService robotService;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final TeamSponsorRepository teamSponsorRepository;
    private final SportRegistrationLineupService sportRegistrationLineupService;
    private final AuditLogService auditLogService;

    public AdminTeamService(
            TeamRepository teamRepository,
            TeamMembershipRepository teamMembershipRepository,
            UserRepository userRepository,
            BotleagueIdService botleagueIdService,
            ChatService chatService,
            RobotRepository robotRepository,
            RobotService robotService,
            SportRegistrationRepository sportRegistrationRepository,
            TeamInviteRepository teamInviteRepository,
            TeamSponsorRepository teamSponsorRepository,
            SportRegistrationLineupService sportRegistrationLineupService,
            AuditLogService auditLogService
    ) {
        this.teamRepository = teamRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.userRepository = userRepository;
        this.botleagueIdService = botleagueIdService;
        this.chatService = chatService;
        this.robotRepository = robotRepository;
        this.robotService = robotService;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamInviteRepository = teamInviteRepository;
        this.teamSponsorRepository = teamSponsorRepository;
        this.sportRegistrationLineupService = sportRegistrationLineupService;
        this.auditLogService = auditLogService;
    }

    private void freeLineupSlots(UUID teamMembershipId) {
        sportRegistrationLineupService.getLineupForMember(teamMembershipId)
                .forEach(lineup -> sportRegistrationLineupService.removeMember(lineup.getId()));
    }

    // ── Create team (admin) ───────────────────────────────────────────────────

    @Transactional
    public AdminTeamDetail createAdminTeam(CreateAdminTeamRequest req) {
        Team team = new Team();
        team.setTeamCode(botleagueIdService.generateBotLeagueTeamId());
        team.setTeamName(req.getTeamName());
        team.setInstitutionName(req.getInstitutionName());
        team.setCity(req.getCity());
        team.setState(req.getState());
        team.setCountry(req.getCountry());
        team.setDescription(req.getDescription());
        team.setStatus("ACTIVE");

        // Resolve captain — required
        if (req.getCaptainUserId() == null) {
            throw ApiException.badRequest("A captain user ID is required");
        }
        User captain = userRepository.findById(req.getCaptainUserId())
                .orElseThrow(() -> ApiException.notFound("User not found"));

        // Guard: user must not already be in an active team. This check is a
        // fast-path UX improvement, not the actual safety net — see the
        // uk_team_membership_one_active partial unique index (V32) caught
        // below, which is what actually closes the race between two
        // concurrent createAdminTeam calls for the same captain.
        boolean alreadyInTeam = teamMembershipRepository
                .findByUserId(captain.getId())
                .stream()
                .anyMatch(m -> m.getStatus() == TeamMembershipStatus.ACTIVE);
        if (alreadyInTeam) {
            throw ApiException.conflict("User is already a member of another team");
        }

        team.setCreatedBy(captain.getId());
        Team saved = teamRepository.save(team);

        TeamMembership membership = new TeamMembership();
        membership.setTeamId(saved.getId());
        membership.setUserId(captain.getId());
        membership.setRoleInTeam(TeamRole.CAPTAIN);
        membership.setStatus(TeamMembershipStatus.ACTIVE);
        membership.setJoinedAt(LocalDateTime.now());
        try {
            teamMembershipRepository.save(membership);
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflict("User is already a member of another team");
        }

        // Create team chat room (best-effort — chat failure must not block team creation)
        try {
            chatService.createTeamChat(saved.getId(), saved.getTeamName(), List.of(captain.getId()));
        } catch (Exception ignored) {
        }

        auditLogService.log("TEAM_CREATED", "TEAM", saved.getId(), saved.getTeamName(), null, "ACTIVE");

        return getTeamDetail(saved.getId());
    }

    // ── Search / list ─────────────────────────────────────────────────────────

    public PagedResponse<AdminTeamSummary> searchTeams(String query, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String q = (query == null || query.isBlank()) ? null : query.trim();
        Page<Team> teamsPage = (q == null)
                ? teamRepository.findAllByDeletedAtIsNull(pageable)
                : teamRepository.searchActiveTeams(q, pageable);

        List<AdminTeamSummary> content = teamsPage.getContent().stream()
                .map(team -> {
                    AdminTeamSummary s = toSummary(team);
                    long count = teamMembershipRepository.countByTeamIdAndStatus(team.getId(), TeamMembershipStatus.ACTIVE);
                    s.setMemberCount(count);
                    return s;
                })
                .toList();

        return new PagedResponse<>(content, page, size, teamsPage.getTotalElements(), teamsPage.getTotalPages());
    }

    // ── Get team detail with members ──────────────────────────────────────────
    // Deliberately NOT filtered by deletedAt — a deleted team's history should
    // still be viewable by direct ID from the admin panel; it's just excluded
    // from the general list/search above.

    public AdminTeamDetail getTeamDetail(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        List<TeamMembership> memberships = teamMembershipRepository.findByTeamId(teamId);

        List<AdminTeamMemberDTO> members = memberships.stream()
                .map(m -> {
                    User user = userRepository.findById(m.getUserId()).orElse(null);
                    return toMemberDTO(m, user);
                })
                .toList();

        AdminTeamDetail detail = toDetail(team);
        detail.setMemberCount(memberships.stream().filter(m -> m.getStatus() == TeamMembershipStatus.ACTIVE).count());
        detail.setMembers(members);
        return detail;
    }

    // ── Change team status ────────────────────────────────────────────────────

    public AdminTeamDetail changeTeamStatus(UUID teamId, ChangeTeamStatusRequest request) {
        Team team = requireNotDeleted(teamId);
        String oldStatus = team.getStatus();
        team.setStatus(request.getStatus());
        teamRepository.save(team);
        auditLogService.log("TEAM_STATUS_CHANGED", "TEAM", teamId, team.getTeamName(),
                oldStatus, request.getStatus());
        return getTeamDetail(teamId);
    }

    // ── Remove a member ───────────────────────────────────────────────────────

    public void removeMember(UUID teamId, UUID userId) {
        requireNotDeleted(teamId);
        TeamMembership membership = teamMembershipRepository
                .findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        membership.setStatus(TeamMembershipStatus.LEFT);
        teamMembershipRepository.save(membership);
        freeLineupSlots(membership.getId());

        try {
            chatService.removeMemberFromTeamChat(teamId, userId, "was removed from the team.");
        } catch (Exception ignored) {
        }

        auditLogService.log("TEAM_MEMBER_REMOVED", "TEAM", teamId, userId.toString(), "ACTIVE", "LEFT");
    }

    // ── Update team info ──────────────────────────────────────────────────────

    public AdminTeamDetail updateTeam(UUID teamId, UpdateTeamRequest request) {
        Team team = requireNotDeleted(teamId);
        String oldTeamName = team.getTeamName();
        if (request.getTeamName()        != null) team.setTeamName(request.getTeamName());
        if (request.getDescription()     != null) team.setDescription(request.getDescription());
        if (request.getInstitutionName() != null) team.setInstitutionName(request.getInstitutionName());
        if (request.getCity()            != null) team.setCity(request.getCity());
        if (request.getState()           != null) team.setState(request.getState());
        if (request.getCountry()         != null) team.setCountry(request.getCountry());
        teamRepository.save(team);
        auditLogService.log("TEAM_UPDATED", "TEAM", teamId, team.getTeamName(), oldTeamName, team.getTeamName());
        return getTeamDetail(teamId);
    }

    // ── Delete team ───────────────────────────────────────────────────────────
    // Soft-delete (matches the existing RobotService.deleteRobotAdmin pattern),
    // cascading to every entity that otherwise gets orphaned by a hard delete:
    // memberships, robots, sport registrations, pending invites, and sponsor
    // records. Each related entity is deactivated through its OWN existing
    // status mechanism rather than a bolted-on deletedAt column, except Robot
    // (which already has one) and TeamSponsor (which has no lifecycle concept
    // at all, so its rows are simply removed).

    @Transactional
    public void deleteTeam(UUID teamId) {
        Team team = requireNotDeleted(teamId);

        team.setDeletedAt(LocalDateTime.now());
        team.setStatus("DELETED");
        teamRepository.save(team);

        teamMembershipRepository.findByTeamIdAndStatus(teamId, TeamMembershipStatus.ACTIVE)
                .forEach(m -> {
                    m.setStatus(TeamMembershipStatus.LEFT);
                    m.setLeftAt(LocalDateTime.now());
                    teamMembershipRepository.save(m);
                    freeLineupSlots(m.getId());
                    try {
                        chatService.removeMemberFromTeamChat(teamId, m.getUserId(), "the team was deleted.");
                    } catch (Exception ignored) {
                    }
                });

        robotRepository.findByTeamIdAndDeletedAtIsNull(teamId)
                .forEach(r -> robotService.deleteRobotAdmin(r.getId()));

        for (SportRegistration reg : sportRegistrationRepository.findByTeamId(teamId)) {
            if (!TERMINAL_REGISTRATION_STATUSES.contains(reg.getStatus())) {
                reg.setStatus(RegistrationStatus.WITHDRAWN);
                sportRegistrationRepository.save(reg);
            }
        }

        for (TeamInvite invite : teamInviteRepository.findByTeamIdAndStatus(teamId, TeamInviteStatus.PENDING)) {
            invite.setStatus(TeamInviteStatus.CANCELLED);
            teamInviteRepository.save(invite);
        }

        teamSponsorRepository.deleteAll(
                teamSponsorRepository.findByTeamIdOrderByDisplayOrderAscCreatedAtAsc(teamId));

        auditLogService.log("TEAM_DELETED", "TEAM", teamId, team.getTeamName(), "ACTIVE", "DELETED");
    }

    private Team requireNotDeleted(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (team.getDeletedAt() != null) {
            throw ApiException.conflict("This team has been deleted");
        }
        return team;
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AdminTeamSummary toSummary(Team team) {
        AdminTeamSummary s = new AdminTeamSummary();
        s.setId(team.getId());
        s.setTeamCode(team.getTeamCode());
        s.setTeamName(team.getTeamName());
        s.setLogoUrl(team.getLogoUrl());
        s.setInstitutionName(team.getInstitutionName());
        s.setCity(team.getCity());
        s.setState(team.getState());
        s.setCountry(team.getCountry());
        s.setStatus(team.getStatus());
        s.setCreatedAt(team.getCreatedAt());
        return s;
    }

    private AdminTeamDetail toDetail(Team team) {
        AdminTeamDetail d = new AdminTeamDetail();
        d.setId(team.getId());
        d.setTeamCode(team.getTeamCode());
        d.setTeamName(team.getTeamName());
        d.setDescription(team.getDescription());
        d.setLogoUrl(team.getLogoUrl());
        d.setInstitutionName(team.getInstitutionName());
        d.setCity(team.getCity());
        d.setState(team.getState());
        d.setCountry(team.getCountry());
        d.setStatus(team.getStatus());
        d.setCreatedBy(team.getCreatedBy());
        d.setCreatedAt(team.getCreatedAt());
        d.setUpdatedAt(team.getUpdatedAt());
        return d;
    }

    private AdminTeamMemberDTO toMemberDTO(TeamMembership m, User user) {
        AdminTeamMemberDTO dto = new AdminTeamMemberDTO();
        dto.setUserId(m.getUserId());
        dto.setTeamRole(m.getRoleInTeam() != null ? m.getRoleInTeam().name() : null);
        dto.setMembershipStatus(m.getStatus() != null ? m.getStatus().name() : null);
        dto.setJoinedAt(m.getJoinedAt());
        dto.setLeftAt(m.getLeftAt());
        if (user != null) {
            dto.setUsername(user.getUsername());
            dto.setEmail(user.getEmail());
            dto.setBotleagueId(user.getBotleagueId());
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
            dto.setProfilePhotoUrl(user.getProfilePhotoUrl());
        }
        return dto;
    }
}
