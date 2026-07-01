import api from "../../../shared/api/Base";

// ── Core event types ──────────────────────────────────────────────────────────

export interface OrganizerEvent {
  id: string;
  eventCode: string;
  eventName: string;
  eventDescription: string | null;
  eventLogoUrl: string | null;
  organizationName: string | null;
  organizationUrl?: string | null;
  venueName: string | null;
  venueAddress?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  tier?: string;
  createdAt: string;
  sports?: OrganizerSport[];
}

export interface OrganizerSport {
  id: string;
  eventId: string;
  sport: string;
  ageGroup: string | null;
  weightClass: string | null;
  status: string;
  bracketGenerated: boolean;
  rejectionReason?: string | null;
  registeredTeamsCount?: number;
  maxTeams?: number;
  registrationStartDate?: string;
  registrationEndDate?: string;
  entryFee?: number;
  prizeMoney?: number;
  formatType?: string;
  registrations?: OrganizerTeamRegistration[];
}

export interface OrganizerTeamRegistration {
  id: string;
  teamName: string;
  teamLogoUrl?: string;
  lineup?: { id: string; fullName: string; role?: string }[];
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalEvents: number;
  liveEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  totalTeams: number;
  totalVolunteers: number;
  totalJudges: number;
  totalStaff: number;
  totalMatches: number;
  pendingApprovals: number;
  openIncidents: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/organizer/dashboard");
  return res.data;
};

// ── My events ─────────────────────────────────────────────────────────────────

export const getMyEvents = async (): Promise<OrganizerEvent[]> => {
  const res = await api.get("/organizer/my-events");
  return res.data;
};

export const getMyEventById = async (eventId: string): Promise<OrganizerEvent> => {
  const res = await api.get(`/admin/events/${eventId}`);
  return res.data;
};

export const getMySports = async (): Promise<OrganizerSport[]> => {
  const res = await api.get("/organizer/my-sports");
  return res.data;
};

export interface UpdateEventInfoRequest {
  eventName?: string;
  eventDescription?: string;
  eventLogoUrl?: string;
  organizationName?: string;
  organizationUrl?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  notes?: string;
}

export const updateEventInfo = async (
  eventId: string,
  req: UpdateEventInfoRequest
): Promise<OrganizerEvent> => {
  const res = await api.patch(`/organizer/events/${eventId}/info`, req);
  return res.data;
};

// ── Registrations ─────────────────────────────────────────────────────────────

export const getRegistrationsForSport = async (
  sportId: string
): Promise<OrganizerTeamRegistration[]> => {
  const res = await api.get(`/event-registrations/event-sport/${sportId}`);
  return res.data;
};

// ── Communication / Announcements ─────────────────────────────────────────────

export interface BroadcastRequest {
  title: string;
  message: string;
  chatMessage?: string;
}

export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  body: string;
  targetType: string;
  targetSportId?: string;
  isPinned: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface AnnouncementRequest {
  title: string;
  body: string;
  targetType?: string;
  targetSportId?: string;
  isPinned?: boolean;
}

export const getAnnouncements = async (eventId: string): Promise<Announcement[]> => {
  const res = await api.get(`/organizer/events/${eventId}/announcements`);
  return res.data;
};

export const createAnnouncement = async (
  eventId: string,
  req: AnnouncementRequest
): Promise<Announcement> => {
  const res = await api.post(`/organizer/events/${eventId}/announcements`, req);
  return res.data;
};

export const updateAnnouncement = async (
  eventId: string,
  announcementId: string,
  req: AnnouncementRequest
): Promise<Announcement> => {
  const res = await api.put(`/organizer/events/${eventId}/announcements/${announcementId}`, req);
  return res.data;
};

export const deleteAnnouncement = async (eventId: string, announcementId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/announcements/${announcementId}`);
};

export const ensureEventChatRoom = async (eventId: string): Promise<string> => {
  const res = await api.post(`/organizer/events/${eventId}/chat-room`);
  return res.data;
};

export const broadcastAnnouncement = async (
  eventId: string,
  request: BroadcastRequest
): Promise<void> => {
  await api.post(`/organizer/events/${eventId}/announce`, request);
};

// ── Incidents ─────────────────────────────────────────────────────────────────

export interface Incident {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  arenaName: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface IncidentRequest {
  title: string;
  description?: string;
  severity?: string;
  arenaName?: string;
}

export interface IncidentUpdateRequest {
  status: string;
  resolutionNotes?: string;
}

export const getIncidents = async (eventId: string): Promise<Incident[]> => {
  const res = await api.get(`/organizer/events/${eventId}/incidents`);
  return res.data;
};

export const createIncident = async (eventId: string, req: IncidentRequest): Promise<Incident> => {
  const res = await api.post(`/organizer/events/${eventId}/incidents`, req);
  return res.data;
};

export const updateIncident = async (
  eventId: string,
  incidentId: string,
  req: IncidentUpdateRequest
): Promise<Incident> => {
  const res = await api.patch(`/organizer/events/${eventId}/incidents/${incidentId}`, req);
  return res.data;
};

// ── Arenas ────────────────────────────────────────────────────────────────────

export interface Arena {
  id: string;
  eventId: string;
  arenaName: string;
  capacity: number | null;
  locationNotes: string | null;
  sportType: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ArenaRequest {
  arenaName: string;
  capacity?: number;
  locationNotes?: string;
  sportType?: string;
}

export const getArenas = async (eventId: string): Promise<Arena[]> => {
  const res = await api.get(`/organizer/events/${eventId}/arenas`);
  return res.data;
};

export const createArena = async (eventId: string, req: ArenaRequest): Promise<Arena> => {
  const res = await api.post(`/organizer/events/${eventId}/arenas`, req);
  return res.data;
};

export const updateArena = async (eventId: string, arenaId: string, req: ArenaRequest): Promise<Arena> => {
  const res = await api.put(`/organizer/events/${eventId}/arenas/${arenaId}`, req);
  return res.data;
};

export const deleteArena = async (eventId: string, arenaId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/arenas/${arenaId}`);
};

