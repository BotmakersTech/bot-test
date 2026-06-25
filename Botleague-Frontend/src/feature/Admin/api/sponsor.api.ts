import api from "../../../shared/api/Base"

export interface EventSponsor {
  id: string
  eventId: string
  sponsorName: string
  sponsorType?: string
  website?: string
  logoUrl?: string
  displayOrder?: number
  createdAt?: string
}

export interface AddSponsorRequest {
  sponsorName: string
  sponsorType?: string
  website?: string
  logoUrl?: string
  displayOrder?: number
}

export const getEventSponsors = async (eventId: string): Promise<EventSponsor[]> => {
  const res = await api.get<EventSponsor[]>(`/event-sponsors/event/${eventId}`)
  return res.data
}

export const addEventSponsor = async (eventId: string, req: AddSponsorRequest): Promise<EventSponsor> => {
  const res = await api.post<EventSponsor>(`/event-sponsors/event/${eventId}`, req)
  return res.data
}

export const updateEventSponsor = async (sponsorId: string, req: AddSponsorRequest): Promise<EventSponsor> => {
  const res = await api.put<EventSponsor>(`/event-sponsors/${sponsorId}`, req)
  return res.data
}

export const deleteEventSponsor = async (sponsorId: string): Promise<void> => {
  await api.delete(`/event-sponsors/${sponsorId}`)
}
