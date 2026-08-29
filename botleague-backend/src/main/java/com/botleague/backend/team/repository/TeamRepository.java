package com.botleague.backend.team.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.botleague.backend.team.entity.Team;

public interface TeamRepository extends JpaRepository<Team, UUID> {

    boolean existsByTeamName(String teamName);

    /** Used when updating a team's name — excludes the team's own current row. */
    boolean existsByTeamNameAndIdNot(String teamName, UUID id);

    boolean existsByTeamCode(String teamCode);

    Optional<Team> findByTeamCode(String teamCode);

    // Soft-deleted teams don't hold their name/code (see the partial unique
    // indexes in V32) — these are what collision checks on create/rename
    // must actually use, or a deleted team's old name would be wrongly
    // reported as taken.
    boolean existsByTeamNameAndDeletedAtIsNull(String teamName);
    boolean existsByTeamNameAndIdNotAndDeletedAtIsNull(String teamName, UUID id);

    Optional<Team> findByIdAndDeletedAtIsNull(UUID id);

    Page<Team> findAllByDeletedAtIsNull(Pageable pageable);

    @Query("SELECT t FROM Team t WHERE " +
           "LOWER(t.teamName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.teamCode) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.institutionName) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Team> searchTeams(@Param("q") String query, Pageable pageable);

    @Query("SELECT t FROM Team t WHERE t.deletedAt IS NULL AND (" +
           "LOWER(t.teamName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.teamCode) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.institutionName) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Team> searchActiveTeams(@Param("q") String query, Pageable pageable);
}