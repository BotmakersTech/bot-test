// src/feature/Team/api/team.api.ts

import api from "../../../shared/api/Base";

// ======================================================
// TYPES
// ======================================================

export interface CreateTeamPayload {
  teamName: string;

  description?: string;

  logoUrl?: string;

  institutionName?: string;

  city?: string;
  state?: string;
  country?: string;
}

export interface TeamResponse {
  id: string;

  teamCode: string;

  teamName: string;

  description?: string;

  logoUrl?: string;

  institutionName?: string;

  city?: string;
  state?: string;
  country?: string;

  memberRole?: string;

  status?: string;

  createdAt?: string;
}

export interface CreateTeamResponse {
  teamId: string;

  teamCode: string;

  teamName: string;
}

// ======================================================
// CREATE TEAM
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

// ======================================================
// GET CURRENT USER TEAM
// ======================================================

export const getMyTeam =
  async (): Promise<TeamResponse> => {
    const res = await api.get(
      "/teams/getTeam/my"
    );

    return {
      ...res.data,

      logoUrl:
        res.data.logoUrl ||
        res.data.logo_Url ||
        null,
    };
  };

  

// ======================================================
// GET TEAM BY TEAM CODE
// ======================================================

export const getTeamByCode = async (
  botLeagueTeamId: string
): Promise<TeamResponse> => {
  const res = await api.get(
    `/teams/getTeam/${botLeagueTeamId}`
  );

  return {
    ...res.data,

    logoUrl:
      res.data.logoUrl ||
      res.data.logo_Url ||
      null,
  };
};

// ======================================================
// UPDATE TEAM
// ======================================================

export const updateTeam = async (
  payload: Partial<CreateTeamPayload>
): Promise<TeamResponse> => {
  const res = await api.patch(
    "/teams/updateTeam",
    payload
  );

  return {
    ...res.data,

    logoUrl:
      res.data.logoUrl ||
      res.data.logo_Url ||
      null,
  };
};

// ======================================================
// LEAVE TEAM
// ======================================================

export const leaveTeam =
  async (): Promise<string> => {
    const res = await api.post(
      "/teams/leaveTeam"
    );

    return res.data;
  };

// ======================================================
// GET TEAM MEMBERS
// ======================================================

export const getTeamMembers = async (
  teamId: string
) => {
  const res = await api.get(
    `/teams/${teamId}/members`
  );

  return res.data;
};