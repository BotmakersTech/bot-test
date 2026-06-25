import api from "../../../shared/api/Base"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminTeamSummary {
  id: string
  teamCode: string
  teamName: string
  logoUrl?: string
  institutionName?: string
  city?: string
  state?: string
  country?: string
  status: string
  memberCount: number
  createdAt: string
}

export interface AdminTeamMember {
  userId: string
  username?: string
  email?: string
  botleagueId?: string
  firstName?: string
  lastName?: string
  profilePhotoUrl?: string
  teamRole: string
  membershipStatus: string
  joinedAt?: string
  leftAt?: string
}

export interface AdminTeamDetail extends AdminTeamSummary {
  description?: string
  createdBy?: string
  updatedAt?: string
  members: AdminTeamMember[]
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const searchAdminTeams = async (
  q?: string,
  page = 0,
  size = 20
): Promise<PagedResponse<AdminTeamSummary>> => {
  const params: Record<string, string | number> = { page, size }
  if (q) params.q = q
  const response = await api.get<PagedResponse<AdminTeamSummary>>("/admin/teams", { params })
  return response.data
}

export const getAdminTeamDetail = async (teamId: string): Promise<AdminTeamDetail> => {
  const response = await api.get<AdminTeamDetail>(`/admin/teams/${teamId}`)
  return response.data
}

export const changeAdminTeamStatus = async (
  teamId: string,
  status: string
): Promise<AdminTeamDetail> => {
  const response = await api.patch<AdminTeamDetail>(`/admin/teams/${teamId}/status`, { status })
  return response.data
}

export const removeMemberFromTeam = async (
  teamId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/admin/teams/${teamId}/members/${userId}`)
}

export const deleteAdminTeam = async (teamId: string): Promise<void> => {
  await api.delete(`/admin/teams/${teamId}`)
}

export interface UpdateTeamRequest {
  teamName?: string
  description?: string
  institutionName?: string
  city?: string
  state?: string
  country?: string
}

export const updateAdminTeam = async (
  teamId: string,
  request: UpdateTeamRequest
): Promise<AdminTeamDetail> => {
  const response = await api.put<AdminTeamDetail>(`/admin/teams/${teamId}`, request)
  return response.data
}
