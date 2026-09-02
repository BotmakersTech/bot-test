package com.botleague.backend.events.enums;

/**
 * Which match-generation system a (sport) uses.
 *
 *   BRACKET          — the existing single/double-elimination system (Match/MatchService).
 *   ROUND_TIME_TRIAL — round-wise time trial: every registered bot runs each round, staff
 *                      record a time per bot, then shortlist N to the next round until a
 *                      round is marked final (see the `timetrial` package).
 *
 * See MatchFormatPolicy for the sport → format lookup.
 */
public enum MatchFormatKind {
    BRACKET,
    ROUND_TIME_TRIAL
}
