import api from "../../../shared/api/Base"

// =====================================================
// ENUMS
// Mirror of backend enums — kept as string unions so
// callers get IDE autocomplete without a separate enum file.
// =====================================================

export type TournamentFormat =
    | "SINGLE_ELIMINATION"
    | "DOUBLE_ELIMINATION"

export type MatchType =
    | "ONE_VS_ONE"
    | "TRIPLE_THREAT"
    | "FATAL_FOUR"

/**
 * BO1 / BO3 / BO5 etc.
 * Extend as your backend MatchFormat enum grows.
 */
export type MatchFormat = string

/**
 * WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE
 * null for SINGLE_ELIMINATION regular matches.
 */
export type BracketSide =
    | "WINNERS"
    | "LOSERS"
    | "GRAND_FINAL"
    | "THIRD_PLACE"

export type MatchStatus =
    | "SCHEDULED"
    | "LIVE"
    | "PENDING_APPROVAL"
    | "COMPLETED"
    | "CANCELLED"

export type MatchResultType =
    | "SCORE"
    | "TAPOUT"
    | "JUDGE_DECISION"
    | "FORFEIT"
    | "DISQUALIFICATION"
    | "BYE"

// =====================================================
// RESPONSE DTO
// Mirrors backend MatchResponseDTO (mapToResponseDTO)
// =====================================================

export interface MatchDTO {

    // ── Identity ───────────────────────────────────
    matchId: string
    eventSportId: string

    // ── Format / Type ──────────────────────────────
    tournamentFormat?: TournamentFormat
    matchType?: MatchType
    format?: MatchFormat

    // ── Bracket structure ──────────────────────────
    roundNumber?: number
    matchNumber?: number
    bracketPosition?: number

    /**
     * WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE
     * null for SINGLE_ELIMINATION
     */
    bracketSide?: BracketSide

    // ── Participating teams (IDs + resolved names) ─
    teamARegistrationId?: string
    teamBRegistrationId?: string
    teamCRegistrationId?: string   // TRIPLE_THREAT / FATAL_FOUR
    teamDRegistrationId?: string   // FATAL_FOUR only

    teamAName?: string
    teamARobotName?: string
    teamBName?: string
    teamBRobotName?: string
    teamCName?: string             // TRIPLE_THREAT / FATAL_FOUR
    teamCRobotName?: string
    teamDName?: string             // FATAL_FOUR only
    teamDRobotName?: string

    // ── Source matches ─────────────────────────────
    sourceMatchAId?: string
    sourceMatchBId?: string
    sourceMatchCId?: string        // TRIPLE_THREAT / FATAL_FOUR
    sourceMatchDId?: string        // FATAL_FOUR only

    // ── Next match flow (winner advances) ──────────
    nextMatchId?: string
    /**
     * 1 = Team A slot
     * 2 = Team B slot
     * 3 = Team C slot (Triple Threat / Fatal Four)
     * 4 = Team D slot (Fatal Four)
     */
    nextMatchSlot?: number

    // ── Loser routing (DOUBLE_ELIMINATION only) ────
    loserNextMatchId?: string
    /** 1 = Team A slot | 2 = Team B slot */
    loserNextMatchSlot?: number

    // ── Scores ─────────────────────────────────────
    teamAScore?: number
    teamBScore?: number
    teamCScore?: number            // TRIPLE_THREAT / FATAL_FOUR
    teamDScore?: number            // FATAL_FOUR only

    // ── Finish positions ───────────────────────────
    positionFirstRegistrationId?: string
    positionSecondRegistrationId?: string
    positionThirdRegistrationId?: string   // TRIPLE_THREAT / FATAL_FOUR
    positionFourthRegistrationId?: string  // FATAL_FOUR only

    // ── Winner ─────────────────────────────────────
    winnerRegistrationId?: string
    winnerTeamName?: string
    winnerRobotName?: string

