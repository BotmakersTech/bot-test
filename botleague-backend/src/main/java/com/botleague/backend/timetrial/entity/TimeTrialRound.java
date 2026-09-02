package com.botleague.backend.timetrial.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.timetrial.enums.RoundStatus;

import jakarta.persistence.*;

/**
 * One round of a round-wise time-trial competition (see MatchFormatKind.ROUND_TIME_TRIAL).
 * Round 1 is seeded from every REGISTERED SportRegistration for the event sport; each
 * later round is spawned from the previous round's shortlisted (ADVANCED) entries.
 */
@Entity
@Table(
    name = "time_trial_rounds",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_ttr_event_sport_round",
        columnNames = {"event_sport_id", "round_number"}
    ),
    indexes = {
        @Index(name = "idx_ttr_event_sport", columnList = "event_sport_id")
    }
)
public class TimeTrialRound {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoundStatus status = RoundStatus.OPEN;

    /** What staff requested at shortlist time. Null until shortlist() is called. */
    @Column(name = "cutoff_count")
    private Integer cutoffCount;

    /**
     * The real number that advanced — may exceed cutoffCount when there's a
     * tie on the boundary time (a tie is never arbitrarily split). Null until
     * shortlist() is called.
     */
    @Column(name = "actual_advanced_count")
    private Integer actualAdvancedCount;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ── Getters & setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public Integer getRoundNumber() { return roundNumber; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }

    public RoundStatus getStatus() { return status; }
    public void setStatus(RoundStatus status) { this.status = status; }

    public Integer getCutoffCount() { return cutoffCount; }
    public void setCutoffCount(Integer cutoffCount) { this.cutoffCount = cutoffCount; }

    public Integer getActualAdvancedCount() { return actualAdvancedCount; }
    public void setActualAdvancedCount(Integer actualAdvancedCount) { this.actualAdvancedCount = actualAdvancedCount; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public Long getVersion() { return version; }
}
