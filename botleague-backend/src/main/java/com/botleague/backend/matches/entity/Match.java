package com.botleague.backend.matches.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.matches.enums.BracketSide;
import com.botleague.backend.matches.enums.MatchFormat;
import com.botleague.backend.matches.enums.MatchResultType;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;

import jakarta.persistence.*;

@Entity
@Table(
    name = "matches",

    indexes = {

        // =====================================================
        // EVENT SPORT
        // =====================================================

        @Index(
            name = "idx_match_event_sport",
            columnList = "event_sport_id"
        ),

        // =====================================================
        // ROUND LOOKUPS
        // =====================================================

        @Index(
            name = "idx_match_round",
            columnList = "event_sport_id, round_number"
        ),

        // =====================================================
        // TEAM LOOKUPS
        // =====================================================

        @Index(
            name = "idx_match_team_a",
            columnList = "team_a_registration_id"
        ),

        @Index(
            name = "idx_match_team_b",
            columnList = "team_b_registration_id"
        ),

        @Index(
            name = "idx_match_team_c",
            columnList = "team_c_registration_id"
        ),

        @Index(
            name = "idx_match_team_d",
            columnList = "team_d_registration_id"
        ),

        // =====================================================
        // WINNER LOOKUPS
        // =====================================================

        @Index(
            name = "idx_match_winner",
            columnList = "winner_registration_id"
        ),

        // =====================================================
        // BRACKET FLOW
        // =====================================================

        @Index(
            name = "idx_match_next",
            columnList = "next_match_id"
        ),

        // =====================================================
        // BRACKET SIDE (DOUBLE ELIMINATION)
        // =====================================================

        @Index(
            name = "idx_match_bracket_side",
            columnList = "event_sport_id, bracket_side"
        ),

        // =====================================================
        // LEADERBOARD POSITION
        // =====================================================

        @Index(
            name = "idx_match_leaderboard_position",
            columnList = "event_sport_id, leaderboard_position"
        )
    },

    uniqueConstraints = {

        @UniqueConstraint(
            name = "uk_match_round_number",
            columnNames = {
                "event_sport_id",
                "round_number",
                "match_number",
                "bracket_side"
            }
        )
    }
)
public class Match {

    // =====================================================
    // PRIMARY KEY
    // =====================================================

    @Id
    private UUID id;

    // =====================================================
    // EVENT SPORT
    // =====================================================

    @Column(
        name = "event_sport_id",
        nullable = false
    )
    private UUID eventSportId;

