package com.botleague.backend.admin.service;

import java.util.List;
import java.util.UUID;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import com.botleague.backend.admin.dto.AdminTeamDetail;
import com.botleague.backend.admin.dto.AdminTeamMemberDTO;
import com.botleague.backend.admin.dto.AdminTeamSummary;
import com.botleague.backend.admin.dto.ChangeTeamStatusRequest;
import com.botleague.backend.admin.dto.CreateAdminTeamRequest;
import com.botleague.backend.admin.dto.PagedResponse;
import com.botleague.backend.admin.dto.UpdateTeamRequest;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;
import java.time.LocalDateTime;
import com.botleague.backend.common.exception.ResourceNotFoundException;

@Service
public class AdminTeamService {

    private final TeamRepository teamRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final UserRepository userRepository;
    private final BotleagueIdService botleagueIdService;

    public AdminTeamService(
            TeamRepository teamRepository,
            TeamMembershipRepository teamMembershipRepository,
            UserRepository userRepository,
            BotleagueIdService botleagueIdService
    ) {
        this.teamRepository = teamRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.userRepository = userRepository;
        this.botleagueIdService = botleagueIdService;
    }

    // ── Create team (admin) ───────────────────────────────────────────────────

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

        // Guard: user must not already be in an active team
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
        teamMembershipRepository.save(membership);

        return getTeamDetail(saved.getId());
    }

    // ── Search / list ─────────────────────────────────────────────────────────

    public PagedResponse<AdminTeamSummary> searchTeams(String query, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String q = (query == null || query.isBlank()) ? null : query.trim();
        Page<Team> teamsPage = (q == null)
                ? teamRepository.findAll(pageable)
                : teamRepository.searchTeams(q, pageable);

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
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        team.setStatus(request.getStatus());
        teamRepository.save(team);
        return getTeamDetail(teamId);
    }

    // ── Remove a member ───────────────────────────────────────────────────────

    public void removeMember(UUID teamId, UUID userId) {
        TeamMembership membership = teamMembershipRepository
                .findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        membership.setStatus(TeamMembershipStatus.LEFT);
        teamMembershipRepository.save(membership);
    }

    // ── Update team info ──────────────────────────────────────────────────────

    public AdminTeamDetail updateTeam(UUID teamId, UpdateTeamRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (request.getTeamName()        != null) team.setTeamName(request.getTeamName());
        if (request.getDescription()     != null) team.setDescription(request.getDescription());
        if (request.getInstitutionName() != null) team.setInstitutionName(request.getInstitutionName());
        if (request.getCity()            != null) team.setCity(request.getCity());
        if (request.getState()           != null) team.setState(request.getState());
        if (request.getCountry()         != null) team.setCountry(request.getCountry());
        teamRepository.save(team);
        return getTeamDetail(teamId);
    }

    // ── Delete team ───────────────────────────────────────────────────────────

    public void deleteTeam(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        teamRepository.delete(team);
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
