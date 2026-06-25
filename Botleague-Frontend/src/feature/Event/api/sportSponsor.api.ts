import api from "../../../shared/api/Base";

export interface SportSponsor {
  id: string;
  sportId: string;
  sponsorName: string;
  sponsorType: string | null;
  website: string | null;
  logoUrl: string | null;
  displayOrder: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SportSponsorRequest {
  sponsorName: string;
  sponsorType?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  displayOrder?: number | null;
}

export async function getSportSponsors(sportId: string): Promise<SportSponsor[]> {
  const { data } = await api.get(`/sport-sponsors/sport/${sportId}`);
  return data;
}

export async function addSportSponsor(
  sportId: string,
  body: SportSponsorRequest
): Promise<SportSponsor> {
  const { data } = await api.post(`/sport-sponsors/sport/${sportId}`, body);
  return data;
}

export async function updateSportSponsor(
  sponsorId: string,
  body: SportSponsorRequest
): Promise<SportSponsor> {
  const { data } = await api.put(`/sport-sponsors/${sponsorId}`, body);
  return data;
}

export async function deleteSportSponsor(sponsorId: string): Promise<void> {
  await api.delete(`/sport-sponsors/${sponsorId}`);
}

export async function getSportSponsorLogoUploadUrl(
  sportId: string,
  fileType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const { data } = await api.post("/sport-sponsors/upload/logo", null, {
    params: { sportId, fileType, fileSize },
  });
  return data;
}
