import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getEventSportDetail,
  updateEventSport as updateEventSportApi,
  toggleSportRegistration,

  type OrganizerEvent,
  type CreateEventSportRequest,
} from "../api/organizer.api"

// =====================================================
// HOOK — organizer-scoped equivalent of Admin's useAdminEvents,
// trimmed to only what the sport-detail + bracket pages need.
// Backend enforces event-assignment scoping; this hook just
// wires the calls and local state.
// =====================================================

export const useOrganizerSportDetail = (eventId?: string, sportId?: string) => {
  const [event, setEvent] = useState<OrganizerEvent | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [sportLoading, setSportLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEventSportById = useCallback(async (evtId: string, spId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await getEventSportDetail(evtId, spId)
      setEvent(response)
      return response
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to fetch event sport"
      setError(message)
      throw new Error(message, { cause: err })
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    if (!eventId || !sportId) return
    await fetchEventSportById(eventId, sportId)
  }, [eventId, sportId, fetchEventSportById])

  const changeSportRegistrationStatus = useCallback(async (evtId: string, spId: string) => {
    try {
      setSportLoading(true)
      return await toggleSportRegistration(evtId, spId)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to update registration status"
      setError(message)
      throw new Error(message, { cause: err })
    } finally {
      setSportLoading(false)
    }
  }, [])

  const updateEventSport = useCallback(async (evtId: string, spId: string, request: CreateEventSportRequest) => {
    try {
      setSportLoading(true)
      setError(null)
      await updateEventSportApi(evtId, spId, request)
      await fetchEventSportById(evtId, spId)
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to update sport"
      setError(message)
      throw new Error(message, { cause: err })
    } finally {
      setSportLoading(false)
    }
  }, [fetchEventSportById])

  useEffect(() => {
    if (eventId && sportId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEventSportById(eventId, sportId)
    }
  }, [eventId, sportId, fetchEventSportById])

  const selectedSport = useMemo(() => {
    if (!event || !sportId) return null
    return event.sports?.find(sport => sport.id === sportId) || null
  }, [event, sportId])

  const registrations = selectedSport?.registrations || []

  return {
    event,
    selectedSport,
    registrations,

    loading,
    sportLoading,
    error,

    refetch,
    fetchEventSportById,
    changeSportRegistrationStatus,
    updateEventSport,
  }
}
