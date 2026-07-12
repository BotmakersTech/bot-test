package com.botleague.backend.ranking.repository;

import com.botleague.backend.ranking.entity.RankingPointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RankingPointTransactionRepository extends JpaRepository<RankingPointTransaction, UUID> {

    List<RankingPointTransaction> findByMatchId(UUID matchId);

    List<RankingPointTransaction> findByTeamIdAndIsVoidedFalseOrderByCreatedAtDesc(UUID teamId);

    /** The ranked entity's transaction history — the primary lookup for a robot's point breakdown. */
    List<RankingPointTransaction> findByRobotIdAndIsVoidedFalseOrderByCreatedAtDesc(UUID robotId);

    List<RankingPointTransaction> findByEventSportIdAndIsVoidedFalse(UUID eventSportId);

    /**
     * All non-voided transactions in a sport/ageGroup/weightClass pool — replaces the
     * previously-broken fullRecalculate() call that passed null into
     * findByEventSportIdAndIsVoidedFalse(eventSportId), which always returned empty
     * since event_sport_id is non-null (a silent no-op on POST /api/rankings/recalculate).
     */
    @Query("""
        SELECT t FROM RankingPointTransaction t
        WHERE t.sport      = :sport
          AND t.ageGroup    = :ageGroup
          AND (:weightClass IS NULL OR t.weightClass = :weightClass)
          AND t.isVoided    = false
    """)
    List<RankingPointTransaction> findByPool(String sport, String ageGroup, String weightClass);

    List<RankingPointTransaction> findByEventIdAndIsVoidedFalse(UUID eventId);

    /** Total non-voided points a team has earned in a specific sport/program/weight pool. */
    @Query("""
        SELECT COALESCE(SUM(t.pointsAwarded), 0)
        FROM RankingPointTransaction t
        WHERE t.teamId      = :teamId
          AND t.sport       = :sport
          AND t.ageGroup    = :ageGroup
          AND (:weightClass IS NULL OR t.weightClass = :weightClass)
          AND t.isVoided    = false
    """)
    int sumPointsByTeamAndPool(UUID teamId, String sport, String ageGroup, String weightClass);

    /** Total non-voided points a robot has earned in a specific sport/program/weight pool. */
    @Query("""
        SELECT COALESCE(SUM(t.pointsAwarded), 0)
        FROM RankingPointTransaction t
        WHERE t.robotId     = :robotId
          AND t.sport       = :sport
          AND t.ageGroup    = :ageGroup
          AND (:weightClass IS NULL OR t.weightClass = :weightClass)
          AND t.isVoided    = false
    """)
    int sumPointsByRobotAndPool(UUID robotId, String sport, String ageGroup, String weightClass);

    /** Sum of points per event for a team (for event breakdown). */
    @Query("""
        SELECT COALESCE(SUM(t.pointsAwarded), 0)
        FROM RankingPointTransaction t
        WHERE t.teamId      = :teamId
          AND t.eventId     = :eventId
          AND t.isVoided    = false
    """)
    int sumPointsByTeamAndEvent(UUID teamId, UUID eventId);

    /** Idempotency guard for awardMatchPoints — per (match, robot), not per team, since points are robot-scoped. */
    boolean existsByMatchIdAndRobotId(UUID matchId, UUID robotId);

    /** Void all transactions for a match (used on score correction). */
    @Query("UPDATE RankingPointTransaction t SET t.isVoided = true WHERE t.matchId = :matchId")
    @org.springframework.data.jpa.repository.Modifying
    void voidAllForMatch(UUID matchId);
}
