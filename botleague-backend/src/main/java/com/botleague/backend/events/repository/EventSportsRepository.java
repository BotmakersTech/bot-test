package com.botleague.backend.events.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.AgeCategory;

public interface EventSportsRepository extends JpaRepository<EventSports, UUID> {

    List<EventSports> findByEventId(UUID eventId);

    boolean existsByEventIdAndSportAndAgeGroup(UUID eventId, String sport, AgeCategory ageCategory);


	 Optional<EventSports> findByIdAndEventId(UUID id, UUID eventId);

	 boolean existsByEventIdAndSportAndAgeGroupAndWeightClass(UUID eventId, String sport, AgeCategory ageGroup,
			String weightClass);
	
}