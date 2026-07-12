package com.botleague.backend.ranking.repository;

import com.botleague.backend.ranking.entity.EventLeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventLeaderboardEntryRepository extends JpaRepository<EventLeaderboardEntry, UUID> {

    Optional<EventLeaderboardEntry> findByEventSportIdAndTeamId(UUID eventSportId, UUID teamId);

    /** The ranked entity's entry within one event sport — the primary lookup key. */
    Optional<EventLeaderboardEntry> findByEventSportIdAndRobotId(UUID eventSportId, UUID robotId);

    boolean existsByEventSportIdAndRobotId(UUID eventSportId, UUID robotId);

    /** All entries a robot has ever had (for its public profile / global aggregation). */
    List<EventLeaderboardEntry> findByRobotId(UUID robotId);

    List<EventLeaderboardEntry> findByRobotIdAndIsFinalized(UUID robotId, Boolean isFinalized);

    /** Full leaderboard ordered by points DESC for tie-breaker processing. */
    List<EventLeaderboardEntry> findByEventSportIdOrderByPointsEarnedDescWinsDescMatchesPlayedDesc(
            UUID eventSportId);

    List<EventLeaderboardEntry> findByEventId(UUID eventId);

    List<EventLeaderboardEntry> findByEventSportIdAndIsFinalized(UUID eventSportId, Boolean isFinalized);

    /** All entries a team has ever had (for global aggregation). */
    List<EventLeaderboardEntry> findByTeamIdAndIsFinalized(UUID teamId, Boolean isFinalized);

    /** All entries for a team regardless of finalization status. */
    List<EventLeaderboardEntry> findByTeamId(UUID teamId);

    /** All finalized entries for a sport+ageGroup+weightClass combination (global ranking source). */
    @Query("""
        SELECT e FROM EventLeaderboardEntry e
        WHERE e.sport      = :sport
          AND e.ageGroup   = :ageGroup
          AND (:weightClass IS NULL OR e.weightClass = :weightClass)
          AND e.isFinalized = true
        ORDER BY e.pointsEarned DESC
    """)
    List<EventLeaderboardEntry> findFinalizedBySportAndAgeGroup(
            String sport, String ageGroup, String weightClass);

    boolean existsByEventSportIdAndTeamId(UUID eventSportId, UUID teamId);

    long countByEventSportId(UUID eventSportId);
}
