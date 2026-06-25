package com.botleague.backend.team.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.team.entity.TeamInvite;
import com.botleague.backend.team.enums.TeamInviteStatus;

public interface TeamInviteRepository
        extends JpaRepository<TeamInvite, UUID> {

    boolean existsByTeamIdAndInvitedUserIdAndStatus(
            UUID teamId, UUID invitedUserId, TeamInviteStatus status);

    List<TeamInvite> findByInvitedUserIdAndStatus(
            UUID userId, TeamInviteStatus status);

    List<TeamInvite> findByTeamIdAndInvitedUserId(
            UUID teamId, UUID invitedUserId);

    List<TeamInvite> findByTeamIdAndInvitedByAndStatus(
            UUID teamId, UUID invitedBy, TeamInviteStatus status);

    List<TeamInvite> findByInvitedByAndStatus(
            UUID invitedBy, TeamInviteStatus status);

    Optional<TeamInvite> findByIdAndStatus(
            UUID inviteId, TeamInviteStatus status);

    List<TeamInvite> findByStatus(TeamInviteStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<TeamInvite> findWithLockById(UUID id);

    /** Removes all old invite history for a (team, user) pair EXCEPT the given invite.
     *  Called before accepting to prevent UNIQUE(team_id, invited_user_id, status) violations on re-join. */
    @Modifying
    @Transactional
    @Query("DELETE FROM TeamInvite i WHERE i.teamId = :teamId AND i.invitedUserId = :userId AND i.id <> :excludeId")
    void deleteOtherInviteHistory(
            @Param("teamId") UUID teamId,
            @Param("userId") UUID userId,
            @Param("excludeId") UUID excludeId);
}