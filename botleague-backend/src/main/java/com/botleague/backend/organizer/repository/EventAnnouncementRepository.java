package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventAnnouncementRepository extends JpaRepository<EventAnnouncement, UUID> {
    List<EventAnnouncement> findByEventIdOrderByCreatedAtDesc(UUID eventId);
    List<EventAnnouncement> findByEventIdAndTargetType(UUID eventId, String targetType);
    List<EventAnnouncement> findByEventIdAndIsPinnedTrueOrderByCreatedAtDesc(UUID eventId);
    List<EventAnnouncement> findByTargetSportIdOrderByCreatedAtDesc(UUID targetSportId);
    long countByEventId(UUID eventId);
}
