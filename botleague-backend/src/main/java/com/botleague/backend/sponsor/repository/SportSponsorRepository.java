package com.botleague.backend.sponsor.repository;

import com.botleague.backend.sponsor.entity.SportSponsor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SportSponsorRepository extends JpaRepository<SportSponsor, UUID> {
    List<SportSponsor> findBySportIdOrderByDisplayOrderAscCreatedAtAsc(UUID sportId);
    long countBySportId(UUID sportId);
}
