package com.botleague.backend.events.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A held edit to an already-approved sport's specs, pending review by the
 * next tier up (SPORT_HEAD -> EVENT_HEAD/ORGANISER -> ADMIN). Deliberately
 * separate from EventSports.status — approval-workflow status for sport
 * *creation* (DRAFT/PENDING_APPROVAL/APPROVED) cannot be reused here because
 * flipping a live, already-APPROVED sport back to PENDING_APPROVAL would
 * break publish-prerequisite checks elsewhere that require all sports
 * APPROVED.
 */
@Entity
@Table(name = "sport_change_requests")
public class SportChangeRequest {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_sport_id", nullable = false)
    private UUID eventSportId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    /** Role tier of the requester at submission time — SPORT_HEAD or EVENT_HEAD/ORGANISER. */
    @Column(name = "requester_tier", nullable = false, length = 30)
    private String requesterTier;

    @Column(name = "proposed_changes_json", nullable = false, columnDefinition = "TEXT")
    private String proposedChangesJson;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_PENDING;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Guards concurrent review attempts on the same request. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public UUID getRequestedBy() { return requestedBy; }
    public void setRequestedBy(UUID requestedBy) { this.requestedBy = requestedBy; }

    public String getRequesterTier() { return requesterTier; }
    public void setRequesterTier(String requesterTier) { this.requesterTier = requesterTier; }

    public String getProposedChangesJson() { return proposedChangesJson; }
    public void setProposedChangesJson(String proposedChangesJson) { this.proposedChangesJson = proposedChangesJson; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(UUID reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getVersion() { return version; }
}
