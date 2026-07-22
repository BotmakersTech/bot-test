package com.botleague.backend.certificate.dto;

import java.util.List;

public class CreateCertificateTemplateRequest {

    private String name;
    private String backgroundAssetKey;
    private Integer pageWidthPx;
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
