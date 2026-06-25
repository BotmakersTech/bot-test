package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventVolunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventVolunteerRepository extends JpaRepository<EventVolunteer, UUID> {
    List<EventVolunteer> findByEventId(UUID eventId);
    List<EventVolunteer> findByEventIdAndShift(UUID eventId, String shift);
    long countByEventId(UUID eventId);
    long countByEventIdAndCheckedInAtIsNotNull(UUID eventId);
}
