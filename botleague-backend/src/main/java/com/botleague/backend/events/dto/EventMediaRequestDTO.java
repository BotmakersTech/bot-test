package com.botleague.backend.events.dto;

public class EventMediaRequestDTO {

    // =====================================================
    // FILE URL
    // =====================================================

    private String fileUrl;

    // =====================================================
    // FILE TYPE
    // =====================================================

    private String fileType;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
}