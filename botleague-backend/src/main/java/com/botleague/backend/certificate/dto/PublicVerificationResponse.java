package com.botleague.backend.certificate.dto;

import java.time.LocalDateTime;

/** Deliberately minimal — a public, unauthenticated endpoint. No PDF/download links, no internal ids. */
public class PublicVerificationResponse {

    private String result; // VALID | REVOKED | NOT_FOUND
    private String certificateNumber;
    private String recipientName;
    private String teamName;
    private String robotName;
    private String eventName;
    private String eventSportName;
    private String category;
    private String label;
    private Integer positionSnapshot;
    private String imageUrl;
    private LocalDateTime issuedAt;

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getEventSportName() { return eventSportName; }
    public void setEventSportName(String eventSportName) { this.eventSportName = eventSportName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Integer getPositionSnapshot() { return positionSnapshot; }
    public void setPositionSnapshot(Integer positionSnapshot) { this.positionSnapshot = positionSnapshot; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
}
