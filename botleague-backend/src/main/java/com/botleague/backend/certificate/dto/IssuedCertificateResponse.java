package com.botleague.backend.certificate.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class IssuedCertificateResponse {

    private UUID id;
    private String certificateNumber;
    private UUID certificateTypeId;
    private String certificateLabel;
    private String category;
    private UUID recipientUserId;
    private String recipientName;
    private UUID teamId;
    private String teamName;
    private UUID robotId;
    private String robotName;
    private UUID eventId;
    private String eventName;
    private UUID eventSportId;
    private String eventSportName;
    private Integer positionSnapshot;
    private String pdfUrl;
    private String imageUrl;
    private String qrUrl;
    private String verificationUrl;
    private String status;
    private String revokedReason;
    private LocalDateTime revokedAt;
    private LocalDateTime issuedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public UUID getCertificateTypeId() { return certificateTypeId; }
    public void setCertificateTypeId(UUID certificateTypeId) { this.certificateTypeId = certificateTypeId; }

    public String getCertificateLabel() { return certificateLabel; }
    public void setCertificateLabel(String certificateLabel) { this.certificateLabel = certificateLabel; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public UUID getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(UUID recipientUserId) { this.recipientUserId = recipientUserId; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public UUID getRobotId() { return robotId; }
    public void setRobotId(UUID robotId) { this.robotId = robotId; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public String getEventSportName() { return eventSportName; }
    public void setEventSportName(String eventSportName) { this.eventSportName = eventSportName; }

    public Integer getPositionSnapshot() { return positionSnapshot; }
    public void setPositionSnapshot(Integer positionSnapshot) { this.positionSnapshot = positionSnapshot; }

    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getQrUrl() { return qrUrl; }
    public void setQrUrl(String qrUrl) { this.qrUrl = qrUrl; }

    public String getVerificationUrl() { return verificationUrl; }
    public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRevokedReason() { return revokedReason; }
    public void setRevokedReason(String revokedReason) { this.revokedReason = revokedReason; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
}
