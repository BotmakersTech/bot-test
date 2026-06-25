import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRealtime } from './RealtimeProvider'
import { updateMatchRealtime, triggerRankingsRefresh, fetchMatchesByEventSport } from '../../feature/Matches/store/matchesSlice'
import type { PublicMatchView } from '../../feature/Matches/api/matches.api'
import type { RealtimeMessage, RankingsUpdatedPayload } from './realtimeTypes'

/**
 * Subscribe to live updates for a specific match (score, status changes).
 * Use this in any component that displays a single match.
 */
export function useMatchRealtime(matchId: string | null | undefined) {
  const dispatch = useDispatch()
  const { subscribe, connected } = useRealtime()

  useEffect(() => {
    if (!matchId) return

    const unsubscribe = subscribe(`/topic/matches/${matchId}`, (frame) => {
      try {
        const msg: RealtimeMessage<PublicMatchView> = JSON.parse(frame.body)
        if (msg.payload) {
          dispatch(updateMatchRealtime(msg.payload))
        }
      } catch {
        // malformed frame — ignore
      }
    })

    return unsubscribe
  }, [matchId, subscribe, dispatch, connected])
}

/**
 * Subscribe to all match events within a sport (bracket view, sport dashboard).
 * Also listens for RANKINGS_UPDATED so the leaderboard re-fetches automatically.
 */
export function useSportMatchRealtime(eventSportId: string | null | undefined) {
  const dispatch = useDispatch()
  const { subscribe, connected } = useRealtime()

  useEffect(() => {
    if (!eventSportId) return

    const unsubscribe = subscribe(`/topic/sports/${eventSportId}`, (frame) => {
      try {
        const msg: RealtimeMessage = JSON.parse(frame.body)
        switch (msg.type) {
          case 'MATCH_CREATED':      // one match pushed during bracket generation
          case 'MATCH_SCHEDULED':    // scheduledAt / date+time updated
          case 'MATCH_STARTED':
          case 'MATCH_SCORE_UPDATED':
          case 'MATCH_RESULT_SUBMITTED':
          case 'MATCH_COMPLETED':
          case 'MATCH_UPDATED':      // participant slots filled after winner/loser advancement
            dispatch(updateMatchRealtime(msg.payload as PublicMatchView))
            break
          case 'BRACKET_CREATED': // all individual MATCH_CREATED already pushed; this is a fence signal
            // fetch once as a safety net in case any MATCH_CREATED was missed
            dispatch((fetchMatchesByEventSport as any)(eventSportId))
            break
          case 'RANKINGS_UPDATED':
            dispatch(
              triggerRankingsRefresh(
                (msg.payload as RankingsUpdatedPayload).eventSportId
              )
            )
            break
          default:
            break
        }
      } catch {
        // malformed frame — ignore
      }
    })

    return unsubscribe
  }, [eventSportId, subscribe, dispatch, connected])
}

/**
 * Subscribe to rankings-only signals for a sport.
 * Components showing leaderboard tables can use this to know when to re-fetch.
 */
export function useRankingsRealtime(
  eventSportId: string | null | undefined,
  onRefresh: () => void
) {
  const { subscribe, connected } = useRealtime()

  useEffect(() => {
    if (!eventSportId) return

    const unsubscribe = subscribe(`/topic/rankings/${eventSportId}`, (frame) => {
      try {
        const msg: RealtimeMessage = JSON.parse(frame.body)
        if (msg.type === 'RANKINGS_UPDATED') {
          onRefresh()
        }
      } catch {
        // malformed frame — ignore
      }
    })

    return unsubscribe
  }, [eventSportId, subscribe, connected, onRefresh])
}
