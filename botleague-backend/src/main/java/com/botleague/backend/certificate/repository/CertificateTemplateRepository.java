package com.botleague.backend.certificate.repository;

import com.botleague.backend.certificate.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, UUID> {

    List<CertificateTemplate> findByProvider(String provider);

    List<CertificateTemplate> findByProviderAndOwnerUserId(String provider, UUID ownerUserId);

    List<CertificateTemplate> findByOwnerUserId(UUID ownerUserId);
}