    // ── Leaderboard / special-match flags ──────────
    /**
     * null  = regular bracket match
     * 1     = grand final (decides 1st / 2nd)
     * 3     = 3rd-place match
     */
    leaderboardPosition?: number

    /**
     * true on the grand-final REMATCH row
     * (Double Elimination bracket-reset)
     */
    isBracketReset?: boolean

    // ── Bye / auto-advance ─────────────────────────
    isBye?: boolean
    autoAdvanced?: boolean

    // ── Win method ─────────────────────────────────
    /** How the result was decided. Set when status = COMPLETED. */
    winMethod?: MatchResultType

    // ── Status ─────────────────────────────────────
    status?: MatchStatus

    // ── Timings ────────────────────────────────────
    scheduledAt?: string
    startedAt?: string
    endedAt?: string

    // ── Audit ──────────────────────────────────────
    createdAt?: string
    updatedAt?: string
}

// =====================================================
// CREATE SINGLE MATCH
// POST /v1/matches
// Maps to backend CreateMatchRequestDTO
// =====================================================

export interface CreateMatchRequestDTO {

    // ── Required ───────────────────────────────────
    eventSportId: string

    /** Default: SINGLE_ELIMINATION */
    tournamentFormat: TournamentFormat

    // ── Match classification ───────────────────────
    /** Default: ONE_VS_ONE */
    matchType?: MatchType

    /** BO1 / BO3 / BO5 etc. Optional. */
    format?: MatchFormat

    // ── Bracket structure ──────────────────────────
    roundNumber?: number
    matchNumber?: number
    bracketPosition?: number

    /**
     * WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE
     * Required for DOUBLE_ELIMINATION; null for SINGLE_ELIMINATION.
     */
    bracketSide?: BracketSide

    // ── Teams (nullable for TBD future matches) ────
    teamARegistrationId?: string
    teamBRegistrationId?: string
    teamCRegistrationId?: string   // TRIPLE_THREAT / FATAL_FOUR
    teamDRegistrationId?: string   // FATAL_FOUR only

    // ── Source matches ─────────────────────────────
    sourceMatchAId?: string
    sourceMatchBId?: string
    sourceMatchCId?: string        // TRIPLE_THREAT / FATAL_FOUR
    sourceMatchDId?: string        // FATAL_FOUR only

    // ── Next match flow ────────────────────────────
    nextMatchId?: string
    /**
     * 1 = Team A slot  2 = Team B slot
     * 3 = Team C slot  4 = Team D slot
     */
    nextMatchSlot?: number

    // ── Loser routing (DOUBLE_ELIMINATION only) ────
    loserNextMatchId?: string
    /** 1 = Team A slot | 2 = Team B slot */
    loserNextMatchSlot?: number

    // ── Leaderboard / flags ────────────────────────
    /** null = regular | 1 = grand final | 3 = 3rd-place match */
    leaderboardPosition?: number
    isBracketReset?: boolean

    // ── Bye / auto-advance ─────────────────────────
    isBye?: boolean
    autoAdvanced?: boolean

    // ── Timings ────────────────────────────────────
    scheduledAt?: string
}

// =====================================================
// GENERATE BRACKET (AUTO-SEED)
// POST /v1/matches/generate
// Maps to backend GenerateBracketRequestDTO
// Backend expects a SINGLE object, not an array.
// =====================================================

export interface GenerateBracketRequestDTO {

    // ── Required ───────────────────────────────────
    eventSportId: string

    /** Default if omitted on backend: SINGLE_ELIMINATION */
    tournamentFormat: TournamentFormat

    /** Default if omitted on backend: ONE_VS_ONE */
    matchType: MatchType

    /** BO1 / BO3 / BO5 etc. Optional — stamped on every match. */
    format?: MatchFormat

    /** Min 1 entry. Order determines seeding. */
    teamRegistrationIds: string[]
}

