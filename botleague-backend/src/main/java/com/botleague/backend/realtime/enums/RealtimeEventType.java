package com.botleague.backend.realtime.enums;

public enum RealtimeEventType {

    // ── Notifications ────────────────────────────────────────────────────────
    NOTIFICATION_NEW,
    NOTIFICATION_COUNT,

    // ── Match lifecycle ──────────────────────────────────────────────────────
    MATCH_CREATED,   // one match created (used during bracket generation)
    MATCH_SCHEDULED,
    MATCH_STARTED,
    MATCH_SCORE_UPDATED,
    MATCH_RESULT_SUBMITTED,
    MATCH_COMPLETED,
    MATCH_UPDATED,   // participant slots filled after winner advancement
    BRACKET_CREATED, // admin just generated a full bracket

    // ── Rankings (leaderboard) ────────────────────────────────────────────────
    RANKINGS_UPDATED,

    // ── Event ────────────────────────────────────────────────────────────────
    EVENT_UPDATED,
    EVENT_STATUS_CHANGED,

    // ── Sport ────────────────────────────────────────────────────────────────
    SPORT_UPDATED,
    SPORT_REGISTRATION_OPENED,
    SPORT_REGISTRATION_CLOSED,

    // ── Registration ─────────────────────────────────────────────────────────
    REGISTRATION_NEW,
    REGISTRATION_CANCELLED,

    // ── Team ─────────────────────────────────────────────────────────────────
    TEAM_UPDATED,
    TEAM_MEMBER_ADDED,
    TEAM_MEMBER_REMOVED,

    // ── Achievements ──────────────────────────────────────────────────────────
    ACHIEVEMENT_UNLOCKED,
}
