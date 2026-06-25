package com.botleague.backend.matches.enums;

public enum MatchFormat {

    // =====================================================
    // SINGLE ELIMINATION
    // One loss = eliminated
    // =====================================================

    SINGLE_ELIMINATION,

    // =====================================================
    // DOUBLE ELIMINATION
    // Two losses = eliminated
    // =====================================================

    DOUBLE_ELIMINATION,

    // =====================================================
    // ROUND ROBIN
    // Everyone plays everyone
    // =====================================================

    ROUND_ROBIN
}