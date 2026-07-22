package com.botleague.backend.certificate.repository;

import com.botleague.backend.certificate.entity.CertificateGenerationJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateGenerationJobRepository extends JpaRepository<CertificateGenerationJob, UUID> {

    List<CertificateGenerationJob> findByCertificateTypeIdOrderByCreatedAtDesc(UUID certificateTypeId);

    List<CertificateGenerationJob> findByStatus(String status);
}
