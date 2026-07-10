package com.botleague.backend.team.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.enums.RobotStatus;

@Repository
public interface RobotRepository extends JpaRepository<Robot, UUID> {

    // =========================
    // BASIC QUERIES
    // =========================

    List<Robot> findByTeamId(UUID teamId);

    Optional<Robot> findByRobotCode(String robotCode);

    boolean existsByRobotCode(String robotCode);

    // =========================
    // FILTERED QUERIES
    // =========================

    List<Robot> findByTeamIdAndDeletedAtIsNull(UUID teamId);

    Optional<Robot> findByIdAndDeletedAtIsNull(UUID id);
    
    boolean existsByTeamIdAndRobotName(UUID teamId, String robotName);

	List<Robot> findByTeamIdAndCreatedAtBetweenAndDeletedAtIsNull(UUID teamId, LocalDateTime joinedAt,
			LocalDateTime leftAt);

    // ── Admin search ──────────────────────────────────────────────────────────
    // All params are optional (null = no filter). Supports name search, sport
    // filter, and status filter in a single query so the controller stays thin.

    @Query("SELECT r FROM Robot r WHERE r.deletedAt IS NULL " +
           "AND (:q = '' OR LOWER(r.robotName) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "AND (:sport = '' OR r.sport = :sport) " +
           "AND (:status IS NULL OR r.status = :status)")
    Page<Robot> searchAdmin(
            @Param("q")      String q,
            @Param("sport")  String sport,
            @Param("status") RobotStatus status,
            Pageable pageable);

}