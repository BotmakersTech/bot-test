package com.botleague.backend.certificate.dto;

import java.util.UUID;

public class CreateCertificateTypeRequest {

    private UUID eventSportId;
    private String category;
    private String label;
    private UUID templateId;
    private String eligibilityRule;
    private Integer eligibilityRank;
    private String issueMode;
    private String numberPrefix;
    private String numberFormat;
    private Integer validityYears;
    private Boolean verificationEnabled;
    private Boolean qrEnabled;
    private Boolean signatureEnabled;

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public UUID getTemplateId() { return templateId; }
    public void setTemplateId(UUID templateId) { this.templateId = templateId; }

    public String getEligibilityRule() { return eligibilityRule; }
    public void setEligibilityRule(String eligibilityRule) { this.eligibilityRule = eligibilityRule; }

    public Integer getEligibilityRank() { return eligibilityRank; }
    public void setEligibilityRank(Integer eligibilityRank) { this.eligibilityRank = eligibilityRank; }

    public String getIssueMode() { return issueMode; }
    public void setIssueMode(String issueMode) { this.issueMode = issueMode; }

    public String getNumberPrefix() { return numberPrefix; }
    public void setNumberPrefix(String numberPrefix) { this.numberPrefix = numberPrefix; }

    public String getNumberFormat() { return numberFormat; }
    public void setNumberFormat(String numberFormat) { this.numberFormat = numberFormat; }

    public Integer getValidityYears() { return validityYears; }
    public void setValidityYears(Integer validityYears) { this.validityYears = validityYears; }

    public Boolean getVerificationEnabled() { return verificationEnabled; }
    public void setVerificationEnabled(Boolean verificationEnabled) { this.verificationEnabled = verificationEnabled; }

    public Boolean getQrEnabled() { return qrEnabled; }
    public void setQrEnabled(Boolean qrEnabled) { this.qrEnabled = qrEnabled; }

    public Boolean getSignatureEnabled() { return signatureEnabled; }
    public void setSignatureEnabled(Boolean signatureEnabled) { this.signatureEnabled = signatureEnabled; }
}
