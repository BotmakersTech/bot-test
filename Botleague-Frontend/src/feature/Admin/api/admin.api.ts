import api from "../../../shared/api/Base"

// =====================================================
// CREATE EVENT REQUEST
// =====================================================

export interface CreateEventRequest {
  eventName: string
  eventDescription: string
  eventLogoUrl?: string
  organizationName: string
  organizationUrl?: string
  venueName: string
  venueAddress: string
  city: string
  state: string
  country: string
  startDate: string
  endDate: string
}

// =====================================================
// LINEUP
// =====================================================

export interface AdminRegistrationLineupResponse {
  id: string
  fullName: string
  role?: string
}

// =====================================================
// TEAM
// =====================================================

export interface AdminRegisteredTeamResponse {
  id: string
  teamName: string
  teamLogoUrl?: string
  lineup?: AdminRegistrationLineupResponse[]
}

// =====================================================
// SPORT
// =====================================================

export interface AdminEventSportResponse {
  id: string
  sport: string
  sportName?: string

  competitionType?: string
  sportsDescription?: string
  ageGroup?: string

  weightClass?: string
  weightLimitKg?: number
  maxLengthCm?: number
  maxWidthCm?: number
  maxHeightCm?: number
  controlType?: string
  maxBotsPerTeam?: number
  extraRules?: Record<string, string>

  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number
  registeredTeamsCount?: number

  entryFee?: number
  prizeMoney?: number

  formatType?: string
  registrationStartDate?: string
  registrationEndDate?: string

  status?: string
  createdAt?: string

  registrations?: AdminRegisteredTeamResponse[]
}

// =====================================================
// EVENT RESPONSE
// =====================================================

export interface AdminEventResponse {
  id: string
  eventName: string
  eventDescription: string
  eventLogoUrl?: string
  organizationName: string
  organizationUrl?: string
  venueName: string
  venueAddress: string
  city: string
  state: string
  country: string
  status?: string
  startDate: string
  endDate: string
  sports?: AdminEventSportResponse[]
}

// =====================================================
// CREATE / UPDATE SPORT REQUEST
// =====================================================

export interface CreateEventSportRequest {
  sport: string
  ageGroup: string

  competitionType?: string
  sportData?: string

  weightClass?: string
  weightLimitKg?: number
  maxLengthCm?: number
  maxWidthCm?: number
  maxHeightCm?: number
  controlType?: string
  maxBotsPerTeam?: number
  extraRules?: Record<string, string>

  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number

  entryFee?: number
  prizeMoney?: number

  formatType?: string
  registrationStartDate?: string
  registrationEndDate?: string
}

// =====================================================
// GET EVENT SPORTS DTO
// =====================================================

export interface GetEventSportDTO {
  id: string
  eventId?: string
  sport: string

  competitionType?: string
  sportsDescription?: string
  ageGroup?: string

  weightClass?: string
  weightLimitKg?: number
  maxLengthCm?: number
  maxWidthCm?: number
  maxHeightCm?: number
  controlType?: string
  maxBotsPerTeam?: number
  extraRules?: Record<string, string>

  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number
  registeredTeamsCount?: number

  entryFee?: number
  prizeMoney?: number

  formatType?: string
  registrationStartDate?: string
  registrationEndDate?: string

  status?: string
  createdAt?: string
}

// =====================================================
// UPDATE EVENT REQUEST
// =====================================================

export interface UpdateEventRequest {
  eventName?: string
  eventDescription?: string
  eventLogoUrl?: string
  organizationName?: string
  organizationUrl?: string
  venueName?: string
  venueAddress?: string
  city?: string
  state?: string
  country?: string
  startDate?: string
  endDate?: string
}

// =====================================================
// CREATE EVENT
// =====================================================

export const createEvent = async (
  request: CreateEventRequest
): Promise<AdminEventResponse> => {
  const response = await api.post<AdminEventResponse>(
    "/Events/create-event",
    request
  )
  return response.data
}

// =====================================================
// GET ALL EVENTS
// =====================================================

export const getAllEvents = async (): Promise<AdminEventResponse[]> => {
  const response = await api.get<AdminEventResponse[]>("/admin/events")
  return response.data
}

// =====================================================
// GET EVENT BY ID
// =====================================================

export const getEventById = async (
  eventId: string
): Promise<AdminEventResponse> => {
  const response = await api.get<AdminEventResponse>(
    `/admin/events/${eventId}`
  )
  return response.data
}

// =====================================================
// GET EVENT SPORT BY ID
// =====================================================

export const getEventSportById = async (
  eventId: string,
  sportId: string
): Promise<AdminEventResponse> => {
  const response = await api.get<AdminEventResponse>(
    `/admin/events/${eventId}/sports/${sportId}`
  )
  return response.data
}

// =====================================================
// CREATE EVENT SPORT
// =====================================================

export const createEventSport = async (
  eventId: string,
  request: CreateEventSportRequest
): Promise<AdminEventSportResponse> => {
  const response = await api.post<AdminEventSportResponse>(
    `/events/${eventId}/sports`,
    request
  )
  return response.data
}

// =====================================================
// UPDATE EVENT SPORT
// =====================================================

export const updateEventSport = async (
  eventId: string,
  sportId: string,
  request: CreateEventSportRequest
): Promise<void> => {
  await api.patch(`/events/${eventId}/sports/${sportId}`, request)
}

