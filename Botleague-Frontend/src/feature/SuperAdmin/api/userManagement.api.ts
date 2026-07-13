import api from "../../../shared/api/Base";

export interface UserSummary {
  id: string;
  botleagueId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountStatus: string;
  primaryRole: string;
  allRoles: string[];
  createdAt: string;
  lastLoginAt: string | null;
  // extended profile fields (detail view only)
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  profilePhotoUrl?: string;
  assignedEvents?: AssignedEvent[];
  assignedSports?: AssignedSport[];
}

export interface UpdateUserProfileRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

export interface AssignedEvent {
  eventId: string;
  eventCode: string;
  eventName: string;
  assignedAt: string;
}

export interface AssignedSport {
  eventSportId: string;
  eventId: string;
  eventName: string;
  sport: string;
  assignedAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EventOption {
  id: string;
  eventCode: string;
  eventName: string;
  status: string;
}

export interface SportOption {
  id: string;
  eventId: string;
  sport: string;
  ageGroup: string | null;
  weightClass: string | null;
  status: string;
}

// ── Admin create user ─────────────────────────────────────────────────────

export interface CreateAdminUserPayload {
  firstName: string;
  lastName:  string;
  phone:     string;
  password:  string;
  email?:    string;
  role:      string;
}

export const createAdminUser = async (
  payload: CreateAdminUserPayload
): Promise<UserSummary> => {
  const res = await api.post("/admin/users", payload);
  return res.data;
};

export const getUsersWithoutTeam = async (): Promise<UserSummary[]> => {
  const res = await api.get("/admin/users/no-team");
  return res.data;
};

// ── User CRUD ─────────────────────────────────────────────────────────────

export const listUsers = async (
  q?: string, page = 0, size = 20
): Promise<PagedResponse<UserSummary>> => {
  const res = await api.get("/admin/users", { params: { q, page, size } });
  return res.data;
};

export const getUserDetail = async (userId: string): Promise<UserSummary> => {
  const res = await api.get(`/admin/users/${userId}`);
  return res.data;
};

export const updateUserProfile = async (
  userId: string,
  request: UpdateUserProfileRequest
): Promise<UserSummary> => {
  const res = await api.patch(`/admin/users/${userId}/profile`, request);
  return res.data;
};

// ── Role management ───────────────────────────────────────────────────────

export const assignRole = async (userId: string, role: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/role`, { role });
};

export const removeRole = async (userId: string, role: string): Promise<void> => {
  // Uses path param — no request body needed
  await api.delete(`/admin/users/${userId}/role/${role}`);
};

// ── Account status ────────────────────────────────────────────────────────

export const updateAccountStatus = async (userId: string, status: string): Promise<void> => {
  await api.patch(`/admin/users/${userId}/status`, null, { params: { status } });
};

// Event/sport assignment goes through admin.api.ts's assignEventHead /
// unassignEventHead / assignSportHead / unassignSportHead, which call the
// real OrganizerAssignmentController endpoints — the /admin/users/{userId}/
// assignments/... paths that used to live here were removed from the
// backend and are gone; keeping them here just 404'd silently.

// ── Picker data (for dropdowns) ───────────────────────────────────────────

export const getAllEventsForPicker = async (): Promise<EventOption[]> => {
  const res = await api.get("/organizer/admin/events");
  return res.data;
};

export const getSportsByEventForPicker = async (eventId: string): Promise<SportOption[]> => {
  const res = await api.get(`/organizer/admin/events/${eventId}/sports`);
  return res.data;
};
