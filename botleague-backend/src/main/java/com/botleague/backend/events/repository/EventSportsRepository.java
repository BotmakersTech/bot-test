package com.botleague.backend.events.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.events.entity.EventSports;

public interface EventSportsRepository extends JpaRepository<EventSports, UUID> {

    List<EventSports> findByEventId(UUID eventId);

    List<EventSports> findByEventIdIn(java.util.Collection<UUID> eventIds);

    // Platform-wide sport-value lookup for News audience resolution — not
    // scoped to one event, matches EventSports.sport against the same
    // catalogue-value strings the sport-creation form already writes.
    List<EventSports> findBySportIn(java.util.Collection<String> sports);

    boolean existsByEventIdAndSportAndAgeGroup(UUID eventId, String sport, String ageGroup);


	 Optional<EventSports> findByIdAndEventId(UUID id, UUID eventId);

	 boolean existsByEventIdAndSportAndAgeGroupAndWeightClass(UUID eventId, String sport, String ageGroup,
			String weightClass);

}