package com.botleague.backend.common.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GetFileService {

    /** Sentinel prefix for a predefined avatar selection, e.g. "avatar:brute". */
    private static final String AVATAR_SENTINEL_PREFIX = "avatar:";

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

    /**
     * Resolves any stored profile-photo value to what the frontend should render:
     *   - null/blank                -> null (caller shows its own placeholder)
     *   - "avatar:<key>"            -> returned as-is; the frontend maps it to a
     *                                  bundled predefined-avatar asset, since these
     *                                  aren't R2-hosted files.
     *   - "users/..."               -> CDN-prefixed into a full public URL.
     *   - anything else unexpected  -> null, rather than throwing (unlike
     *                                  getPublicUrl above, this must never 500 a
     *                                  profile/roster/chat response over bad data).
     */
    public String resolveProfileImage(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        if (raw.startsWith(AVATAR_SENTINEL_PREFIX)) {
            return raw;
        }
        if (raw.startsWith("users/")) {
            return publicBaseUrl + "/" + raw;
        }
        return null;
    }

    /** Certificate template backgrounds and issued certificate PDFs/images/QR codes. */
    public String getCertificateUrl(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        if (!key.startsWith("certificates/")) {
            throw new RuntimeException("Invalid file key");
        }
        return publicBaseUrl + "/" + key;
    }
}