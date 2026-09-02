package com.botleague.backend.timetrial.enums;

/**
 * Lifecycle of one TimeTrialRound.
 *
 *   OPEN           — created, entries awaiting a time or DNF
 *   TIMES_RECORDED — every entry has a time or DNF; ready to shortlist or finalize
 *   ADVANCED       — shortlisted; the next round has been spawned; this round is locked
 *   FINALIZED      — marked as the final round; its ranking is the event's final standings
 *   CANCELLED      — soft-deleted (see RaceRoundService's "delete latest round" escape hatch)
 */
public enum RoundStatus {
    OPEN,
    TIMES_RECORDED,
    ADVANCED,
    FINALIZED,
    CANCELLED
}
