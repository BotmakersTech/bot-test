package com.botleague.backend.certificate.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class CertificateGenerationJobResponse {

    private UUID id;
    private UUID certificateTypeId;
    private String status;
    private Integer totalRecipients;
    private Integer succeededCount;
    private Integer failedCount;
    private String errorSummary;
    private UUID triggeredBy;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCertificateTypeId() { return certificateTypeId; }
    public void setCertificateTypeId(UUID certificateTypeId) { this.certificateTypeId = certificateTypeId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTotalRecipients() { return totalRecipients; }
    public void setTotalRecipients(Integer totalRecipients) { this.totalRecipients = totalRecipients; }

    public Integer getSucceededCount() { return succeededCount; }
    public void setSucceededCount(Integer succeededCount) { this.succeededCount = succeededCount; }

    public Integer getFailedCount() { return failedCount; }
    public void setFailedCount(Integer failedCount) { this.failedCount = failedCount; }

    public String getErrorSummary() { return errorSummary; }
    public void setErrorSummary(String errorSummary) { this.errorSummary = errorSummary; }

    public UUID getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(UUID triggeredBy) { this.triggeredBy = triggeredBy; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
