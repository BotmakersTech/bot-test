// ======================================================
// EVENT API
// event.api.ts
// ======================================================

import api from "../../../shared/api/Base";

// ======================================================
// EVENT TYPES
// ======================================================

export type EventTier = "S_TIER" | "A_TIER" | "B_TIER";

export interface EventResponse {
  id: string;
  eventCode: string;
  eventName: string;
  eventDescription?: string;
  eventLogoUrl?: string;
  organizationName?: string;
  venueName?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  tier?: EventTier;
  createdAt: string;
}

// ======================================================
// EVENT SPORT TYPES
// ======================================================

export interface EventSportResponse {
  id: string;
  eventId: string;
  sport: string;

  competitionType?: string;
  sportsDescription?: string;
  ageGroup: string;

  weightClass?: string;
  weightLimitKg?: number;
  maxLengthCm?: number;
  maxWidthCm?: number;
  maxHeightCm?: number;
  controlType?: string;
  maxBotsPerTeam?: number;
  extraRules?: Record<string, string>;

  minTeamSize: number;
  maxTeamSize: number;
  maxTeams: number;
  registeredTeamsCount: number;

  entryFee: number;
  prizeMoney: number;

  formatType: string;
  registrationStartDate: string;
  registrationEndDate: string;

  status: string;
  createdAt: string;
}

// ======================================================
// EVENT REGISTRATION TYPES
// ======================================================

export interface EventRegistrationResponse {
  registrationId: string;
  id?: string;            // backend may use `id` instead of `registrationId`
  eventId: string;
  eventSportId: string;
  teamId: string;
  teamName?: string;
  botId?: string;         // sent in request, may come back in response
  robotId?: string;       // entity field name on SportRegistration
  robotName: string;
  botType?: string;
  status: string;
  lineupSize?: number;
  lineupLocked?: boolean;
  checkedIn?: boolean;
  registeredAt?: string;
  createdAt?: string;
}

// ======================================================
// REGISTER ROBOT REQUEST
// ======================================================

export interface RegisterTeamRequest {
  eventSportId: string;
  teamId: string;
  botId: string;    // accepted by some backend versions
  robotId: string;  // entity field name on SportRegistration
  robotName: string;
}

// ======================================================
// LINEUP ROLE
// ======================================================

export type LineupRole =
  | "DRIVER"
  | "SECONDARY_DRIVER"
  | "BUILD_HEAD";

// ======================================================
// LINEUP TYPES
// ======================================================

export interface TeamLineUpResponse {
  lineupId: string;
  sportRegistrationId?: string;
  robotId?: string;
  teamMembershipId?: string;
  userId?: string;
  memberName: string;
  botleagueId?: string;
  teamRole?: string;
  lineupRole: string;
  isActive: boolean;
  eventId?: string;
  eventSportId?: string;
  teamId?: string;
  createdAt?: string;
}

// ======================================================
// ADD LINEUP REQUEST
// ======================================================

export interface AddLineupMemberRequest {
  sportRegistrationId: string;
  robotId: string;
  teamMembershipId: string;
  lineupRole: LineupRole;
}

// ======================================================
// ATOMIC REGISTER + LINEUP TYPES
// ======================================================

export interface RegisterWithLineupRequest {
  eventSportId: string;
  teamId: string;
  botId: string;
  lineup: { teamMembershipId: string; lineupRole: LineupRole }[];
}

export interface RegisterWithLineupResponse {
  registrationId: string;
  robotId: string;
  robotName: string;
  status: string;
  lineup: TeamLineUpResponse[];
}

// ======================================================
// GET LIVE EVENTS
// ======================================================

export const getLiveEvents = async (): Promise<EventResponse[]> => {
  const response = await api.get("/Events/live");
  return response.data;
};

// ======================================================
// GET EVENT SPORTS
// ======================================================

export const getEventSports = async (
  eventId: string
): Promise<EventSportResponse[]> => {
  const response = await api.get(`/events/${eventId}/sports`);
  return response.data;
};

// ======================================================
// REGISTER ROBOT
// ======================================================

export const registerTeamToEvent = async (
  request: RegisterTeamRequest
): Promise<EventRegistrationResponse> => {
  const response = await api.post("/event-registrations", request);
  return response.data;
};

// ======================================================
// GET TEAM REGISTRATIONS
// ======================================================

export const getTeamRegistrations = async (
  teamId: string
): Promise<EventRegistrationResponse[]> => {
  const response = await api.get(`/event-registrations/team/${teamId}`);
  return response.data;
};

// ======================================================
// GET TEAM'S ROBOTS IN A SPECIFIC SPORT
// ======================================================

export const getTeamRobotsInSport = async (
  eventSportId: string,
  teamId: string
): Promise<EventRegistrationResponse[]> => {
  const response = await api.get(
    `/event-registrations/event-sport/${eventSportId}/team/${teamId}`
  );
  return response.data;
};

// ======================================================
// GET EVENT SPORT REGISTRATIONS
// ======================================================

export const getEventSportRegistrations = async (
  eventSportId: string
): Promise<EventRegistrationResponse[]> => {
  const response = await api.get(
    `/event-registrations/event-sport/${eventSportId}`
  );
  return response.data;
};

// ======================================================
// CANCEL REGISTRATION
// ======================================================

export const cancelEventRegistration = async (
  registrationId: string
): Promise<string> => {
  const response = await api.delete(`/event-registrations/${registrationId}`);
  return response.data;
};

// ======================================================
// ADD LINEUP MEMBER
// ======================================================

export const addLineupMember = async (
  request: AddLineupMemberRequest
): Promise<TeamLineUpResponse> => {
  const response = await api.post("/event-registration-lineups", request);
  return response.data;
};

// ======================================================
// GET LINEUP
// ======================================================

export const getLineup = async (
  sportRegistrationId: string
): Promise<TeamLineUpResponse[]> => {
  const response = await api.get(
    `/event-registration-lineups/registration/${sportRegistrationId}`
  );
  return response.data;
};

// ======================================================
// REMOVE LINEUP MEMBER
// ======================================================

export const removeLineupMember = async (
  lineupId: string
): Promise<string> => {
  const response = await api.delete(
    `/event-registration-lineups/${lineupId}`
  );
  return response.data;
};

// ======================================================
// REGISTER ROBOT + LINEUP (ATOMIC)
// ======================================================

export const registerTeamWithLineup = async (
  request: RegisterWithLineupRequest
): Promise<RegisterWithLineupResponse> => {
  const response = await api.post("/event-registrations/with-lineup", request);
  return response.data;
};