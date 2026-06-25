package com.botleague.backend.matches.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.matches.enums.BracketSide;
import com.botleague.backend.matches.enums.MatchFormat;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;

public class CreateMatchRequestDTO {

    // =====================================================
    // EVENT SPORT
    // =====================================================

    private UUID eventSportId;

    // =====================================================
    // TOURNAMENT FORMAT
    // SINGLE_ELIMINATION | DOUBLE_ELIMINATION
    // =====================================================

    private TournamentFormat tournamentFormat;

    // =====================================================
    // MATCH TYPE
    // ONE_VS_ONE | TRIPLE_THREAT | FATAL_FOUR
    // =====================================================

    private MatchType matchType = MatchType.ONE_VS_ONE;

    // =====================================================
    // MATCH FORMAT (e.g. BO1, BO3, BO5)
    // =====================================================

    private MatchFormat format;

    // =====================================================
    // BRACKET STRUCTURE
    // =====================================================

    private Integer roundNumber;

    private Integer matchNumber;

    private Integer bracketPosition;

    // =====================================================
    // BRACKET SIDE
    // WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE
    // NULL for single elimination
    // =====================================================

    private BracketSide bracketSide;

    // =====================================================
    // PARTICIPATING TEAMS
    // -------------------------------------------------------
    // ONE_VS_ONE   : team_a + team_b
    // TRIPLE_THREAT: team_a + team_b + team_c
    // FATAL_FOUR   : team_a + team_b + team_c + team_d
    // ALL nullable for future / TBD matches
    // =====================================================

    private UUID teamARegistrationId;

    private UUID teamBRegistrationId;

    private UUID teamCRegistrationId;

    private UUID teamDRegistrationId;

    // =====================================================
    // SOURCE MATCHES
    // WHICH MATCHES FEED INTO THIS MATCH
    // -------------------------------------------------------
    // ONE_VS_ONE   : source_a + source_b
    // TRIPLE_THREAT: source_a + source_b + source_c
    // FATAL_FOUR   : source_a + source_b + source_c + source_d
    // =====================================================

    private UUID sourceMatchAId;

    private UUID sourceMatchBId;

    private UUID sourceMatchCId;

    private UUID sourceMatchDId;

    // =====================================================
    // NEXT MATCH FLOW
    // WHERE WINNER ADVANCES
    // -------------------------------------------------------
    // 1 = Team A slot
    // 2 = Team B slot
    // 3 = Team C slot (Triple Threat / Fatal Four)
    // 4 = Team D slot (Fatal Four)
    // =====================================================

    private UUID nextMatchId;

    private Integer nextMatchSlot;

    // =====================================================
    // LOSER ROUTING (DOUBLE ELIMINATION ONLY)
    // WHERE THE LOSER DROPS INTO THE LOSERS BRACKET
    // -------------------------------------------------------
    // 1 = Team A slot
    // 2 = Team B slot
    // =====================================================

    private UUID loserNextMatchId;

    private Integer loserNextMatchSlot;

    // =====================================================
    // LEADERBOARD POSITION
    // -------------------------------------------------------
    // null  = regular bracket match
    // 1     = grand final (decides 1st / 2nd place)
    // 3     = 3rd-place match (decides 3rd place)
    // =====================================================

    private Integer leaderboardPosition;

    // =====================================================
    // BRACKET RESET FLAG (DOUBLE ELIMINATION ONLY)
    // TRUE when this is the rematch grand final
    // =====================================================

    private Boolean isBracketReset = false;

    // =====================================================
    // BYE / AUTO ADVANCE
    // =====================================================

    private Boolean isBye = false;

    private Boolean autoAdvanced = false;

    // =====================================================
    // TIMINGS
    // =====================================================

    private LocalDateTime scheduledAt;

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

    public Integer getBracketPosition() {
        return bracketPosition;
    }

    public void setBracketPosition(Integer bracketPosition) {
        this.bracketPosition = bracketPosition;
    }

    public BracketSide getBracketSide() {
        return bracketSide;
    }

    public void setBracketSide(BracketSide bracketSide) {
        this.bracketSide = bracketSide;
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

    public UUID getTeamCRegistrationId() {
        return teamCRegistrationId;
    }

    public void setTeamCRegistrationId(UUID teamCRegistrationId) {
        this.teamCRegistrationId = teamCRegistrationId;
    }

    public UUID getTeamDRegistrationId() {
        return teamDRegistrationId;
    }

    public void setTeamDRegistrationId(UUID teamDRegistrationId) {
        this.teamDRegistrationId = teamDRegistrationId;
    }

    public UUID getSourceMatchAId() {
        return sourceMatchAId;
    }

    public void setSourceMatchAId(UUID sourceMatchAId) {
        this.sourceMatchAId = sourceMatchAId;
    }

    public UUID getSourceMatchBId() {
        return sourceMatchBId;
    }

    public void setSourceMatchBId(UUID sourceMatchBId) {
        this.sourceMatchBId = sourceMatchBId;
    }

    public UUID getSourceMatchCId() {
        return sourceMatchCId;
    }

    public void setSourceMatchCId(UUID sourceMatchCId) {
        this.sourceMatchCId = sourceMatchCId;
    }

    public UUID getSourceMatchDId() {
        return sourceMatchDId;
    }

    public void setSourceMatchDId(UUID sourceMatchDId) {
        this.sourceMatchDId = sourceMatchDId;
    }

    public UUID getNextMatchId() {
        return nextMatchId;
    }

    public void setNextMatchId(UUID nextMatchId) {
        this.nextMatchId = nextMatchId;
    }

    public Integer getNextMatchSlot() {
        return nextMatchSlot;
    }

    public void setNextMatchSlot(Integer nextMatchSlot) {
        this.nextMatchSlot = nextMatchSlot;
    }

    public UUID getLoserNextMatchId() {
        return loserNextMatchId;
    }

    public void setLoserNextMatchId(UUID loserNextMatchId) {
        this.loserNextMatchId = loserNextMatchId;
    }

    public Integer getLoserNextMatchSlot() {
        return loserNextMatchSlot;
    }

    public void setLoserNextMatchSlot(Integer loserNextMatchSlot) {
        this.loserNextMatchSlot = loserNextMatchSlot;
    }

    public Integer getLeaderboardPosition() {
        return leaderboardPosition;
    }

    public void setLeaderboardPosition(Integer leaderboardPosition) {
        this.leaderboardPosition = leaderboardPosition;
    }

    public Boolean getIsBracketReset() {
        return isBracketReset;
    }

    public void setIsBracketReset(Boolean isBracketReset) {
        this.isBracketReset = isBracketReset;
    }

    public Boolean getIsBye() {
        return isBye;
    }

    public void setIsBye(Boolean isBye) {
        this.isBye = isBye;
    }

    public Boolean getAutoAdvanced() {
        return autoAdvanced;
    }

    public void setAutoAdvanced(Boolean autoAdvanced) {
        this.autoAdvanced = autoAdvanced;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}