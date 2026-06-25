package com.botleague.backend.team.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.team.entity.RobotMedia;
import com.botleague.backend.team.enums.MediaType;

public interface RobotMediaRepository extends JpaRepository<RobotMedia, UUID> {

    // =========================
    // FETCH ALL MEDIA OF A ROBOT
    // =========================
    List<RobotMedia> findByRobotId(UUID robotId);

    // =========================
    // FETCH MEDIA BY TYPE (IMAGE / VIDEO)
    // =========================
    List<RobotMedia> findByRobotIdAndMediaType(UUID robotId, MediaType mediaType);

    // =========================
    // FETCH LATEST MEDIA (for thumbnail / primary)
    // =========================
    Optional<RobotMedia> findTopByRobotIdOrderByCreatedAtDesc(UUID robotId);

    
    Optional<RobotMedia>
    findFirstByRobotIdAndMediaTypeOrderByCreatedAtDesc(
            UUID robotId,
            MediaType mediaType
    );
    // =========================
    // COUNT MEDIA (for limit validation)
    // =========================
    long countByRobotId(UUID robotId);

    // =========================
    // DELETE ALL MEDIA OF A ROBOT
    // =========================
    void deleteByRobotId(UUID robotId);

    // =========================
    // CHECK IF MEDIA EXISTS
    // =========================
    boolean existsByRobotId(UUID robotId);
}