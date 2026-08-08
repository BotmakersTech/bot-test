import api from "../../../shared/api/Base";
import type { MatchDTO } from "./adminMatches.api";

export interface JudgeEventAssignment {
  eventJudgeId: string;
  eventId: string;
  eventName: string;
  scoringRights: boolean;
  createdAt: string;
  assignedMatchIds: string[];
}

export interface SportMatches {
  eventSportId: string;
  sportName: string;
  matches: MatchDTO[];
}

export const getJudgeAssignments = async (userId: string): Promise<JudgeEventAssignment[]> => {
  const res = await api.get(`/admin/judges/${userId}/assignments`);
  return res.data;
};

export const assignJudgeToEvent = async (userId: string, eventId: string): Promise<JudgeEventAssignment> => {
  const res = await api.post(`/admin/judges/${userId}/assignments`, { eventId });
  return res.data;
};

export const removeJudgeFromEvent = async (userId: string, eventJudgeId: string): Promise<void> => {
  await api.delete(`/admin/judges/${userId}/assignments/${eventJudgeId}`);
};

export const getEventMatchesForAssignment = async (eventId: string): Promise<SportMatches[]> => {
  const res = await api.get(`/admin/judges/events/${eventId}/matches`);
  return res.data;
};

export const assignMatchToJudge = async (userId: string, eventJudgeId: string, matchId: string): Promise<void> => {
  await api.post(`/admin/judges/${userId}/assignments/${eventJudgeId}/matches/${matchId}`);
};

export const unassignMatchFromJudge = async (userId: string, eventJudgeId: string, matchId: string): Promise<void> => {
  await api.delete(`/admin/judges/${userId}/assignments/${eventJudgeId}/matches/${matchId}`);
};
