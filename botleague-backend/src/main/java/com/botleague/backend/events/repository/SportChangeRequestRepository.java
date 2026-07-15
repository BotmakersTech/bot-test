package com.botleague.backend.events.repository;

import com.botleague.backend.events.entity.SportChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SportChangeRequestRepository extends JpaRepository<SportChangeRequest, UUID> {

    List<SportChangeRequest> findByEventSportIdAndStatus(UUID eventSportId, String status);

    List<SportChangeRequest> findByEventIdAndStatus(UUID eventId, String status);

    Optional<SportChangeRequest> findFirstByEventSportIdAndStatus(UUID eventSportId, String status);
}
