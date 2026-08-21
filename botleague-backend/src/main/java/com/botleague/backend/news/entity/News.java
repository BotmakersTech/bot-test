package com.botleague.backend.news.entity;

import com.botleague.backend.news.enums.NewsCategory;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Platform-wide, Admin-authored content targeted by age category and/or
 * sport interest (or everyone, when both are empty). Distinct from
 * EventAnnouncement, which is always scoped to one event — News has no
 * event scope at all.
 */
@Entity
@Table(name = "news", indexes = {
        @Index(name = "idx_news_published_at", columnList = "published_at"),
        @Index(name = "idx_news_is_archived", columnList = "is_archived"),
        @Index(name = "idx_news_created_by", columnList = "created_by")
})
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    /** JSON array of AgeCategory names. Null/empty = no age restriction. */
    @Column(name = "target_age_categories", columnDefinition = "TEXT")
    private String targetAgeCategories;

    /** JSON array of sport catalogue value strings. Null/empty = no sport restriction. */
    @Column(name = "target_sports", columnDefinition = "TEXT")
    private String targetSports;

    /** Editorial tag (Events Recap / Global / Team Spotlight / Tech / Update). Null = uncategorized. */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30)
    private NewsCategory category;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "attachment_key")
    private String attachmentKey;

    @Column(name = "attachment_file_type")
    private String attachmentFileType;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Column(name = "recipient_count", nullable = false)
    private Integer recipientCount = 0;

    /** Links to the Notification row this News triggered on publish. */
    @Column(name = "notification_id")
    private UUID notificationId;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        if (this.publishedAt == null) this.publishedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters & Setters

    public UUID getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public String getTargetAgeCategories() { return targetAgeCategories; }
    public void setTargetAgeCategories(String targetAgeCategories) { this.targetAgeCategories = targetAgeCategories; }

    public String getTargetSports() { return targetSports; }
    public void setTargetSports(String targetSports) { this.targetSports = targetSports; }

    public NewsCategory getCategory() { return category; }
    public void setCategory(NewsCategory category) { this.category = category; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentKey() { return attachmentKey; }
    public void setAttachmentKey(String attachmentKey) { this.attachmentKey = attachmentKey; }

    public String getAttachmentFileType() { return attachmentFileType; }
    public void setAttachmentFileType(String attachmentFileType) { this.attachmentFileType = attachmentFileType; }

    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public Integer getRecipientCount() { return recipientCount; }
    public void setRecipientCount(Integer recipientCount) { this.recipientCount = recipientCount; }

    public UUID getNotificationId() { return notificationId; }
    public void setNotificationId(UUID notificationId) { this.notificationId = notificationId; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
