package com.botleague.backend.organizer.repository;

import com.botleague.backend.organizer.entity.EventCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventCertificateRepository extends JpaRepository<EventCertificate, UUID> {
    List<EventCertificate> findByEventId(UUID eventId);
    List<EventCertificate> findByEventIdAndCertificateType(UUID eventId, String type);
    List<EventCertificate> findByRecipientUserId(UUID userId);
    long countByEventId(UUID eventId);
}
