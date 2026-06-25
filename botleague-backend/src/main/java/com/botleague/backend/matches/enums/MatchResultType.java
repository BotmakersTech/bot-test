package com.botleague.backend.matches.enums;

public enum MatchResultType {

    /** Winner decided by highest score */
    SCORE,

    /** One competitor submitted / tapped out */
    TAPOUT,

    /** Judges declared the winner (no clear score winner) */
    JUDGE_DECISION,

    /** A team voluntarily gave up the match */
    FORFEIT,

    /** A team was disqualified by the official */
    DISQUALIFICATION,

    /** Match had only one competitor — auto-advanced */
    BYE
}