// =====================================================
// UPDATE MATCH (FULL / PARTIAL)
// PUT  /v1/matches/:matchId   → full update
// PATCH /v1/matches/:matchId/teams    → teams only
// PATCH /v1/matches/:matchId/schedule → scheduledAt only
// Maps to backend UpdateMatchRequestDTO (patch semantics)
// =====================================================

export interface UpdateMatchRequestDTO {

    // ── Tournament / type ──────────────────────────
    tournamentFormat?: TournamentFormat
    matchType?: MatchType
    format?: MatchFormat

    // ── Bracket structure ──────────────────────────
    roundNumber?: number
    matchNumber?: number
    bracketPosition?: number
    bracketSide?: BracketSide

    // ── Teams ──────────────────────────────────────
    teamARegistrationId?: string
    teamBRegistrationId?: string
    teamCRegistrationId?: string
    teamDRegistrationId?: string

    // ── Source matches ─────────────────────────────
    sourceMatchAId?: string
    sourceMatchBId?: string
    sourceMatchCId?: string
    sourceMatchDId?: string

    // ── Next match flow ────────────────────────────
    nextMatchId?: string
    nextMatchSlot?: number

    // ── Loser routing ──────────────────────────────
    loserNextMatchId?: string
    loserNextMatchSlot?: number

    // ── Leaderboard / flags ────────────────────────
    leaderboardPosition?: number
    isBracketReset?: boolean

    // ── Bye / auto-advance ─────────────────────────
    isBye?: boolean
    autoAdvanced?: boolean

    // ── Timings ────────────────────────────────────
    scheduledAt?: string
}

// =====================================================
// UPDATE SCORE (LIVE)
// PATCH /v1/matches/:matchId/score
// Maps to backend UpdateMatchScoreDTO
// Omit C/D for ONE_VS_ONE matches.
// =====================================================

export interface UpdateMatchScoreDTO {

    teamAScore?: number
    teamBScore?: number
    teamCScore?: number   // TRIPLE_THREAT / FATAL_FOUR
    teamDScore?: number   // FATAL_FOUR only
}

// =====================================================
// SUBMIT MATCH RESULT
// POST /v1/matches/:matchId/result  (or PATCH)
// Maps to backend SubmitMatchResultDTO
//
// Use this when you need to:
//   • record exact finish positions (Triple Threat / Fatal Four)
//   • override the auto-inferred winner
//   • supply a custom endedAt timestamp
// =====================================================

export interface SubmitMatchResultDTO {

    // ── Scores (optional — update if provided) ─────
    teamAScore?: number
    teamBScore?: number
    teamCScore?: number   // TRIPLE_THREAT / FATAL_FOUR
    teamDScore?: number   // FATAL_FOUR only

    // ── Finish positions ───────────────────────────
    /** Required for TRIPLE_THREAT / FATAL_FOUR */
    positionFirstRegistrationId?: string
    positionSecondRegistrationId?: string
    /** Required for TRIPLE_THREAT / FATAL_FOUR */
    positionThirdRegistrationId?: string
    /** Required for FATAL_FOUR */
    positionFourthRegistrationId?: string

    // ── Explicit winner override ───────────────────
    /**
     * Optional. If omitted, backend infers winner from
     * positionFirst → highest score.
     */
    winnerRegistrationId?: string

    // ── Win method ─────────────────────────────────
    /**
     * How the result was decided.
     * SCORE | TAPOUT | JUDGE_DECISION | FORFEIT | DISQUALIFICATION | BYE
     */
    winMethod?: MatchResultType

    // ── Timing ─────────────────────────────────────
    /** Defaults to server now() when omitted. */
    endedAt?: string
}

// =====================================================
// ─── API FUNCTIONS ───────────────────────────────────
// =====================================================

// =====================================================
// CREATE SINGLE MATCH
// POST /v1/matches
// =====================================================

