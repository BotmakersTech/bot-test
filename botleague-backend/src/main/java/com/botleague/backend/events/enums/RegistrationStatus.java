package com.botleague.backend.events.enums;

public enum RegistrationStatus {
    PENDING,      // submitted, waiting for organizer confirmation
    CONFIRMED,    // accepted into the competition (eligible for the bracket)
    WAITLISTED,   // competition full, on the waiting list
    REJECTED,     // rejected (rules / weight / size mismatch)
    WITHDRAWN,    // pulled out before the event
    CHECKED_IN    // verified on event day (weight / size check passed)
, REGISTERED, CANCELLED
}