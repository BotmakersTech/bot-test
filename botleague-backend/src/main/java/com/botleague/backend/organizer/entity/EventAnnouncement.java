package com.botleague.backend.organizer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_announcements", indexes = {
    @Index(name = "idx_announcement_event", columnList = "event_id"),
    @Index(name = "idx_announcement_sent",  columnList = "sent_at")
})
public class EventAnnouncement {

    @Id
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    /**
     * Who receives this announcement.
     * ALL | TEAMS | VOLUNTEERS | JUDGES | STAFF | SPECIFIC_SPORT
     */
    @Column(name = "target_type", length = 30)
    private String targetType = "ALL";

    /**
     * Scopes this announcement to one sport within the event. Null = the
     * event-wide broadcast (existing behavior); non-null = a sport-level
     * announcement (see OrganizerCommunicationService.sendSportAnnouncement).
     */
    @Column(name = "target_sport_id")
    private UUID targetSportId;

    /** JSON array of team UUIDs — only set when targetType = SPECIFIC_TEAMS. */
    @Column(name = "target_team_ids_json", columnDefinition = "TEXT")
    private String targetTeamIdsJson;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "attachment_key")
    private String attachmentKey;

    @Column(name = "attachment_file_type")
    private String attachmentFileType;

    /** When the announcement was pushed / sent */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public UUID getTargetSportId() { return targetSportId; }
    public void setTargetSportId(UUID targetSportId) { this.targetSportId = targetSportId; }
    public String getTargetTeamIdsJson() { return targetTeamIdsJson; }
    public void setTargetTeamIdsJson(String targetTeamIdsJson) { this.targetTeamIdsJson = targetTeamIdsJson; }
    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
    public String getAttachmentKey() { return attachmentKey; }
    public void setAttachmentKey(String attachmentKey) { this.attachmentKey = attachmentKey; }
    public String getAttachmentFileType() { return attachmentFileType; }
    public void setAttachmentFileType(String attachmentFileType) { this.attachmentFileType = attachmentFileType; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
