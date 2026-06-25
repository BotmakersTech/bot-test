package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventIncidentRepository extends JpaRepository<EventIncident, UUID> {
    List<EventIncident> findByEventIdOrderByCreatedAtDesc(UUID eventId);
    List<EventIncident> findByEventIdAndStatus(UUID eventId, String status);
    List<EventIncident> findByEventIdAndSeverity(UUID eventId, String severity);
    long countByEventIdAndStatus(UUID eventId, String status);
    long countByEventId(UUID eventId);
}
