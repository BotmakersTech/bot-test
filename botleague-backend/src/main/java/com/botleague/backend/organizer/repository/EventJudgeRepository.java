package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventJudge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventJudgeRepository extends JpaRepository<EventJudge, UUID> {
    List<EventJudge> findByEventId(UUID eventId);
    List<EventJudge> findByEventIdAndAssignedSportId(UUID eventId, UUID sportId);
    long countByEventId(UUID eventId);
}