export const createMatch =
    async (
        request: CreateMatchRequestDTO
    ): Promise<MatchDTO> => {

        const response =
            await api.post<MatchDTO>(
                "/v1/matches",
                request
            )

        return response.data
    }

// =====================================================
// CREATE TOURNAMENT BRACKET (MANUAL BULK)
// POST /v1/matches/bulk
// Each match fully specified — no auto-seeding.
// =====================================================

export const createTournamentBracket =
    async (
        requests: CreateMatchRequestDTO[]
    ): Promise<MatchDTO[]> => {

        const response =
            await api.post<MatchDTO[]>(
                "/v1/matches/bulk",
                requests
            )

        return response.data
    }

// =====================================================
// GENERATE BRACKET (AUTO-SEED)
// POST /v1/matches/generate
// Backend receives a single GenerateBracketRequestDTO.
// =====================================================

export const generateBracket =
    async (
        request: GenerateBracketRequestDTO
    ): Promise<MatchDTO[]> => {

        const response =
            await api.post<MatchDTO[]>(
                "/v1/matches/generate",
                request
            )

        return response.data
    }

// =====================================================
// GET MATCH BY ID
// GET /v1/matches/:matchId
// =====================================================

export const getMatchById =
    async (
        matchId: string
    ): Promise<MatchDTO> => {

        const response =
            await api.get<MatchDTO>(
                `/v1/matches/${matchId}`
            )

        return response.data
    }

// =====================================================
// GET ALL MATCHES
// GET /v1/matches
// =====================================================

export const getAllMatches =
    async (): Promise<MatchDTO[]> => {

        const response =
            await api.get<MatchDTO[]>(
                "/v1/matches/all"
            )

        return response.data
    }

// =====================================================
// GET MATCHES BY EVENT SPORT
// GET /v1/matches/event-sport/:eventSportId
// =====================================================

export const getMatchesByEventSport =
    async (
        eventSportId: string
    ): Promise<MatchDTO[]> => {

        const response =
            await api.get<MatchDTO[]>(
                `/v1/matches/event-sport/${eventSportId}`
            )

        return response.data
    }

// =====================================================
// GET MATCHES BY ROUND
// GET /v1/matches/event-sport/:eventSportId/round/:roundNumber
// =====================================================

export const getMatchesByRound =
    async (
        eventSportId: string,
        roundNumber: number
    ): Promise<MatchDTO[]> => {

        const response =
            await api.get<MatchDTO[]>(
                `/v1/matches/event-sport/${eventSportId}/round/${roundNumber}`
            )

        return response.data
    }

// =====================================================
// GET MATCHES BY TEAM
// GET /v1/matches/team/:registrationId
// Covers all 4 slots: A, B, C, D
// =====================================================

export const getMatchesByTeam =
    async (
        registrationId: string
    ): Promise<MatchDTO[]> => {

        const response =
            await api.get<MatchDTO[]>(
                `/v1/matches/team/${registrationId}`
            )

        return response.data
    }

// =====================================================
// UPDATE FULL MATCH (PATCH SEMANTICS)
// PUT /v1/matches/:matchId
// Only non-null fields are applied on backend.
// =====================================================

export const updateMatch =
    async (
        matchId: string,
        request: UpdateMatchRequestDTO
    ): Promise<MatchDTO> => {

        const response =
            await api.put<MatchDTO>(
                `/v1/matches/${matchId}`,
                request
            )

        return response.data
    }

// =====================================================
// UPDATE TEAMS ONLY
// PATCH /v1/matches/:matchId/teams
// Only teamA/B/C/DRegistrationId fields are read.
// =====================================================

