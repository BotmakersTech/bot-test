package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventArena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventArenaRepository extends JpaRepository<EventArena, UUID> {
    List<EventArena> findByEventId(UUID eventId);
    List<EventArena> findByEventIdAndIsActive(UUID eventId, Boolean isActive);
    long countByEventId(UUID eventId);
}
