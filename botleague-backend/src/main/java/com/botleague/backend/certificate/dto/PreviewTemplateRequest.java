package com.botleague.backend.certificate.dto;

import java.util.List;

/**
 * Renders from whatever the editor currently has in memory — not a saved
 * template row — so a live preview reflects unsaved drag/position edits
 * (and a not-yet-created template's freshly-uploaded background) instead of
 * going stale the moment the user moves a marker.
 */
public class PreviewTemplateRequest {

    private String backgroundAssetKey;
    private Integer pageWidthPx;
    private Integer pageHeightPx;
    private List<TemplatePlaceholderPosition> placeholderMap;

    public String getBackgroundAssetKey() { return backgroundAssetKey; }
    public void setBackgroundAssetKey(String backgroundAssetKey) { this.backgroundAssetKey = backgroundAssetKey; }

    public Integer getPageWidthPx() { return pageWidthPx; }
    public void setPageWidthPx(Integer pageWidthPx) { this.pageWidthPx = pageWidthPx; }

    public Integer getPageHeightPx() { return pageHeightPx; }
    public void setPageHeightPx(Integer pageHeightPx) { this.pageHeightPx = pageHeightPx; }

    public List<TemplatePlaceholderPosition> getPlaceholderMap() { return placeholderMap; }
    public void setPlaceholderMap(List<TemplatePlaceholderPosition> placeholderMap) { this.placeholderMap = placeholderMap; }
}
