package com.botleague.backend.events.enums;

public enum EventStatus {

    DRAFT,        // being created; visible to organizers/admins only
    PUBLISHED,    // publicly visible; registrations open
    LIVE,         // competition started; registrations locked; matches/scoring active
    COMPLETED,    // all competitions finished; results finalised
    ARCHIVED      // read-only; no edits, no registrations, no scoring

}
