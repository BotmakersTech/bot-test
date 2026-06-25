import api from "../../../shared/api/Base"

// ── Types ─────────────────────────────────────────────────────

export type AgeCategory = "JUNIOR_INNOVATORS" | "YOUNG_ENGINEERS" | "ROBO_MINDS"

export interface EligibilityResponse {
  age: number
  category: AgeCategory | null
  categoryLabel: string | null
  ageRange: string | null
  eligible: boolean
  requiresGuardian: boolean
  hasGuardian: boolean
  canRegister: boolean
  blockReason: string | null
}

export interface GuardianInfo {
  guardianName: string
  relationship: string
  mobileNumber: string
  email: string
  emergencyContact: string
}

export interface GuardianResponse extends GuardianInfo {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface RankingEntry {
  rank: number
  id: string
  entityType: string
  teamId: string | null
  userId: string | null
  displayName: string
  avatarUrl: string | null
  state: string | null
  city: string | null
  category: AgeCategory | null
  categoryLabel: string | null
  sport: string
  scope: string
  season: string
  totalPoints: number
  eventsPlayed: number
  wins: number
  losses: number
  draws: number
  goldMedals: number
  silverMedals: number
  bronzeMedals: number
  lastUpdated: string
}

// ── Eligibility ───────────────────────────────────────────────

export async function getMyEligibility(): Promise<EligibilityResponse> {
  const res = await api.get<EligibilityResponse>("/eligibility/me")
  return res.data
}

// ── Guardian ──────────────────────────────────────────────────

export async function getMyGuardian(): Promise<GuardianResponse | null> {
  try {
    const res = await api.get<GuardianResponse>("/guardian")
    return res.data
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

export async function saveGuardian(data: GuardianInfo): Promise<GuardianResponse> {
  const res = await api.post<GuardianResponse>("/guardian", data)
  return res.data
}

// ── Rankings ──────────────────────────────────────────────────

export interface RankingQuery {
  category?: AgeCategory | ""
  sport?: string
  scope?: "NATIONAL" | "STATE" | "EVENT"
  season?: string
  page?: number
  size?: number
}

export async function getRankings(query: RankingQuery = {}): Promise<RankingEntry[]> {
  const params: Record<string, string | number> = {}
  if (query.category) params.category = query.category
  if (query.sport)    params.sport    = query.sport
  if (query.scope)    params.scope    = query.scope
  if (query.season)   params.season   = query.season
  params.page = query.page ?? 0
  params.size = query.size ?? 20
  const res = await api.get<RankingEntry[]>("/rankings", { params })
  return res.data
}

export async function getEventRankings(eventId: string, page = 0, size = 20): Promise<RankingEntry[]> {
  const res = await api.get<RankingEntry[]>(`/rankings/event/${eventId}`, {
    params: { page, size }
  })
  return res.data
}
