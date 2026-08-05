import api from "../../../shared/api/Base";

// Self-service "apply to volunteer" flow — distinct from the organiser
// roster CRUD in feature/Organizer/api/organizer.api.ts.

export interface VolunteerApplication {
  id: string;
  eventId: string;
  userId?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  dutyStation: string | null;
  shift: string | null;
  notes: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface VolunteerApplicationRequest {
  shift?: string;
  notes?: string;
}

export const getMyVolunteerApplication = async (eventId: string): Promise<VolunteerApplication | null> => {
  const res = await api.get(`/events/${eventId}/volunteer-applications/me`, {
    validateStatus: (status) => status === 200 || status === 204,
  });
  return res.status === 204 ? null : res.data;
};

export const applyToVolunteer = async (
  eventId: string,
  req: VolunteerApplicationRequest
): Promise<VolunteerApplication> => {
  const res = await api.post(`/events/${eventId}/volunteer-applications`, req);
  return res.data;
};

export interface VolunteerAssignment {
  id: string;
  eventId: string;
  eventName: string | null;
  eventCity: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  dutyStation: string | null;
  shift: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string | null;
  decidedAt: string | null;
}

// Every application/assignment this volunteer has ever made, across all
// events — powers the Volunteer dashboard, distinct from getMyVolunteerApplication
// (which is scoped to a single event's Apply CTA).
export const getMyVolunteerAssignments = async (): Promise<VolunteerAssignment[]> => {
  const res = await api.get(`/volunteers/me/assignments`);
  return res.data;
};
