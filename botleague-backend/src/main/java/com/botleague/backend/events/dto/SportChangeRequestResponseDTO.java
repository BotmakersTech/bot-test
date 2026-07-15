package com.botleague.backend.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class SportChangeRequestResponseDTO {

    private UUID id;
    private UUID eventSportId;
    private UUID eventId;
    private String sportName;
    private UUID requestedBy;
    private String requestedByName;
    private String requesterTier;
    private UpdateSportsDTO proposedChanges;
    private String status;
    private UUID reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getSportName() { return sportName; }
    public void setSportName(String sportName) { this.sportName = sportName; }

    public UUID getRequestedBy() { return requestedBy; }
    public void setRequestedBy(UUID requestedBy) { this.requestedBy = requestedBy; }

    public String getRequestedByName() { return requestedByName; }
    public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }

    public String getRequesterTier() { return requesterTier; }
    public void setRequesterTier(String requesterTier) { this.requesterTier = requesterTier; }

    public UpdateSportsDTO getProposedChanges() { return proposedChanges; }
    public void setProposedChanges(UpdateSportsDTO proposedChanges) { this.proposedChanges = proposedChanges; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(UUID reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String reviewedByName) { this.reviewedByName = reviewedByName; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
