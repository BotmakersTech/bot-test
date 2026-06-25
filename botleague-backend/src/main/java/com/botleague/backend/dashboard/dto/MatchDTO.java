// com/botleague/backend/dashboard/dto/MatchDTO.java
package com.botleague.backend.dashboard.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.matches.enums.MatchStatus;

public class MatchDTO {

    private UUID matchId;
    private Integer roundNumber;
    private Integer matchNumber;
    private MatchStatus status;
    private Integer teamAScore;
    private Integer teamBScore;
    private String teamAName;
    private String teamBName;
    private UUID teamARegistrationId;
    private UUID teamBRegistrationId;
    private UUID winnerRegistrationId;
    private LocalDateTime scheduledAt;

    // ================= GETTERS & SETTERS =================

    public UUID getMatchId() {
        return matchId;
    }

    public void setMatchId(UUID matchId) {
        this.matchId = matchId;
    }

    public Integer getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(Integer roundNumber) {
        this.roundNumber = roundNumber;
    }

    public Integer getMatchNumber() {
        return matchNumber;
    }

    public void setMatchNumber(Integer matchNumber) {
        this.matchNumber = matchNumber;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
        this.status = status;
    }

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

    public String getTeamAName() {
        return teamAName;
    }

    public void setTeamAName(String teamAName) {
        this.teamAName = teamAName;
    }

    public String getTeamBName() {
        return teamBName;
    }

    public void setTeamBName(String teamBName) {
        this.teamBName = teamBName;
    }

    public UUID getTeamARegistrationId() {
        return teamARegistrationId;
    }

    public void setTeamARegistrationId(UUID teamARegistrationId) {
        this.teamARegistrationId = teamARegistrationId;
    }

    public UUID getTeamBRegistrationId() {
        return teamBRegistrationId;
    }

    public void setTeamBRegistrationId(UUID teamBRegistrationId) {
        this.teamBRegistrationId = teamBRegistrationId;
    }

    public UUID getWinnerRegistrationId() {
        return winnerRegistrationId;
    }

    public void setWinnerRegistrationId(UUID winnerRegistrationId) {
        this.winnerRegistrationId = winnerRegistrationId;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}