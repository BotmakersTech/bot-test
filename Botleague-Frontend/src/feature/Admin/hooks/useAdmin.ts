"use client"

import { useCallback, useEffect, useState } from "react"

import {
    createEvent as createEventApi,
    getAllEvents,
    getEventById,
    getEventSportById,
    type CreateEventRequest,
    type AdminEventResponse
} from "../api/admin.api"

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

    const [loading, setLoading] =
        useState<boolean>(false)

    const [createLoading, setCreateLoading] =
        useState<boolean>(false)

    const [error, setError] =
        useState<string | null>(null)

    // =====================================================
    // FETCH ALL EVENTS
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
                // UPDATE LOCAL EVENTS STATE
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
    // AUTO LOAD
    // =====================================================

    useEffect(() => {

        // =====================================================
        // EVENT SPORT DETAILS
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

    }, [
        eventId,
        sportId,
        fetchEvents,
        fetchEventById,
        fetchEventSportById
    ])

    // =====================================================
    // RETURN
    // =====================================================

    return {

        // =====================================================
        // DATA
        // =====================================================

        events,
        event,

        // =====================================================
        // LOADING
        // =====================================================

        loading,
        createLoading,

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
        createEvent: handleCreateEvent
    }
}