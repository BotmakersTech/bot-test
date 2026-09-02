package com.botleague.backend.timetrial.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.botleague.backend.timetrial.entity.TimeTrialEntry;

@Repository
public interface TimeTrialEntryRepository extends JpaRepository<TimeTrialEntry, UUID> {

    List<TimeTrialEntry> findByRoundId(UUID roundId);

    List<TimeTrialEntry> findByRoundIdOrderByTimeMillisAsc(UUID roundId);

    Optional<TimeTrialEntry> findByRoundIdAndRegistrationId(UUID roundId, UUID registrationId);

    List<TimeTrialEntry> findByEventSportIdOrderByRoundIdAsc(UUID eventSportId);
}
