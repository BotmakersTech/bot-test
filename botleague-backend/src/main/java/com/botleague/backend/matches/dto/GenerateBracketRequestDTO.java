package com.botleague.backend.matches.dto;

import java.util.List;
import java.util.UUID;

import com.botleague.backend.matches.enums.MatchFormat;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;

public class GenerateBracketRequestDTO {

    // =====================================================
    // EVENT SPORT
    // =====================================================

    private UUID eventSportId;

    // =====================================================
    // TOURNAMENT FORMAT
    // SINGLE_ELIMINATION | DOUBLE_ELIMINATION
    // =====================================================

    private TournamentFormat tournamentFormat=TournamentFormat.SINGLE_ELIMINATION;

    // =====================================================
    // MATCH TYPE
    // ONE_VS_ONE | TRIPLE_THREAT | FATAL_FOUR
    // =====================================================

    private MatchType matchType;

    // =====================================================
    // MATCH FORMAT (e.g. BO1, BO3, BO5)
    // =====================================================

    private MatchFormat format;

    // =====================================================
    // TEAMS
    // =====================================================

    private List<UUID> teamRegistrationIds;

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

    public MatchFormat getFormat() {
        return format;
    }

    public void setFormat(MatchFormat format) {
        this.format = format;
    }

    public List<UUID> getTeamRegistrationIds() {
        return teamRegistrationIds;
    }

    public void setTeamRegistrationIds(List<UUID> teamRegistrationIds) {
        this.teamRegistrationIds = teamRegistrationIds;
    }
}