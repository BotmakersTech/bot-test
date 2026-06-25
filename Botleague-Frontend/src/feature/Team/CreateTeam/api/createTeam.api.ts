import api from "../../../../shared/api/Base";

// ======================================================
// TYPES
// ======================================================

export interface CreateTeamPayload {
  teamName: string;
  description?: string;
  institutionName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CreateTeamResponse {
id: string;
  teamId: string;
  teamCode: string;
  teamName: string;
  teamLogoUrl?: string;
}

// ======================================================
// API
// ======================================================

export const createTeam = async (
  payload: CreateTeamPayload
): Promise<CreateTeamResponse> => {

  const res = await api.post(
    "/teams/createTeam",
    payload
  );

  return res.data;
};