export const updateMatchTeams =
    async (
        matchId: string,
        request: Pick<
            UpdateMatchRequestDTO,
            | "teamARegistrationId"
            | "teamBRegistrationId"
            | "teamCRegistrationId"
            | "teamDRegistrationId"
        >
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/teams`,
                request
            )

        return response.data
    }

// =====================================================
// SCHEDULE MATCH
// PATCH /v1/matches/:matchId/schedule
// Only scheduledAt is read on the backend.
// =====================================================

export const scheduleMatch =
    async (
        matchId: string,
        scheduledAt: string
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/schedule`,
                { scheduledAt } satisfies Pick<UpdateMatchRequestDTO, "scheduledAt">
            )

        return response.data
    }

// =====================================================
// START MATCH
// PATCH /v1/matches/:matchId/start
// No request body. Status: SCHEDULED → LIVE.
// =====================================================

export const startMatch =
    async (
        matchId: string
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/start`
            )

        return response.data
    }

// =====================================================
// UPDATE SCORE (LIVE ONLY)
// PATCH /v1/matches/:matchId/score
// =====================================================

export const updateMatchScore =
    async (
        matchId: string,
        request: UpdateMatchScoreDTO
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/score`,
                request
            )

        return response.data
    }

// =====================================================
// SUBMIT MATCH RESULT
// PATCH /v1/matches/:matchId/result
//
// Use for:
//   • TRIPLE_THREAT / FATAL_FOUR (must supply positions)
//   • Any match needing an explicit winner override
//   • Custom endedAt timestamp
// =====================================================

export const submitMatchResult =
    async (
        matchId: string,
        request: SubmitMatchResultDTO
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/result`,
                request
            )

        return response.data
    }

// =====================================================
// COMPLETE MATCH (SCORE-BASED AUTO)
// PATCH /v1/matches/:matchId/complete
//
// No body. Backend infers winner from current scores.
// Throws 400 if scores are tied — use submitMatchResult
// with an explicit winnerRegistrationId instead.
// Automatically advances winner → next match,
// runner-up → 3rd-place match (if exists),
// loser → losers bracket (DOUBLE_ELIMINATION only).
// =====================================================

export const completeMatch =
    async (
        matchId: string
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/complete`
            )

        return response.data
    }

// =====================================================
// APPROVE MATCH RESULT
// PATCH /v1/matches/:matchId/approve
//
// Only for PENDING_APPROVAL matches. Only an EVENT_HEAD /
// ORGANISER(owner) / ADMIN / SUPER_ADMIN for the parent
// event may approve — SPORT_HEAD and JUDGE cannot self-approve.
// This is the point ranking points get awarded.
// =====================================================

export const approveMatchResult =
    async (
        matchId: string
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/approve`
            )

        return response.data
    }

// =====================================================
// REJECT MATCH RESULT
// PATCH /v1/matches/:matchId/reject
//
// Only for PENDING_APPROVAL matches. Reverts to LIVE so
// the result can be resubmitted.
// =====================================================

export const rejectMatchResult =
    async (
        matchId: string,
        reason?: string
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/reject`,
                { reason }
            )

        return response.data
    }

// =====================================================
// CANCEL MATCH
// PATCH /v1/matches/:matchId/cancel
// Not allowed on COMPLETED matches.
// =====================================================

export const cancelMatch =
    async (
        matchId: string
    ): Promise<MatchDTO> => {

        const response =
            await api.patch<MatchDTO>(
                `/v1/matches/${matchId}/cancel`
            )

        return response.data
    }

// =====================================================
// DELETE MATCH (SOFT DELETE)
// DELETE /v1/matches/:matchId
// Sets deletedAt on backend; row remains in DB.
// =====================================================

export const deleteMatch =
    async (
        matchId: string
    ): Promise<string> => {

        const response =
            await api.delete<string>(
                `/v1/matches/${matchId}`
            )

        return response.data
    }

// =====================================================
// BACKWARD-COMPAT ALIAS
// Old callers of createMatchesBulk are redirected to
// generateBracket (same signature, same endpoint).
// =====================================================

/** @deprecated Use generateBracket instead */
export const createMatchesBulk = generateBracket