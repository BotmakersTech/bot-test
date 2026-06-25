package com.botleague.backend.readiness.repository;

import com.botleague.backend.readiness.entity.PlayerReadiness;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlayerReadinessRepository extends JpaRepository<PlayerReadiness, UUID> {

    Optional<PlayerReadiness> findByMatchIdAndUserId(UUID matchId, UUID userId);

    List<PlayerReadiness> findByMatchId(UUID matchId);
}
