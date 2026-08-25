package com.botleague.backend.matches.repository;

import com.botleague.backend.matches.entity.RankingBonusPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RankingBonusPointRepository extends JpaRepository<RankingBonusPoint, UUID> {

    List<RankingBonusPoint> findByEventSportId(UUID eventSportId);

    /** Per-registration bonus totals for a sport, in one query — used by LeaderboardService. */
    @Query("""
        SELECT b.registrationId, COALESCE(SUM(b.points), 0)
        FROM RankingBonusPoint b
        WHERE b.eventSportId = :eventSportId
        GROUP BY b.registrationId
    """)
    List<Object[]> sumByRegistrationForSport(UUID eventSportId);
}
