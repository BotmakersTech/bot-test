package com.botleague.backend.matches.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import com.botleague.backend.common.exception.ApiException;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import com.botleague.backend.admin.repository.UserEventAssignmentRepository;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.team.repository.TeamRepository;
import com.botleague.backend.matches.dto.CreateMatchRequestDTO;
import com.botleague.backend.matches.dto.GenerateBracketRequestDTO;
import com.botleague.backend.matches.dto.MatchResponseDTO;
import com.botleague.backend.matches.dto.SubmitMatchResultDTO;
import com.botleague.backend.matches.dto.UpdateMatchRequestDTO;
import com.botleague.backend.matches.dto.UpdateMatchScoreDTO;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.MatchFormat;
import com.botleague.backend.matches.enums.MatchStatus;
import com.botleague.backend.matches.enums.MatchType;
import com.botleague.backend.matches.enums.TournamentFormat;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.matches.tournament.SingleEliminationBracketGenerator;
import com.botleague.backend.realtime.enums.RealtimeEventType;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.role.service.UserRoleService;
import com.botleague.backend.common.exception.ResourceNotFoundException;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import com.botleague.backend.common.exception.ResourceNotFoundException;

@Service
public class MatchService {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final MatchRepository matchRepository;
    private final EventSportsRepository eventSportsRepository;
    private final SportRegistrationRepository eventRegistrationRepository;
    private final TeamRepository teamRepository;
    private final UserRoleService userRoleService;
    private final SingleEliminationBracketGenerator singleEliminationBracketGenerator;
    private final RealtimePublisher realtimePublisher;
    private final UserEventAssignmentRepository eventAssignmentRepository;
    private TournamentNotificationService tournamentNotificationService;
    private com.botleague.backend.ranking.service.RankingEngineService rankingEngineService;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public MatchService(
            MatchRepository matchRepository,
            EventSportsRepository eventSportsRepository,
            SportRegistrationRepository eventRegistrationRepository,
            TeamRepository teamRepository,
            UserRoleService userRoleService,
            SingleEliminationBracketGenerator singleEliminationBracketGenerator,
            RealtimePublisher realtimePublisher,
            UserEventAssignmentRepository eventAssignmentRepository
    ) {
        this.matchRepository = matchRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.teamRepository = teamRepository;
        this.userRoleService = userRoleService;
        this.singleEliminationBracketGenerator = singleEliminationBracketGenerator;
        this.realtimePublisher = realtimePublisher;
        this.eventAssignmentRepository = eventAssignmentRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setTournamentNotificationService(TournamentNotificationService tournamentNotificationService) {
        this.tournamentNotificationService = tournamentNotificationService;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setRankingEngineService(
            com.botleague.backend.ranking.service.RankingEngineService rankingEngineService) {
        this.rankingEngineService = rankingEngineService;
    }

    // =====================================================
    // CREATE MATCH (MANUAL SINGLE)
    // POST /v1/matches
    // =====================================================

    @Transactional
    public MatchResponseDTO createMatch(
            Authentication authentication,
            CreateMatchRequestDTO request
    ) {
        validateAdminOrOrganizerForSport(authentication, request.getEventSportId());

        Match match = buildMatchFromCreateRequest(request, extractUserId(authentication));
        Match savedMatch = matchRepository.save(match);

        return mapToResponseDTO(savedMatch);
    }

    // =====================================================
    // GENERATE BRACKET (AUTO)
    // POST /v1/matches/generate
    //
    // Accepts a single GenerateBracketRequestDTO (not a list).
    //
    // Fields consumed:
    //   eventSportId        — required
    //   tournamentFormat    — required; default SINGLE_ELIMINATION
    //   matchType           — required; default ONE_VS_ONE
    //   format              — optional MatchFormat (BO1/BO3/BO5 …)
    //   teamRegistrationIds — required, min 1 entry
    // =====================================================

    @Transactional
    public List<MatchResponseDTO> generateBracket(
            Authentication authentication,
            GenerateBracketRequestDTO request
    ) {
        if (request.getEventSportId() == null) {
            throw ApiException.badRequest("eventSportId is required");
        }

        validateAdminOrOrganizerForSport(authentication, request.getEventSportId());

        EventSports eventSports = eventSportsRepository
                .findById(request.getEventSportId())
                .orElseThrow(() -> new ResourceNotFoundException("Event sport not found"));

        if (eventSports.getStatus() != SportEventStatus.REGISTRATION_CLOSED) {
            throw ApiException.conflict(
                    "Bracket can only be generated once registration is closed. Current status: "
                            + eventSports.getStatus());
        }

        List<Match> existingMatches =
                matchRepository.findByEventSportIdAndDeletedAtIsNull(
                        request.getEventSportId()
                );

        if (!existingMatches.isEmpty()) {
            throw ApiException.conflict("Bracket already exists for this event sport");
        }

        if (request.getTeamRegistrationIds() == null
                || request.getTeamRegistrationIds().isEmpty()) {
            throw ApiException.badRequest("At least one team registration ID is required");
        }

        // tournamentFormat has a default of SINGLE_ELIMINATION in the DTO
        TournamentFormat tournamentFormat = request.getTournamentFormat();
        if (tournamentFormat == null) {
            throw ApiException.badRequest("tournamentFormat is required");
        }

        switch (tournamentFormat) {
            case SINGLE_ELIMINATION:
                return generateSingleElimination(request);

            case DOUBLE_ELIMINATION:
                // No DoubleEliminationBracketGenerator exists yet, so the losers-bracket
                // routing (loserNextMatchId / loserNextMatchSlot) cannot be wired
                // automatically. Silently falling back to a single-elimination bracket
                // here would mislabel the tournament and eliminate teams with no
                // second-chance bracket — refuse instead of generating something
                // that doesn't match what was requested.
                throw ApiException.badRequest(
                        "Double-elimination bracket generation is not yet implemented. "
                        + "Use SINGLE_ELIMINATION, or build the double-elimination bracket "
                        + "manually via POST /v1/matches/bulk.");

            default:
                throw ApiException.badRequest(
                        "Tournament format not supported: " + tournamentFormat
                );
        }
    }

    // =====================================================
    // PRIVATE — SINGLE ELIMINATION DISPATCHER
    //
    // All three MatchTypes (ONE_VS_ONE, TRIPLE_THREAT, FATAL_FOUR)
    // delegate to SingleEliminationBracketGenerator.
    //
    // The optional MatchFormat from GenerateBracketRequestDTO is
    // stamped onto every generated match here, because the generator
    // itself only receives the request and does not set format.
    // =====================================================

    private List<MatchResponseDTO> generateSingleElimination(
            GenerateBracketRequestDTO request
    ) {
        MatchType matchType = request.getMatchType() != null
                ? request.getMatchType()
                : MatchType.ONE_VS_ONE;

        switch (matchType) {
            case ONE_VS_ONE:
            case TRIPLE_THREAT:
            case FATAL_FOUR: {
                List<Match> matches = singleEliminationBracketGenerator.generate(request);

                // Stamp MatchFormat (BO1/BO3/BO5 etc.) if caller supplied it
                MatchFormat matchFormat = request.getFormat();
                if (matchFormat != null) {
                    for (Match m : matches) {
                        m.setFormat(matchFormat);
                    }
                }

                matchRepository.saveAll(matches);

                UUID sportId = request.getEventSportId();
                if (sportId != null) {
                    eventSportsRepository.findById(sportId).ifPresent(sport -> {
                        sport.setBracketGenerated(true);
                        eventSportsRepository.save(sport);
                    });
                }

                // Push each match individually so spectators can add them directly to Redux
                // without needing a separate REST fetch.
                List<MatchResponseDTO> created = fetchOrderedResponse(request.getEventSportId());
                for (MatchResponseDTO dto : created) {
                    realtimePublisher.pushMatchUpdate(
                            dto.getMatchId(), request.getEventSportId(),
                            RealtimeEventType.MATCH_CREATED, dto);
                }
                realtimePublisher.pushBracketCreated(request.getEventSportId());
                if (tournamentNotificationService != null) {
                    tournamentNotificationService.onBracketCreated(request.getEventSportId(), "Tournament");
                }
                return created;
            }
            default:
                throw ApiException.badRequest("Match type not supported: " + matchType);
        }
    }

    // =====================================================
    // CREATE TOURNAMENT BRACKET (MANUAL BULK)
    // POST /v1/matches/bulk  (or similar admin endpoint)
    //
    // Accepts a List<CreateMatchRequestDTO> — each match fully
    // specified by the caller (no auto-seeding / bracket logic).
    // =====================================================

    @Transactional
    public List<MatchResponseDTO> createTournamentBracket(
            Authentication authentication,
            List<CreateMatchRequestDTO> requests
    ) {
        if (requests == null || requests.isEmpty()) {
            throw ApiException.badRequest("No matches provided");
        }

        UUID eventSportId = requests.get(0).getEventSportId();

        validateAdminOrOrganizerForSport(authentication, eventSportId);

        EventSports eventSports = eventSportsRepository
                .findById(eventSportId)
                .orElseThrow(() -> new ResourceNotFoundException("Event sport not found"));

        if (eventSports.getStatus() != SportEventStatus.REGISTRATION_CLOSED) {
            throw ApiException.conflict(
                    "Bracket can only be generated once registration is closed. Current status: "
                            + eventSports.getStatus());
        }

        List<Match> existingMatches =
                matchRepository.findByEventSportIdAndDeletedAtIsNull(eventSportId);

        if (!existingMatches.isEmpty()) {
            throw ApiException.conflict("Bracket already exists for this event sport");
        }

        UUID currentUserId = extractUserId(authentication);

        List<Match> matches = new ArrayList<>();
        for (CreateMatchRequestDTO request : requests) {
            matches.add(buildMatchFromCreateRequest(request, currentUserId));
        }

        List<Match> savedMatches = matchRepository.saveAll(matches);

        // Auto-advance any explicitly-flagged bye matches
        for (Match match : savedMatches) {
            if (Boolean.TRUE.equals(match.getIsBye())) {
                autoAdvanceBye(match);
            }
        }

        List<MatchResponseDTO> response = new ArrayList<>();
        for (Match match : savedMatches) {
            response.add(mapToResponseDTO(match));
        }
        // Push each match individually before the BRACKET_CREATED signal
        for (MatchResponseDTO dto : response) {
            realtimePublisher.pushMatchUpdate(
                    dto.getMatchId(), eventSportId,
                    RealtimeEventType.MATCH_CREATED, dto);
        }
        realtimePublisher.pushBracketCreated(eventSportId);
        if (tournamentNotificationService != null) {
            tournamentNotificationService.onBracketCreated(eventSportId, "Tournament");
        }
        return response;
    }

    // =====================================================
    // GET MATCH BY ID
    // GET /v1/matches/:matchId
    // =====================================================

    public MatchResponseDTO getMatchById(UUID matchId) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));
        return mapToResponseDTO(match);
    }

    // =====================================================
    // GET MATCHES BY EVENT SPORT
    // GET /v1/matches/event-sport/:eventSportId
    // =====================================================

    public List<MatchResponseDTO> getMatchesByEventSport(UUID eventSportId) {
        List<Match> matches =
                matchRepository
                        .findByEventSportIdAndDeletedAtIsNullOrderByRoundNumberAscMatchNumberAsc(
                                eventSportId
                        );
        return toResponseList(matches);
    }

    // =====================================================
    // GET MATCHES BY ROUND
    // GET /v1/matches/event-sport/:eventSportId/round/:roundNumber
    // =====================================================

    public List<MatchResponseDTO> getMatchesByRound(
            UUID eventSportId,
            Integer roundNumber
    ) {
        List<Match> matches =
                matchRepository.findByEventSportIdAndRoundNumberAndDeletedAtIsNull(
                        eventSportId, roundNumber
                );
        return toResponseList(matches);
    }

    // =====================================================
    // GET MATCHES BY TEAM
    // GET /v1/matches/team/:registrationId
    // Covers all 4 registration slots: A, B, C, D
    // =====================================================

    public List<MatchResponseDTO> getMatchesByTeam(UUID registrationId) {
        List<Match> matches =
                matchRepository
                        .findByTeamARegistrationIdOrTeamBRegistrationIdOrTeamCRegistrationIdOrTeamDRegistrationIdAndDeletedAtIsNull(
                                registrationId,
                                registrationId,
                                registrationId,
                                registrationId
                        );
        return toResponseList(matches);
    }

    // =====================================================
    // GET ALL MATCHES
    // =====================================================

    public List<MatchResponseDTO> getAllMatches() {
        return toResponseList(matchRepository.findAll());
    }

    // =====================================================
    // UPDATE MATCH (FULL)
    // PUT /v1/matches/:matchId
    //
    // All UpdateMatchRequestDTO fields are optional.
    // Only non-null values are applied (patch semantics).
    // =====================================================

    @Transactional
    public MatchResponseDTO updateMatch(
            UUID matchId,
            UpdateMatchRequestDTO request,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateAdminOrOrganizerForSport(authentication, match.getEventSportId());

        if (request.getTournamentFormat()    != null) match.setTournamentFormat(request.getTournamentFormat());
        if (request.getMatchType()           != null) match.setMatchType(request.getMatchType());
        if (request.getFormat()              != null) match.setFormat(request.getFormat());
        if (request.getRoundNumber()         != null) match.setRoundNumber(request.getRoundNumber());
        if (request.getMatchNumber()         != null) match.setMatchNumber(request.getMatchNumber());
        if (request.getBracketPosition()     != null) match.setBracketPosition(request.getBracketPosition());
        if (request.getBracketSide()         != null) match.setBracketSide(request.getBracketSide());
        if (request.getTeamARegistrationId() != null) match.setTeamARegistrationId(request.getTeamARegistrationId());
        if (request.getTeamBRegistrationId() != null) match.setTeamBRegistrationId(request.getTeamBRegistrationId());
        if (request.getTeamCRegistrationId() != null) match.setTeamCRegistrationId(request.getTeamCRegistrationId());
        if (request.getTeamDRegistrationId() != null) match.setTeamDRegistrationId(request.getTeamDRegistrationId());
        if (request.getSourceMatchAId()      != null) match.setSourceMatchAId(request.getSourceMatchAId());
        if (request.getSourceMatchBId()      != null) match.setSourceMatchBId(request.getSourceMatchBId());
        if (request.getSourceMatchCId()      != null) match.setSourceMatchCId(request.getSourceMatchCId());
        if (request.getSourceMatchDId()      != null) match.setSourceMatchDId(request.getSourceMatchDId());
        if (request.getNextMatchId()         != null) match.setNextMatchId(request.getNextMatchId());
        if (request.getNextMatchSlot()       != null) match.setNextMatchSlot(request.getNextMatchSlot());
        if (request.getLoserNextMatchId()    != null) match.setLoserNextMatchId(request.getLoserNextMatchId());
        if (request.getLoserNextMatchSlot()  != null) match.setLoserNextMatchSlot(request.getLoserNextMatchSlot());
        if (request.getLeaderboardPosition() != null) match.setLeaderboardPosition(request.getLeaderboardPosition());
        if (request.getIsBracketReset()      != null) match.setIsBracketReset(request.getIsBracketReset());
        if (request.getIsBye()               != null) match.setIsBye(request.getIsBye());
        if (request.getAutoAdvanced()        != null) match.setAutoAdvanced(request.getAutoAdvanced());
        if (request.getScheduledAt()         != null) match.setScheduledAt(request.getScheduledAt());

        return mapToResponseDTO(matchRepository.save(match));
    }

    // =====================================================
    // UPDATE MATCH TEAMS ONLY
    // PATCH /v1/matches/:matchId/teams
    // =====================================================

    @Transactional
    public MatchResponseDTO updateMatchTeams(
            UUID matchId,
            UpdateMatchRequestDTO request,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateAdminOrOrganizerForSport(authentication, match.getEventSportId());

        if (request.getTeamARegistrationId() != null) match.setTeamARegistrationId(request.getTeamARegistrationId());
        if (request.getTeamBRegistrationId() != null) match.setTeamBRegistrationId(request.getTeamBRegistrationId());
        if (request.getTeamCRegistrationId() != null) match.setTeamCRegistrationId(request.getTeamCRegistrationId());
        if (request.getTeamDRegistrationId() != null) match.setTeamDRegistrationId(request.getTeamDRegistrationId());

        return mapToResponseDTO(matchRepository.save(match));
    }

    // =====================================================
    // SCHEDULE MATCH
    // PATCH /v1/matches/:matchId/schedule
    // =====================================================

    @Transactional
    public MatchResponseDTO scheduleMatch(
            UUID matchId,
            UpdateMatchRequestDTO request,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateAdminOrOrganizerForSport(authentication, match.getEventSportId());

        if (request.getScheduledAt() == null) {
            throw ApiException.badRequest("scheduledAt is required");
        }

        match.setScheduledAt(request.getScheduledAt());

        Match saved = matchRepository.save(match);
        MatchResponseDTO dto = mapToResponseDTO(saved);
        realtimePublisher.pushMatchUpdate(saved.getId(), saved.getEventSportId(),
                RealtimeEventType.MATCH_SCHEDULED, dto);
        return dto;
    }

    // =====================================================
    // START MATCH
    // PATCH /v1/matches/:matchId/start
    // =====================================================

    @Transactional
    public MatchResponseDTO startMatch(
            UUID matchId,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateAdminOrOrganizerForSport(authentication, match.getEventSportId());

        if (match.getStatus() != MatchStatus.SCHEDULED) {
            throw ApiException.conflict(
                    "Only SCHEDULED matches can be started; current status: "
                            + match.getStatus()
            );
        }

        match.setStatus(MatchStatus.LIVE);
        match.setStartedAt(LocalDateTime.now());

        Match savedStarted = matchRepository.save(match);
        MatchResponseDTO started = mapToResponseDTO(savedStarted);
        realtimePublisher.pushMatchUpdate(match.getId(), match.getEventSportId(),
                RealtimeEventType.MATCH_STARTED, started);
        if (tournamentNotificationService != null) {
            tournamentNotificationService.onMatchStarted(savedStarted);
        }
        return started;
    }

    // =====================================================
    // UPDATE SCORE (LIVE)
    // PATCH /v1/matches/:matchId/score
    //
    // UpdateMatchScoreDTO fields:
    //   teamAScore — ONE_VS_ONE, TRIPLE_THREAT, FATAL_FOUR
    //   teamBScore — ONE_VS_ONE, TRIPLE_THREAT, FATAL_FOUR
    //   teamCScore — TRIPLE_THREAT, FATAL_FOUR only
    //   teamDScore — FATAL_FOUR only
    //
    // Callers omit the fields that don't apply to their match type.
    // =====================================================

    @Transactional
    public MatchResponseDTO updateMatchScore(
            UUID matchId,
            UpdateMatchScoreDTO request,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateCanScoreMatchForSport(authentication, match.getEventSportId());

        if (match.getStatus() != MatchStatus.LIVE) {
            throw ApiException.conflict(
                    "Score can only be updated on LIVE matches; current status: "
                            + match.getStatus()
            );
        }

        if (request.getTeamAScore() != null) match.setTeamAScore(request.getTeamAScore());
        if (request.getTeamBScore() != null) match.setTeamBScore(request.getTeamBScore());
        if (request.getTeamCScore() != null) match.setTeamCScore(request.getTeamCScore());
        if (request.getTeamDScore() != null) match.setTeamDScore(request.getTeamDScore());

        MatchResponseDTO scored = mapToResponseDTO(matchRepository.save(match));
        realtimePublisher.pushMatchUpdate(match.getId(), match.getEventSportId(),
                RealtimeEventType.MATCH_SCORE_UPDATED, scored);
        return scored;
    }

    // =====================================================
    // SUBMIT MATCH RESULT
    // POST (or PATCH) /v1/matches/:matchId/result
    //
    // SubmitMatchResultDTO fields:
    //   teamAScore / teamBScore / teamCScore / teamDScore
    //   positionFirstRegistrationId   — who placed 1st
    //   positionSecondRegistrationId  — who placed 2nd
    //   positionThirdRegistrationId   — who placed 3rd (TRIPLE_THREAT / FATAL_FOUR)
    //   positionFourthRegistrationId  — who placed 4th (FATAL_FOUR)
    //   winnerRegistrationId          — optional explicit override
    //   endedAt                       — optional; defaults to now()
    //
    // Flow:
    //   1. Validate LIVE
    //   2. Apply scores
    //   3. Apply finish positions
    //   4. Resolve winner (explicit > positionFirst > highest score)
    //   5. Mark COMPLETED + set endedAt
    //   6. Advance winner → nextMatch
    //   7. Advance runner-up → 3rd-place match (single elim, if exists)
    //   8. Advance loser → losers bracket (DOUBLE_ELIMINATION only)
    // =====================================================

    @Transactional
    public MatchResponseDTO submitMatchResult(
            UUID matchId,
            SubmitMatchResultDTO request,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateCanScoreMatchForSport(authentication, match.getEventSportId());

        if (match.getStatus() != MatchStatus.LIVE) {
            throw ApiException.conflict(
                    "Only LIVE matches can be completed; current status: "
                            + match.getStatus()
            );
        }

        // ── 1. Apply scores ────────────────────────────────────────
        if (request.getTeamAScore() != null) match.setTeamAScore(request.getTeamAScore());
        if (request.getTeamBScore() != null) match.setTeamBScore(request.getTeamBScore());
        if (request.getTeamCScore() != null) match.setTeamCScore(request.getTeamCScore());
        if (request.getTeamDScore() != null) match.setTeamDScore(request.getTeamDScore());

        // ── 2. Apply finish positions ──────────────────────────────
        if (request.getPositionFirstRegistrationId()  != null)
            match.setPositionFirstRegistrationId(request.getPositionFirstRegistrationId());
        if (request.getPositionSecondRegistrationId() != null)
            match.setPositionSecondRegistrationId(request.getPositionSecondRegistrationId());
        if (request.getPositionThirdRegistrationId()  != null)
            match.setPositionThirdRegistrationId(request.getPositionThirdRegistrationId());
        if (request.getPositionFourthRegistrationId() != null)
            match.setPositionFourthRegistrationId(request.getPositionFourthRegistrationId());

        // ── 3. Resolve winner ──────────────────────────────────────
        UUID winnerId = request.getWinnerRegistrationId();
        if (winnerId == null) {
            winnerId = inferWinner(match);
        }
        if (winnerId == null) {
            throw ApiException.badRequest(
                    "Cannot complete match: winner cannot be inferred from a tied score. "
                    + "Submit an explicit winnerRegistrationId to resolve the tie.");
        }
        match.setWinnerRegistrationId(winnerId);

        // ── 4. Record win method + mark completed ──────────────────
        if (request.getWinMethod() != null) match.setWinMethod(request.getWinMethod());
        match.setStatus(MatchStatus.COMPLETED);
        match.setEndedAt(
                request.getEndedAt() != null ? request.getEndedAt() : LocalDateTime.now()
        );

        Match savedMatch = matchRepository.save(match);

        // ── Award ranking points immediately after result ───────────
        if (rankingEngineService != null) {
            try {
                rankingEngineService.awardMatchPoints(savedMatch);
                autoFinalizeIfLastMatch(savedMatch.getEventSportId());
            }
            catch (Exception ignored) { /* ranking failure must never roll back match result */ }
        }

        // ── 5. Advance winner ──────────────────────────────────────
        Match nextMatch = advanceWinner(savedMatch);

        // ── 6. Advance runner-up to 3rd-place match ────────────────
        Match thirdPlaceMatch = advanceRunnerUpToThirdPlace(savedMatch);

        // ── 7. Advance loser to losers bracket ─────────────────────
        Match loserMatch = TournamentFormat.DOUBLE_ELIMINATION.equals(savedMatch.getTournamentFormat())
                ? advanceLoser(savedMatch) : null;

        MatchResponseDTO result = mapToResponseDTO(savedMatch);
        realtimePublisher.pushMatchUpdate(savedMatch.getId(), savedMatch.getEventSportId(),
                RealtimeEventType.MATCH_RESULT_SUBMITTED, result);

        // Push the matches that received a new participant so spectators see bracket fill in realtime
        if (nextMatch != null)
            realtimePublisher.pushMatchUpdate(nextMatch.getId(), nextMatch.getEventSportId(),
                    RealtimeEventType.MATCH_UPDATED, mapToResponseDTO(nextMatch));
        if (thirdPlaceMatch != null)
            realtimePublisher.pushMatchUpdate(thirdPlaceMatch.getId(), thirdPlaceMatch.getEventSportId(),
                    RealtimeEventType.MATCH_UPDATED, mapToResponseDTO(thirdPlaceMatch));
        if (loserMatch != null)
            realtimePublisher.pushMatchUpdate(loserMatch.getId(), loserMatch.getEventSportId(),
                    RealtimeEventType.MATCH_UPDATED, mapToResponseDTO(loserMatch));

        realtimePublisher.pushRankingsUpdated(savedMatch.getEventSportId());

        if (tournamentNotificationService != null) {
            if (savedMatch.getNextMatchId() == null) {
                tournamentNotificationService.onTournamentWinner(savedMatch, savedMatch.getEventSportId());
            } else {
                tournamentNotificationService.onMatchCompleted(savedMatch);
                if (nextMatch != null) {
                    int totalRounds = matchRepository
                            .findByEventSportIdAndDeletedAtIsNull(savedMatch.getEventSportId())
                            .stream()
                            .mapToInt(m -> m.getRoundNumber() != null ? m.getRoundNumber() : 0)
                            .max().orElse(0);
                    tournamentNotificationService.onWinnerAdvanced(savedMatch, nextMatch,
                            savedMatch.getEventSportId(), totalRounds);
                }
            }
        }

        return result;
    }

    // =====================================================
    // COMPLETE MATCH (SCORE-BASED SHORTCUT)
    // PATCH /v1/matches/:matchId/complete
    //
    // No body required. Winner inferred from current scores.
    // Throws if scores are equal — use submitMatchResult with
    // an explicit winnerRegistrationId for tied/manual cases.
    // =====================================================

    @Transactional
    public MatchResponseDTO completeMatch(
            UUID matchId,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateCanScoreMatchForSport(authentication, match.getEventSportId());

        if (match.getStatus() != MatchStatus.LIVE) {
            throw ApiException.conflict(
                    "Only LIVE matches can be completed; current status: "
                            + match.getStatus()
            );
        }

        UUID winnerId = inferWinner(match);
        if (winnerId == null) {
            throw ApiException.badRequest(
                    "Cannot auto-complete: winner cannot be inferred from current scores. "
                    + "Use submitMatchResult with an explicit winnerRegistrationId."
            );
        }

        match.setWinnerRegistrationId(winnerId);
        match.setStatus(MatchStatus.COMPLETED);
        match.setEndedAt(LocalDateTime.now());

        Match savedMatch = matchRepository.save(match);

        // ── Award ranking points ────────────────────────────────────
        if (rankingEngineService != null) {
            try {
                rankingEngineService.awardMatchPoints(savedMatch);
                autoFinalizeIfLastMatch(savedMatch.getEventSportId());
            }
            catch (Exception ignored) {}
        }

        Match nextMatch2       = advanceWinner(savedMatch);
        Match thirdPlaceMatch2 = advanceRunnerUpToThirdPlace(savedMatch);
        Match loserMatch2      = TournamentFormat.DOUBLE_ELIMINATION.equals(savedMatch.getTournamentFormat())
                ? advanceLoser(savedMatch) : null;

        MatchResponseDTO completed = mapToResponseDTO(savedMatch);
        realtimePublisher.pushMatchUpdate(savedMatch.getId(), savedMatch.getEventSportId(),
                RealtimeEventType.MATCH_COMPLETED, completed);

        if (nextMatch2 != null)
            realtimePublisher.pushMatchUpdate(nextMatch2.getId(), nextMatch2.getEventSportId(),
                    RealtimeEventType.MATCH_UPDATED, mapToResponseDTO(nextMatch2));
        if (thirdPlaceMatch2 != null)
            realtimePublisher.pushMatchUpdate(thirdPlaceMatch2.getId(), thirdPlaceMatch2.getEventSportId(),
                    RealtimeEventType.MATCH_UPDATED, mapToResponseDTO(thirdPlaceMatch2));
        if (loserMatch2 != null)
            realtimePublisher.pushMatchUpdate(loserMatch2.getId(), loserMatch2.getEventSportId(),
                    RealtimeEventType.MATCH_UPDATED, mapToResponseDTO(loserMatch2));

        realtimePublisher.pushRankingsUpdated(savedMatch.getEventSportId());

        if (tournamentNotificationService != null) {
            if (savedMatch.getNextMatchId() == null) {
                tournamentNotificationService.onTournamentWinner(savedMatch, savedMatch.getEventSportId());
            } else {
                tournamentNotificationService.onMatchCompleted(savedMatch);
                if (nextMatch2 != null) {
                    int totalRounds2 = matchRepository
                            .findByEventSportIdAndDeletedAtIsNull(savedMatch.getEventSportId())
                            .stream()
                            .mapToInt(m -> m.getRoundNumber() != null ? m.getRoundNumber() : 0)
                            .max().orElse(0);
                    tournamentNotificationService.onWinnerAdvanced(savedMatch, nextMatch2,
                            savedMatch.getEventSportId(), totalRounds2);
                }
            }
        }

        return completed;
    }

    // =====================================================
    // CANCEL MATCH
    // PATCH /v1/matches/:matchId/cancel
    // =====================================================

    @Transactional
    public MatchResponseDTO cancelMatch(
            UUID matchId,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateAdminOrOrganizerForSport(authentication, match.getEventSportId());

        if (match.getStatus() == MatchStatus.COMPLETED) {
            throw ApiException.conflict("Completed matches cannot be cancelled");
        }

        if (match.getStatus() == MatchStatus.CANCELLED) {
            throw ApiException.conflict("Match is already cancelled");
        }

        match.setStatus(MatchStatus.CANCELLED);

        return mapToResponseDTO(matchRepository.save(match));
    }

    // =====================================================
    // DELETE MATCH (SOFT)
    // DELETE /v1/matches/:matchId
    // =====================================================

    @Transactional
    public void deleteMatch(
            UUID matchId,
            Authentication authentication
    ) {
        Match match = matchRepository
                .findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        validateAdminOrOrganizerForSport(authentication, match.getEventSportId());

        match.setDeletedAt(LocalDateTime.now());
        matchRepository.save(match);
    }

    // =====================================================
    // PRIVATE — BUILD Match FROM CreateMatchRequestDTO
    //
    // Single source of truth for the field-mapping used by
    // both createMatch() and createTournamentBracket().
    // =====================================================

    private Match buildMatchFromCreateRequest(
            CreateMatchRequestDTO request,
            UUID createdBy
    ) {
        Match match = new Match();

        match.setEventSportId(request.getEventSportId());
        match.setTournamentFormat(request.getTournamentFormat());
        match.setMatchType(
                request.getMatchType() != null
                        ? request.getMatchType()
                        : MatchType.ONE_VS_ONE
        );
        match.setFormat(request.getFormat());

        match.setRoundNumber(request.getRoundNumber());
        match.setMatchNumber(request.getMatchNumber());
        match.setBracketPosition(request.getBracketPosition());
        match.setBracketSide(request.getBracketSide());

        match.setTeamARegistrationId(request.getTeamARegistrationId());
        match.setTeamBRegistrationId(request.getTeamBRegistrationId());
        match.setTeamCRegistrationId(request.getTeamCRegistrationId());
        match.setTeamDRegistrationId(request.getTeamDRegistrationId());

        match.setSourceMatchAId(request.getSourceMatchAId());
        match.setSourceMatchBId(request.getSourceMatchBId());
        match.setSourceMatchCId(request.getSourceMatchCId());
        match.setSourceMatchDId(request.getSourceMatchDId());

        match.setNextMatchId(request.getNextMatchId());
        match.setNextMatchSlot(request.getNextMatchSlot());

        match.setLoserNextMatchId(request.getLoserNextMatchId());
        match.setLoserNextMatchSlot(request.getLoserNextMatchSlot());

        match.setLeaderboardPosition(request.getLeaderboardPosition());
        match.setIsBracketReset(Boolean.TRUE.equals(request.getIsBracketReset()));
        match.setIsBye(Boolean.TRUE.equals(request.getIsBye()));
        match.setAutoAdvanced(Boolean.TRUE.equals(request.getAutoAdvanced()));

        match.setTeamAScore(0);
        match.setTeamBScore(0);
        match.setTeamCScore(0);
        match.setTeamDScore(0);

        match.setStatus(MatchStatus.SCHEDULED);
        match.setScheduledAt(request.getScheduledAt());

        match.setCreatedBy(createdBy);

        return match;
    }

    // =====================================================
    // PRIVATE — INFER WINNER FROM SCORES / POSITIONS
    //
    //   ONE_VS_ONE:
    //     → higher score; null if tied
    //
    //   TRIPLE_THREAT / FATAL_FOUR:
    //     → positionFirstRegistrationId if already set
    //     → else highest-scoring team
    //     → null if scores are all equal (manual resolution needed)
    // =====================================================

    private UUID inferWinner(Match match) {

        MatchType matchType = match.getMatchType() != null
                ? match.getMatchType()
                : MatchType.ONE_VS_ONE;

        switch (matchType) {

            case ONE_VS_ONE: {
                int a = orZero(match.getTeamAScore());
                int b = orZero(match.getTeamBScore());
                if (a > b) return match.getTeamARegistrationId();
                if (b > a) return match.getTeamBRegistrationId();
                return null;
            }

            case TRIPLE_THREAT:
            case FATAL_FOUR: {
                if (match.getPositionFirstRegistrationId() != null) {
                    return match.getPositionFirstRegistrationId();
                }
                return highestScoringTeam(match, matchType);
            }

            default:
                return null;
        }
    }

    // =====================================================
    // PRIVATE — HIGHEST SCORING TEAM
    // =====================================================

    private UUID highestScoringTeam(Match match, MatchType matchType) {

        UUID winner = null;
        int best = -1;

        int a = orZero(match.getTeamAScore());
        int b = orZero(match.getTeamBScore());

        if (a > best) { best = a; winner = match.getTeamARegistrationId(); }
        if (b > best) { best = b; winner = match.getTeamBRegistrationId(); }

        if (matchType == MatchType.TRIPLE_THREAT || matchType == MatchType.FATAL_FOUR) {
            int c = orZero(match.getTeamCScore());
            if (c > best) { best = c; winner = match.getTeamCRegistrationId(); }
        }

        if (matchType == MatchType.FATAL_FOUR) {
            int d = orZero(match.getTeamDScore());
            if (d > best) { winner = match.getTeamDRegistrationId(); }
        }

        return winner;
    }

    // =====================================================
    // PRIVATE — ADVANCE WINNER TO NEXT MATCH
    // =====================================================

    private Match advanceWinner(Match completedMatch) {

        if (completedMatch.getWinnerRegistrationId() == null) return null;
        if (completedMatch.getNextMatchId() == null) return null;

        Match nextMatch = matchRepository
                .findById(completedMatch.getNextMatchId())
                .orElseThrow(() -> new RuntimeException(
                        "Next match not found: " + completedMatch.getNextMatchId()
                ));

        assignToSlot(
                nextMatch,
                completedMatch.getNextMatchSlot(),
                completedMatch.getWinnerRegistrationId()
        );

        return matchRepository.save(nextMatch);
    }

    // =====================================================
    // PRIVATE — ADVANCE RUNNER-UP TO 3RD-PLACE MATCH
    //
    // Finds a match with leaderboardPosition = 3 in the same
    // event sport whose sourceMatchAId or sourceMatchBId equals
    // the completed match's ID. Fills that slot with the runner-up.
    //
    // Runner-up resolution:
    //   ONE_VS_ONE    → the non-winner team
    //   TRIPLE_THREAT → positionSecondRegistrationId
    //   FATAL_FOUR    → positionSecondRegistrationId
    //
    // No-ops silently when:
    //   • No 3rd-place match exists for this event sport
    //   • Runner-up cannot be resolved (positions not submitted yet)
    //   • This match is not a direct source of the 3rd-place match
    //
    // NOTE: MatchRepository must expose:
    //   List<Match> findByEventSportIdAndLeaderboardPositionAndDeletedAtIsNull(
    //       UUID eventSportId, Integer leaderboardPosition);
    // =====================================================

    private Match advanceRunnerUpToThirdPlace(Match completedMatch) {

        UUID runnerUpId = resolveRunnerUp(completedMatch);
        if (runnerUpId == null) return null;

        List<Match> thirdPlaceCandidates =
                matchRepository.findByEventSportIdAndLeaderboardPositionAndDeletedAtIsNull(
                        completedMatch.getEventSportId(), 3
                );

        if (thirdPlaceCandidates == null || thirdPlaceCandidates.isEmpty()) return null;

        Match thirdPlaceMatch = thirdPlaceCandidates.get(0);

        if (completedMatch.getId().equals(thirdPlaceMatch.getSourceMatchAId())) {
            thirdPlaceMatch.setTeamARegistrationId(runnerUpId);

        } else if (completedMatch.getId().equals(thirdPlaceMatch.getSourceMatchBId())) {
            thirdPlaceMatch.setTeamBRegistrationId(runnerUpId);

        } else {
            return null;
        }

        return matchRepository.save(thirdPlaceMatch);
    }

    // =====================================================
    // PRIVATE — RESOLVE RUNNER-UP (2ND PLACE) FROM A MATCH
    // =====================================================

    private UUID resolveRunnerUp(Match match) {

        if (match.getWinnerRegistrationId() == null) return null;

        MatchType matchType = match.getMatchType() != null
                ? match.getMatchType()
                : MatchType.ONE_VS_ONE;

        switch (matchType) {

            case ONE_VS_ONE: {
                UUID winner = match.getWinnerRegistrationId();
                return winner.equals(match.getTeamARegistrationId())
                        ? match.getTeamBRegistrationId()
                        : match.getTeamARegistrationId();
            }

            case TRIPLE_THREAT:
            case FATAL_FOUR:
                // positionSecond must be supplied via submitMatchResult;
                // completeMatch() cannot determine runner-up for these types
                return match.getPositionSecondRegistrationId();

            default:
                return null;
        }
    }

    // =====================================================
    // PRIVATE — ADVANCE LOSER (DOUBLE ELIMINATION ONLY)
    // =====================================================

    private Match advanceLoser(Match completedMatch) {

        if (completedMatch.getLoserNextMatchId() == null) return null;

        UUID loserId = resolveLoser(completedMatch);
        if (loserId == null) return null;

        Match loserNextMatch = matchRepository
                .findById(completedMatch.getLoserNextMatchId())
                .orElseThrow(() -> new RuntimeException(
                        "Loser next match not found: "
                                + completedMatch.getLoserNextMatchId()
                ));

        assignToSlot(
                loserNextMatch,
                completedMatch.getLoserNextMatchSlot(),
                loserId
        );

        return matchRepository.save(loserNextMatch);
    }

    // =====================================================
    // PRIVATE — RESOLVE LOSER
    //
    //   ONE_VS_ONE    → the non-winner
    //   TRIPLE_THREAT → positionThirdRegistrationId (last place)
    //   FATAL_FOUR    → positionFourthRegistrationId (last place)
    // =====================================================

    private UUID resolveLoser(Match match) {

        UUID winner = match.getWinnerRegistrationId();
        if (winner == null) return null;

        MatchType matchType = match.getMatchType() != null
                ? match.getMatchType()
                : MatchType.ONE_VS_ONE;

        switch (matchType) {

            case ONE_VS_ONE:
                return winner.equals(match.getTeamARegistrationId())
                        ? match.getTeamBRegistrationId()
                        : match.getTeamARegistrationId();

            case TRIPLE_THREAT:
                return match.getPositionThirdRegistrationId();

            case FATAL_FOUR:
                return match.getPositionFourthRegistrationId();

            default:
                return null;
        }
    }

    // =====================================================
    // PRIVATE — ASSIGN REGISTRATION ID TO A TEAM SLOT
    // Slot mapping: 1 = A  2 = B  3 = C  4 = D
    // =====================================================

    private void assignToSlot(Match match, Integer slot, UUID registrationId) {
        if (slot == null) return;
        switch (slot) {
            case 1 -> match.setTeamARegistrationId(registrationId);
            case 2 -> match.setTeamBRegistrationId(registrationId);
            case 3 -> match.setTeamCRegistrationId(registrationId);
            case 4 -> match.setTeamDRegistrationId(registrationId);
            default -> throw new RuntimeException("Invalid match slot: " + slot);
        }
    }

    // =====================================================
    // PRIVATE — AUTO ADVANCE BYE
    //
    // Auto-advances only when exactly ONE real team is present
    // across all four slots. A match with 2+ real teams that has
    // empty slots is a real competition — it must NOT auto-advance.
    // =====================================================

    /**
     * After every match completes, check whether ALL non-bye matches in the sport are
     * finished. If so, trigger the full ranking finalization so that global rankings
     * are populated without requiring an admin to manually hit /rankings/finalize.
     */
    private void autoFinalizeIfLastMatch(UUID eventSportId) {
        if (rankingEngineService == null) return;

        boolean anyPending = matchRepository
                .findByEventSportIdAndDeletedAtIsNull(eventSportId)
                .stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsBye()))      // ignore bye matches
                .anyMatch(m -> m.getStatus() != MatchStatus.COMPLETED
                            && m.getStatus() != MatchStatus.CANCELLED);

        if (!anyPending) {
            rankingEngineService.finalizeEventLeaderboard(eventSportId);
        }
    }

    private void autoAdvanceBye(Match match) {

        List<UUID> present = new ArrayList<>();
        if (match.getTeamARegistrationId() != null) present.add(match.getTeamARegistrationId());
        if (match.getTeamBRegistrationId() != null) present.add(match.getTeamBRegistrationId());
        if (match.getTeamCRegistrationId() != null) present.add(match.getTeamCRegistrationId());
        if (match.getTeamDRegistrationId() != null) present.add(match.getTeamDRegistrationId());

        if (present.size() != 1) return;

        UUID winner = present.get(0);

        match.setWinnerRegistrationId(winner);
        match.setPositionFirstRegistrationId(winner);
        match.setStatus(MatchStatus.COMPLETED);
        match.setAutoAdvanced(true);
        match.setEndedAt(LocalDateTime.now());

        Match savedMatch = matchRepository.save(match);
        advanceWinner(savedMatch);

        realtimePublisher.pushMatchUpdate(savedMatch.getId(), savedMatch.getEventSportId(),
                RealtimeEventType.MATCH_COMPLETED, mapToResponseDTO(savedMatch));
        realtimePublisher.pushRankingsUpdated(savedMatch.getEventSportId());

        if (rankingEngineService != null) {
            try { autoFinalizeIfLastMatch(savedMatch.getEventSportId()); }
            catch (Exception ignored) {}
        }

        if (tournamentNotificationService != null) {
            tournamentNotificationService.onMatchCompleted(savedMatch);
        }
    }

    // =====================================================
    // PRIVATE — FETCH ORDERED RESPONSE
    // =====================================================

    private List<MatchResponseDTO> fetchOrderedResponse(UUID eventSportId) {
        List<Match> matches =
                matchRepository
                        .findByEventSportIdAndDeletedAtIsNullOrderByRoundNumberAscMatchNumberAsc(
                                eventSportId
                        );
        return toResponseList(matches);
    }

    // =====================================================
    // PRIVATE — VALIDATE ADMIN
    // =====================================================

    /**
     * Score submission: all match-management roles PLUS JUDGE.
     * Used for: updateScore, submitMatchResult, completeMatch.
     *
     * JUDGE is intentionally NOT event-scoped here (judge-to-event assignment
     * is out of scope for this change) — any JUDGE may score any match, matching
     * prior behavior. ORGANIZER / SUB_ORGANIZER must be assigned to the event.
     */
    private void validateCanScoreMatchForSport(Authentication authentication, UUID eventSportId) {
        UUID currentUserId = extractUserId(authentication);
        if (userRoleService.hasRole(currentUserId, AccountType.SUPER_ADMIN)
                || userRoleService.hasRole(currentUserId, AccountType.ADMINISTRATOR)
                || userRoleService.hasRole(currentUserId, AccountType.MANAGER)
                || userRoleService.hasRole(currentUserId, AccountType.JUDGE)) {
            return;
        }
        if (userRoleService.hasRole(currentUserId, AccountType.ORGANIZER)
                || userRoleService.hasRole(currentUserId, AccountType.SUB_ORGANIZER)) {
            if (eventSportId != null) {
                var sportOpt = eventSportsRepository.findById(eventSportId);
                if (sportOpt.isPresent()) {
                    UUID eventId = sportOpt.get().getEventId();
                    if (eventAssignmentRepository.existsByUserIdAndEventId(currentUserId, eventId)) {
                        return;
                    }
                }
            }
        }
        throw ApiException.forbidden("Insufficient role or event assignment required");
    }

    /**
     * Hard-delete / data-destructive ops: SUPER_ADMIN and ADMINISTRATOR only.
     */
    private void validateSuperOrAdmin(Authentication authentication) {
        UUID currentUserId = extractUserId(authentication);
        boolean allowed = userRoleService.hasRole(currentUserId, AccountType.SUPER_ADMIN)
                || userRoleService.hasRole(currentUserId, AccountType.ADMINISTRATOR);
        if (!allowed) {
            throw ApiException.forbidden("SUPER_ADMIN or ADMINISTRATOR role required");
        }
    }

    /**
     * Accepts match-management roles OR an ORGANIZER/SUB_ORGANIZER assigned
     * to the event containing the given eventSportId.
     */
    private void validateAdminOrOrganizerForSport(Authentication authentication, UUID eventSportId) {
        UUID currentUserId = extractUserId(authentication);
        if (userRoleService.hasRole(currentUserId, AccountType.SUPER_ADMIN)
                || userRoleService.hasRole(currentUserId, AccountType.ADMINISTRATOR)
                || userRoleService.hasRole(currentUserId, AccountType.MANAGER)) {
            return;
        }
        // ORGANIZER / SUB_ORGANIZER — check event assignment
        if (userRoleService.hasRole(currentUserId, AccountType.ORGANIZER)
                || userRoleService.hasRole(currentUserId, AccountType.SUB_ORGANIZER)) {
            if (eventSportId != null) {
                var sportOpt = eventSportsRepository.findById(eventSportId);
                if (sportOpt.isPresent()) {
                    UUID eventId = sportOpt.get().getEventId();
                    if (eventAssignmentRepository.existsByUserIdAndEventId(currentUserId, eventId)) {
                        return;
                    }
                }
            }
        }
        throw ApiException.forbidden("Insufficient role or event assignment required");
    }

    // =====================================================
    // PRIVATE — NULL-SAFE INTEGER → int
    // =====================================================

    private int orZero(Integer value) {
        return value != null ? value : 0;
    }

    // =====================================================
    // PRIVATE — List<Match> → List<MatchResponseDTO>
    // =====================================================

    private List<MatchResponseDTO> toResponseList(List<Match> matches) {
        List<MatchResponseDTO> response = new ArrayList<>();
        for (Match match : matches) {
            response.add(mapToResponseDTO(match));
        }
        return response;
    }

    // =====================================================
    // PRIVATE — MAP Match ENTITY → MatchResponseDTO
    //
    // Every field in MatchResponseDTO is populated here.
    // Team names are resolved lazily from eventRegistrationRepository.
    //
    // MatchResponseDTO fields covered:
    //   matchId, eventSportId, tournamentFormat, matchType, format
    //   roundNumber, matchNumber, bracketPosition, bracketSide
    //   teamA/B/C/D RegistrationId + Name
    //   sourceMatchA/B/C/D Id
    //   nextMatchId, nextMatchSlot
    //   loserNextMatchId, loserNextMatchSlot
    //   teamA/B/C/D Score
    //   positionFirst/Second/Third/Fourth RegistrationId
    //   winnerRegistrationId, winnerTeamName
    //   leaderboardPosition, isBracketReset, isBye, autoAdvanced
    //   status
    //   scheduledAt, startedAt, endedAt
    //   createdAt, updatedAt
    // =====================================================

    private MatchResponseDTO mapToResponseDTO(Match match) {

        MatchResponseDTO dto = new MatchResponseDTO();

        // ── Identity ───────────────────────────────────────────────
        dto.setMatchId(match.getId());
        dto.setEventSportId(match.getEventSportId());

        // ── Format / Type ──────────────────────────────────────────
        dto.setTournamentFormat(match.getTournamentFormat());
        dto.setMatchType(match.getMatchType());
        dto.setFormat(match.getFormat());

        // ── Bracket structure ──────────────────────────────────────
        dto.setRoundNumber(match.getRoundNumber());
        dto.setMatchNumber(match.getMatchNumber());
        dto.setBracketPosition(match.getBracketPosition());
        dto.setBracketSide(match.getBracketSide());

        // ── Teams (IDs + resolved names) ───────────────────────────
        dto.setTeamARegistrationId(match.getTeamARegistrationId());
        dto.setTeamBRegistrationId(match.getTeamBRegistrationId());
        dto.setTeamCRegistrationId(match.getTeamCRegistrationId());
        dto.setTeamDRegistrationId(match.getTeamDRegistrationId());

        resolveParticipant(match.getTeamARegistrationId(), dto::setTeamAName, dto::setTeamARobotName);
        resolveParticipant(match.getTeamBRegistrationId(), dto::setTeamBName, dto::setTeamBRobotName);
        resolveParticipant(match.getTeamCRegistrationId(), dto::setTeamCName, dto::setTeamCRobotName);
        resolveParticipant(match.getTeamDRegistrationId(), dto::setTeamDName, dto::setTeamDRobotName);

        // ── Source matches ─────────────────────────────────────────
        dto.setSourceMatchAId(match.getSourceMatchAId());
        dto.setSourceMatchBId(match.getSourceMatchBId());
        dto.setSourceMatchCId(match.getSourceMatchCId());
        dto.setSourceMatchDId(match.getSourceMatchDId());

        // ── Next match flow ────────────────────────────────────────
        dto.setNextMatchId(match.getNextMatchId());
        dto.setNextMatchSlot(match.getNextMatchSlot());

        // ── Loser routing ──────────────────────────────────────────
        dto.setLoserNextMatchId(match.getLoserNextMatchId());
        dto.setLoserNextMatchSlot(match.getLoserNextMatchSlot());

        // ── Scores ─────────────────────────────────────────────────
        dto.setTeamAScore(match.getTeamAScore());
        dto.setTeamBScore(match.getTeamBScore());
        dto.setTeamCScore(match.getTeamCScore());
        dto.setTeamDScore(match.getTeamDScore());

        // ── Finish positions ───────────────────────────────────────
        dto.setPositionFirstRegistrationId(match.getPositionFirstRegistrationId());
        dto.setPositionSecondRegistrationId(match.getPositionSecondRegistrationId());
        dto.setPositionThirdRegistrationId(match.getPositionThirdRegistrationId());
        dto.setPositionFourthRegistrationId(match.getPositionFourthRegistrationId());

        // ── Winner ─────────────────────────────────────────────────
        dto.setWinnerRegistrationId(match.getWinnerRegistrationId());
        resolveParticipant(match.getWinnerRegistrationId(), dto::setWinnerTeamName, dto::setWinnerRobotName);

        // ── Leaderboard / flags ────────────────────────────────────
        dto.setLeaderboardPosition(match.getLeaderboardPosition());
        dto.setIsBracketReset(match.getIsBracketReset());
        dto.setIsBye(match.getIsBye());
        dto.setAutoAdvanced(match.getAutoAdvanced());

        // ── Win method ─────────────────────────────────────────────
        dto.setWinMethod(match.getWinMethod());

        // ── Status ─────────────────────────────────────────────────
        dto.setStatus(match.getStatus());

        // ── Timings ────────────────────────────────────────────────
        dto.setScheduledAt(match.getScheduledAt());
        dto.setStartedAt(match.getStartedAt());
        dto.setEndedAt(match.getEndedAt());

        // ── Audit ──────────────────────────────────────────────────
        // MatchResponseDTO exposes setCreatedAt / setUpdatedAt;
        // Match entity exposes getCreatedAt() / getUpdatedAt() (no public setter).
        dto.setCreatedAt(match.getCreatedAt());
        dto.setUpdatedAt(match.getUpdatedAt());

        return dto;
    }

    // =====================================================
    // PRIVATE — RESOLVE TEAM + ROBOT NAMES FROM REGISTRATION ID
    // =====================================================

    private void resolveParticipant(
            UUID registrationId,
            java.util.function.Consumer<String> teamNameSetter,
            java.util.function.Consumer<String> robotNameSetter
    ) {
        if (registrationId == null) return;
        eventRegistrationRepository.findById(registrationId).ifPresent(reg -> {
            robotNameSetter.accept(reg.getRobotName());
            if (reg.getTeamId() != null) {
                teamRepository.findById(reg.getTeamId())
                        .ifPresent(t -> teamNameSetter.accept(t.getTeamName()));
            }
        });
    }
    // =====================================================
    // GET MY MATCHES
    // GET /v1/matches/my
    //
    // Setter-injected so there is no circular-dependency risk.
    // =====================================================

    private com.botleague.backend.team.repository.TeamMembershipRepository teamMembershipRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setTeamMembershipRepository(
            com.botleague.backend.team.repository.TeamMembershipRepository repo) {
        this.teamMembershipRepository = repo;
    }

    public List<MatchResponseDTO> getMyMatches(UUID userId) {
        if (teamMembershipRepository == null) return List.of();

        // 1. Collect all team IDs this user actively belongs to
        java.util.Set<UUID> teamIds = teamMembershipRepository
                .findByUserId(userId).stream()
                .filter(m -> m.getStatus() ==
                        com.botleague.backend.team.enums.TeamMembershipStatus.ACTIVE)
                .map(com.botleague.backend.team.entity.TeamMembership::getTeamId)
                .collect(java.util.stream.Collectors.toSet());

        if (teamIds.isEmpty()) return List.of();

        // 2. Collect all registration IDs for those teams (targeted query, not findAll)
        java.util.Set<UUID> regIds = eventRegistrationRepository.findByTeamIdIn(teamIds)
                .stream()
                .map(reg -> reg.getId())
                .collect(java.util.stream.Collectors.toSet());

        if (regIds.isEmpty()) return List.of();

        // 3. Targeted DB query — no full table scan
        List<Match> myMatches = matchRepository.findByAnyRegistrationIdIn(regIds);
        myMatches.sort(java.util.Comparator.comparing(
                m -> m.getScheduledAt() != null ? m.getScheduledAt() : LocalDateTime.MIN));

        return toResponseList(myMatches);
    }

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}