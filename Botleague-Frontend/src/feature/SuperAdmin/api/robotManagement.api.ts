import api from "../../../shared/api/Base"

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminRobotSummary {
  id: string
  robotCode: string
  robotName: string
  robotIMG?: string
  robotType: string
  sport: string
  weightClass?: string
  weightKg?: number
  controlType: string
  controlMode?: string
  status: string
  teamId: string
  teamName?: string
  teamCode?: string
  eligibleCategories?: string[]
  createdAt: string
}

export interface AdminRobotDetail extends AdminRobotSummary {
  description?: string
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  attributes?: Record<string, string>
  updatedAt?: string
}

export interface PagedResponse<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
}

export interface UpdateRobotRequest {
  robotName?: string
  robotType?: string
  sport?: string
  controlType?: string
  controlMode?: string
  weightClass?: string
  weightKg?: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  description?: string
  attributes?: Record<string, string>
}

// ── API calls ────────────────────────────────────────────────────────────────

export const searchAdminRobots = async (
  q?: string,
  sport?: string,
  status?: string,
  page = 0,
  size = 20
): Promise<PagedResponse<AdminRobotSummary>> => {
  const params: Record<string, string | number> = { page, size }
  if (q)      params.q      = q
  if (sport)  params.sport  = sport
  if (status) params.status = status
  const res = await api.get<PagedResponse<AdminRobotSummary>>("/admin/robots", { params })
  return res.data
}

export const getAdminRobotDetail = async (robotId: string): Promise<AdminRobotDetail> => {
  const res = await api.get<AdminRobotDetail>(`/admin/robots/${robotId}`)
  return res.data
}

export const updateAdminRobot = async (
  robotId: string,
  request: UpdateRobotRequest
): Promise<AdminRobotDetail> => {
  const res = await api.put<AdminRobotDetail>(`/admin/robots/${robotId}`, request)
  return res.data
}

export const changeAdminRobotStatus = async (
  robotId: string,
  status: string
): Promise<AdminRobotDetail> => {
  const res = await api.patch<AdminRobotDetail>(`/admin/robots/${robotId}/status`, null, {
    params: { status },
  })
  return res.data
}

export const deleteAdminRobot = async (robotId: string): Promise<void> => {
  await api.delete(`/admin/robots/${robotId}`)
}

// ── Admin create robot ────────────────────────────────────────────────────

export interface CreateAdminRobotPayload {
  robotName:   string;
  teamId:      string;
  robotType:   string;
  sport:       string;
  ageCategory: string;
  controlType: string;
  controlMode?: string;
  weightClass?: string;
  weightKg?:   number;
  lengthCm?:   number;
  widthCm?:    number;
  heightCm?:   number;
  description?: string;
}

export const createAdminRobot = async (
  payload: CreateAdminRobotPayload
): Promise<AdminRobotDetail> => {
  const res = await api.post<AdminRobotDetail>("/admin/robots", payload)
  return res.data
}

// ── All teams (for team picker dropdown) ─────────────────────────────────

export interface TeamOption { id: string; teamCode: string; teamName: string }

export const getAllTeamsForPicker = async (): Promise<TeamOption[]> => {
  const res = await api.get<{ content: TeamOption[] }>("/admin/teams", { params: { size: 200 } })
  return res.data.content ?? []
}
