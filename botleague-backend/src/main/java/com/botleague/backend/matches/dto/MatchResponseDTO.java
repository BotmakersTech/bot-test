package com.botleague.backend.matches.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.matches.enums.BracketSide;
import com.botleague.backend.matches.enums.MatchFormat;
import com.botleague.backend.matches.enums.MatchResultType;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;

public class MatchResponseDTO {

    // =====================================================
    // BASIC
    // =====================================================

    private UUID matchId;

    private UUID eventSportId;

    private TournamentFormat tournamentFormat;

    private MatchType matchType;

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
    // =====================================================

    private UUID teamARegistrationId;

    private UUID teamBRegistrationId;

    private UUID teamCRegistrationId;

    private UUID teamDRegistrationId;

    private String teamAName;
    private String teamARobotName;

    private String teamBName;
    private String teamBRobotName;

    private String teamCName;
    private String teamCRobotName;

    private String teamDName;
    private String teamDRobotName;

    // =====================================================
    // SOURCE MATCHES
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
    // NEXT MATCH FLOW — WHERE WINNER ADVANCES
    // =====================================================

    private UUID nextMatchId;

    /**
     * 1 = Team A slot
     * 2 = Team B slot
     * 3 = Team C slot (Triple Threat / Fatal Four)
     * 4 = Team D slot (Fatal Four)
     */
    private Integer nextMatchSlot;

    // =====================================================
    // LOSER ROUTING (DOUBLE ELIMINATION ONLY)
    // WHERE THE LOSER GOES (INTO LOSERS BRACKET)
    // =====================================================

    private UUID loserNextMatchId;

    /**
     * 1 = Team A slot
     * 2 = Team B slot
     */
    private Integer loserNextMatchSlot;

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

    private String winnerTeamName;

    private String winnerRobotName;

    // =====================================================
    // LEADERBOARD POSITION
    // -------------------------------------------------------
    // null  = regular bracket match
    // 1     = grand final (decides 1st / 2nd place)
    // 3     = 3rd-place match (decides 3rd place)
    // =====================================================

    private Integer leaderboardPosition;

    // =====================================================
    // GRAND FINAL / BRACKET-RESET FLAG (DOUBLE ELIM)
    // =====================================================

    private Boolean isBracketReset;

    // =====================================================
    // BYE / AUTO ADVANCE
    // =====================================================

    private Boolean isBye;

    private Boolean autoAdvanced;

    // =====================================================
    // WIN METHOD
    // How the result was decided (set when COMPLETED).
    // SCORE | TAPOUT | JUDGE_DECISION | FORFEIT | DISQUALIFICATION | BYE
    // =====================================================

    private MatchResultType winMethod;

    // =====================================================
    // STATUS
    // =====================================================

    private MatchStatus status;

    // =====================================================
    // TIMINGS
    // =====================================================

    private LocalDateTime scheduledAt;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    // =====================================================
    // AUDIT
    // =====================================================

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getMatchId() {
        return matchId;
    }

    public void setMatchId(UUID matchId) {
        this.matchId = matchId;
    }

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

    public String getTeamAName() { return teamAName; }
    public void setTeamAName(String teamAName) { this.teamAName = teamAName; }

    public String getTeamARobotName() { return teamARobotName; }
    public void setTeamARobotName(String teamARobotName) { this.teamARobotName = teamARobotName; }

    public String getTeamBName() { return teamBName; }
    public void setTeamBName(String teamBName) { this.teamBName = teamBName; }

    public String getTeamBRobotName() { return teamBRobotName; }
    public void setTeamBRobotName(String teamBRobotName) { this.teamBRobotName = teamBRobotName; }

    public String getTeamCName() { return teamCName; }
    public void setTeamCName(String teamCName) { this.teamCName = teamCName; }

    public String getTeamCRobotName() { return teamCRobotName; }
    public void setTeamCRobotName(String teamCRobotName) { this.teamCRobotName = teamCRobotName; }

    public String getTeamDName() { return teamDName; }
    public void setTeamDName(String teamDName) { this.teamDName = teamDName; }

    public String getTeamDRobotName() { return teamDRobotName; }
    public void setTeamDRobotName(String teamDRobotName) { this.teamDRobotName = teamDRobotName; }

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

    public String getWinnerTeamName() { return winnerTeamName; }
    public void setWinnerTeamName(String winnerTeamName) { this.winnerTeamName = winnerTeamName; }

    public String getWinnerRobotName() { return winnerRobotName; }
    public void setWinnerRobotName(String winnerRobotName) { this.winnerRobotName = winnerRobotName; }

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

    public MatchResultType getWinMethod() {
        return winMethod;
    }

    public void setWinMethod(MatchResultType winMethod) {
        this.winMethod = winMethod;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
        this.status = status;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}