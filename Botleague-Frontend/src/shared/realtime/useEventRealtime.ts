import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRealtime } from './RealtimeProvider'
import {
  updateEventRealtime,
  updateEventStatusRealtime,
  updateEventSportRealtime,
  incrementSportRegistrationCount,
} from '../../feature/Event/store/eventsSlice'
import type { RealtimeMessage, RegistrationRealtimePayload } from './realtimeTypes'

/**
 * Subscribe to event-level realtime updates and merge them into the Redux store.
 *
 * Topics consumed:  /topic/events/{eventId}
 * Events handled:
 *   EVENT_UPDATED         → updateEventRealtime (name, venue, dates, logo)
 *   EVENT_STATUS_CHANGED  → updateEventStatusRealtime (status transition)
 *   SPORT_UPDATED         → updateEventSportRealtime (weight limits, dates, etc.)
 *   SPORT_REGISTRATION_OPENED / SPORT_REGISTRATION_CLOSED → updateEventSportRealtime
 *   REGISTRATION_NEW      → incrementSportRegistrationCount
 *
 * Optional callbacks let callers react beyond just Redux (e.g. show a toast).
 */
export function useEventRealtime(
  eventId: string | null | undefined,
  callbacks: {
    onEventUpdated?: (payload: unknown) => void
    onEventStatusChanged?: (payload: unknown) => void
    onSportUpdated?: (payload: unknown) => void
    onRegistrationNew?: (payload: RegistrationRealtimePayload) => void
  } = {}
) {
  const dispatch = useDispatch()
  const { subscribe, connected } = useRealtime()

  useEffect(() => {
    if (!eventId) return

    const unsubscribe = subscribe(`/topic/events/${eventId}`, (frame) => {
      try {
        const msg: RealtimeMessage = JSON.parse(frame.body)

        switch (msg.type) {
          case 'EVENT_UPDATED':
            dispatch(updateEventRealtime(msg.payload as any))
            callbacks.onEventUpdated?.(msg.payload)
            break

          case 'EVENT_STATUS_CHANGED':
            dispatch(updateEventStatusRealtime(msg.payload as any))
            callbacks.onEventStatusChanged?.(msg.payload)
            break

          case 'SPORT_UPDATED':
          case 'SPORT_REGISTRATION_OPENED':
          case 'SPORT_REGISTRATION_CLOSED':
            dispatch(updateEventSportRealtime(msg.payload as any))
            callbacks.onSportUpdated?.(msg.payload)
            break

          case 'REGISTRATION_NEW': {
            const reg = msg.payload as RegistrationRealtimePayload
            if (reg?.sportId) {
              dispatch(incrementSportRegistrationCount({ eventId, sportId: reg.sportId }))
            }
            callbacks.onRegistrationNew?.(reg)
            break
          }

          default:
            break
        }
      } catch {
        // malformed frame — ignore
      }
    })

    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, subscribe, dispatch, connected])
}

/**
 * Subscribe to registration count updates for a specific sport competition.
 * Also dispatches to the Redux store automatically.
 */
export function useRegistrationRealtime(
  sportId: string | null | undefined,
  eventId: string | null | undefined,
  onNew?: (payload: RegistrationRealtimePayload) => void
) {
  const dispatch = useDispatch()
  const { subscribe, connected } = useRealtime()

  useEffect(() => {
    if (!sportId) return

    const unsubscribe = subscribe(`/topic/registrations/${sportId}`, (frame) => {
      try {
        const msg: RealtimeMessage<RegistrationRealtimePayload> = JSON.parse(frame.body)
        if (msg.type === 'REGISTRATION_NEW') {
          if (eventId) {
            dispatch(incrementSportRegistrationCount({ eventId, sportId }))
          }
          onNew?.(msg.payload)
        }
      } catch {
        // malformed frame — ignore
      }
    })

    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportId, eventId, subscribe, dispatch, connected])
}
