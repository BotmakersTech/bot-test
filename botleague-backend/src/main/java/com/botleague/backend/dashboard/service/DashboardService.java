package com.botleague.backend.dashboard.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.dashboard.dto.DashboardResponse;
import com.botleague.backend.dashboard.dto.EventDTO;
import com.botleague.backend.dashboard.dto.MatchDTO;
import com.botleague.backend.dashboard.dto.ProfileDTO;
import com.botleague.backend.dashboard.dto.SportDTO;
import com.botleague.backend.dashboard.dto.TeamsDTO;
import com.botleague.backend.dashboard.dto.InvitesDTO;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventRegistrationLineup;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.repository.EventRegistrationLineupRepository;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.profile.service.UserProfileService;
import com.botleague.backend.team.dto.RobotResponseDTO;
import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamInvite;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamInviteStatus;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.RobotRepository;
import com.botleague.backend.team.repository.TeamInviteRepository;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final UserProfileService                  profileService;
    private final TeamMembershipRepository            teamMembershipRepository;
    private final TeamRepository                      teamRepository;
    private final RobotRepository                     robotRepository;
    private final TeamInviteRepository                teamInviteRepository;
    private final EventRegistrationLineupRepository   eventRegistrationLineupRepository;
    private final SportRegistrationRepository         sportRegistrationRepository;   // replaces EventRegistrationRepository
    private final EventRepository                     eventRepository;
    private final EventSportsRepository               eventSportsRepository;
    private final MatchRepository                     matchRepository;

    private final String teamLogo = "https://media.botleague.in/";

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public DashboardService(
            UserProfileService                profileService,
            TeamMembershipRepository          teamMembershipRepository,
            RobotRepository                   robotRepository,
            TeamRepository                    teamRepository,
            TeamInviteRepository              teamInviteRepository,
            EventRegistrationLineupRepository eventRegistrationLineupRepository,
            SportRegistrationRepository       sportRegistrationRepository,
            EventRepository                   eventRepository,
            EventSportsRepository             eventSportsRepository,
            MatchRepository                   matchRepository
    ) {
        this.profileService                    = profileService;
        this.teamMembershipRepository          = teamMembershipRepository;
        this.robotRepository                   = robotRepository;
        this.teamRepository                    = teamRepository;
        this.teamInviteRepository              = teamInviteRepository;
        this.eventRegistrationLineupRepository = eventRegistrationLineupRepository;
        this.sportRegistrationRepository       = sportRegistrationRepository;
        this.eventRepository                   = eventRepository;
        this.eventSportsRepository             = eventSportsRepository;
        this.matchRepository                   = matchRepository;
    }

    // =====================================================
    // MAIN
    // =====================================================

    public DashboardResponse getDashboard(UUID userId) {

        ProfileDTO             profile = getProfile(userId);
        List<RobotResponseDTO> robots  = getRobots(userId);
        List<TeamsDTO>         teams   = getTeams(userId);
        List<InvitesDTO>       invites = getTeamInvite(userId);
        List<EventDTO>         events  = getEvents(userId);

        return new DashboardResponse(profile, robots, teams, invites, events);
    }

    // =====================================================
    // PROFILE
    // =====================================================

    private ProfileDTO getProfile(UUID userId) {

        User user = profileService.getUserById(userId);

        String location = (user.getCity() != null && user.getState() != null)
                ? user.getCity() + ", " + user.getState()
                : "Location not set";

        String createdDate = (user.getCreatedAt() != null)
                ? user.getCreatedAt().toLocalDate().toString()
                : null;

        return new ProfileDTO(
                user.getFirstName(),
                user.getLastName(),
                user.getBotleagueId(),
                location,
                user.getAccountType(),
                createdDate,
                null,
                null
        );
    }

    // =====================================================
    // ROBOTS
    // =====================================================

    private List<RobotResponseDTO> getRobots(UUID userId) {

        List<RobotResponseDTO> result = new ArrayList<>();

        List<TeamMembership> memberships =
                teamMembershipRepository.findByUserId(userId);

        for (TeamMembership membership : memberships) {

            UUID          teamId   = membership.getTeamId();
            LocalDateTime joinedAt = membership.getJoinedAt();
            LocalDateTime leftAt   = membership.getLeftAt();

            List<Robot> robots;

            if (TeamMembershipStatus.ACTIVE.equals(membership.getStatus())) {

                robots = robotRepository
                        .findByTeamIdAndCreatedAtAfterAndDeletedAtIsNull(teamId, joinedAt);

            } else {

                if (leftAt == null) continue;

                robots = robotRepository
                        .findByTeamIdAndCreatedAtBetweenAndDeletedAtIsNull(teamId, joinedAt, leftAt);
            }

            for (Robot robot : robots) {

                RobotResponseDTO dto = new RobotResponseDTO();
                dto.setId(robot.getId());
                dto.setRobotCode(robot.getRobotCode());
                dto.setRobotName(robot.getRobotName());
                dto.setRobotType(robot.getRobotType());
                dto.setSport(robot.getSport());
                dto.setControlType(robot.getControlType());
                dto.setWeightClass(robot.getWeightClass());
                dto.setDescription(robot.getDescription());
                dto.setStatus(robot.getStatus());
                dto.setTeamId(robot.getTeamId());
                dto.setCreatedAt(robot.getCreatedAt());

                result.add(dto);
            }
        }

        return result;
    }

    // =====================================================
    // TEAMS
    // =====================================================

    private List<TeamsDTO> getTeams(UUID userId) {

        List<TeamMembership> memberships =
                teamMembershipRepository.findByUserId(userId);

        return memberships.stream().map(membership -> {

            Team team = teamRepository.findById(membership.getTeamId())
                    .orElseThrow(() -> ApiException.notFound("Team not found"));

            TeamsDTO dto = new TeamsDTO();
            dto.setTeamId(team.getId());
            dto.setTeamName(team.getTeamName());
            dto.setTeamCode(team.getTeamCode());
            dto.setTeamLogo(teamLogo + team.getLogoUrl());
            dto.setRole(membership.getRoleInTeam());
            dto.setStatus(membership.getStatus());

            return dto;

        }).collect(Collectors.toList());
    }

    // =====================================================
    // INVITES
    // =====================================================

    private List<InvitesDTO> getTeamInvite(UUID userId) {

        List<TeamInvite> invites =
                teamInviteRepository.findByInvitedUserIdAndStatus(
                        userId, TeamInviteStatus.PENDING);

        return invites.stream()
                .filter(invite -> invite.getExpiresAt() != null
                        && invite.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(invite -> {

                    InvitesDTO dto = new InvitesDTO();
                    dto.setInviteId(invite.getId());
                    dto.setTeamId(invite.getTeamId());
                    dto.setInvitedBy(invite.getInvitedBy());
                    dto.setStatus(invite.getStatus());
                    dto.setExpiresAt(invite.getExpiresAt());

                    dto.setTeamName(
                            teamRepository.findById(invite.getTeamId())
                                    .map(Team::getTeamName)
                                    .orElse("Unknown Team"));

                    dto.setInvitedByName(
                            profileService.getUserById(invite.getInvitedBy())
                                    .getUsername());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    // =====================================================
    // EVENTS
    // =====================================================

    private List<EventDTO> getEvents(UUID userId) {

        // ─────────────────────────────────────────────
        // 1. Find all teams this user is (or was) a member of.
        // ─────────────────────────────────────────────

        List<UUID> teamIds = teamMembershipRepository
                .findByUserId(userId)
                .stream()
                .map(TeamMembership::getTeamId)
                .distinct()
                .collect(Collectors.toList());

        if (teamIds.isEmpty()) {
            return List.of();
        }

        // ─────────────────────────────────────────────
        // 2. Load all SportRegistrations for those teams.
        //    This works regardless of whether a lineup
        //    was filled — the team participated as a unit.
        //    We also check via lineup so individual
        //    members on multi-bot teams see all their sports.
        // ─────────────────────────────────────────────

        List<SportRegistration> registrations = sportRegistrationRepository
                .findByTeamIdIn(teamIds)
                .stream()
                .filter(r -> r.getStatus() != null &&
                        (r.getStatus().name().equals("REGISTERED") ||
                         r.getStatus().name().equals("PENDING") ||
                         r.getStatus().name().equals("CONFIRMED") ||
                         r.getStatus().name().equals("CHECKED_IN")))
                .collect(Collectors.toList());

        List<EventDTO> result = new ArrayList<>();

        for (SportRegistration registration : registrations) {

            UUID eventId         = registration.getEventId();
            UUID eventSportId    = registration.getEventSportId();
            UUID registrationId  = registration.getId();

            // ─────────────────────────────────────────
            // 5. Load and validate Event
            // ─────────────────────────────────────────

            Event event = eventRepository.findById(eventId).orElse(null);
            if (event == null || event.getDeletedAt() != null) {
                continue;
            }

            // ─────────────────────────────────────────
            // 6. Load EventSports
            // ─────────────────────────────────────────

            EventSports eventSport =
                    eventSportsRepository.findById(eventSportId).orElse(null);
            if (eventSport == null) {
                continue;
            }

            // ─────────────────────────────────────────
            // 7. Load matches for this registration
            // ─────────────────────────────────────────

            List<Match> matches = matchRepository
                    .findByEventSportIdAndTeamARegistrationIdOrEventSportIdAndTeamBRegistrationId(
                            eventSportId, registrationId,
                            eventSportId, registrationId);

            List<MatchDTO> matchDTOs = matches.stream()
                    .filter(m -> m.getDeletedAt() == null)
                    .map(m -> {

                        MatchDTO dto = new MatchDTO();
                        dto.setMatchId(m.getId());
                        dto.setRoundNumber(m.getRoundNumber());
                        dto.setMatchNumber(m.getMatchNumber());
                        dto.setStatus(m.getStatus());
                        dto.setTeamARegistrationId(m.getTeamARegistrationId());
                        dto.setTeamBRegistrationId(m.getTeamBRegistrationId());

                        // resolveTeamName now uses SportRegistration → Team
                        dto.setTeamAName(resolveTeamName(m.getTeamARegistrationId()));
                        dto.setTeamBName(resolveTeamName(m.getTeamBRegistrationId()));

                        dto.setTeamAScore(m.getTeamAScore());
                        dto.setTeamBScore(m.getTeamBScore());
                        dto.setWinnerRegistrationId(m.getWinnerRegistrationId());
                        dto.setScheduledAt(m.getScheduledAt());

                        return dto;
                    })
                    .collect(Collectors.toList());

            // ─────────────────────────────────────────
            // 8. Build SportDTO
            //    registrationStatus comes from
            //    SportRegistration.status (RegistrationStatus enum)
            // ─────────────────────────────────────────

            SportDTO sportDTO = new SportDTO();
            sportDTO.setEventSportId(eventSport.getId());
            sportDTO.setSport(eventSport.getSport());
            sportDTO.setAgeGroup(eventSport.getAgeGroup());
            sportDTO.setWeightClass(eventSport.getWeightClass());
            sportDTO.setFormatType(eventSport.getFormatType());
            sportDTO.setRegistrationStatus(registration.getStatus()); // RegistrationStatus enum
            sportDTO.setMatches(matchDTOs);

            // ─────────────────────────────────────────
            // 9. Build EventDTO
            // ─────────────────────────────────────────

            EventDTO eventDTO = new EventDTO();
            eventDTO.setEventId(event.getId());
            eventDTO.setEventCode(event.getEventCode());
            eventDTO.setEventName(event.getEventName());
            eventDTO.setEventDescription(event.getEventDescription());
            eventDTO.setLogoURL(teamLogo + event.getEventLogoUrl());
            eventDTO.setOrganizationName(event.getOrganizationName());
            eventDTO.setVenueName(event.getVenueName());
            eventDTO.setCity(event.getCity());
            eventDTO.setState(event.getState());
            eventDTO.setStartDate(event.getStartDate());
            eventDTO.setEndDate(event.getEndDate());
            eventDTO.setEventStatus(event.getStatus());
            eventDTO.setSport(sportDTO);

            result.add(eventDTO);
        }

        return result;
    }

    // =====================================================
    // HELPERS
    // =====================================================

    /**
     * Resolves a team name from a SportRegistration ID.
     *
     * SportRegistration has no teamName field (unlike the old EventRegistration).
     * We look up the teamId from the registration, then fetch the Team name.
     */
    private String resolveTeamName(UUID sportRegistrationId) {

        if (sportRegistrationId == null) return null;

        return sportRegistrationRepository
                .findById(sportRegistrationId)
                .flatMap(reg -> teamRepository.findById(reg.getTeamId()))
                .map(Team::getTeamName)
                .orElse(null);
    }
}