    // =====================================================
    // TOURNAMENT FORMAT
    // SINGLE_ELIMINATION | DOUBLE_ELIMINATION
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
        name = "tournament_format",
        nullable = false
    )
    private TournamentFormat tournamentFormat;

    // =====================================================
    // MATCH TYPE
    // ONE_VS_ONE | TRIPLE_THREAT | FATAL_FOUR
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
        name = "match_type",
        nullable = false
    )
    private MatchType matchType = MatchType.ONE_VS_ONE;

    // =====================================================
    // MATCH FORMAT (e.g. BO1, BO3, BO5 etc.)
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
        name = "format",
        nullable = true
    )
    private MatchFormat format;

    // =====================================================
    // BRACKET STRUCTURE
    // =====================================================

    @Column(name = "round_number")
    private Integer roundNumber;

    @Column(name = "match_number")
    private Integer matchNumber;

    @Column(name = "bracket_position")
    private Integer bracketPosition;

    // =====================================================
    // BRACKET SIDE
    // WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE
    // NULL for single elimination
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(name = "bracket_side")
    private BracketSide bracketSide;

    // =====================================================
    // PARTICIPATING TEAMS
    // -------------------------------------------------------
    // ONE_VS_ONE   : team_a + team_b
    // TRIPLE_THREAT: team_a + team_b + team_c
    // FATAL_FOUR   : team_a + team_b + team_c + team_d
    // ALL nullable for future / TBD matches
    // =====================================================

    @Column(name = "team_a_registration_id")
    private UUID teamARegistrationId;

    @Column(name = "team_b_registration_id")
    private UUID teamBRegistrationId;

    @Column(name = "team_c_registration_id")
    private UUID teamCRegistrationId;

    @Column(name = "team_d_registration_id")
    private UUID teamDRegistrationId;

    // =====================================================
    // SOURCE MATCHES
    // WHICH MATCHES FEED INTO THIS MATCH
    // -------------------------------------------------------
    // ONE_VS_ONE   : source_a + source_b
    // TRIPLE_THREAT: source_a + source_b + source_c
    // FATAL_FOUR   : source_a + source_b + source_c + source_d
    // =====================================================

    @Column(name = "source_match_a_id")
    private UUID sourceMatchAId;

    @Column(name = "source_match_b_id")
    private UUID sourceMatchBId;

    @Column(name = "source_match_c_id")
    private UUID sourceMatchCId;

    @Column(name = "source_match_d_id")
    private UUID sourceMatchDId;

    // =====================================================
    // NEXT MATCH FLOW — WHERE WINNER ADVANCES
    // =====================================================

    @Column(name = "next_match_id")
    private UUID nextMatchId;

    /**
     * 1 = team A slot
     * 2 = team B slot
     * 3 = team C slot (Triple Threat / Fatal Four)
     * 4 = team D slot (Fatal Four)
     */
    @Column(name = "next_match_slot")
    private Integer nextMatchSlot;

    // =====================================================
    // LOSER ROUTING (DOUBLE ELIMINATION ONLY)
    // WHERE THE LOSER GOES (INTO LOSERS BRACKET)
    // =====================================================

    @Column(name = "loser_next_match_id")
    private UUID loserNextMatchId;

    /**
     * 1 = team A slot
     * 2 = team B slot
     */
    @Column(name = "loser_next_match_slot")
    private Integer loserNextMatchSlot;

    // =====================================================
    // SCORES
    // -------------------------------------------------------
    // C and D scores are used only for
    // TRIPLE_THREAT and FATAL_FOUR match types
    // =====================================================

    @Column(name = "team_a_score")
    private Integer teamAScore = 0;

    @Column(name = "team_b_score")
    private Integer teamBScore = 0;

    @Column(name = "team_c_score")
    private Integer teamCScore = 0;

    @Column(name = "team_d_score")
    private Integer teamDScore = 0;

    // =====================================================
    // FINISH POSITIONS
    // -------------------------------------------------------
    // Records how each participant placed in this match.
    // Matters most for TRIPLE_THREAT and FATAL_FOUR where
    // 2nd / 3rd place from one match may advance differently.
    // =====================================================

    /** Registration ID of the participant who placed 1st */
    @Column(name = "position_first_registration_id")
    private UUID positionFirstRegistrationId;

    /** Registration ID of the participant who placed 2nd */
    @Column(name = "position_second_registration_id")
    private UUID positionSecondRegistrationId;

    /** Registration ID of the participant who placed 3rd */
    @Column(name = "position_third_registration_id")
    private UUID positionThirdRegistrationId;

    /** Registration ID of the participant who placed 4th (Fatal Four) */
    @Column(name = "position_fourth_registration_id")
    private UUID positionFourthRegistrationId;

    // =====================================================
    // WINNER
    // =====================================================

    @Column(name = "winner_registration_id")
    private UUID winnerRegistrationId;

    // =====================================================
    // LEADERBOARD POSITION
    // -------------------------------------------------------
    // Populated on the FINAL match(es) that decide ranking.
    //
    //  null  — regular bracket match (no leaderboard meaning)
    //  1     — this match decides 1st place  (the grand final)
    //  3     — this match decides 3rd place  (bronze / 3rd-place match)
    //
    // In Double Elimination the grand final may be played twice
    // (isBracketReset = true for the rematch), so both rows
    // can have leaderboard_position = 1.
    // =====================================================

    @Column(name = "leaderboard_position")
    private Integer leaderboardPosition;

    // =====================================================
    // GRAND FINAL / BRACKET-RESET FLAG (DOUBLE ELIM)
    // -------------------------------------------------------
    // When the losers-bracket finalist wins the grand final,
    // a bracket-reset rematch is required. The rematch row
    // sets is_bracket_reset = true so it can be distinguished
    // from the original grand final.
    // =====================================================

    @Column(
        name = "is_bracket_reset",
        nullable = false
    )
    private Boolean isBracketReset = false;

    // =====================================================
    // BYE / AUTO ADVANCE
    // =====================================================

    @Column(
        name = "is_bye",
        nullable = false
    )
    private Boolean isBye = false;

    @Column(
        name = "auto_advanced",
        nullable = false
    )
    private Boolean autoAdvanced = false;

    // =====================================================
    // RANKING-POOL SNAPSHOT
    // Captured from EventSports at bracket-generation time. Sport specs
    // (weight class / age group) stay editable at any lifecycle stage by
    // design — awardMatchPoints() must use THESE, not a live read of the
    // sport, so a mid-tournament edit can't retroactively move an
    // already-played match's points into a different ranking pool.
    // =====================================================

    @Column(name = "weight_class_snapshot", length = 20)
    private String weightClassSnapshot;

    @Column(name = "age_group_snapshot", length = 30)
    private String ageGroupSnapshot;

    // =====================================================
    // WIN METHOD
    // How the match result was decided.
    // SCORE | TAPOUT | JUDGE_DECISION | FORFEIT | DISQUALIFICATION | BYE
    // Null until the match is COMPLETED.
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(name = "win_method")
    private MatchResultType winMethod;

    // =====================================================
    // MATCH STATUS
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(
        name = "status",
        nullable = false
    )
    private MatchStatus status = MatchStatus.SCHEDULED;

    // =====================================================
    // RESULT APPROVAL
    // Populated when a submitted result is approved/rejected
    // by an EVENT_HEAD/ORGANISER(owner)/ADMIN/SUPER_ADMIN.
    // =====================================================

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // =====================================================
    // TIMINGS
    // =====================================================

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    // =====================================================
    // ADMIN / AUDIT
    // =====================================================

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(
        name = "created_at",
        nullable = false
    )
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =====================================================
    // SOFT DELETE
    // =====================================================

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // =====================================================
    // OPTIMISTIC LOCKING
    // approveMatchResult() etc. are read-check-write on status; without
    // this, two concurrent approvals of the same match can both pass the
    // status guard before either commits, double-awarding ranking points.
    // =====================================================

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    // =====================================================
    // LIFECYCLE
    // =====================================================

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // TRANSIENT STATE (NOT PERSISTED)
    // =====================================================

    @Transient
    private boolean ghostResolved = false;

    public boolean isGhostResolved() {
        return ghostResolved;
    }

    public void setGhostResolved(boolean ghostResolved) {
        this.ghostResolved = ghostResolved;
    }

    // =====================================================
    // CONVENIENCE HELPERS
    // =====================================================

    /** Returns true when this match determines a leaderboard position. */
    public boolean isLeaderboardMatch() {
        return leaderboardPosition != null;
    }

    /** Returns true when this is the 3rd-place match. */
    public boolean isThirdPlaceMatch() {
        return Integer.valueOf(3).equals(leaderboardPosition);
    }

    /** Returns true when this is the grand final. */
    public boolean isGrandFinal() {
        return Integer.valueOf(1).equals(leaderboardPosition);
    }

    /** Returns true when this is a losers-bracket match (Double Elimination only). */
    public boolean isLosersBracket() {
        return BracketSide.LOSERS.equals(bracketSide);
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public String getWeightClassSnapshot() {
        return weightClassSnapshot;
    }

    public void setWeightClassSnapshot(String weightClassSnapshot) {
        this.weightClassSnapshot = weightClassSnapshot;
    }

    public String getAgeGroupSnapshot() {
        return ageGroupSnapshot;
    }

    public void setAgeGroupSnapshot(String ageGroupSnapshot) {
        this.ageGroupSnapshot = ageGroupSnapshot;
    }

    public Long getVersion() {
        return version;
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

    public UUID getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(UUID approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}