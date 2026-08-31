import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useRealtime } from './RealtimeProvider'
import { updateMatchRealtime, triggerRankingsRefresh, fetchMatchesByEventSport } from '../../feature/Matches/store/matchesSlice'
import type { PublicMatchView } from '../../feature/Matches/api/matches.api'
import type { RealtimeEventType, RealtimeMessage, RankingsUpdatedPayload } from './realtimeTypes'

/** Merges a realtime match payload into a locally-`useState`-held match list —
 *  for the (many) pages that don't read matches from the `matchesSlice` Redux
 *  store and so don't benefit from `updateMatchRealtime`'s dispatch. Insert if
 *  not already present (covers MATCH_CREATED arriving before the initial
 *  fetch resolves), otherwise merge the partial fields in place. */
export function mergeMatchUpdate<T extends { matchId: string }>(list: T[], payload: Partial<T> & { matchId: string }): T[] {
  const idx = list.findIndex((m) => m.matchId === payload.matchId)
  if (idx === -1) return [...list, payload as T]
  const next = list.slice()
  // Ignore keys the frame didn't include so a sparse push can't blank out
  // fields (status, winner, scores) a fuller earlier frame already set.
  const clean: Partial<T> = {}
  for (const k in payload) {
    if (payload[k as keyof typeof payload] !== undefined) {
      clean[k as keyof T] = payload[k as keyof typeof payload] as T[keyof T]
    }
  }
  next[idx] = { ...next[idx], ...clean }
  return next
}

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
 *
 * `onEvent` is optional — pass it from any page that holds its own local
 * `useState` match list (most Admin/Organizer/Judge pages do, not just the
 * Redux-backed ones) to merge live updates in, e.g.:
 *   useSportMatchRealtime(sportId, (type, payload) => {
 *     if (type === 'RANKINGS_UPDATED' || type === 'BRACKET_CREATED') return
 *     setMatches(prev => mergeMatchUpdate(prev, payload as MatchDTO))
 *   })
 * Kept in a ref so passing an inline arrow function every render doesn't
 * tear down and resubscribe the WebSocket subscription.
 */
export function useSportMatchRealtime(
  eventSportId: string | null | undefined,
  onEvent?: (type: RealtimeEventType, payload: unknown) => void
) {
  const dispatch = useDispatch()
  const { subscribe, connected } = useRealtime()
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!eventSportId) return

    // Catch-up: whenever the socket (re)connects OR the tab returns to the
    // foreground, re-pull matches + poke the leaderboard so anything that
    // changed while we were disconnected/backgrounded — a score, a completed
    // match, a bracket advance — lands without a manual refresh.
    const catchUp = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatch((fetchMatchesByEventSport as any)(eventSportId))
      dispatch(triggerRankingsRefresh(eventSportId))
    }

    if (connected) catchUp()

    const onForeground = () => {
      if (document.visibilityState === 'visible') catchUp()
    }
    document.addEventListener('visibilitychange', onForeground)
    window.addEventListener('focus', onForeground)

    const unsubscribe = subscribe(`/topic/sports/${eventSportId}`, (frame) => {
      try {
        const msg: RealtimeMessage = JSON.parse(frame.body)
        switch (msg.type) {
          case 'MATCH_CREATED':      // one match pushed during bracket generation
          case 'MATCH_SCHEDULED':    // scheduledAt / date+time updated
          case 'MATCH_STARTED':
          case 'MATCH_SCORE_UPDATED':
          case 'MATCH_RESULT_SUBMITTED':
          case 'MATCH_RESULT_PENDING_APPROVAL':
          case 'MATCH_RESULT_APPROVED':
          case 'MATCH_RESULT_REJECTED':
          case 'MATCH_COMPLETED':
          case 'MATCH_UPDATED':      // participant slots filled after winner/loser advancement
            dispatch(updateMatchRealtime(msg.payload as PublicMatchView))
            // A completed result now moves ranking points in the same request
            // (no approval step), so refresh the leaderboard in this tick
            // rather than waiting on a separate RANKINGS_UPDATED frame that
            // could be dropped independently.
            if (
              msg.type === 'MATCH_COMPLETED' ||
              msg.type === 'MATCH_RESULT_APPROVED' ||
              msg.type === 'MATCH_RESULT_REJECTED'
            ) {
              dispatch(triggerRankingsRefresh(eventSportId))
            }
            break
          case 'BRACKET_CREATED': // all individual MATCH_CREATED already pushed; this is a fence signal
            // fetch once as a safety net in case any MATCH_CREATED was missed;
            // bracket generation also seeds the leaderboard, so refresh it too
            dispatch((fetchMatchesByEventSport as any)(eventSportId))
            dispatch(triggerRankingsRefresh(eventSportId))
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
        onEventRef.current?.(msg.type, msg.payload)
      } catch {
        // malformed frame — ignore
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', onForeground)
      window.removeEventListener('focus', onForeground)
      unsubscribe()
    }
  }, [eventSportId, subscribe, dispatch, connected])
}

/**
 * Same as useSportMatchRealtime, but for pages watching several sports at
 * once (e.g. a judge assigned to matches across more than one sport) — one
 * subscription per sport, all funneled into the same callback. Does NOT
 * touch Redux; purely for local-state pages.
 */
export function useMultiSportMatchRealtime(
  eventSportIds: string[],
  onEvent: (type: RealtimeEventType, payload: unknown) => void
) {
  const { subscribe, connected } = useRealtime()
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const key = Array.from(new Set(eventSportIds)).sort().join(',')

  useEffect(() => {
    if (!key) return
    const ids = key.split(',')

    const unsubscribes = ids.map((id) =>
      subscribe(`/topic/sports/${id}`, (frame) => {
        try {
          const msg: RealtimeMessage = JSON.parse(frame.body)
          onEventRef.current(msg.type, msg.payload)
        } catch {
          // malformed frame — ignore
        }
      })
    )

    return () => unsubscribes.forEach((unsub) => unsub())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, subscribe, connected])
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
