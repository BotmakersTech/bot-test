package com.botleague.backend.certificate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One row per QR scan / public verification-page hit — the fraud-detection
 * trail. IP is hashed at write time; the raw address is never persisted.
 */
@Entity
@Table(name = "certificate_verification_logs", indexes = {
        @Index(name = "idx_cert_verify_log_cert", columnList = "issued_certificate_id"),
        @Index(name = "idx_cert_verify_log_time", columnList = "verified_at")
})
public class CertificateVerificationLog {

    public static final String RESULT_VALID = "VALID";
    public static final String RESULT_REVOKED = "REVOKED";
    public static final String RESULT_NOT_FOUND = "NOT_FOUND";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "issued_certificate_id")
    private UUID issuedCertificateId;

    @Column(name = "verified_at", nullable = false)
    private LocalDateTime verifiedAt;

    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "result", nullable = false, length = 20)
    private String result;

    @PrePersist
    public void onCreate() {
        verifiedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public UUID getIssuedCertificateId() { return issuedCertificateId; }
    public void setIssuedCertificateId(UUID issuedCertificateId) { this.issuedCertificateId = issuedCertificateId; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }

    public String getIpHash() { return ipHash; }
    public void setIpHash(String ipHash) { this.ipHash = ipHash; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}