// =====================================================
// GET EVENT SPORTS LIST
// =====================================================

export const getEventSports = async (
  eventId: string
): Promise<GetEventSportDTO[]> => {
  const response = await api.get<GetEventSportDTO[]>(
    `/events/${eventId}/sports`
  )
  return response.data
}

export const makeEventLive = async (
  eventId: string
): Promise<AdminEventResponse> => {
  const response = await api.patch<AdminEventResponse>(
    `/Events/${eventId}/PublishEvent`
  )
  return response.data
}
 

// =====================================================
// UPDATE EVENT
// =====================================================

export const updateEvent = async (
  eventId: string,
  request: UpdateEventRequest
): Promise<AdminEventResponse> => {
  const response = await api.put<AdminEventResponse>(
    `/admin/events/${eventId}`,
    request
  )
  return response.data
}

// =====================================================
// CHANGE EVENT STATUS
// =====================================================

export const changeEventStatus = async (
  eventId: string,
  status: string
): Promise<AdminEventResponse> => {
  const response = await api.patch<AdminEventResponse>(
    `/admin/events/${eventId}/status`,
    { status }
  )
  return response.data
}

// =====================================================
// DELETE EVENT
// =====================================================

export const deleteEvent = async (eventId: string): Promise<void> => {
  await api.delete(`/admin/events/${eventId}`)
}

export const changeRegistrationStatus = async (
  eventId: string,
  sportId: string
) => {
  const response = await api.patch(
    `/events/${eventId}/sports/${sportId}/registration`,
    {}
  );
  return response.data;
};

  export const getTeamRegistrationSports =
    async (
        sportId: string
    ): Promise<GetEventSportDTO[]> => {

        const response =
            await api.get<
                GetEventSportDTO[]
            >(
                `/event-registrations/event-sport/${sportId}`
            )

        return response.data
    }

// =====================================================
// ORGANIZER ASSIGNMENT — assign a user to manage an event
// =====================================================

export interface UserSearchResult {
  id: string
  botleagueId: string
  username: string
  firstName: string
  lastName: string
  email: string
  phone: string
  allRoles: string[]
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const searchUsers = async (
  q: string
): Promise<UserSearchResult[]> => {
  const response = await api.get<PagedResponse<UserSearchResult>>("/admin/users", {
    params: { q, page: 0, size: 10 },
  })
  return response.data.content
}

export interface EventAssignment {
  id: string
  userId: string
  username: string
  userDisplayName: string
  userEmail: string
  eventId: string
  eventName: string
  eventCode: string
  eventSportId?: string
  sportName?: string
  assignedBy: string
  assignedAt: string
  roleType?: "EVENT_HEAD" | "SPORT_HEAD"
  ownerChain?: "BOTLEAGUE" | "ORGANISER"
  status?: "PENDING_APPROVAL" | "APPROVED" | "REJECTED"
  rejectionReason?: string
}

export const getEventAssignments = async (
  eventId: string
): Promise<EventAssignment[]> => {
  const response = await api.get<EventAssignment[]>(`/admin/assignments/event/${eventId}`)
  return response.data
}

export const assignEventHead = async (
  userId: string,
  eventId: string
): Promise<EventAssignment> => {
  const response = await api.post<EventAssignment>("/admin/assignments/event", { userId, eventId })
  return response.data
}

export const unassignEventHead = async (
  userId: string,
  eventId: string
): Promise<void> => {
  await api.delete("/admin/assignments/event", { params: { userId, eventId } })
}

export const getSportAssignments = async (
  eventSportId: string
): Promise<EventAssignment[]> => {
  const response = await api.get<EventAssignment[]>(`/admin/assignments/sport/${eventSportId}`)
  return response.data
}

export const assignSportHead = async (
  userId: string,
  eventSportId: string
): Promise<EventAssignment> => {
  const response = await api.post<EventAssignment>("/admin/assignments/sport", { userId, eventSportId })
  return response.data
}

export const unassignSportHead = async (
  userId: string,
  eventSportId: string
): Promise<void> => {
  await api.delete("/admin/assignments/sport", { params: { userId, eventSportId } })
}

export const approveSportHeadAssignment = async (
  assignmentId: string
): Promise<EventAssignment> => {
  const response = await api.patch<EventAssignment>(`/admin/assignments/sport/${assignmentId}/approve`)
  return response.data
}

export const rejectSportHeadAssignment = async (
  assignmentId: string,
  reason?: string
): Promise<EventAssignment> => {
  const response = await api.patch<EventAssignment>(`/admin/assignments/sport/${assignmentId}/reject`, { reason })
  return response.data
}

// =====================================================
// SPORT APPROVAL — organizer-submitted sports awaiting admin review
// =====================================================

export const approveSport = async (sportId: string): Promise<GetEventSportDTO> => {
  const response = await api.patch<GetEventSportDTO>(`/admin/sports/${sportId}/approve`)
  return response.data
}

export const rejectSport = async (sportId: string, reason?: string): Promise<GetEventSportDTO> => {
  const response = await api.patch<GetEventSportDTO>(`/admin/sports/${sportId}/reject`, undefined, {
    params: reason ? { reason } : undefined,
  })
  return response.data
}

