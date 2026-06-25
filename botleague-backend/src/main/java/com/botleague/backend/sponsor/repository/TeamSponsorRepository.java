package com.botleague.backend.sponsor.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.sponsor.entity.TeamSponsor;

public interface TeamSponsorRepository extends JpaRepository<TeamSponsor, UUID> {

    List<TeamSponsor> findByTeamIdOrderByDisplayOrderAscCreatedAtAsc(UUID teamId);

    long countByTeamId(UUID teamId);
}