// ── Volunteers ────────────────────────────────────────────────────────────────

export interface Volunteer {
  id: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  dutyStation: string | null;
  shift: string | null;
  notes: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  createdAt: string;
}

export interface VolunteerRequest {
  name: string;
  email?: string;
  phone?: string;
  dutyStation?: string;
  shift?: string;
  notes?: string;
}

export const getVolunteers = async (eventId: string): Promise<Volunteer[]> => {
  const res = await api.get(`/organizer/events/${eventId}/volunteers`);
  return res.data;
};

export const createVolunteer = async (eventId: string, req: VolunteerRequest): Promise<Volunteer> => {
  const res = await api.post(`/organizer/events/${eventId}/volunteers`, req);
  return res.data;
};

export const updateVolunteer = async (
  eventId: string, volunteerId: string, req: VolunteerRequest
): Promise<Volunteer> => {
  const res = await api.put(`/organizer/events/${eventId}/volunteers/${volunteerId}`, req);
  return res.data;
};

export const checkInVolunteer = async (eventId: string, volunteerId: string): Promise<Volunteer> => {
  const res = await api.patch(`/organizer/events/${eventId}/volunteers/${volunteerId}/checkin`);
  return res.data;
};

export const checkOutVolunteer = async (eventId: string, volunteerId: string): Promise<Volunteer> => {
  const res = await api.patch(`/organizer/events/${eventId}/volunteers/${volunteerId}/checkout`);
  return res.data;
};

export const deleteVolunteer = async (eventId: string, volunteerId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/volunteers/${volunteerId}`);
};

// ── Judges ────────────────────────────────────────────────────────────────────

export interface Judge {
  id: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  credentials: string | null;
  assignedSportId: string | null;
  assignedArena: string | null;
  scoringRights: boolean;
  notes: string | null;
  createdAt: string;
}

export interface JudgeRequest {
  name: string;
  email?: string;
  phone?: string;
  credentials?: string;
  assignedSportId?: string;
  assignedArena?: string;
  scoringRights?: boolean;
  notes?: string;
}

export const getJudges = async (eventId: string): Promise<Judge[]> => {
  const res = await api.get(`/organizer/events/${eventId}/judges`);
  return res.data;
};

export const createJudge = async (eventId: string, req: JudgeRequest): Promise<Judge> => {
  const res = await api.post(`/organizer/events/${eventId}/judges`, req);
  return res.data;
};

export const updateJudge = async (
  eventId: string, judgeId: string, req: JudgeRequest
): Promise<Judge> => {
  const res = await api.put(`/organizer/events/${eventId}/judges/${judgeId}`, req);
  return res.data;
};

export const deleteJudge = async (eventId: string, judgeId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/judges/${judgeId}`);
};

// ── Staff ─────────────────────────────────────────────────────────────────────

export interface Staff {
  id: string;
  eventId: string;
  name: string;
  email: string | null;
  phone: string | null;
  staffType: string;
  dutyDescription: string | null;
  shift: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  createdAt: string;
}

export interface StaffRequest {
  name: string;
  email?: string;
  phone?: string;
  staffType: string;
  dutyDescription?: string;
  shift?: string;
}

export const getStaff = async (eventId: string): Promise<Staff[]> => {
  const res = await api.get(`/organizer/events/${eventId}/staff`);
  return res.data;
};

export const createStaff = async (eventId: string, req: StaffRequest): Promise<Staff> => {
  const res = await api.post(`/organizer/events/${eventId}/staff`, req);
  return res.data;
};

export const updateStaff = async (
  eventId: string, staffId: string, req: StaffRequest
): Promise<Staff> => {
  const res = await api.put(`/organizer/events/${eventId}/staff/${staffId}`, req);
  return res.data;
};

export const checkInStaff = async (eventId: string, staffId: string): Promise<Staff> => {
  const res = await api.patch(`/organizer/events/${eventId}/staff/${staffId}/checkin`);
  return res.data;
};

