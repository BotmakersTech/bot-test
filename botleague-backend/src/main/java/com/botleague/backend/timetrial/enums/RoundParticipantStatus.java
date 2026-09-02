package com.botleague.backend.timetrial.enums;

/**
 * One bot's status within a single TimeTrialRound.
 *
 *   PENDING    — round generated, no time entered yet
 *   TIMED      — a time has been recorded
 *   DNF        — did not finish; never advances regardless of the shortlist cutoff
 *   ADVANCED   — shortlisted into the next round (non-final rounds only)
 *   ELIMINATED — not shortlisted (non-final rounds only)
 *   FINISHED   — the round was marked final; this is the bot's terminal result
 */
public enum RoundParticipantStatus {
    PENDING,
    TIMED,
    DNF,
    ADVANCED,
    ELIMINATED,
    FINISHED
}
