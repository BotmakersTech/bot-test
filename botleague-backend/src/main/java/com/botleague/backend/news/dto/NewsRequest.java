package com.botleague.backend.news.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class NewsRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    private String body;

    /** AgeCategory enum names. Empty/null = no age restriction. */
    private List<String> targetAgeCategories;

    /** Sport catalogue value strings. Empty/null = no sport restriction. */
    private List<String> targetSports;

    private Boolean isPinned;

    private String attachmentKey;
    private String attachmentUrl;
    private String attachmentFileType;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public List<String> getTargetAgeCategories() { return targetAgeCategories; }
    public void setTargetAgeCategories(List<String> targetAgeCategories) { this.targetAgeCategories = targetAgeCategories; }

    public List<String> getTargetSports() { return targetSports; }
    public void setTargetSports(List<String> targetSports) { this.targetSports = targetSports; }

    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }

    public String getAttachmentKey() { return attachmentKey; }
    public void setAttachmentKey(String attachmentKey) { this.attachmentKey = attachmentKey; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentFileType() { return attachmentFileType; }
    public void setAttachmentFileType(String attachmentFileType) { this.attachmentFileType = attachmentFileType; }
}
