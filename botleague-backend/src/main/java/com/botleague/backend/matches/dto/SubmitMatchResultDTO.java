package com.botleague.backend.matches.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.matches.enums.MatchResultType;

public class SubmitMatchResultDTO {

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
    // FINISH POSITIONS
    // -------------------------------------------------------
    // Records how each participant placed in this match.
    // Matters most for TRIPLE_THREAT and FATAL_FOUR where
    // 2nd / 3rd place from one match may advance differently.
    // =====================================================

    /** Registration ID of the participant who placed 1st */
    private UUID positionFirstRegistrationId;

    /** Registration ID of the participant who placed 2nd */
    private UUID positionSecondRegistrationId;

    /** Registration ID of the participant who placed 3rd */
    private UUID positionThirdRegistrationId;

    /** Registration ID of the participant who placed 4th (Fatal Four) */
    private UUID positionFourthRegistrationId;

    // =====================================================
    // WINNER
    // =====================================================

    private UUID winnerRegistrationId;

    // =====================================================
    // WIN METHOD
    // How the result was decided.
    // SCORE | TAPOUT | JUDGE_DECISION | FORFEIT | DISQUALIFICATION | BYE
    // =====================================================

    private MatchResultType winMethod;

    // =====================================================
    // TIMINGS
    // =====================================================

    private LocalDateTime endedAt;

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

    public UUID getPositionFirstRegistrationId() {
        return positionFirstRegistrationId;
    }

    public void setPositionFirstRegistrationId(UUID positionFirstRegistrationId) {
        this.positionFirstRegistrationId = positionFirstRegistrationId;
    }

    public UUID getPositionSecondRegistrationId() {
        return positionSecondRegistrationId;
    }

    public void setPositionSecondRegistrationId(UUID positionSecondRegistrationId) {
        this.positionSecondRegistrationId = positionSecondRegistrationId;
    }

    public UUID getPositionThirdRegistrationId() {
        return positionThirdRegistrationId;
    }

    public void setPositionThirdRegistrationId(UUID positionThirdRegistrationId) {
        this.positionThirdRegistrationId = positionThirdRegistrationId;
    }

    public UUID getPositionFourthRegistrationId() {
        return positionFourthRegistrationId;
    }

    public void setPositionFourthRegistrationId(UUID positionFourthRegistrationId) {
        this.positionFourthRegistrationId = positionFourthRegistrationId;
    }

    public UUID getWinnerRegistrationId() {
        return winnerRegistrationId;
    }

    public void setWinnerRegistrationId(UUID winnerRegistrationId) {
        this.winnerRegistrationId = winnerRegistrationId;
    }

    public MatchResultType getWinMethod() {
        return winMethod;
    }

    public void setWinMethod(MatchResultType winMethod) {
        this.winMethod = winMethod;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }
}