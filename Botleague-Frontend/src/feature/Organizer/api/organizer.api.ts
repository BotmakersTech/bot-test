import api from "../../../shared/api/Base";

// ── Core event types ──────────────────────────────────────────────────────────

export interface OrganizerEvent {
  id: string;
  eventCode: string;
  eventName: string;
  eventDescription: string | null;
  eventLogoUrl: string | null;
  eventThumbnailUrl?: string | null;
  teaserVideo1Url?: string | null;
  teaserVideo2Url?: string | null;
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

  sportsDescription?: string | null;
  sportThumbnailUrl?: string | null;
  sportTeaserVideoUrl?: string | null;
  competitionType?: string | null;
  weightLimitKg?: number | null;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  controlType?: string | null;
  maxBotsPerTeam?: number | null;
  extraRules?: Record<string, string> | null;
  minTeamSize?: number;
  maxTeamSize?: number;
  createdAt?: string;
}

export interface OrganizerTeamRegistration {
  id: string;
  teamId?: string;
  teamName: string;
  teamLogoUrl?: string;
  robotId?: string;
  robotName?: string;
  lineup?: { id: string; fullName: string; role?: string }[];
}

// Shape actually returned by GET /event-registrations/event-sport/{sportId}
// (backend: EventRegistrationResponse) — distinct from OrganizerTeamRegistration
// above (which comes from the admin sport-detail endpoint). Do not conflate:
// this one keys on `registrationId`, not `id`, and has no `lineup` field.
export interface EventSportRegistration {
  registrationId: string;
  eventId: string;
  eventSportId: string;
  teamId: string;
  teamName: string;
  sportName: string;
  eventName: string;
  botId?: string;
  robotId?: string;
  robotName?: string;
  status: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  controlType?: string;
  controlMode?: string;
  createdAt?: string;
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

export interface CreateEventRequest {
  eventName: string;
  eventDescription: string;
  organizationName: string;
  organizationUrl?: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
}

export const createEvent = async (request: CreateEventRequest): Promise<OrganizerEvent> => {
  const res = await api.post("/Events/create-event", request);
  return res.data;
};

export const uploadEventImage = async (eventId: string, file: File): Promise<{ fileUrl: string; key: string }> => {
  const uploadRes = await api.post(`/Events/${eventId}/upload-url`, null, {
    params: { fileType: file.type, fileSize: file.size },
  });
  const { uploadUrl, fileUrl, key } = uploadRes.data;
  if (!uploadUrl || !key) throw new Error("Invalid upload URL response from server");

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload to storage failed");

  await api.post(`/Events/${eventId}/media`, { key, fileType: file.type });
  return { fileUrl, key };
};

// Backend ignores sportId and returns the parent event (with all its sports
// nested) — same shape/endpoint the admin sport-detail page uses, scoped
// server-side to the caller's assigned events. Callers pick the matching
// sport out of the returned event's `sports` array.
export const getEventSportDetail = async (eventId: string, sportId: string): Promise<OrganizerEvent> => {
  const res = await api.get(`/admin/events/${eventId}/sports/${sportId}`);
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
): Promise<EventSportRegistration[]> => {
  const res = await api.get(`/event-registrations/event-sport/${sportId}`);
  return res.data;
};

// Full roster (all statuses, not just REGISTERED) — use this for the
// organizer roster-management view so WAITLISTED/REJECTED/CHECKED_IN
// registrations stay visible and restorable.
export const getAllRegistrationsForSport = async (
  eventId: string,
  sportId: string
): Promise<EventSportRegistration[]> => {
  const res = await api.get(`/organizer/events/${eventId}/sports/${sportId}/registrations`);
  return res.data;
};

export const updateRegistrationStatus = async (
  eventId: string,
  registrationId: string,
  status: string,
  reason?: string
): Promise<EventSportRegistration> => {
  const res = await api.patch(`/organizer/events/${eventId}/registrations/${registrationId}/status`, { status, reason });
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

export const ensureTeamChatRoom = async (eventId: string, teamId: string): Promise<string> => {
  const res = await api.post(`/organizer/events/${eventId}/teams/${teamId}/chat-room`);
  return res.data;
};

// ── Sport announcements (one-way, organiser -> sport participants) ────────────

export interface SportAnnounceRequest {
  title?: string;
  message: string;
  targetType: "ALL" | "SPECIFIC_TEAMS";
  teamIds?: string[];
  attachmentKey?: string;
  attachmentUrl?: string;
  attachmentFileType?: string;
}

export interface SportAnnouncementRecord {
  id: string;
  eventId: string;
  title: string;
  body: string;
  targetType: string;
  targetSportId: string | null;
  sportName: string | null;
  targetTeamIds: string[];
  attachmentUrl: string | null;
  attachmentFileType: string | null;
  isPinned: boolean;
  sentAt: string | null;
  createdAt: string;
}

export const sendSportAnnouncement = async (
  eventId: string,
  sportId: string,
  req: SportAnnounceRequest
): Promise<SportAnnouncementRecord> => {
  const res = await api.post(`/organizer/events/${eventId}/sports/${sportId}/announce`, req);
  return res.data;
};

export const getSportAnnouncementsForOrganizer = async (
  eventId: string,
  sportId: string
): Promise<SportAnnouncementRecord[]> => {
  const res = await api.get(`/organizer/events/${eventId}/sports/${sportId}/announcements`);
  return res.data;
};

export const getAnnouncementAttachmentUploadUrl = async (
  eventId: string,
  sportId: string,
  fileType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> => {
  const res = await api.post(`/events/${eventId}/sports/${sportId}/announcements/upload-url`, null, {
    params: { fileType, fileSize },
  });
  return res.data;
};

// ── Support contacts ────────────────────────────────────────────────────────

export interface SupportContactRecord {
  id: string;
  eventId: string;
  eventSportId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  roleLabel: string | null;
  displayOrder: number;
}

export interface SupportContactRequest {
  eventSportId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  roleLabel?: string | null;
  displayOrder?: number | null;
}

export const getSupportContacts = async (
  eventId: string,
  sportId?: string
): Promise<SupportContactRecord[]> => {
  const res = await api.get(`/organizer/events/${eventId}/support-contacts`, {
    params: sportId ? { sportId } : undefined,
  });
  return res.data;
};

export const createSupportContact = async (
  eventId: string,
  req: SupportContactRequest
): Promise<SupportContactRecord> => {
  const res = await api.post(`/organizer/events/${eventId}/support-contacts`, req);
  return res.data;
};

export const updateSupportContact = async (
  eventId: string,
  contactId: string,
  req: SupportContactRequest
): Promise<SupportContactRecord> => {
  const res = await api.put(`/organizer/events/${eventId}/support-contacts/${contactId}`, req);
  return res.data;
};

export const deleteSupportContact = async (eventId: string, contactId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/support-contacts/${contactId}`);
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

export const deleteIncident = async (eventId: string, incidentId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/incidents/${incidentId}`);
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

export const updateCertificate = async (
  eventId: string,
  certId: string,
  req: CertificateRequest
): Promise<Certificate> => {
  const res = await api.put(`/organizer/events/${eventId}/certificates/${certId}`, req);
  return res.data;
};

export const deleteCertificate = async (eventId: string, certId: string): Promise<void> => {
  await api.delete(`/organizer/events/${eventId}/certificates/${certId}`);
};

// ── Sport creation (shared /events/{id}/sports endpoint — ORGANIZER-permitted) ─

export interface CreateEventSportRequest {
  sport: string;
  ageGroup: string;

  competitionType?: string;
  sportData?: string;

  weightClass?: string;
  weightLimitKg?: number;
  maxLengthCm?: number;
  maxWidthCm?: number;
  maxHeightCm?: number;
  controlType?: string;
  maxBotsPerTeam?: number;
  extraRules?: Record<string, string>;

  minTeamSize?: number;
  maxTeamSize?: number;
  maxTeams?: number;

  entryFee?: number;
  prizeMoney?: number;

  formatType?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
}

export const createEventSport = async (
  eventId: string,
  request: CreateEventSportRequest
): Promise<OrganizerSport> => {
  const res = await api.post(`/events/${eventId}/sports`, request);
  return res.data;
};

export interface SportUpdateResult {
  status: "APPLIED" | "PENDING_APPROVAL";
  message: string;
}

export const updateEventSport = async (
  eventId: string,
  sportId: string,
  request: CreateEventSportRequest
): Promise<SportUpdateResult> => {
  const res = await api.patch(`/events/${eventId}/sports/${sportId}`, request);
  return res.data;
};

// ── Sport change requests (approval chain for edits to APPROVED+ sports) ───────

export interface SportChangeRequest {
  id: string;
  eventSportId: string;
  eventId: string;
  sportName: string;
  requestedBy: string;
  requestedByName: string | null;
  requesterTier: "SPORT_HEAD" | "EVENT_HEAD_OR_ORGANISER";
  proposedChanges: CreateEventSportRequest;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export const getSportChangeRequests = async (
  eventId: string,
  sportId: string,
  status: string = "PENDING"
): Promise<SportChangeRequest[]> => {
  const res = await api.get(`/events/${eventId}/sports/${sportId}/change-requests`, { params: { status } });
  return res.data;
};

export const approveSportChangeRequest = async (
  eventId: string,
  changeRequestId: string
): Promise<SportChangeRequest> => {
  const res = await api.patch(`/events/${eventId}/sports/change-requests/${changeRequestId}/approve`);
  return res.data;
};

export const rejectSportChangeRequest = async (
  eventId: string,
  changeRequestId: string,
  reason?: string
): Promise<SportChangeRequest> => {
  const res = await api.patch(`/events/${eventId}/sports/change-requests/${changeRequestId}/reject`, { reason });
  return res.data;
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
  status: string,
  notes?: string
): Promise<OrganizerEvent> => {
  const res = await api.patch(`/admin/events/${eventId}/status`, { status, notes });
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

export const approveMatchResult = async (matchId: string): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/approve`);
  return res.data;
};

export const rejectMatchResult = async (matchId: string, reason?: string): Promise<OrganizerMatch> => {
  const res = await api.patch(`/v1/matches/${matchId}/reject`, { reason });
  return res.data;
};
