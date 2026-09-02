package com.botleague.backend.timetrial.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.timetrial.enums.RoundParticipantStatus;

import jakarta.persistence.*;

/**
 * One bot's result within one TimeTrialRound. Team/robot names are NOT stored
 * here — they're resolved from SportRegistration at DTO-mapping time, same as
 * Match never stores team names.
 */
@Entity
@Table(
    name = "time_trial_entries",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_tte_round_registration",
        columnNames = {"round_id", "registration_id"}
    ),
    indexes = {
        @Index(name = "idx_tte_round", columnList = "round_id"),
        @Index(name = "idx_tte_event_sport", columnList = "event_sport_id"),
        @Index(name = "idx_tte_registration", columnList = "registration_id")
    }
)
public class TimeTrialEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    /** Denormalized so a robot's whole round history can be pulled without joining through rounds. */
    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    @Column(name = "registration_id", nullable = false)
    private UUID registrationId;

    /** Milliseconds. Null until recordTimes() sets it (or dnf=true instead). */
    @Column(name = "time_millis")
    private Long timeMillis;

    @Column(nullable = false)
    private Boolean dnf = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoundParticipantStatus status = RoundParticipantStatus.PENDING;

    /** Standard competition ranking (1,2,2,4) within this round — recomputed on every recordTimes() call. */
    @Column(name = "rank_in_round")
    private Integer rankInRound;

    @Column(length = 500)
    private String notes;

    @Column(name = "recorded_by")
    private UUID recordedBy;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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

    public UUID getRoundId() { return roundId; }
    public void setRoundId(UUID roundId) { this.roundId = roundId; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public Long getTimeMillis() { return timeMillis; }
    public void setTimeMillis(Long timeMillis) { this.timeMillis = timeMillis; }

    public Boolean getDnf() { return dnf; }
    public void setDnf(Boolean dnf) { this.dnf = dnf; }

    public RoundParticipantStatus getStatus() { return status; }
    public void setStatus(RoundParticipantStatus status) { this.status = status; }

    public Integer getRankInRound() { return rankInRound; }
    public void setRankInRound(Integer rankInRound) { this.rankInRound = rankInRound; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getRecordedBy() { return recordedBy; }
    public void setRecordedBy(UUID recordedBy) { this.recordedBy = recordedBy; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public Long getVersion() { return version; }
}
