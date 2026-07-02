package com.botleague.backend.events.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.RegistrationStatus;

@Repository
public interface SportRegistrationRepository
        extends JpaRepository<SportRegistration, UUID> {

    // =====================================================
    // DUPLICATE / EXISTENCE CHECKS
    // =====================================================

    // Same physical bot already entered in this competition.
    boolean existsByEventSportIdAndRobotIdAndStatus(
            UUID eventSportId,
            UUID robotId,
            RegistrationStatus status
    );

    boolean existsByEventSportIdAndRobotId(
            UUID eventSportId,
            UUID robotId
    );

    // Matches the (event_sport_id, team_id, robot_name) unique constraint.
    // Use THIS for the "did this team already enter a bot with this name?" check.
    boolean existsByEventSportIdAndTeamIdAndRobotName(
            UUID eventSportId,
            UUID teamId,
            String robotName
    );

    // NOTE: ignores the team. Two different teams may use the same robot name,
    // so this is only a loose check - prefer the team-scoped version above.
    boolean existsByEventSportIdAndRobotName(
            UUID eventSportId,
            String robotName
    );

    // =====================================================
    // FIND BY EVENT SPORT
    // =====================================================

    List<SportRegistration> findByEventSportId(
            UUID eventSportId
    );

    List<SportRegistration> findByEventSportIdAndStatus(
            UUID eventSportId,
            RegistrationStatus status
    );

    // Confirmed entries in seed order - use this when building / reading the bracket.
    List<SportRegistration> findByEventSportIdAndStatusOrderBySeedAsc(
            UUID eventSportId,
            RegistrationStatus status
    );

    // =====================================================
    // FIND BY EVENT
    // =====================================================

    List<SportRegistration> findByEventId(
            UUID eventId
    );

    List<SportRegistration> findByEventIdAndStatus(
            UUID eventId,
            RegistrationStatus status
    );

    // =====================================================
    // FIND BY TEAM
    // =====================================================

    List<SportRegistration> findByTeamId(
            UUID teamId
    );

    List<SportRegistration> findByTeamIdAndStatus(
            UUID teamId,
            RegistrationStatus status
    );

    // =====================================================
    // A TEAM'S ROBOTS IN ONE SPORT
    // =====================================================

    List<SportRegistration> findByEventSportIdAndTeamId(
            UUID eventSportId,
            UUID teamId
    );

    List<SportRegistration> findByEventSportIdAndTeamIdAndStatus(
            UUID eventSportId,
            UUID teamId,
            RegistrationStatus status
    );

    // =====================================================
    // SINGLE-RESULT LOOKUPS
    // =====================================================

    Optional<SportRegistration> findByEventSportIdAndRobotId(
            UUID eventSportId,
            UUID robotId
    );

    // Looks up the single CANCELLED row so re-registration can reactivate it
    // rather than inserting a new row (which would violate the UK constraint).
    Optional<SportRegistration> findByEventSportIdAndRobotIdAndStatus(
            UUID eventSportId,
            UUID robotId,
            RegistrationStatus status
    );

    // Replaces findByEventSportIdAndRobotName(): looking up by robot name ALONE
    // can match several rows (different teams) and then throws. Scoping by team
    // matches the unique constraint, so at most one row comes back.
    Optional<SportRegistration> findByEventSportIdAndTeamIdAndRobotName(
            UUID eventSportId,
            UUID teamId,
            String robotName
    );

    // =====================================================
    // STATUS FILTERS
    // =====================================================

    List<SportRegistration> findByStatus(
            RegistrationStatus status
    );

    // =====================================================
    // COUNTS (capacity + per-team bot limit)
    // =====================================================

    long countByEventSportId(
            UUID eventSportId
    );

    long countByEventSportIdAndStatus(
            UUID eventSportId,
            RegistrationStatus status
    );

    // How many bots this team already has in the competition -> compare to maxBotsPerTeam.
    long countByEventSportIdAndTeamIdAndStatus(
            UUID eventSportId,
            UUID teamId,
            RegistrationStatus status
    );

    // Distinct teams in the competition. Use this for capacity if maxTeams counts
    // TEAMS rather than bots (derived queries can't do COUNT DISTINCT).
    @Query("select count(distinct r.teamId) from SportRegistration r "
            + "where r.eventSportId = :eventSportId and r.status = :status")
    long countDistinctTeams(
            @Param("eventSportId") UUID eventSportId,
            @Param("status") RegistrationStatus status
    );

    // =====================================================
    // DELETE HELPERS
    // (Prefer a soft delete - set status = WITHDRAWN - to keep history.
    //  These hard-delete and must run inside a transaction.)
    // =====================================================

    @Transactional
    void deleteByEventSportIdAndRobotId(
            UUID eventSportId,
            UUID robotId
    );

    // Team-scoped so it can't accidentally wipe another team's identically named bot.
    @Transactional
    void deleteByEventSportIdAndTeamIdAndRobotName(
            UUID eventSportId,
            UUID teamId,
            String robotName
    );

	boolean existsByEventSportIdAndRobotIdAndStatusIn(UUID eventSportId, UUID robotId, List<RegistrationStatus> of);

	long countByEventSportIdAndTeamIdAndStatusIn(UUID eventSportId, UUID teamId, List<RegistrationStatus> of);

    // Fetch all registrations for a set of teams in one query (used by getMyMatches).
    List<SportRegistration> findByTeamIdIn(java.util.Collection<UUID> teamIds);

    /** All registrations where a specific robot participated (for public robot profile). */
    List<SportRegistration> findByRobotId(UUID robotId);
}