package com.botleague.backend.news.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class NewsResponse {

    public UUID id;
    public String title;
    public String body;
    public UUID createdBy;
    public List<String> targetAgeCategories;
    public List<String> targetSports;
    public String attachmentUrl;
    public String attachmentKey;
    public String attachmentFileType;
    public Boolean isPinned;
    public Boolean isArchived;
    public Integer recipientCount;
    public LocalDateTime publishedAt;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
