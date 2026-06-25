package com.botleague.backend.matches.dto;

public class UpdateMatchScoreDTO {

    // =====================================================
    // SCORES
    // -------------------------------------------------------
    // C and D scores are used only for
    // TRIPLE_THREAT and FATAL_FOUR match types
    // =====================================================

    private Integer teamAScore;

    private Integer teamBScore;

    private Integer teamCScore;

    private Integer teamDScore;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public Integer getTeamAScore() {
        return teamAScore;
    }

    public void setTeamAScore(Integer teamAScore) {
        this.teamAScore = teamAScore;
    }

    public Integer getTeamBScore() {
        return teamBScore;
    }

    public void setTeamBScore(Integer teamBScore) {
        this.teamBScore = teamBScore;
    }

    public Integer getTeamCScore() {
        return teamCScore;
    }

    public void setTeamCScore(Integer teamCScore) {
        this.teamCScore = teamCScore;
    }

    public Integer getTeamDScore() {
        return teamDScore;
    }

    public void setTeamDScore(Integer teamDScore) {
        this.teamDScore = teamDScore;
    }
}