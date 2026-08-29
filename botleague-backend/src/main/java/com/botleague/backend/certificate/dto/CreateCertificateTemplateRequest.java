package com.botleague.backend.certificate.dto;

import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateCertificateTemplateRequest {

    @NotBlank(message = "name is required")
    private String name;
    @NotBlank(message = "backgroundAssetKey is required")
    private String backgroundAssetKey;
    @NotNull(message = "pageWidthPx is required")
    @Min(value = 1, message = "pageWidthPx must be positive")
    private Integer pageWidthPx;
    @NotNull(message = "pageHeightPx is required")
    @Min(value = 1, message = "pageHeightPx must be positive")
    private Integer pageHeightPx;
    private List<TemplatePlaceholderPosition> placeholderMap;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBackgroundAssetKey() { return backgroundAssetKey; }
    public void setBackgroundAssetKey(String backgroundAssetKey) { this.backgroundAssetKey = backgroundAssetKey; }

    public Integer getPageWidthPx() { return pageWidthPx; }
    public void setPageWidthPx(Integer pageWidthPx) { this.pageWidthPx = pageWidthPx; }

    public Integer getPageHeightPx() { return pageHeightPx; }
    public void setPageHeightPx(Integer pageHeightPx) { this.pageHeightPx = pageHeightPx; }

    public List<TemplatePlaceholderPosition> getPlaceholderMap() { return placeholderMap; }
    public void setPlaceholderMap(List<TemplatePlaceholderPosition> placeholderMap) { this.placeholderMap = placeholderMap; }
}
