package com.botleague.backend.matches.dto;

import java.util.UUID;

import com.botleague.backend.matches.enums.LeaderboardStatus;

/**
 * One row in the leaderboard — a single team and where it placed.
 *
 * RANKING
 *   rank  — 1-based final (or provisional) placement. Standard competition
 *           ranking: teams that genuinely tie SHARE a rank number, and the
 *           next rank skips accordingly (e.g. 1, 2, 2, 4). Lower = better.
 *   tied  — true when this team shares its rank with at least one other team
 *           (the display order among tied teams is decided by tiebreakers:
 *            point differential, then wins, then a stable id ordering).
 *
 * STATUS
 *   status            — CHAMPION / ELIMINATED / ACTIVE (quick human bucket).
 *   eliminatedInRound — the roundNumber of the match in which the team was
 *                       knocked out; null for the champion and for teams that
 *                       are still ACTIVE (tournament in progress).
 *
 * STATS (all derived only from COMPLETED matches; byes never count as wins)
 *   played            — real matches contested (2+ teams actually present)
 *   wins / losses     — outcomes of those real matches
 *   byes              — auto-advance / walkover matches (1 team present)
 *   pointsFor         — sum of this team's own scores across real matches
 *   pointsAgainst     — sum of every opponent's score in those same matches
 *   pointDifferential — pointsFor − pointsAgainst
 */
public class LeaderboardEntryDTO {

    private Integer rank;
    private boolean tied;

    private UUID registrationId;
    private String robotName;
    private String teamName;

    private LeaderboardStatus status;
    private Integer eliminatedInRound;

    private int played;
    private int wins;
    private int losses;
    private int byes;

    private int pointsFor;
    private int pointsAgainst;
    private int pointDifferential;

    public LeaderboardEntryDTO() {
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    /** Jackson serialises this as "tied". */
    public boolean isTied() {
        return tied;
    }

    public void setTied(boolean tied) {
        this.tied = tied;
    }

    public UUID getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(UUID registrationId) {
        this.registrationId = registrationId;
    }

    public String getRobotName() {
        return robotName;
    }

    public void setRobotName(String robotName) {
        this.robotName = robotName;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public LeaderboardStatus getStatus() {
        return status;
    }

    public void setStatus(LeaderboardStatus status) {
        this.status = status;
    }

    public Integer getEliminatedInRound() {
        return eliminatedInRound;
    }

    public void setEliminatedInRound(Integer eliminatedInRound) {
        this.eliminatedInRound = eliminatedInRound;
    }

    public int getPlayed() {
        return played;
    }

    public void setPlayed(int played) {
        this.played = played;
    }

    public int getWins() {
        return wins;
    }

    public void setWins(int wins) {
        this.wins = wins;
    }

    public int getLosses() {
        return losses;
    }

    public void setLosses(int losses) {
        this.losses = losses;
    }

    public int getByes() {
        return byes;
    }

    public void setByes(int byes) {
        this.byes = byes;
    }

    public int getPointsFor() {
        return pointsFor;
    }

    public void setPointsFor(int pointsFor) {
        this.pointsFor = pointsFor;
    }

    public int getPointsAgainst() {
        return pointsAgainst;
    }

    public void setPointsAgainst(int pointsAgainst) {
        this.pointsAgainst = pointsAgainst;
    }

    public int getPointDifferential() {
        return pointDifferential;
    }

    public void setPointDifferential(int pointDifferential) {
        this.pointDifferential = pointDifferential;
    }
}