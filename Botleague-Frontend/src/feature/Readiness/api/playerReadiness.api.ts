import api from "../../../shared/api/Base";

export interface ReadinessDTO {
  matchId: string;
  userId: string;
  ready: boolean;
  arrivedAtVenue: boolean;
  robotChecked: boolean;
  batteryCharged: boolean;
  equipmentVerified: boolean;
  readinessPercent: number;
}

export interface UpdateReadinessRequest {
  registrationId?: string;
  ready?: boolean;
  arrivedAtVenue?: boolean;
  robotChecked?: boolean;
  batteryCharged?: boolean;
  equipmentVerified?: boolean;
}

export const getMyReadiness = async (matchId: string): Promise<ReadinessDTO> => {
  const res = await api.get<ReadinessDTO>(`/v1/matches/${matchId}/readiness/my`);
  return res.data;
};

export const updateMyReadiness = async (
  matchId: string,
  req: UpdateReadinessRequest
): Promise<ReadinessDTO> => {
  const res = await api.patch<ReadinessDTO>(
    `/v1/matches/${matchId}/readiness/my`,
    req
  );
  return res.data;
};
