package com.botleague.backend.certificate.repository;

import com.botleague.backend.certificate.entity.IssuedCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssuedCertificateRepository extends JpaRepository<IssuedCertificate, UUID> {

    Optional<IssuedCertificate> findByCertificateNumber(String certificateNumber);

    List<IssuedCertificate> findByRecipientUserIdAndStatusOrderByIssuedAtDesc(UUID recipientUserId, String status);

    List<IssuedCertificate> findByCertificateTypeIdAndStatus(UUID certificateTypeId, String status);

    List<IssuedCertificate> findByCertificateTypeIdOrderByIssuedAtDesc(UUID certificateTypeId);

    List<IssuedCertificate> findByGenerationJobId(UUID generationJobId);

    List<IssuedCertificate> findByEventIdAndStatus(UUID eventId, String status);

    Optional<IssuedCertificate> findByCertificateTypeIdAndRecipientUserIdAndRobotIdAndStatusNot(
            UUID certificateTypeId, UUID recipientUserId, UUID robotId, String excludedStatus);

    Optional<IssuedCertificate> findByCertificateTypeIdAndRecipientNameSnapshotAndRobotIdAndStatusNot(
            UUID certificateTypeId, String recipientNameSnapshot, UUID robotId, String excludedStatus);

    long countByCertificateTypeIdAndStatusNot(UUID certificateTypeId, String excludedStatus);
}
