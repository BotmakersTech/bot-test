package com.botleague.backend.matches.enums;

/**
 * Coarse status of a team on the leaderboard.
 *
 *   CHAMPION   — finished 1st (decisive final won, tournament effectively decided for them)
 *   ELIMINATED — out of championship contention; final placement is decided
 *                (covers the runner-up, the 3rd-place finisher, every earlier exit)
 *   ACTIVE     — still has matches to play / still in contention (tournament in progress)
 *
 * The precise placement is always carried by {@code rank} on the entry — this enum
 * is only a quick, human-readable bucket.
 */
public enum LeaderboardStatus {
    CHAMPION,
    ELIMINATED,
    ACTIVE
}