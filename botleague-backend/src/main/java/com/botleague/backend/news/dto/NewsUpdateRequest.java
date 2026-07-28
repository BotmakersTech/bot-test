package com.botleague.backend.news.dto;

/** Partial update — null fields are left unchanged. */
public class NewsUpdateRequest {

    private Boolean isPinned;
    private Boolean isArchived;

    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
}
