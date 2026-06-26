package com.botleague.backend.team.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.role.service.UserRoleService;
import com.botleague.backend.team.dto.CreateTeamRequestDTO;
import com.botleague.backend.team.dto.CreateTeamResponseDTO;
import com.botleague.backend.team.dto.GetTeamMembersDTO;
import com.botleague.backend.team.dto.GetTeamResponseDTO;
import com.botleague.backend.team.dto.TeamMemberResponseDTO;
import com.botleague.backend.team.dto.UpdateTeamRequestDTO;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;

@Service
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;
    private final BotleagueIdService botleagueIdService;
    private final UserRoleService userRoleService;
    private final TeamMembershipService teamMembershipService;
    private final TeamMembershipRepository teamMembershipRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;

    private static final String CDN_BASE_URL = "https://media.botleague.in/";

    public TeamService(
            TeamRepository teamRepository,
            BotleagueIdService botleagueIdService,
            UserRoleService userRoleService,
            TeamMembershipService teamMembershipService,
            TeamMembershipRepository teamMembershipRepository,
            UserRepository userRepository,
            ChatService chatService) {

        this.teamRepository = teamRepository;
        this.botleagueIdService = botleagueIdService;
        this.userRoleService = userRoleService;
        this.teamMembershipService = teamMembershipService;
        this.teamMembershipRepository = teamMembershipRepository;
        this.userRepository = userRepository;
        this.chatService = chatService;
    }

    // ================= CREATE TEAM =================

    public CreateTeamResponseDTO createTeam(
            Authentication authentication,
            CreateTeamRequestDTO request) {

        UUID userId = extractUserId(authentication);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!com.botleague.backend.auth.enums.AccountStatus.ACTIVE.equals(user.getAccountStatus())) {
            throw ApiException.forbidden("Account is not active");
        }

        // All four required fields must be filled before team creation
        java.util.List<String> missing = new java.util.ArrayList<>();
        if (user.getFirstName() == null || user.getFirstName().isBlank()
                || user.getLastName() == null || user.getLastName().isBlank())
            missing.add("Full Name");
        if (user.getDateOfBirth() == null)
            missing.add("Date of Birth");
        if (user.getUsername() == null || user.getUsername().isBlank())
            missing.add("Username");
        if (user.getProfilePhotoUrl() == null || user.getProfilePhotoUrl().isBlank())
            missing.add("Profile Picture");

        if (!missing.isEmpty()) {
            throw ApiException.badRequest(
                "PROFILE_INCOMPLETE: Please complete your profile before creating a team. Missing: "
                + String.join(", ", missing));
        }

        if (teamMembershipRepository.existsByUserIdAndStatus(userId, TeamMembershipStatus.ACTIVE)) {
            throw ApiException.conflict("User already associated with a team");
        }

        if (teamRepository.existsByTeamName(request.getTeamName())) {
            throw ApiException.conflict("Team name already exists");
        }

        String teamCode = botleagueIdService.generateBotLeagueTeamId();

        Team team = new Team();
        team.setTeamName(request.getTeamName());
        team.setTeamCode(teamCode);
        team.setDescription(request.getDescription());
        team.setLogoUrl(request.getLogoUrl());
        team.setInstitutionName(request.getInstitutionName());
        team.setCity(request.getCity());
        team.setState(request.getState());
        team.setCountry(request.getCountry());
        team.setCreatedBy(userId);
        team.setStatus("PENDING");
        teamRepository.save(team);

        // Ensure the team captain has at least COMPETITOR role (not admin — that was a bug)
        userRoleService.ensureUserRole(userId);
        teamMembershipService.assignCaptainOnCreate(team.getId(), userId);

        // Create team chat room
        chatService.createTeamChat(team.getId(), team.getTeamName(), List.of(userId));

        CreateTeamResponseDTO response = new CreateTeamResponseDTO();
        response.setId(team.getId());
        response.setTeamCode(team.getTeamCode());
        response.setTeamName(team.getTeamName());
        response.setStatus(team.getStatus());

        return response;
    }

    // ================= UPDATE TEAM =================

    public GetTeamResponseDTO updateTeam(
            Authentication authentication,
            UpdateTeamRequestDTO request) {

        UUID userId = extractUserId(authentication);

        TeamMembership membership = teamMembershipRepository
                .findByUserIdAndStatus(userId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.forbidden("User is not part of any active team"));

        if (membership.getRoleInTeam() != TeamRole.CAPTAIN
                && membership.getRoleInTeam() != TeamRole.VICE_CAPTAIN) {
            throw ApiException.forbidden("Only team captain or vice captain can update the team");
        }

        UUID teamId = membership.getTeamId();

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        if (request.getTeamName() != null) {
            team.setTeamName(request.getTeamName());
        }
        if (request.getLogo_Url() != null) {
            team.setLogoUrl(request.getLogo_Url());
        }
        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }
        if (request.getInstitutionName() != null) {
            team.setInstitutionName(request.getInstitutionName());
        }
        if (request.getCity() != null) {
            team.setCity(request.getCity());
        }
        if (request.getState() != null) {
            team.setState(request.getState());
        }
        if (request.getCountry() != null) {
            team.setCountry(request.getCountry());
        }

        teamRepository.save(team);

        GetTeamResponseDTO response = new GetTeamResponseDTO();
        response.setTeamCode(team.getTeamCode());
        response.setTeamName(team.getTeamName());
        response.setDescription(team.getDescription());
        response.setInstitutionName(team.getInstitutionName());
        response.setCity(team.getCity());
        response.setState(team.getState());
        response.setCountry(team.getCountry());
        response.setStatus(team.getStatus());

        return response;
    }

    // ================= GET TEAM =================

    @Transactional(readOnly = true)
    public GetTeamResponseDTO getTeam(String teamCode) {

        Team team = teamRepository.findByTeamCode(teamCode)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        GetTeamResponseDTO response = new GetTeamResponseDTO();
        if (team.getLogoUrl() != null) {
            response.setLogo_Url(CDN_BASE_URL + team.getLogoUrl());
        }
        response.setTeamCode(team.getTeamCode());
        response.setTeamName(team.getTeamName());
        response.setDescription(team.getDescription());
        response.setInstitutionName(team.getInstitutionName());
        response.setCity(team.getCity());
        response.setState(team.getState());
        response.setCountry(team.getCountry());
        response.setStatus(team.getStatus());

        return response;
    }

    // ================= GET TEAM MEMBERS =================

    @Transactional(readOnly = true)
    public GetTeamMembersDTO getTeamMembers(String teamCode) {

        Team team = teamRepository.findByTeamCode(teamCode)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        List<TeamMembership> memberships = teamMembershipRepository
                .findByTeamIdAndStatus(team.getId(), TeamMembershipStatus.ACTIVE);

        List<TeamMemberResponseDTO> members = memberships.stream()
                .map(membership -> {
                    User user = userRepository.findById(membership.getUserId())
                            .orElseThrow(() -> ApiException.notFound("User not found"));

                    TeamMemberResponseDTO dto = new TeamMemberResponseDTO();
                    dto.setUserId(user.getId());
                    dto.setBotleagueId(user.getBotleagueId());
                    dto.setUsername(user.getUsername());
                    dto.setFirstName(user.getFirstName());
                    dto.setLastName(user.getLastName());
                    dto.setDateOfBirth(user.getDateOfBirth());
                    dto.setProfilePhotoUrl(user.getProfilePhotoUrl());
                    dto.setCountry(user.getCountry());
                    dto.setState(user.getState());
                    dto.setCity(user.getCity());
                    dto.setAddress(user.getAddress());
                    dto.setMembershipId(membership.getId());
                    dto.setTeamId(membership.getTeamId());
                    dto.setTeamRole(membership.getRoleInTeam());
                    dto.setMembershipStatus(membership.getStatus());
                    dto.setJoinedAt(membership.getJoinedAt());
                    dto.setLeftAt(membership.getLeftAt());
                    return dto;
                })
                .collect(Collectors.toList());

        GetTeamMembersDTO response = new GetTeamMembersDTO();
        response.setTeamCode(team.getTeamCode());
        response.setTeamName(team.getTeamName());
        response.setMembers(members);

        return response;
    }

    // ================= GET MY TEAM =================

    @Transactional(readOnly = true)
    public GetTeamResponseDTO getTeamOfCurrentUser(
            Authentication authentication) {

        UUID userId = extractUserId(authentication);

        // ============================================
        // FIND ACTIVE MEMBERSHIP
        // ============================================

        TeamMembership membership = teamMembershipRepository
                .findByUserIdAndStatus(
                        userId,
                        TeamMembershipStatus.ACTIVE)
                .orElse(null);

        // ============================================
        // USER HAS NO TEAM
        // ============================================

        if (membership == null) {

            GetTeamResponseDTO response =
                    new GetTeamResponseDTO();

            response.setId(null);
            response.setTeamCode(null);
            response.setTeamName(null);
            response.setDescription(null);
            response.setInstitutionName(null);
            response.setCity(null);
            response.setState(null);
            response.setCountry(null);
            response.setStatus("NO_TEAM");

            return response;
        }

        // ============================================
        // TEAM EXISTS
        // ============================================

        Team team = teamRepository
                .findById(membership.getTeamId())
                .orElseThrow(() ->
                        ApiException.notFound("Team not found"));

        GetTeamResponseDTO response =
                new GetTeamResponseDTO();

        response.setId(team.getId());

        if (team.getLogoUrl() != null &&
                !team.getLogoUrl().isBlank()) {

            response.setLogo_Url(
                    CDN_BASE_URL + team.getLogoUrl());
        }

        response.setTeamCode(team.getTeamCode());
        response.setTeamName(team.getTeamName());
        response.setDescription(team.getDescription());
        response.setInstitutionName(team.getInstitutionName());
        response.setCity(team.getCity());
        response.setState(team.getState());
        response.setCountry(team.getCountry());
        response.setStatus(team.getStatus());

        return response;
    }

    // ================= LEAVE TEAM =================

    public String leaveTeam(Authentication authentication) {

        UUID userId = extractUserId(authentication);

        TeamMembership membership = teamMembershipRepository
                .findByUserIdAndStatus(userId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("User not part of any team"));

        UUID teamId = membership.getTeamId();

        if (TeamRole.MEMBER.equals(membership.getRoleInTeam())) {
            membership.setStatus(TeamMembershipStatus.LEFT);
            membership.setLeftAt(LocalDateTime.now());
            teamMembershipRepository.save(membership);
            return "User left successfully";
        }

        if (TeamRole.CAPTAIN.equals(membership.getRoleInTeam())) {
            List<TeamMembership> members = teamMembershipRepository
                    .findByTeamIdAndStatus(teamId, TeamMembershipStatus.ACTIVE);

            if (members.size() > 1) {
                throw ApiException.badRequest("Captain must transfer role before leaving");
            }

            membership.setStatus(TeamMembershipStatus.LEFT);
            membership.setLeftAt(LocalDateTime.now());
            teamMembershipRepository.save(membership);
            return "User left successfully";
        }

        return "User left successfully";
    }

    // ================= KICK MEMBER =================

    public void kickMember(Authentication authentication, UUID targetUserId) {

        UUID captainId = extractUserId(authentication);

        TeamMembership captainMembership = teamMembershipRepository
                .findByUserIdAndStatus(captainId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("Captain not in a team"));

        if (!TeamRole.CAPTAIN.equals(captainMembership.getRoleInTeam())) {
            throw ApiException.forbidden("Only captain can remove members");
        }

        TeamMembership targetMembership = teamMembershipRepository
                .findByUserIdAndStatus(targetUserId, TeamMembershipStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("User not in team"));

        if (!captainMembership.getTeamId().equals(targetMembership.getTeamId())) {
            throw ApiException.forbidden("User is not part of your team");
        }

        if (TeamRole.CAPTAIN.equals(targetMembership.getRoleInTeam())) {
            throw ApiException.badRequest("Captain cannot remove themselves");
        }

        targetMembership.setStatus(TeamMembershipStatus.LEFT);
        teamMembershipRepository.save(targetMembership);
    }

    // ================= HELPER =================

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}