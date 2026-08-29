package com.botleague.backend.guardian.enums;

public enum GuardianVerificationStatus {
    /** Guardian details submitted, but the guardian has not yet confirmed via OTP. */
    PENDING,
    /** The guardian entered a valid OTP sent to their own phone. */
    CONFIRMED
}
