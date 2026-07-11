package com.botleague.backend.matches.enums;

public enum MatchStatus {

    SCHEDULED,

    LIVE,

    /** Result submitted, awaiting EVENT_HEAD/ORGANISER/ADMIN approval before it counts toward rankings. */
    PENDING_APPROVAL,

    COMPLETED,

    CANCELLED
}