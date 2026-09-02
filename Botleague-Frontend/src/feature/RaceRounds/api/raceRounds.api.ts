import api from "../../../shared/api/Base"

// =====================================================
// ENUMS
// Mirror of backend com.botleague.backend.timetrial.enums.*
// =====================================================

export type RoundStatus =
    | "OPEN"
    | "TIMES_RECORDED"
    | "ADVANCED"
    | "FINALIZED"
    | "CANCELLED"

export type RoundParticipantStatus =
    | "PENDING"
    | "TIMED"
    | "DNF"
    | "ADVANCED"
    | "ELIMINATED"
    | "FINISHED"

// =====================================================
// RESPONSE DTOs — mirror RoundResponseDTO / RoundEntryResponseDTO
// =====================================================

export interface RoundEntryDTO {
    entryId: string
    registrationId: string
    robotName?: string
    teamName?: string
    /** Milliseconds. Null until recorded (or dnf=true instead). */
    timeMillis?: number | null
    dnf?: boolean
    status: RoundParticipantStatus
    /** Standard competition ranking (1,2,2,4) within this round. Null until timed. */
    rankInRound?: number | null
    notes?: string | null
}

export interface RoundDTO {
    roundId: string
    eventSportId: string
    roundNumber: number
    status: RoundStatus
    /** What staff requested at shortlist time. Null until shortlisted. */
    cutoffCount?: number | null
    /** May exceed cutoffCount when there's a tie at the boundary time. */
    actualAdvancedCount?: number | null
    entries: RoundEntryDTO[]
}

// =====================================================
// REQUEST DTOs
// =====================================================

export interface EntryTimeInput {
    registrationId: string
    timeMillis?: number
    dnf?: boolean
    notes?: string
}

// =====================================================
// API FUNCTIONS — mirror /api/v1/race-rounds
// =====================================================

export const generateFirstRound =
    async (eventSportId: string): Promise<RoundDTO> => {
        const response = await api.post<RoundDTO>("/v1/race-rounds/generate", { eventSportId })
        return response.data
    }

export const getRoundsForSport =
    async (eventSportId: string): Promise<RoundDTO[]> => {
        const response = await api.get<RoundDTO[]>(`/v1/race-rounds/event-sport/${eventSportId}`)
        return response.data
    }

export const getRound =
    async (roundId: string): Promise<RoundDTO> => {
        const response = await api.get<RoundDTO>(`/v1/race-rounds/${roundId}`)
        return response.data
    }

export const recordRoundTimes =
    async (roundId: string, entries: EntryTimeInput[]): Promise<RoundDTO> => {
        const response = await api.patch<RoundDTO>(`/v1/race-rounds/${roundId}/times`, { entries })
        return response.data
    }

export const shortlistRound =
    async (roundId: string, cutoffCount: number): Promise<RoundDTO> => {
        const response = await api.patch<RoundDTO>(`/v1/race-rounds/${roundId}/shortlist`, { cutoffCount })
        return response.data
    }

export const finalizeRound =
    async (roundId: string): Promise<RoundDTO> => {
        const response = await api.patch<RoundDTO>(`/v1/race-rounds/${roundId}/finalize`)
        return response.data
    }

export const deleteRound =
    async (roundId: string): Promise<void> => {
        await api.delete(`/v1/race-rounds/${roundId}`)
    }
