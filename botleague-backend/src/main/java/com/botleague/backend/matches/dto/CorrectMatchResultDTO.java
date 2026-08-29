package com.botleague.backend.matches.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Reopens a COMPLETED match for correction. Extends SubmitMatchResultDTO so
 * a correction can carry the same optional score/position/winner overrides
 * a first-time submission does (and inherits its @Min(0) score constraints)
 * — plus a mandatory reason, since correcting an already-approved result
 * needs to be justified in a way a first submission doesn't.
 */
public class CorrectMatchResultDTO extends SubmitMatchResultDTO {

    @NotBlank(message = "A reason is required")
    @Size(max = 500)
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
