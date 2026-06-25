package com.botleague.backend.profile.dto;

public class UploadResponse {

    private String uploadUrl;   // presigned PUT URL
    private String fileUrl;     // public access URL
    private String key;

    public UploadResponse(String uploadUrl, String fileUrl, String key) {
        this.uploadUrl = uploadUrl;
        this.fileUrl = fileUrl;
        this.key = key;
    }

    // getters

    public String getUploadUrl() {
        return uploadUrl;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public String getKey() {
        return key;
    }
}