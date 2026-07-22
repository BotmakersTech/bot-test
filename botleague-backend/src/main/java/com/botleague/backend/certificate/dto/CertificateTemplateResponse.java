package com.botleague.backend.certificate.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CertificateTemplateResponse {

    private UUID id;
    private String provider;
    private UUID ownerUserId;
    private String name;
    private String backgroundUrl;
    private Integer pageWidthPx;
    private Integer pageHeightPx;
    private List<TemplatePlaceholderPosition> placeholderMap;
    private String status;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBackgroundUrl() { return backgroundUrl; }
    public void setBackgroundUrl(String backgroundUrl) { this.backgroundUrl = backgroundUrl; }

    public Integer getPageWidthPx() { return pageWidthPx; }
    public void setPageWidthPx(Integer pageWidthPx) { this.pageWidthPx = pageWidthPx; }

    public Integer getPageHeightPx() { return pageHeightPx; }
    public void setPageHeightPx(Integer pageHeightPx) { this.pageHeightPx = pageHeightPx; }

    public List<TemplatePlaceholderPosition> getPlaceholderMap() { return placeholderMap; }
    public void setPlaceholderMap(List<TemplatePlaceholderPosition> placeholderMap) { this.placeholderMap = placeholderMap; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
