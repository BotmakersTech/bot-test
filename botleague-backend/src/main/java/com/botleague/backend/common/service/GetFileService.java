package com.botleague.backend.common.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GetFileService {

    @Value("${r2.public-url}")
    private String publicBaseUrl;

    public String getPublicUrl(String key) {

        if (key == null || key.isEmpty()) {
            return null;
        }

        // basic safety check
        if (!key.startsWith("users/")) {
            throw new RuntimeException("Invalid file key");
        }

        return publicBaseUrl + "/" + key;
    }
}