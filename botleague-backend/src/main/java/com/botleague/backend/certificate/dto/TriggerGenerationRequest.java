package com.botleague.backend.certificate.dto;

import java.util.List;

/** manualRecipients is required (and only used) when the certificate type's eligibilityRule is MANUAL_SELECT. */
public class TriggerGenerationRequest {

    private List<ManualRecipientRequest> manualRecipients;

    public List<ManualRecipientRequest> getManualRecipients() { return manualRecipients; }
    public void setManualRecipients(List<ManualRecipientRequest> manualRecipients) { this.manualRecipients = manualRecipients; }
}
