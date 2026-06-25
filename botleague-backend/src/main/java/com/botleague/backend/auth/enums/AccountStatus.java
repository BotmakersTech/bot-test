package com.botleague.backend.auth.enums;

public enum AccountStatus {

    ACTIVE,
    PENDING,
    SUSPENDED,
    DEACTIVATED,
    /** @deprecated Use SUSPENDED */
    SUSPEND
}
