package com.botleague.backend.certificate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A background image (the admin's/organiser's Canva export) plus a
 * placeholder coordinate map — not a code-editable document. The generation
 * engine draws text/QR at the mapped {x,y} points; nothing here is a live
 * template language, so there's no injection surface from a hostile
 * placeholder string.
 */
@Entity
@Table(name = "certificate_templates", indexes = {
        @Index(name = "idx_cert_template_provider", columnList = "provider"),
        @Index(name = "idx_cert_template_owner", columnList = "owner_user_id")
})
public class CertificateTemplate {

    public static final String PROVIDER_BOTLEAGUE = "BOTLEAGUE";
    public static final String PROVIDER_ORGANISER = "ORGANISER";

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_ARCHIVED = "ARCHIVED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    /** The organiser's user id; set only when provider = ORGANISER, null means platform-owned. */
    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "background_asset_key", nullable = false, columnDefinition = "TEXT")
    private String backgroundAssetKey;

    @Column(name = "page_width_px", nullable = false)
    private Integer pageWidthPx;

    @Column(name = "page_height_px", nullable = false)
    private Integer pageHeightPx;

    /** JSON array of {placeholder,x,y,fontFamily,fontSizePx,color,align,maxWidthPx} — see PlaceholderMapping. */
    @Column(name = "placeholder_map", nullable = false, columnDefinition = "TEXT")
    private String placeholderMap = "[]";

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_DRAFT;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBackgroundAssetKey() { return backgroundAssetKey; }
    public void setBackgroundAssetKey(String backgroundAssetKey) { this.backgroundAssetKey = backgroundAssetKey; }

    public Integer getPageWidthPx() { return pageWidthPx; }
    public void setPageWidthPx(Integer pageWidthPx) { this.pageWidthPx = pageWidthPx; }

    public Integer getPageHeightPx() { return pageHeightPx; }
    public void setPageHeightPx(Integer pageHeightPx) { this.pageHeightPx = pageHeightPx; }

    public String getPlaceholderMap() { return placeholderMap; }
    public void setPlaceholderMap(String placeholderMap) { this.placeholderMap = placeholderMap; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }
}
