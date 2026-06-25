package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventVenueDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventVenueDetailRepository extends JpaRepository<EventVenueDetail, UUID> {
    Optional<EventVenueDetail> findByEventId(UUID eventId);
}
