package com.botleague.backend.certificate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One configured certificate for one Event Sport (e.g. "RoboWar -> BotLeague
 * Winner"). BOTLEAGUE and ORGANISER providers can each configure their own
 * row for the same category — they don't share or override each other.
 */
@Entity
@Table(
        name = "certificate_types",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_certificate_type_natural_key",
                columnNames = {"event_sport_id", "provider", "category", "label"}
        ),
        indexes = {
                @Index(name = "idx_cert_type_event_sport", columnList = "event_sport_id"),
                @Index(name = "idx_cert_type_template", columnList = "template_id")
        }
)
public class CertificateType {

    public static final String PROVIDER_BOTLEAGUE = "BOTLEAGUE";
    public static final String PROVIDER_ORGANISER = "ORGANISER";

    // Fixed categories the spec names explicitly; CATEGORY_SPECIAL covers
    // unlimited admin-defined award names (label carries the real name).
    public static final String CATEGORY_PARTICIPATION = "PARTICIPATION";
    public static final String CATEGORY_WINNER = "WINNER";
    public static final String CATEGORY_RUNNER_UP = "RUNNER_UP";
    public static final String CATEGORY_SECOND_RUNNER_UP = "SECOND_RUNNER_UP";
    public static final String CATEGORY_SPECIAL = "SPECIAL";

    public static final String RULE_ALL_REGISTERED = "ALL_REGISTERED";
    public static final String RULE_RANK_EQUALS = "RANK_EQUALS";
    public static final String RULE_MANUAL_SELECT = "MANUAL_SELECT";

    public static final String ISSUE_AUTO_ON_FINALIZE = "AUTO_ON_FINALIZE";
    public static final String ISSUE_MANUAL_TRIGGER = "MANUAL_TRIGGER";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_DISABLED = "DISABLED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "category", nullable = false, length = 40)
    private String category;

    @Column(name = "label", nullable = false, length = 120)
    private String label;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "eligibility_rule", nullable = false, length = 30)
    private String eligibilityRule;

    /** Populated only when eligibilityRule = RANK_EQUALS (1 = Winner, 2 = Runner-Up, 3 = Second Runner-Up, ...). */
    @Column(name = "eligibility_rank")
    private Integer eligibilityRank;

    @Column(name = "issue_mode", nullable = false, length = 20)
    private String issueMode = ISSUE_MANUAL_TRIGGER;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    @Column(name = "number_prefix", nullable = false, length = 20)
    private String numberPrefix;

    @Column(name = "number_format", nullable = false, length = 60)
    private String numberFormat;

    @Column(name = "validity_years")
    private Integer validityYears;

    @Column(name = "verification_enabled", nullable = false)
    private Boolean verificationEnabled = true;

    @Column(name = "qr_enabled", nullable = false)
    private Boolean qrEnabled = true;

    @Column(name = "signature_enabled", nullable = false)
    private Boolean signatureEnabled = true;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    /** Backs number_format's {seq} token without a COUNT(*) race under concurrent generation. */
    @Column(name = "next_sequence", nullable = false)
    private Long nextSequence = 1L;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public UUID getTemplateId() { return templateId; }
    public void setTemplateId(UUID templateId) { this.templateId = templateId; }

    public String getEligibilityRule() { return eligibilityRule; }
    public void setEligibilityRule(String eligibilityRule) { this.eligibilityRule = eligibilityRule; }

    public Integer getEligibilityRank() { return eligibilityRank; }
    public void setEligibilityRank(Integer eligibilityRank) { this.eligibilityRank = eligibilityRank; }

    public String getIssueMode() { return issueMode; }
    public void setIssueMode(String issueMode) { this.issueMode = issueMode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNumberPrefix() { return numberPrefix; }
    public void setNumberPrefix(String numberPrefix) { this.numberPrefix = numberPrefix; }

    public String getNumberFormat() { return numberFormat; }
    public void setNumberFormat(String numberFormat) { this.numberFormat = numberFormat; }

    public Integer getValidityYears() { return validityYears; }
    public void setValidityYears(Integer validityYears) { this.validityYears = validityYears; }

    public Boolean getVerificationEnabled() { return verificationEnabled; }
    public void setVerificationEnabled(Boolean verificationEnabled) { this.verificationEnabled = verificationEnabled; }

    public Boolean getQrEnabled() { return qrEnabled; }
    public void setQrEnabled(Boolean qrEnabled) { this.qrEnabled = qrEnabled; }

    public Boolean getSignatureEnabled() { return signatureEnabled; }
    public void setSignatureEnabled(Boolean signatureEnabled) { this.signatureEnabled = signatureEnabled; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }

    public Long getNextSequence() { return nextSequence; }
    public void setNextSequence(Long nextSequence) { this.nextSequence = nextSequence; }
}
