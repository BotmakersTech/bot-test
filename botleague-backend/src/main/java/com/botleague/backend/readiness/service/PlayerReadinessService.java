package com.botleague.backend.readiness.service;

import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.readiness.dto.ReadinessResponse;
import com.botleague.backend.readiness.dto.UpdateReadinessRequest;
import com.botleague.backend.readiness.entity.PlayerReadiness;
import com.botleague.backend.readiness.repository.PlayerReadinessRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlayerReadinessService {

    private final PlayerReadinessRepository playerReadinessRepository;
    private final MatchRepository matchRepository;

    public PlayerReadinessService(PlayerReadinessRepository playerReadinessRepository,
                                  MatchRepository matchRepository) {
        this.playerReadinessRepository = playerReadinessRepository;
        this.matchRepository = matchRepository;
    }

    public ReadinessResponse updateReadiness(UUID matchId, UUID userId, UUID registrationId, UpdateReadinessRequest req) {
        if (!matchRepository.existsById(matchId)) {
            throw new RuntimeException("Match not found: " + matchId);
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
