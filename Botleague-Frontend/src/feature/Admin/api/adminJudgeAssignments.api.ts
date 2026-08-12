import api from "../../../shared/api/Base";

export interface JudgeEventAssignment {
  eventJudgeId: string;
  eventId: string;
  eventName: string;
  scoringRights: boolean;
  createdAt: string;
  assignedSportId: string | null;
  assignedSportName: string | null;
}

export interface EventSportOption {
  eventSportId: string;
  sportName: string;
  matchCount: number;
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

export const getEventSportsForAssignment = async (eventId: string): Promise<EventSportOption[]> => {
  const res = await api.get(`/admin/judges/events/${eventId}/sports`);
  return res.data;
};

export const assignSportToJudge = async (
  userId: string,
  eventJudgeId: string,
  eventSportId: string
): Promise<JudgeEventAssignment> => {
  const res = await api.put(`/admin/judges/${userId}/assignments/${eventJudgeId}/sport`, { eventSportId });
  return res.data;
};

export const unassignSportFromJudge = async (userId: string, eventJudgeId: string): Promise<JudgeEventAssignment> => {
  const res = await api.delete(`/admin/judges/${userId}/assignments/${eventJudgeId}/sport`);
  return res.data;
};
