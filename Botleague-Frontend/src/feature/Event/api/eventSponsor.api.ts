import api from "../../../shared/api/Base";

export const EVENT_SPORT_SPONSOR_TYPES = [
  "Title Sponsor",
  "Gold Sponsor",
  "Silver Sponsor",
  "Bronze Sponsor",
  "Technology Partner",
  "Media Partner",
  "Equipment Partner",
] as const;

export type EventSponsorType = typeof EVENT_SPORT_SPONSOR_TYPES[number];

export interface EventSponsor {
  id: string;
  eventId: string;
  sponsorName: string;
  sponsorType: string | null;
  website: string | null;
  logoUrl: string | null;
  displayOrder: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsorRequest {
  sponsorName: string;
  sponsorType?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  displayOrder?: number | null;
}

export async function getEventSponsors(eventId: string): Promise<EventSponsor[]> {
  const { data } = await api.get(`/event-sponsors/event/${eventId}`);
  return data;
}

export async function addEventSponsor(
  eventId: string,
  body: EventSponsorRequest
): Promise<EventSponsor> {
  const { data } = await api.post(`/event-sponsors/event/${eventId}`, body);
  return data;
}

export async function updateEventSponsor(
  sponsorId: string,
  body: EventSponsorRequest
): Promise<EventSponsor> {
  const { data } = await api.put(`/event-sponsors/${sponsorId}`, body);
  return data;
}

export async function deleteEventSponsor(sponsorId: string): Promise<void> {
  await api.delete(`/event-sponsors/${sponsorId}`);
}

export async function getEventSponsorLogoUploadUrl(
  eventId: string,
  fileType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const { data } = await api.post("/event-sponsors/upload/logo", null, {
    params: { eventId, fileType, fileSize },
  });
  return data;
}
