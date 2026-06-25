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

    boolean existsByTeamCode(String teamCode);

    Optional<Team> findByTeamCode(String teamCode);

    @Query("SELECT t FROM Team t WHERE " +
           "LOWER(t.teamName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.teamCode) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.institutionName) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Team> searchTeams(@Param("q") String query, Pageable pageable);
}