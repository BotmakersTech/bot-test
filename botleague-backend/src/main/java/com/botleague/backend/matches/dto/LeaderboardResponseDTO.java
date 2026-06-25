package com.botleague.backend.matches.dto;

import java.util.List;
import java.util.UUID;

import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;

/**
 * The whole leaderboard for one event-sport (one bracket).
 *
 *   eventSportId          — the bracket this leaderboard belongs to
 *   tournamentFormat      — SINGLE_ELIMINATION | DOUBLE_ELIMINATION
 *   matchType             — ONE_VS_ONE | TRIPLE_THREAT | FATAL_FOUR
 *                           (the type the bracket was generated with)
 *   isFinal               — true only when every match is COMPLETED or
 *                           CANCELLED (no SCHEDULED / LIVE left). When false
 *                           the ranks are provisional "current standings".
 *   totalTeams            — number of distinct teams that appear anywhere
 *                           in the bracket
 *   championRegistrationId / championTeamName
 *                         — populated once the deciding final is COMPLETED;
 *                           null while the champion is still undecided
 *   entries               — one row per team, already sorted best-rank-first
 */
public class LeaderboardResponseDTO {

    private UUID eventSportId;
    private TournamentFormat tournamentFormat;
    private MatchType matchType;

    private Boolean isFinal;
    private int totalTeams;

    private UUID championRegistrationId;
    private String championRobotName;
    private String championTeamName;

    private List<LeaderboardEntryDTO> entries;

    public LeaderboardResponseDTO() {
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getEventSportId() {
        return eventSportId;
    }

    public void setEventSportId(UUID eventSportId) {
        this.eventSportId = eventSportId;
    }

    public TournamentFormat getTournamentFormat() {
        return tournamentFormat;
    }

    public void setTournamentFormat(TournamentFormat tournamentFormat) {
        this.tournamentFormat = tournamentFormat;
    }

    public MatchType getMatchType() {
        return matchType;
    }

    public void setMatchType(MatchType matchType) {
        this.matchType = matchType;
    }

    /** Jackson serialises this as "isFinal". */
    public Boolean getIsFinal() {
        return isFinal;
    }

    public void setIsFinal(Boolean isFinal) {
        this.isFinal = isFinal;
    }

    public int getTotalTeams() {
        return totalTeams;
    }

    public void setTotalTeams(int totalTeams) {
        this.totalTeams = totalTeams;
    }

    public UUID getChampionRegistrationId() {
        return championRegistrationId;
    }

    public void setChampionRegistrationId(UUID championRegistrationId) {
        this.championRegistrationId = championRegistrationId;
    }

    public String getChampionRobotName() {
        return championRobotName;
    }

    public void setChampionRobotName(String championRobotName) {
        this.championRobotName = championRobotName;
    }

    public String getChampionTeamName() {
        return championTeamName;
    }

    public void setChampionTeamName(String championTeamName) {
        this.championTeamName = championTeamName;
    }

    public List<LeaderboardEntryDTO> getEntries() {
        return entries;
    }

    public void setEntries(List<LeaderboardEntryDTO> entries) {
        this.entries = entries;
    }
}