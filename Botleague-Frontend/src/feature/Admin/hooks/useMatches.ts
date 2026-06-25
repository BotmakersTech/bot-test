import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"

import {
    cancelMatch,
    completeMatch,
    createMatch,
    createTournamentBracket,
    generateBracket,
    deleteMatch,
    getAllMatches,
    getMatchById,
    getMatchesByEventSport,
    getMatchesByRound,
    getMatchesByTeam,
    scheduleMatch,
    startMatch,
    submitMatchResult,
    updateMatch,
    updateMatchScore,
    updateMatchTeams,

    type MatchDTO,
    type CreateMatchRequestDTO,
    type GenerateBracketRequestDTO,
    type UpdateMatchRequestDTO,
    type UpdateMatchScoreDTO,
    type SubmitMatchResultDTO
} from "../api/adminMatches.api"

export const useMatches = (
    sportId?: string
) => {

    // =====================================================
    // STATE
    // =====================================================

    const [matches, setMatches] =
        useState<MatchDTO[]>([])

    const [match, setMatch] =
        useState<MatchDTO | null>(null)

    const [loading, setLoading] =
        useState(false)

    const [createLoading, setCreateLoading] =
        useState(false)

    const [updateLoading, setUpdateLoading] =
        useState(false)

    const [error, setError] =
        useState<string | null>(null)

    // =====================================================
    // REF — avoids fetchMatches in useEffect dep array
    // =====================================================

    const fetchMatchesRef =
        useRef<(id: string) => Promise<MatchDTO[]>>(
            null!
        )

    // =====================================================
    // SHARED ERROR EXTRACTOR
    // =====================================================

    const extractError = (
        err: any,
        fallback: string
    ): string =>
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        fallback

    // =====================================================
    // FETCH MATCHES BY EVENT SPORT
    // GET /v1/matches/event-sport/:eventSportId
    // =====================================================

    const fetchMatches =
        useCallback(async (
            eventSportId: string
        ) => {

            try {

                setLoading(true)
                setError(null)

                const response =
                    await getMatchesByEventSport(
                        eventSportId
                    )

                setMatches(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to fetch matches")

                setError(message)
                throw err

            } finally {

                setLoading(false)
            }

        }, [])

    // Keep ref in sync so useEffect always calls
    // the latest version without needing it as a dep
    // eslint-disable-next-line react-hooks/refs
    fetchMatchesRef.current = fetchMatches

    // =====================================================
    // FETCH ALL MATCHES
    // GET /v1/matches
    // =====================================================

    const fetchAllMatches =
        useCallback(async () => {

            try {

                setLoading(true)
                setError(null)

                const response = await getAllMatches()

                setMatches(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to fetch matches")

                setError(message)
                throw err

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // FETCH MATCH BY ID
    // GET /v1/matches/:matchId
    // =====================================================

    const fetchMatchById =
        useCallback(async (
            matchId: string
        ) => {

            try {

                setLoading(true)
                setError(null)

                const response =
                    await getMatchById(matchId)

                setMatch(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to fetch match")

                setError(message)
                throw err

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // FETCH MATCHES BY ROUND
    // GET /v1/matches/event-sport/:eventSportId/round/:roundNumber
    // =====================================================

    const fetchMatchesByRound =
        useCallback(async (
            eventSportId: string,
            roundNumber: number
        ) => {

            try {

                setLoading(true)
                setError(null)

                const response =
                    await getMatchesByRound(
                        eventSportId,
                        roundNumber
                    )

                setMatches(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to fetch matches by round")

                setError(message)
                throw err

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // FETCH MATCHES BY TEAM
    // GET /v1/matches/team/:registrationId
    // Covers all 4 slots: A, B, C, D
    // =====================================================

    const fetchMatchesByTeam =
        useCallback(async (
            registrationId: string
        ) => {

            try {

                setLoading(true)
                setError(null)

                const response =
                    await getMatchesByTeam(
                        registrationId
                    )

                setMatches(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to fetch matches by team")

                setError(message)
                throw err

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // CREATE SINGLE MATCH (MANUAL)
    // POST /v1/matches
    // Appends the new match to local state.
    // =====================================================

    const handleCreateMatch =
        useCallback(async (
            request: CreateMatchRequestDTO
        ) => {

            try {

                setCreateLoading(true)
                setError(null)

                const response =
                    await createMatch(request)

                setMatches(prev => [...prev, response])
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to create match")

                setError(message)
                throw err

            } finally {

                setCreateLoading(false)
            }

        }, [])

    // =====================================================
    // CREATE TOURNAMENT BRACKET (MANUAL BULK)
    // POST /v1/matches/bulk
    // Each match fully specified — no auto-seeding.
    // Replaces local matches list with the saved bracket.
    // =====================================================

    const handleCreateTournamentBracket =
        useCallback(async (
            requests: CreateMatchRequestDTO[]
        ) => {

            try {

                setCreateLoading(true)
                setError(null)

                const response =
                    await createTournamentBracket(requests)

                setMatches(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to create tournament bracket")

                setError(message)
                throw err

            } finally {

                setCreateLoading(false)
            }

        }, [])

    // =====================================================
    // GENERATE BRACKET (AUTO-SEED)
    // POST /v1/matches/generate
    // Backend expects a single GenerateBracketRequestDTO.
    // Replaces local matches list with the generated bracket.
    // =====================================================

    const handleGenerateBracket =
        useCallback(async (
            request: GenerateBracketRequestDTO
        ) => {

            try {

                setCreateLoading(true)
                setError(null)

                const response =
                    await generateBracket(request)

                setMatches(response)
                return response

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to generate bracket")

                setError(message)
                throw err

            } finally {

                setCreateLoading(false)
            }

        }, [])

    // =====================================================
    // UPDATE FULL MATCH (PATCH SEMANTICS)
    // PUT /v1/matches/:matchId
    //
    // NOTE: No fetchMatches call here intentionally.
    // The component calls refreshMatches() after await.
    // Calling fetchMatches here AND in the component
    // causes double-fetches on every action.
    // =====================================================

    const handleUpdateMatch =
        useCallback(async (
            matchId: string,
            request: UpdateMatchRequestDTO
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await updateMatch(matchId, request)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to update match")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // UPDATE TEAMS ONLY
    // PATCH /v1/matches/:matchId/teams
    // Only teamA/B/C/DRegistrationId fields are sent.
    // =====================================================

    const handleUpdateMatchTeams =
        useCallback(async (
            matchId: string,
            request: Pick<
                UpdateMatchRequestDTO,
                | "teamARegistrationId"
                | "teamBRegistrationId"
                | "teamCRegistrationId"
                | "teamDRegistrationId"
            >
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await updateMatchTeams(matchId, request)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to update match teams")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // SCHEDULE MATCH
    // PATCH /v1/matches/:matchId/schedule
    // Only scheduledAt is sent to the backend.
    // =====================================================

    const handleScheduleMatch =
        useCallback(async (
            matchId: string,
            scheduledAt: string
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await scheduleMatch(matchId, scheduledAt)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to schedule match")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // START MATCH
    // PATCH /v1/matches/:matchId/start
    // No request body. Status: SCHEDULED → LIVE.
    // Returns the updated MatchDTO.
    // Caller is responsible for refreshing match list.
    // =====================================================

    const handleStartMatch =
        useCallback(async (
            matchId: string
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await startMatch(matchId)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to start match")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // UPDATE SCORE (LIVE ONLY)
    // PATCH /v1/matches/:matchId/score
    // Omit teamCScore / teamDScore for ONE_VS_ONE matches.
    // =====================================================

    const handleUpdateScore =
        useCallback(async (
            matchId: string,
            request: UpdateMatchScoreDTO
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await updateMatchScore(matchId, request)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to update match score")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // SUBMIT MATCH RESULT
    // PATCH /v1/matches/:matchId/result
    //
    // Use for:
    //   • TRIPLE_THREAT / FATAL_FOUR (must supply positions)
    //   • Any match needing an explicit winner override
    //   • Custom endedAt timestamp
    //
    // Backend flow on this endpoint:
    //   1. Apply scores
    //   2. Apply finish positions
    //   3. Resolve winner (explicit > positionFirst > highest score)
    //   4. Mark COMPLETED + set endedAt
    //   5. Advance winner → nextMatch
    //   6. Advance runner-up → 3rd-place match (if exists)
    //   7. Advance loser → losers bracket (DOUBLE_ELIMINATION)
    // =====================================================

    const handleSubmitMatchResult =
        useCallback(async (
            matchId: string,
            request: SubmitMatchResultDTO
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await submitMatchResult(matchId, request)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to submit match result")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // COMPLETE MATCH (SCORE-BASED AUTO)
    // PATCH /v1/matches/:matchId/complete
    //
    // No request body. Backend infers winner from scores.
    // Throws if scores are tied — use submitMatchResult
    // with an explicit winnerRegistrationId instead.
    //
    // Backend automatically:
    //   • Advances winner → nextMatch
    //   • Advances runner-up → 3rd-place match (if exists)
    //   • Advances loser → losers bracket (DOUBLE_ELIMINATION)
    // =====================================================

    const handleCompleteMatch =
        useCallback(async (
            matchId: string
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await completeMatch(matchId)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to complete match")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // CANCEL MATCH
    // PATCH /v1/matches/:matchId/cancel
    // Not allowed on COMPLETED matches.
    // =====================================================

    const handleCancelMatch =
        useCallback(async (
            matchId: string
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                return await cancelMatch(matchId)

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to cancel match")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // DELETE MATCH (SOFT DELETE)
    // DELETE /v1/matches/:matchId
    // Sets deletedAt on backend; row remains in DB.
    // Removes the match from local state on success.
    // =====================================================

    const handleDeleteMatch =
        useCallback(async (
            matchId: string
        ) => {

            try {

                setUpdateLoading(true)
                setError(null)

                await deleteMatch(matchId)

                setMatches(prev =>
                    prev.filter(m => m.matchId !== matchId)
                )

            } catch (err: any) {

                const message =
                    extractError(err, "Failed to delete match")

                setError(message)
                throw err

            } finally {

                setUpdateLoading(false)
            }

        }, [])

    // =====================================================
    // AUTO LOAD ON MOUNT / sportId CHANGE
    //
    // KEY: depend only on sportId (stable string from
    // useParams). fetchMatchesRef.current ensures we
    // always call the latest fetchMatches without adding
    // it to deps — doing so would trigger a fetch loop
    // every time the useCallback rebuilds.
    // =====================================================

    useEffect(() => {

        if (!sportId) return

        fetchMatchesRef.current(sportId)

    }, [sportId])

    // =====================================================
    // RETURN
    // =====================================================

    return {

        // ── State ──────────────────────────────────────
        matches,
        match,
        loading,
        createLoading,
        updateLoading,
        error,

        // ── Fetchers ───────────────────────────────────
        fetchMatches,
        fetchAllMatches,
        fetchMatchById,
        fetchMatchesByRound,
        fetchMatchesByTeam,

        // ── Create ─────────────────────────────────────
        createMatch:              handleCreateMatch,
        createTournamentBracket:  handleCreateTournamentBracket,
        generateBracket:          handleGenerateBracket,

        // ── Update ─────────────────────────────────────
        updateMatch:              handleUpdateMatch,
        updateMatchTeams:         handleUpdateMatchTeams,
        scheduleMatch:            handleScheduleMatch,

        // ── Lifecycle ──────────────────────────────────
        startMatch:               handleStartMatch,
        updateMatchScore:         handleUpdateScore,
        submitMatchResult:        handleSubmitMatchResult,
        completeMatch:            handleCompleteMatch,
        cancelMatch:              handleCancelMatch,
        deleteMatch:              handleDeleteMatch,
    }
}