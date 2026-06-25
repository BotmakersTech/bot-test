package com.botleague.backend.auth.enums;

public enum AccountType {

    /** Platform-wide super administrator — unrestricted access to everything. */
    SUPER_ADMIN,

    /** Platform administrator — user management, event creation, tier & sport-spec changes. */
    ADMINISTRATOR,

    /** Event manager — event operations, registrations, matches, reports (no user mgmt). */
    MANAGER,

    /** Event organiser — manages their assigned events (info, teams, volunteers, judges, staff, venue). */
    ORGANIZER,

    /** Sport-level organiser — manages their assigned sport within an event (registrations, matches, scores). */
    SUB_ORGANIZER,

    /** Regular platform competitor — registers teams, views events, tracks their matches. */
    COMPETITOR,

    /** Match judge — views and scores their assigned matches. */
    JUDGE,

    /** Event volunteer — views their event info, checks in/out. */
    VOLUNTEER
}
