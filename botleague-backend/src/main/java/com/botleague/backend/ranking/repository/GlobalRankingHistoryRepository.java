package com.botleague.backend.ranking.repository;

import com.botleague.backend.ranking.entity.GlobalRankingHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GlobalRankingHistoryRepository extends JpaRepository<GlobalRankingHistory, UUID> {

    /** Most recent N rank changes for a team in a specific competition. */
    List<GlobalRankingHistory> findByTeamIdAndSportAndAgeGroupAndWeightClassOrderByRecordedAtDesc(
            UUID teamId, String sport, String ageGroup, String weightClass, Pageable pageable);

    /** All history entries triggered by a specific event completion. */
    List<GlobalRankingHistory> findByTriggeredByEventIdOrderByRankDeltaDesc(UUID eventId);

    /** Recent history across all competitions for a team (for profile page). */
    List<GlobalRankingHistory> findByTeamIdOrderByRecordedAtDesc(UUID teamId, Pageable pageable);
}