export const checkOutStaff = async (eventId: string, staffId: string): Promise<Staff> => {
  const res = await api.patch(`/organizer/events/${eventId}/staff/${staffId}/checkout`);
  return res.data;
};

export const deleteStaff = async (eventId: string, staffId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/staff/${staffId}`);
};

// ── Venue & Logistics ─────────────────────────────────────────────────────────

export interface VenueDetail {
  id?: string;
  eventId: string;
  floorPlanUrl?: string | null;
  arenaCount?: number | null;
  seatingCapacity?: number | null;
  hasPower: boolean;
  hasInternet: boolean;
  hasMedicalFacility: boolean;
  parkingCapacity?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  safetyCompliant: boolean;
  checklistJson?: string | null;
  additionalNotes?: string | null;
  updatedAt?: string | null;
}

export const getVenueDetail = async (eventId: string): Promise<VenueDetail> => {
  const res = await api.get(`/organizer/events/${eventId}/venue`);
  return res.data;
};

export const upsertVenueDetail = async (
  eventId: string,
  req: Partial<VenueDetail>
): Promise<VenueDetail> => {
  const res = await api.put(`/organizer/events/${eventId}/venue`, req);
  return res.data;
};

// ── Certificates ──────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  eventId: string;
  recipientUserId: string | null;
  recipientName: string;
  certificateType: string;
  sportId: string | null;
  sportName: string | null;
  teamName: string | null;
  position: number | null;
  pdfUrl: string | null;
  issuedAt: string | null;
  createdAt: string;
}

export interface CertificateRequest {
  recipientUserId?: string;
  recipientName: string;
  certificateType: string;
  sportId?: string;
  position?: number;
  pdfUrl?: string;
  teamName?: string;
  sportName?: string;
}

export const getCertificates = async (eventId: string): Promise<Certificate[]> => {
  const res = await api.get(`/organizer/events/${eventId}/certificates`);
  return res.data;
};

export const issueCertificate = async (
  eventId: string,
  req: CertificateRequest
): Promise<Certificate> => {
  const res = await api.post(`/organizer/events/${eventId}/certificates`, req);
  return res.data;
};

export const deleteCertificate = async (eventId: string, certId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/certificates/${certId}`);
};

// ── Sport lifecycle ───────────────────────────────────────────────────────────

export const submitSportForApproval = async (
  eventId: string,
  sportId: string
): Promise<OrganizerSport> => {
  const res = await api.post(`/organizer/events/${eventId}/sports/${sportId}/submit-approval`);
  return res.data;
};

export const toggleSportRegistration = async (
  eventId: string,
  sportId: string
): Promise<string> => {
  const res = await api.patch(`/events/${eventId}/sports/${sportId}/registration`);
  return res.data;
};

export const changeEventStatus = async (
  eventId: string,
  status: string
): Promise<OrganizerEvent> => {
  const res = await api.patch(`/admin/events/${eventId}/status`, { status });
  return res.data;
};

export const adminApproveSport = async (sportId: string): Promise<OrganizerSport> => {
  const res = await api.patch(`/admin/sports/${sportId}/approve`);
  return res.data;
};

export const adminRejectSport = async (sportId: string, reason?: string): Promise<OrganizerSport> => {
  const params = reason ? { params: { reason } } : {};
  const res = await api.patch(`/admin/sports/${sportId}/reject`, undefined, params);
  return res.data;
};

// ── Matches ───────────────────────────────────────────────────────────────────

export interface OrganizerMatch {
  matchId: string;
  matchNumber?: number;
  roundNumber?: number;
  scheduledAt?: string;
  status: string;
  isBye?: boolean;
  teamARobotName?: string;
  teamAName?: string;
  teamARegistrationId?: string;
  teamBRobotName?: string;
  teamBName?: string;
  teamBRegistrationId?: string;
  teamAScore?: number;
  teamBScore?: number;
  arenaName?: string;
  eventSportId: string;
  winnerRegistrationId?: string;
  winMethod?: string;
}

export const getMatchesForSport = async (eventSportId: string): Promise<OrganizerMatch[]> => {
  const res = await api.get(`/v1/matches/event-sport/${eventSportId}`);
  return res.data;
};

export interface GenerateBracketRequest {
  eventSportId: string;
  teamRegistrationIds: string[];
  tournamentFormat?: string;
  matchType?: string;
  format?: string;
}

export const generateBracket = async (req: GenerateBracketRequest): Promise<OrganizerMatch[]> => {
  const res = await api.post('/v1/matches/generate', req);
  return res.data;
};

export const scheduleMatch = async (
  matchId: string,
  scheduledAt: string
): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/schedule`, { scheduledAt });
  return res.data;
};

export const startMatch = async (matchId: string): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/start`);
  return res.data;
};

export const updateMatchScore = async (
  matchId: string,
  scores: { teamAScore: number; teamBScore: number }
): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/score`, scores);
  return res.data;
};

export const completeMatch = async (matchId: string): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/complete`);
  return res.data;
};

export const cancelMatch = async (matchId: string): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/cancel`);
  return res.data;
};
