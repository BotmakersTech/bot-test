package com.botleague.backend.auth.enums;

public enum AccountType {

    /** Platform-wide super administrator — unrestricted access to everything. */
    SUPER_ADMIN,

    /** Platform administrator — user management, event creation, sport-spec changes, event operations (absorbs the retired MANAGER role). */
    ADMIN,

    /** External partner who owns their own events — top of the organiser-owned ownership chain (ORGANISER -> EVENT_HEAD -> SPORT_HEAD). */
    ORGANISER,

    /** Manages their assigned event (info, teams, volunteers, judges, staff, venue). Shared appointee layer under both the BotLeague and Organiser ownership chains. */
    EVENT_HEAD,

    /** Manages their assigned sport within an event (registrations, matches, scores). Shared appointee layer under both ownership chains. */
    SPORT_HEAD,

    /** Regular platform competitor — registers teams, views events, tracks their matches. */
    COMPETITOR,

    /** Match judge — views and scores their assigned matches. */
    JUDGE,

    /** Event volunteer — views their event info, checks in/out. */
    VOLUNTEER
}
