package com.botleague.backend.team.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;

public interface TeamMembershipRepository
        extends JpaRepository<TeamMembership, UUID> {

    /*
     * =========================================
     * BASIC FINDERS
     * =========================================
     */

    List<TeamMembership> findByTeamId(UUID teamId);

    List<TeamMembership> findByUserId(UUID userId);

    Optional<TeamMembership> findByTeamIdAndUserId(
            UUID teamId,
            UUID userId
    );

    /*
     * =========================================
     * STATUS
     * =========================================
     */

    Optional<TeamMembership> findByUserIdAndStatus(
            UUID userId,
            TeamMembershipStatus status
    );

    List<TeamMembership> findByTeamIdAndStatus(
            UUID teamId,
            TeamMembershipStatus status
    );

    Optional<TeamMembership>
    findByTeamIdAndUserIdAndStatus(
            UUID teamId,
            UUID userId,
            TeamMembershipStatus status
    );

    /*
     * =========================================
     * ROLE HELPERS
     * =========================================
     */

    Optional<TeamMembership>
    findByTeamIdAndRoleInTeamAndStatus(
            UUID teamId,
            TeamRole roleInTeam,
            TeamMembershipStatus status
    );

    List<TeamMembership>
    findByTeamIdAndStatusAndUserIdNot(
            UUID teamId,
            TeamMembershipStatus status,
            UUID userId
    );

    /*
     * =========================================
     * EXISTS
     * =========================================
     */

    boolean existsByTeamIdAndUserIdAndRoleInTeamAndStatus(
            UUID teamId,
            UUID userId,
            TeamRole roleInTeam,
            TeamMembershipStatus status
    );

	boolean existsByUserIdAndStatus(UUID invitedUserId, TeamMembershipStatus active);

    long countByTeamIdAndStatus(UUID teamId, TeamMembershipStatus status);

    List<TeamMembership> findByStatus(TeamMembershipStatus status);
}