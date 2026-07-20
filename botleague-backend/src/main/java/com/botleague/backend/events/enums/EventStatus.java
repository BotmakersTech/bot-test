package com.botleague.backend.events.enums;

public enum EventStatus {

    DRAFT,        // being created; visible to organizers/admins only
    PUBLISHED,    // publicly visible; registrations open
    LIVE,         // competition started; registrations locked; matches/scoring active
    COMPLETED,    // all competitions finished; results finalised
    ARCHIVED,     // read-only; no edits, no registrations, no scoring — ended NORMALLY
    CANCELLED     // safe abort of a LIVE or PUBLISHED event — distinct from
                  // ARCHIVED because conflating "cancelled" with "completed
                  // normally, now just old" would misrepresent what happened.
                  // Stays visible/queryable (unlike a soft-delete), just
                  // terminal and no longer active.

}
