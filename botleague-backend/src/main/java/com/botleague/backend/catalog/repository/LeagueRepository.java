package com.botleague.backend.catalog.repository;

import com.botleague.backend.catalog.entity.League;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueRepository extends JpaRepository<League, UUID> {

    Optional<League> findBySlug(String slug);

    Optional<League> findByAgeGroupCode(String ageGroupCode);

    List<League> findByStatusOrderByDisplayOrderAsc(String status);

    List<League> findAllByOrderByDisplayOrderAsc();

    boolean existsBySlug(String slug);

    boolean existsByAgeGroupCode(String ageGroupCode);
}
