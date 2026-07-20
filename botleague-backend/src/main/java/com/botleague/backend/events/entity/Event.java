package com.botleague.backend.events.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.events.enums.EventStatus;

import jakarta.persistence.*;

@Entity
@Table(name = "events", indexes = {
        @Index(name = "idx_event_code", columnList = "event_code"),
        @Index(name = "idx_created_by", columnList = "created_by")
})
public class Event {

    // =========================
    // Primary Key
    // =========================
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // =========================
    // Identity
    // =========================
    @Column(name = "event_code", unique = true, nullable = false, length = 50)
    private String eventCode;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    @Column(name = "event_logo_url")
    private String eventLogoUrl;

    @Column(name = "event_thumbnail_url")
    private String eventThumbnailUrl;

    @Column(name = "teaser_video_1_url")
    private String teaserVideo1Url;

    @Column(name = "teaser_video_2_url")
    private String teaserVideo2Url;

    // =========================
    // Organizer Info
    // =========================
    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "organization_url")
    private String organizationUrl;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // =========================
    // Ownership Chain
    // =========================
    @Column(name = "owner_type", nullable = false, length = 10)
    private String ownerType = "BOTLEAGUE";

    @Column(name = "owner_id")
    private UUID ownerId;

    // =========================
    // Location
    // =========================
    @Column(name = "venue_name")
    private String venueName;

    @Column(name = "venue_address", columnDefinition = "TEXT")
    private String venueAddress;

    private String city;
    private String state;
    private String country;

    // =========================
    // Timeline
    // =========================
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;


    // =========================
    // Status Lifecycle
    // =========================
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    // =========================
    // Admin Control
    // =========================
    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // =========================
    // System Fields
    // =========================
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * softDeleteEvent()/changeEventStatus() are read-check-write on
     * status/deletedAt — without this, two concurrent admin actions on the
     * same event (e.g. a status change racing a delete) could both pass
     * their guard before either commits.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    // =========================
    // Lifecycle Hooks
    // =========================
    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = EventStatus.DRAFT;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =========================
    // Getters & Setters
    // =========================

    public UUID getId() {
        return id;
    }

    public String getEventCode() {
        return eventCode;
    }

    public void setEventCode(String eventCode) {
        this.eventCode = eventCode;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public void setEventDescription(String eventDescription) {
        this.eventDescription = eventDescription;
    }
    
    

    public String getEventLogoUrl() {
        return eventLogoUrl;
    }

    public void setEventLogoUrl(String eventLogoUrl) {
        this.eventLogoUrl = eventLogoUrl;
    }

    public String getEventThumbnailUrl() {
        return eventThumbnailUrl;
    }

    public void setEventThumbnailUrl(String eventThumbnailUrl) {
        this.eventThumbnailUrl = eventThumbnailUrl;
    }

    public String getTeaserVideo1Url() {
        return teaserVideo1Url;
    }

    public void setTeaserVideo1Url(String teaserVideo1Url) {
        this.teaserVideo1Url = teaserVideo1Url;
    }

    public String getTeaserVideo2Url() {
        return teaserVideo2Url;
    }

    public void setTeaserVideo2Url(String teaserVideo2Url) {
        this.teaserVideo2Url = teaserVideo2Url;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getOrganizationUrl() {
        return organizationUrl;
    }

    public void setOrganizationUrl(String organizationUrl) {
        this.organizationUrl = organizationUrl;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public String getVenueAddress() {
        return venueAddress;
    }

    public void setVenueAddress(String venueAddress) {
        this.venueAddress = venueAddress;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

 

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public UUID getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(UUID approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Long getVersion() {
        return version;
    }
}