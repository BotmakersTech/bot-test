package com.botleague.backend.organizer.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class SportAnnounceRequest {

    /** Optional — auto-derived from the sport name if omitted. */
    private String title;

    @NotBlank
    private String message;

    /** "ALL" | "SPECIFIC_TEAMS" */
    @NotBlank
    private String targetType;

    /** Required, non-empty, iff targetType = SPECIFIC_TEAMS. */
    private List<String> teamIds;

    private String attachmentKey;
    private String attachmentUrl;
    private String attachmentFileType;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public List<String> getTeamIds() { return teamIds; }
    public void setTeamIds(List<String> teamIds) { this.teamIds = teamIds; }

    public String getAttachmentKey() { return attachmentKey; }
    public void setAttachmentKey(String attachmentKey) { this.attachmentKey = attachmentKey; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public String getAttachmentFileType() { return attachmentFileType; }
    public void setAttachmentFileType(String attachmentFileType) { this.attachmentFileType = attachmentFileType; }
}
