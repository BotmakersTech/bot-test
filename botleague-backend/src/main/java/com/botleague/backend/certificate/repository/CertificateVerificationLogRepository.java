package com.botleague.backend.certificate.repository;

import com.botleague.backend.certificate.entity.CertificateVerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateVerificationLogRepository extends JpaRepository<CertificateVerificationLog, UUID> {

    List<CertificateVerificationLog> findByIssuedCertificateIdOrderByVerifiedAtDesc(UUID issuedCertificateId);
}
