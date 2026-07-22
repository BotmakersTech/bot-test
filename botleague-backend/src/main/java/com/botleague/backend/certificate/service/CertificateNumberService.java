package com.botleague.backend.certificate.service;

import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.certificate.repository.CertificateTypeRepository;
import com.botleague.backend.common.exception.ApiException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.DecimalFormat;
import java.util.UUID;

/**
 * Allocates the next certificate number for a CertificateType from its
 * next_sequence counter. Backed by @Version optimistic locking on
 * CertificateType (findOrCreateGlobalRanking in the ranking engine uses the
 * same catch-and-retry shape for its own low-contention counter) rather than
 * a SELECT ... FOR UPDATE — generation jobs run on a bounded 1-2 thread
 * executor, so real contention on one certificate type is rare.
 */
@Service
public class CertificateNumberService {

    private static final int MAX_RETRIES = 5;
    private static final DecimalFormat SEQUENCE_FORMAT = new DecimalFormat("000000");

    private final CertificateTypeRepository certificateTypeRepository;

    public CertificateNumberService(CertificateTypeRepository certificateTypeRepository) {
        this.certificateTypeRepository = certificateTypeRepository;
    }

    @Transactional
    public String nextCertificateNumber(UUID certificateTypeId) {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                CertificateType type = certificateTypeRepository.findById(certificateTypeId)
                        .orElseThrow(() -> ApiException.notFound("Certificate type not found"));
                long sequence = type.getNextSequence();
                type.setNextSequence(sequence + 1);
                certificateTypeRepository.saveAndFlush(type);
                return formatNumber(type, sequence);
            } catch (ObjectOptimisticLockingFailureException e) {
                // Lost the race for this sequence value — retry with a fresh read.
            }
        }
        throw new IllegalStateException(
                "Failed to allocate a certificate number after " + MAX_RETRIES + " attempts (certificate type " + certificateTypeId + ")");
    }

    private String formatNumber(CertificateType type, long sequence) {
        String format = type.getNumberFormat() != null && !type.getNumberFormat().isBlank()
                ? type.getNumberFormat() : "{seq}";
        String rendered = format.replace("{seq}", SEQUENCE_FORMAT.format(sequence));
        String prefix = type.getNumberPrefix();
        return (prefix != null && !prefix.isBlank()) ? prefix + "-" + rendered : rendered;
    }
}
