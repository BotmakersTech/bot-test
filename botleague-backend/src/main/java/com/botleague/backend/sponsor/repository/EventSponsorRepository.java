package com.botleague.backend.sponsor.repository;

import com.botleague.backend.sponsor.entity.EventSponsor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventSponsorRepository extends JpaRepository<EventSponsor, UUID> {
    List<EventSponsor> findByEventIdOrderByDisplayOrderAscCreatedAtAsc(UUID eventId);
    long countByEventId(UUID eventId);
}
