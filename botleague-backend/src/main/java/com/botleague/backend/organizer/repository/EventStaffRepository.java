package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventStaffRepository extends JpaRepository<EventStaff, UUID> {
    List<EventStaff> findByEventId(UUID eventId);
    List<EventStaff> findByEventIdAndStaffType(UUID eventId, String staffType);
    long countByEventId(UUID eventId);
    long countByEventIdAndCheckedInAtIsNotNull(UUID eventId);
}
