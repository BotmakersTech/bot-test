package com.botleague.backend.readiness.service;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.readiness.dto.ReadinessResponse;
import com.botleague.backend.readiness.dto.UpdateReadinessRequest;
import com.botleague.backend.readiness.entity.PlayerReadiness;
import com.botleague.backend.readiness.repository.PlayerReadinessRepository;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlayerReadinessService {

    private final PlayerReadinessRepository playerReadinessRepository;
    private final MatchRepository matchRepository;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamMembershipRepository teamMembershipRepository;

    public PlayerReadinessService(PlayerReadinessRepository playerReadinessRepository,
                                  MatchRepository matchRepository,
                                  SportRegistrationRepository sportRegistrationRepository,
                                  TeamMembershipRepository teamMembershipRepository) {
        this.playerReadinessRepository = playerReadinessRepository;
        this.matchRepository = matchRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamMembershipRepository = teamMembershipRepository;
    }

    public ReadinessResponse updateReadiness(UUID matchId, UUID userId, UUID registrationId, UpdateReadinessRequest req) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found: " + matchId));

        // The registrationId is client-supplied — verify it's actually a
        // participant in this match, and that the caller belongs to the team
        // behind it, before letting them set readiness "on behalf of" it.
        Set<UUID> participantIds = new HashSet<>();
        if (match.getTeamARegistrationId() != null) participantIds.add(match.getTeamARegistrationId());
        if (match.getTeamBRegistrationId() != null) participantIds.add(match.getTeamBRegistrationId());
        if (match.getTeamCRegistrationId() != null) participantIds.add(match.getTeamCRegistrationId());
        if (match.getTeamDRegistrationId() != null) participantIds.add(match.getTeamDRegistrationId());

        if (!participantIds.contains(registrationId)) {
            throw ApiException.badRequest("That registration is not part of this match");
        }

        SportRegistration registration = sportRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));

        boolean isTeamMember = teamMembershipRepository
                .findByTeamIdAndUserIdAndStatus(registration.getTeamId(), userId, TeamMembershipStatus.ACTIVE)
                .isPresent();
        if (!isTeamMember) {
            throw ApiException.forbidden("You are not a member of the team for this registration");
        }

        PlayerReadiness pr = playerReadinessRepository
                .findByMatchIdAndUserId(matchId, userId)
                .orElseGet(() -> {
                    PlayerReadiness fresh = new PlayerReadiness();
                    fresh.setMatchId(matchId);
                    fresh.setUserId(userId);
                    fresh.setRegistrationId(registrationId);
                    return fresh;
                });

        if (req.getReady() != null) pr.setReady(req.getReady());
        if (req.getArrivedAtVenue() != null) pr.setArrivedAtVenue(req.getArrivedAtVenue());
        if (req.getRobotChecked() != null) pr.setRobotChecked(req.getRobotChecked());
        if (req.getBatteryCharged() != null) pr.setBatteryCharged(req.getBatteryCharged());
        if (req.getEquipmentVerified() != null) pr.setEquipmentVerified(req.getEquipmentVerified());

        return mapToDTO(playerReadinessRepository.save(pr));
    }

    @Transactional(readOnly = true)
    public List<ReadinessResponse> getMatchReadiness(UUID matchId) {
        return playerReadinessRepository.findByMatchId(matchId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReadinessResponse getMyReadiness(UUID matchId, UUID userId) {
        return playerReadinessRepository
                .findByMatchIdAndUserId(matchId, userId)
                .map(this::mapToDTO)
                .orElseGet(() -> {
                    ReadinessResponse empty = new ReadinessResponse();
                    empty.setMatchId(matchId);
                    empty.setUserId(userId);
                    empty.setReadinessPercent(0);
                    return empty;
                });
    }

    private ReadinessResponse mapToDTO(PlayerReadiness pr) {
        ReadinessResponse dto = new ReadinessResponse();
        dto.setId(pr.getId());
        dto.setMatchId(pr.getMatchId());
        dto.setUserId(pr.getUserId());
        dto.setRegistrationId(pr.getRegistrationId());
        dto.setReady(pr.isReady());
        dto.setArrivedAtVenue(pr.isArrivedAtVenue());
        dto.setRobotChecked(pr.isRobotChecked());
        dto.setBatteryCharged(pr.isBatteryCharged());
        dto.setEquipmentVerified(pr.isEquipmentVerified());
        dto.setUpdatedAt(pr.getUpdatedAt());

        int count = 0;
        if (pr.isReady()) count++;
        if (pr.isArrivedAtVenue()) count++;
        if (pr.isRobotChecked()) count++;
        if (pr.isBatteryCharged()) count++;
        if (pr.isEquipmentVerified()) count++;
        dto.setReadinessPercent(count * 20);

        return dto;
    }
}
