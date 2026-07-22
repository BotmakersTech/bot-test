package com.botleague.backend.certificate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * The final, per-recipient artifact. Immutable after issuance except for
 * `status` (revoke) — a correction issues a new certificate and marks this
 * one SUPERSEDED, preserving both in history. Every display field is a
 * snapshot taken at generation time, so a later name/team-rename can never
 * retroactively alter a historical certificate's displayed record.
 */
@Entity
@Table(name = "issued_certificates", indexes = {
        @Index(name = "idx_issued_cert_recipient", columnList = "recipient_user_id"),
        @Index(name = "idx_issued_cert_event", columnList = "event_id"),
        @Index(name = "idx_issued_cert_type", columnList = "certificate_type_id"),
        @Index(name = "idx_issued_cert_job", columnList = "generation_job_id")
})
public class IssuedCertificate {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_REVOKED = "REVOKED";
    public static final String STATUS_SUPERSEDED = "SUPERSEDED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 60)
    private String certificateNumber;

    @Column(name = "certificate_type_id", nullable = false)
    private UUID certificateTypeId;

    @Column(name = "generation_job_id", nullable = false)
    private UUID generationJobId;

    /** Null for role-based non-account recipients (external judge/mentor/sponsor). */
    @Column(name = "recipient_user_id")
    private UUID recipientUserId;

    @Column(name = "recipient_name_snapshot", nullable = false, length = 160)
    private String recipientNameSnapshot;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "team_name_snapshot", length = 160)
    private String teamNameSnapshot;

    @Column(name = "robot_id")
    private UUID robotId;

    @Column(name = "robot_name_snapshot", length = 160)
    private String robotNameSnapshot;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    /** Copied from EventLeaderboardEntry.eventRank at generation time. */
    @Column(name = "position_snapshot")
    private Integer positionSnapshot;

    @Column(name = "pdf_key", nullable = false, columnDefinition = "TEXT")
    private String pdfKey;

    @Column(name = "image_key", nullable = false, columnDefinition = "TEXT")
    private String imageKey;

    @Column(name = "qr_key", columnDefinition = "TEXT")
    private String qrKey;

    @Column(name = "verification_url", nullable = false, columnDefinition = "TEXT")
    private String verificationUrl;

    @Column(name = "signature_hash", length = 128)
    private String signatureHash;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    @Column(name = "revoked_reason", columnDefinition = "TEXT")
    private String revokedReason;

    @Column(name = "revoked_by")
    private UUID revokedBy;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    public void onCreate() {
        issuedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public UUID getCertificateTypeId() { return certificateTypeId; }
    public void setCertificateTypeId(UUID certificateTypeId) { this.certificateTypeId = certificateTypeId; }

    public UUID getGenerationJobId() { return generationJobId; }
    public void setGenerationJobId(UUID generationJobId) { this.generationJobId = generationJobId; }

    public UUID getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(UUID recipientUserId) { this.recipientUserId = recipientUserId; }

    public String getRecipientNameSnapshot() { return recipientNameSnapshot; }
    public void setRecipientNameSnapshot(String recipientNameSnapshot) { this.recipientNameSnapshot = recipientNameSnapshot; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getTeamNameSnapshot() { return teamNameSnapshot; }
    public void setTeamNameSnapshot(String teamNameSnapshot) { this.teamNameSnapshot = teamNameSnapshot; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public String getRobotNameSnapshot() { return robotNameSnapshot; }
    public void setRobotNameSnapshot(String robotNameSnapshot) { this.robotNameSnapshot = robotNameSnapshot; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public Integer getPositionSnapshot() { return positionSnapshot; }
    public void setPositionSnapshot(Integer positionSnapshot) { this.positionSnapshot = positionSnapshot; }

    public String getPdfKey() { return pdfKey; }
    public void setPdfKey(String pdfKey) { this.pdfKey = pdfKey; }

    public String getImageKey() { return imageKey; }
    public void setImageKey(String imageKey) { this.imageKey = imageKey; }

    public String getQrKey() { return qrKey; }
    public void setQrKey(String qrKey) { this.qrKey = qrKey; }

    public String getVerificationUrl() { return verificationUrl; }
    public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }

    public String getSignatureHash() { return signatureHash; }
    public void setSignatureHash(String signatureHash) { this.signatureHash = signatureHash; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRevokedReason() { return revokedReason; }
    public void setRevokedReason(String revokedReason) { this.revokedReason = revokedReason; }

    public UUID getRevokedBy() { return revokedBy; }
    public void setRevokedBy(UUID revokedBy) { this.revokedBy = revokedBy; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public Long getVersion() { return version; }
}
