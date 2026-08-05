package com.botleague.backend.organizer.enums;

public enum VolunteerStatus {
    /** Self-service application awaiting organiser review. */
    PENDING,
    /** Organiser-added directly, or a self-service application that was approved. */
    APPROVED,
    /** Self-service application the organiser turned down. */
    REJECTED
}
