package com.botleague.backend.events.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.enums.EventStatus;

public interface EventRepository extends JpaRepository<Event, UUID> {

    // =========================
    // Basic Lookups
    // =========================

    Optional<Event> findByIdAndDeletedAtIsNull(UUID id);

  
    Optional<Event> findByEventCode(String eventCode);

    boolean existsByEventNameAndDeletedAtIsNull(String eventName);

    // =========================
    // Organizer Queries
    // =========================

    List<Event> findByCreatedByAndDeletedAtIsNull(UUID createdBy);

    // =========================
    // Status Based Queries
    // =========================

    List<Event> findByStatusAndDeletedAtIsNull(EventStatus status);

    List<Event> findByStatusInAndDeletedAtIsNull(List<EventStatus> statuses);

    // =========================
    // Admin Queries
    // =========================

    List<Event> findByStatus(EventStatus status); // for review queue

    List<Event> findAllByDeletedAtIsNull();
}

