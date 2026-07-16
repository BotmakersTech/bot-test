package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.SupportContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupportContactRepository extends JpaRepository<SupportContact, UUID> {
    List<SupportContact> findByEventIdAndEventSportIdIsNullOrderByDisplayOrderAsc(UUID eventId);
    List<SupportContact> findByEventSportIdOrderByDisplayOrderAsc(UUID eventSportId);
}
