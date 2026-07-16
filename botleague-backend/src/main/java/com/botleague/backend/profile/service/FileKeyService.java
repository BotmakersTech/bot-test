package com.botleague.backend.profile.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class FileKeyService {

    // =========================
    // PROFILE
    // =========================
    public String generateProfileKey(String userId, String contentType) {
        return "users/" + userId + "/profile/" + UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // ROBOT - IMAGE
    // =========================
    public String generateRobotImageKey(UUID teamId, UUID robotId, String contentType) {
        return "robots/" + teamId + "/" + robotId + "/images/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // ROBOT - VIDEO
    // =========================
    public String generateRobotVideoKey(UUID teamId, UUID robotId, String contentType) {
        return "robots/" + teamId + "/" + robotId + "/videos/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // EVENT - IMAGE
    // =========================
    public String generateEventImageKey(UUID eventId, String contentType) {
        return "events/" + eventId + "/images/" +
                UUID.randomUUID() + getExtension(contentType);
    }
    public String generateTeamLogoKey(UUID teamId, String contentType) {
        return "team/" + teamId + "/logos/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // EVENT - THUMBNAIL / TEASER VIDEOS
    // =========================
    public String generateEventMediaKey(UUID eventId, String slot, String contentType) {
        return "events/" + eventId + "/media/" + slot.toLowerCase() + "/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // SPORT - THUMBNAIL / TEASER VIDEO
    // =========================
    public String generateSportMediaKey(UUID eventSportId, String slot, String contentType) {
        return "sports/" + eventSportId + "/media/" + slot.toLowerCase() + "/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // SPORT ANNOUNCEMENT - ATTACHMENT
    // =========================
    public String generateAnnouncementAttachmentKey(UUID eventSportId, String contentType) {
        return "sports/" + eventSportId + "/announcements/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // SPONSOR - LOGO (TEAM)
    // =========================
    public String generateSponsorLogoKey(UUID teamId, String contentType) {
        return "team/" + teamId + "/sponsors/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // SPONSOR - LOGO (EVENT)
    // =========================
    public String generateEventSponsorLogoKey(UUID eventId, String contentType) {
        return "events/" + eventId + "/sponsors/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // SPONSOR - LOGO (SPORT)
    // =========================
    public String generateSportSponsorLogoKey(UUID sportId, String contentType) {
        return "sports/" + sportId + "/sponsors/" +
                UUID.randomUUID() + getExtension(contentType);
    }

    // =========================
    // COMMON EXTENSION RESOLVER
    // =========================
    private String getExtension(String contentType) {
        if (contentType == null) return "";
        // Strip parameters like "; charset=utf-8"
        String type = contentType.split(";")[0].trim().toLowerCase();
        switch (type) {
            case "image/jpeg":
            case "image/jpg":       return ".jpg";
            case "image/png":       return ".png";
            case "image/webp":      return ".webp";
            case "image/gif":       return ".gif";
            case "image/bmp":       return ".bmp";
            case "image/svg+xml":   return ".svg";
            case "image/tiff":      return ".tiff";
            case "image/avif":      return ".avif";
            case "image/heic":
            case "image/heif":      return ".heic";
            case "image/ico":
            case "image/x-icon":    return ".ico";
            case "video/mp4":       return ".mp4";
            case "video/mpeg":      return ".mpeg";
            case "video/webm":      return ".webm";
            default:
                // Generic fallback: image/xyz → .xyz
                if (type.startsWith("image/")) {
                    String sub = type.substring("image/".length())
                                     .replaceAll("[^a-zA-Z0-9]", "");
                    return sub.isEmpty() ? "" : "." + sub;
                }
                if (type.startsWith("video/")) {
                    String sub = type.substring("video/".length())
                                     .replaceAll("[^a-zA-Z0-9]", "");
                    return sub.isEmpty() ? "" : "." + sub;
                }
                return "";
        }
    }
}