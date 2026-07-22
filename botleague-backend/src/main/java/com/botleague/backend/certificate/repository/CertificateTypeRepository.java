package com.botleague.backend.certificate.repository;

import com.botleague.backend.certificate.entity.CertificateType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificateTypeRepository extends JpaRepository<CertificateType, UUID> {

    List<CertificateType> findByEventSportId(UUID eventSportId);

    List<CertificateType> findByEventSportIdAndProvider(UUID eventSportId, String provider);

    Optional<CertificateType> findByEventSportIdAndProviderAndCategoryAndLabel(
            UUID eventSportId, String provider, String category, String label);

    List<CertificateType> findByTemplateId(UUID templateId);
}
