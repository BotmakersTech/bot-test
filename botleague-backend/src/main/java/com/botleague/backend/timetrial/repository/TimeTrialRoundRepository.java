package com.botleague.backend.timetrial.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.botleague.backend.timetrial.entity.TimeTrialRound;

@Repository
public interface TimeTrialRoundRepository extends JpaRepository<TimeTrialRound, UUID> {

    List<TimeTrialRound> findByEventSportIdAndDeletedAtIsNullOrderByRoundNumberAsc(UUID eventSportId);

    Optional<TimeTrialRound> findByEventSportIdAndRoundNumberAndDeletedAtIsNull(UUID eventSportId, Integer roundNumber);

    boolean existsByEventSportIdAndDeletedAtIsNull(UUID eventSportId);

    Optional<TimeTrialRound> findTopByEventSportIdAndDeletedAtIsNullOrderByRoundNumberDesc(UUID eventSportId);
}
