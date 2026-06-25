"use client"

import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react"

import {
    createEvent as createEventApi,
    createEventSport as createEventSportApi,
    updateEventSport as updateEventSportApi,
    getEventSports as getEventSportsApi,
    makeEventLive as makeEventLiveApi,
    getAllEvents,
    getEventById,
    getEventSportById,
    changeRegistrationStatus,
    updateEvent as updateEventApi,
    changeEventStatus as changeEventStatusApi,
    deleteEvent as deleteEventApi,

    type CreateEventRequest,
    type CreateEventSportRequest,
    type UpdateEventRequest,
    type AdminEventResponse,
    type GetEventSportDTO,
} from "../api/admin.api"

// =====================================================
// TYPES
// =====================================================

export interface LineupPlayer {

    id: string

    fullName: string

    role?: string
}

export interface Registration {

    id: string

    teamName: string

    teamLogoUrl?: string

    lineup?: LineupPlayer[]
}

export interface EventSport {

    id: string

    sportName: string

    registrations?: Registration[]
}

// =====================================================
// HOOK
// =====================================================

export const useAdminEvents = (
    eventId?: string,
    sportId?: string
) => {

    // =====================================================
    // STATE
    // =====================================================

    const [events, setEvents] =
        useState<AdminEventResponse[]>([])

    const [event, setEvent] =
        useState<AdminEventResponse | null>(
            null
        )

    const [eventSports, setEventSports] =
        useState<GetEventSportDTO[]>([])

    const [loading, setLoading] =
        useState<boolean>(false)

    const [createLoading, setCreateLoading] =
        useState<boolean>(false)

    const [sportLoading, setSportLoading] =
        useState<boolean>(false)

    const [publishLoading, setPublishLoading] =
        useState<boolean>(false)

    const [error, setError] =
        useState<string | null>(null)

    // =====================================================
    // FETCH ALL EVENTS
    // =====================================================

    // =====================================================
// FETCH MATCHES BY EVENT SPORT
// =====================================================

    const fetchEvents =
        useCallback(async () => {

            try {

                setLoading(true)

                setError(null)

                const response =
                    await getAllEvents()

                setEvents(response)

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to fetch events"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // FETCH EVENT BY ID
    // =====================================================

    const fetchEventById =
        useCallback(async (
            id: string
        ) => {

            try {

                setLoading(true)

                setError(null)

                const response =
                    await getEventById(id)

                setEvent(response)

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to fetch event"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // REFETCH — re-fetch the current single event
    // =====================================================

    const refetch =
        useCallback(async () => {

            if (!eventId) return

            await fetchEventById(eventId)

        }, [eventId, fetchEventById])

    // =====================================================
    // FETCH EVENT SPORT BY ID
    // =====================================================

    const fetchEventSportById =
        useCallback(async (
            eventId: string,
            sportId: string
        ) => {

            try {

                setLoading(true)

                setError(null)

                const response =
                    await getEventSportById(
                        eventId,
                        sportId
                    )

                setEvent(response)

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to fetch event sport"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setLoading(false)
            }

        }, [])

    // =====================================================
    // FETCH EVENT SPORTS LIST
    // =====================================================

    const fetchEventSports =
        useCallback(async (
            id: string
        ) => {

            try {

                setSportLoading(true)

                setError(null)

                const response =
                    await getEventSportsApi(id)

                setEventSports(response)

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to fetch event sports"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setSportLoading(false)
            }

        }, [])

    // =====================================================
    // CREATE EVENT
    // =====================================================

    const handleCreateEvent =
        useCallback(async (
            request: CreateEventRequest
        ) => {

            try {

                setCreateLoading(true)

                setError(null)

                const response =
                    await createEventApi(
                        request
                    )

                // =====================================================
                // UPDATE EVENTS STATE
                // =====================================================

                setEvents((prev) => [
                    response,
                    ...prev
                ])

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to create event"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setCreateLoading(false)
            }

        }, [])

    // =====================================================
    // CREATE EVENT SPORT
    // =====================================================

    const handleCreateEventSport =
        useCallback(async (
            evtId: string,
            request: CreateEventSportRequest
        ) => {

            try {

                setSportLoading(true)

                setError(null)

                const response =
                    await createEventSportApi(
                        evtId,
                        request
                    )

                // =====================================================
                // OPTIMISTICALLY APPEND SPORT TO eventSports LIST
                // =====================================================

                setEventSports((prev) => [
                    ...prev,
                    {
                        id:     response.id,
                        sport:  response.sport ?? response.sportName ?? "",
                        status: undefined
                    }
                ])

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to add sport"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setSportLoading(false)
            }

        }, [])

    // =====================================================
    // UPDATE EVENT SPORT
    // =====================================================

    // ======================================================
// CHANGE REGISTRATION STATUS HOOK
// ======================================================

const changeSportRegistrationStatus =
    useCallback(async (
      eventId: string,
      sportId: string
    ) => {

      try {

        setSportLoading(true)

        const response =
          await changeRegistrationStatus(
            eventId,
            sportId
          )

        return response

      } catch (err: any) {

        const message =
          err?.response?.data?.message ||
          "Failed to update registration status"

        setError(message)

        throw new Error(message, { cause: err })

      } finally {

        setSportLoading(false)
      }

    }, [])

    const handleUpdateEventSport =
        useCallback(async (
            evtId: string,
            spId: string,
            request: CreateEventSportRequest
        ) => {

            try {

                setSportLoading(true)

                setError(null)

                await updateEventSportApi(
                    evtId,
                    spId,
                    request
                )

                // =====================================================
                // REFRESH SPORTS LIST AFTER UPDATE
                // =====================================================

                await fetchEventSports(evtId)

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to update sport"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setSportLoading(false)
            }

        }, [fetchEventSports])

    // =====================================================
    // PUBLISH EVENT
    // =====================================================

    const handlePublishEvent =
        useCallback(async (
            id: string
        ) => {

            try {

                setPublishLoading(true)

                setError(null)

                const response =
                    await makeEventLiveApi(id)

                // =====================================================
                // REFLECT UPDATED STATUS IN LOCAL STATE
                // =====================================================

                setEvent(response)

                setEvents(prev =>
                    prev.map(e =>
                        e.id === id ? response : e
                    )
                )

                return response

            } catch (err: any) {

                const message =
                    err?.response?.data?.message ||
                    "Failed to publish event"

                setError(message)

                throw new Error(message, { cause: err })

            } finally {

                setPublishLoading(false)
            }

        }, [])

    // =====================================================
    // UPDATE EVENT
    // =====================================================

    const handleUpdateEvent = useCallback(async (evtId: string, request: UpdateEventRequest) => {
        try {
            setSportLoading(true)
            setError(null)
            const response = await updateEventApi(evtId, request)
            setEvent(response)
            setEvents(prev => prev.map(e => e.id === evtId ? response : e))
            return response
        } catch (err: any) {
            const message = err?.response?.data?.message || "Failed to update event"
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setSportLoading(false)
        }
    }, [])

    // =====================================================
    // CHANGE EVENT STATUS
    // =====================================================

    const handleChangeEventStatus = useCallback(async (evtId: string, status: string) => {
        try {
            setPublishLoading(true)
            setError(null)
            const response = await changeEventStatusApi(evtId, status)
            setEvent(response)
            setEvents(prev => prev.map(e => e.id === evtId ? response : e))
            return response
        } catch (err: any) {
            const message = err?.response?.data?.message || "Failed to change status"
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setPublishLoading(false)
        }
    }, [])

    // =====================================================
    // DELETE EVENT
    // =====================================================

    const handleDeleteEvent = useCallback(async (evtId: string) => {
        try {
            setLoading(true)
            setError(null)
            await deleteEventApi(evtId)
            setEvents(prev => prev.filter(e => e.id !== evtId))
            setEvent(null)
        } catch (err: any) {
            const message = err?.response?.data?.message || "Failed to delete event"
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setLoading(false)
        }
    }, [])

    // =====================================================
    // AUTO LOAD
    // =====================================================

    useEffect(() => {

        // =====================================================
        // EVENT SPORT
        // =====================================================

        if (eventId && sportId) {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEventSportById(
        eventId,
        sportId
    )

 

    return
}

        // =====================================================
        // SINGLE EVENT
        // =====================================================

        if (eventId) {

            fetchEventById(eventId)

            return
        }

        // =====================================================
        // ALL EVENTS
        // =====================================================

        fetchEvents()

    }, [eventId, sportId, fetchEvents, fetchEventById, fetchEventSportById])

    // =====================================================
    // SELECTED SPORT
    // =====================================================

    const selectedSport =
        useMemo(() => {

            if (!event || !sportId) {

                return null
            }

            return event?.sports?.find(
                (sport) =>
                    sport.id === sportId
            ) || null

        }, [event, sportId])

    // =====================================================
    // REGISTRATIONS
    // =====================================================

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const registrations =
        selectedSport?.registrations || []

    // =====================================================
    // TOTAL LINEUP PLAYERS
    // =====================================================

    const totalLineupPlayers =
        useMemo(() => {

            return registrations.reduce(
                (
                    total,
                    team
                ) => {

                    return (
                        total +
                        (
                            team?.lineup?.length || 0
                        )
                    )

                },
                0
            )

        }, [registrations])

    // =====================================================
    // RETURN
    // =====================================================

    return {

        // =====================================================
        // DATA
        // =====================================================

        events,
        event,
        eventSports,
        
        selectedSport,
        registrations,
        totalLineupPlayers,
        changeSportRegistrationStatus,

        // =====================================================
        // LOADING
        // =====================================================

        loading,
        createLoading,
        sportLoading,
        publishLoading,

        // =====================================================
        // ERROR
        // =====================================================

        error,

        // =====================================================
        // ACTIONS
        // =====================================================

        fetchEvents,
        fetchEventById,
        fetchEventSportById,
        fetchEventSports,
       
        refetch,
        createEvent:      handleCreateEvent,
        createEventSport: handleCreateEventSport,
        updateEventSport: handleUpdateEventSport,
        publishEvent:     handlePublishEvent,
        updateEvent:      handleUpdateEvent,
        changeEventStatus: handleChangeEventStatus,
        deleteEvent:      handleDeleteEvent,
    }
}