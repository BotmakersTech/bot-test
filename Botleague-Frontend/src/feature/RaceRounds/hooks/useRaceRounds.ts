import { useCallback, useEffect, useRef, useState } from "react"

import { useSportMatchRealtime } from "../../../shared/realtime/useMatchRealtime"

import {
    generateFirstRound,
    getRoundsForSport,
    recordRoundTimes,
    shortlistRound,
    finalizeRound,
    deleteRound,

    type RoundDTO,
    type EntryTimeInput,
} from "../api/raceRounds.api"

const ROUND_EVENT_TYPES = new Set([
    "ROUND_GENERATED",
    "ROUND_TIMES_UPDATED",
    "ROUND_SHORTLISTED",
    "ROUND_FINALIZED",
])

export const useRaceRounds = (sportId?: string) => {

    const [rounds, setRounds] = useState<RoundDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const extractError = (err: any, fallback: string): string =>
        err?.response?.data?.message || err?.response?.data?.error || fallback

    const fetchRoundsRef = useRef<(id: string) => Promise<RoundDTO[]>>(null!)

    const fetchRounds = useCallback(async (eventSportId: string) => {
        try {
            setLoading(true)
            setError(null)
            const response = await getRoundsForSport(eventSportId)
            setRounds(response)
            return response
        } catch (err: any) {
            setError(extractError(err, "Failed to fetch rounds"))
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    // eslint-disable-next-line react-hooks/refs
    fetchRoundsRef.current = fetchRounds

    // Simplest-correct realtime strategy: a round update touches its whole
    // shape (entries, status, counts) at once, so just refetch the list
    // rather than trying to merge a partial RoundDTO into local state.
    useSportMatchRealtime(sportId, (type) => {
        if (!sportId || !ROUND_EVENT_TYPES.has(type)) return
        fetchRoundsRef.current(sportId).catch(() => { /* surfaced via error state on manual fetch */ })
    })

    const handleGenerateFirstRound = useCallback(async (eventSportId: string) => {
        try {
            setActionLoading(true)
            setError(null)
            const round = await generateFirstRound(eventSportId)
            setRounds(prev => [...prev, round])
            return round
        } catch (err: any) {
            setError(extractError(err, "Failed to generate Round 1"))
            throw err
        } finally {
            setActionLoading(false)
        }
    }, [])

    const handleRecordTimes = useCallback(async (roundId: string, entries: EntryTimeInput[]) => {
        try {
            setActionLoading(true)
            setError(null)
            const updated = await recordRoundTimes(roundId, entries)
            setRounds(prev => prev.map(r => r.roundId === updated.roundId ? updated : r))
            return updated
        } catch (err: any) {
            setError(extractError(err, "Failed to record times"))
            throw err
        } finally {
            setActionLoading(false)
        }
    }, [])

    const handleShortlist = useCallback(async (roundId: string, cutoffCount: number, eventSportId: string) => {
        try {
            setActionLoading(true)
            setError(null)
            await shortlistRound(roundId, cutoffCount)
            return await fetchRounds(eventSportId)
        } catch (err: any) {
            setError(extractError(err, "Failed to shortlist round"))
            throw err
        } finally {
            setActionLoading(false)
        }
    }, [fetchRounds])

    const handleFinalize = useCallback(async (roundId: string) => {
        try {
            setActionLoading(true)
            setError(null)
            const updated = await finalizeRound(roundId)
            setRounds(prev => prev.map(r => r.roundId === updated.roundId ? updated : r))
            return updated
        } catch (err: any) {
            setError(extractError(err, "Failed to finalize round"))
            throw err
        } finally {
            setActionLoading(false)
        }
    }, [])

    const handleDeleteRound = useCallback(async (roundId: string) => {
        try {
            setActionLoading(true)
            setError(null)
            await deleteRound(roundId)
            setRounds(prev => prev.filter(r => r.roundId !== roundId))
        } catch (err: any) {
            setError(extractError(err, "Failed to delete round"))
            throw err
        } finally {
            setActionLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!sportId) return
        fetchRoundsRef.current(sportId)
    }, [sportId])

    return {
        rounds,
        loading,
        actionLoading,
        error,
        fetchRounds,
        generateFirstRound: handleGenerateFirstRound,
        recordTimes: handleRecordTimes,
        shortlistRound: handleShortlist,
        finalizeRound: handleFinalize,
        deleteRound: handleDeleteRound,
    }
}
