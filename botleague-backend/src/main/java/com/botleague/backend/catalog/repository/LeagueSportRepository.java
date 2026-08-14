package com.botleague.backend.catalog.repository;

import com.botleague.backend.catalog.entity.LeagueSport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueSportRepository extends JpaRepository<LeagueSport, UUID> {

    List<LeagueSport> findByLeagueIdOrderByDisplayOrderAsc(UUID leagueId);

    List<LeagueSport> findByLeagueIdAndStatusOrderByDisplayOrderAsc(UUID leagueId, String status);

    List<LeagueSport> findBySportIdOrderByDisplayOrderAsc(UUID sportId);

    Optional<LeagueSport> findByLeagueIdAndSportId(UUID leagueId, UUID sportId);

    boolean existsByLeagueIdAndSportId(UUID leagueId, UUID sportId);

    List<LeagueSport> findAllByOrderByDisplayOrderAsc();
}
