package com.botleague.backend.ranking.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.ranking.entity.Ranking;

public interface RankingRepository extends JpaRepository<Ranking, UUID> {

    /** All-sport ranking for a category + scope, sorted by points desc. */
    List<Ranking> findByCategoryAndScopeAndSeasonOrderByTotalPointsDesc(
            AgeCategory category, String scope, String season, Pageable pageable);

    /** Sport-specific ranking. */
    List<Ranking> findByCategoryAndSportAndScopeAndSeasonOrderByTotalPointsDesc(
            AgeCategory category, String sport, String scope, String season, Pageable pageable);

    /** Scope=NATIONAL, no category filter. */
    List<Ranking> findByScopeAndSeasonOrderByTotalPointsDesc(
            String scope, String season, Pageable pageable);

    /** Sport-specific, all categories. */
    List<Ranking> findBySportAndScopeAndSeasonOrderByTotalPointsDesc(
            String sport, String scope, String season, Pageable pageable);

    /** Rankings scoped to a single event. */
    List<Ranking> findByEventIdOrderByTotalPointsDesc(UUID eventId, Pageable pageable);

    /** Lookup or upsert by natural key (single weight class — legacy). */
    Optional<Ranking> findByTeamIdAndSportAndScopeAndSeason(
            UUID teamId, String sport, String scope, String season);

    Optional<Ranking> findByUserIdAndSportAndScopeAndSeason(
            UUID userId, String sport, String scope, String season);

    /** All ranking entries for a team+sport (may span multiple weight classes). */
    List<Ranking> findAllByTeamIdAndSportAndScopeAndSeason(
            UUID teamId, String sport, String scope, String season);

    /** All ranking entries for a team across all pools (rollup across its robots). */
    List<Ranking> findByTeamId(UUID teamId);

    /** All ranking entries for a robot across all pools. */
    List<Ranking> findByRobotId(UUID robotId);

    /** Exact match including weight class — the preferred upsert key, per robot. */
    Optional<Ranking> findByRobotIdAndSportAndWeightClassAndScopeAndSeason(
            UUID robotId, String sport, String weightClass, String scope, String season);

    /** All entries for a specific pool — used for full rank recalculation. */
    @Query("""
        SELECT r FROM Ranking r
        WHERE r.sport = :sport AND r.scope = :scope AND r.season = :season
          AND (:category IS NULL OR r.category = :category)
          AND (:weightClass IS NULL OR r.weightClass = :weightClass)
        ORDER BY r.totalPoints DESC, r.wins DESC, r.winPercentage DESC
    """)
    List<Ranking> findPoolOrderedByPoints(
            @Param("sport")       String sport,
            @Param("scope")       String scope,
            @Param("season")      String season,
            @Param("category")    AgeCategory category,
            @Param("weightClass") String weightClass);

    /** State-scoped leaderboard. */
    @Query("SELECT r FROM Ranking r WHERE r.scope = 'STATE' AND r.state = :state " +
           "AND r.season = :season ORDER BY r.totalPoints DESC")
    List<Ranking> findByStateAndSeason(@Param("state") String state,
                                       @Param("season") String season,
                                       Pageable pageable);
}
