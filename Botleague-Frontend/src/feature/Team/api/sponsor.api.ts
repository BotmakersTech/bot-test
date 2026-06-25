import api from "../../../shared/api/Base";

// ── Types ────────────────────────────────────────────────────────────────────

export const SPONSOR_TYPES = [
  "Technology Partner",
  "Educational Partner",
  "Equipment Partner",
  "Funding Sponsor",
  "Venue Sponsor",
  "Community Partner",
  "Media Partner",
] as const;

export type SponsorType = typeof SPONSOR_TYPES[number];

export interface Sponsor {
  id: string;
  teamId: string;
  sponsorName: string;
  sponsorType: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  displayOrder: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorRequest {
  sponsorName: string;
  sponsorType?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  displayOrder?: number;
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function uploadSponsorLogo(teamId: string, file: File): Promise<string> {
  const { data } = await api.post<{ uploadUrl: string; fileUrl: string; key: string }>(
    "/sponsors/upload/logo",
    null,
    { params: { teamId, fileType: file.type, fileSize: file.size } }
  );
  const res = await fetch(data.uploadUrl, { method: "PUT", body: file });
  if (!res.ok) throw new Error("Upload to storage failed");
  return data.fileUrl;
}

export async function getTeamSponsors(teamId: string): Promise<Sponsor[]> {
  const res = await api.get<Sponsor[]>(`/sponsors/team/${teamId}`);
  return res.data;
}

export async function addSponsor(teamId: string, data: SponsorRequest): Promise<Sponsor> {
  const res = await api.post<Sponsor>(`/sponsors/team/${teamId}`, data);
  return res.data;
}

export async function updateSponsor(sponsorId: string, data: SponsorRequest): Promise<Sponsor> {
  const res = await api.put<Sponsor>(`/sponsors/${sponsorId}`, data);
  return res.data;
}

export async function deleteSponsor(sponsorId: string): Promise<void> {
  await api.delete(`/sponsors/${sponsorId}`);
}
