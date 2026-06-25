// ─────────────────────────────────────────────────────────────
// TEAM & REGISTRATION
// ─────────────────────────────────────────────────────────────

export interface TeamPlayer {
  id: string
  fullName: string
  role?: string
}

export interface TeamReg {
  id: string
  teamName: string
  teamLogoUrl?: string
  lineup?: TeamPlayer[]
}

// ─────────────────────────────────────────────────────────────
// SPORT
// ─────────────────────────────────────────────────────────────

export interface SportDetail {
  id: string
  sport: string
  sportsInfo?: string | null
  sportsDescripction?: string | null
  status?: string
  formatType?: string
  ageGroup?: string
  weightClass?: string
  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number
  entryFee?: number
  prizeMoney?: number
  registrationStartDate?: string
  registrationEndDate?: string
  registeredTeamsCount?: number
  registrations?: TeamReg[]
}

// ─────────────────────────────────────────────────────────────
// EVENT
// ─────────────────────────────────────────────────────────────

export interface AdminEvent {
  id: string
  eventName: string
  status?: string
  sports?: SportDetail[]
}

// ─────────────────────────────────────────────────────────────
// MATCHES
// ─────────────────────────────────────────────────────────────

export type WinnerId = string | "DRAW"

export interface Match {
  id: string
  teamA: TeamReg
  teamB: TeamReg
  scoreA?: number | null
  scoreB?: number | null
  winner?: WinnerId | null
  stage?: string
}

// Payload sent to POST /api/sports/:sportId/matches/bulk
export interface BulkMatchPayload {
  teamAId: string
  teamBId: string
  stage: string
  sportId: string
}

export interface BulkMatchRequest {
  matches: BulkMatchPayload[]
}

// Payload sent to PATCH /api/matches/:matchId/score
export interface ScoreUpdateRequest {
  scoreA: number
  scoreB: number
  winnerId: WinnerId
}

// Response from GET /api/sports/:sportId/matches
export interface MatchesResponse {
  matches: Match[]
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────

export interface StandingEntry {
  team: TeamReg
  played: number
  won: number
  lost: number
  drawn: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

// ─────────────────────────────────────────────────────────────
// BRACKET GENERATION
// ─────────────────────────────────────────────────────────────

export type BracketType = "ROUND_ROBIN" | "KNOCKOUT"

export interface MatchPreview {
  teamA: TeamReg
  teamB: TeamReg | null   // null = BYE slot in knockout
  stage: string
  bye?: boolean
  id?: string             // only present for manually added matches
}

// ─────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────

export interface CreateMatchesModalProps {
  sport: SportDetail
  onClose: () => void
  onMatchesCreated?: () => void
}

export interface AddScoreModalProps {
  sport: SportDetail
  onClose: () => void
  onScoreUpdated?: () => void
}

export interface LeaderboardModalProps {
  sport: SportDetail
  onClose: () => void
}

export interface TournamentActionsProps {
  sport: SportDetail
  eventStatus?: string
}

export interface ScoreMatchRowProps {
  match: Match
  isEditing: boolean
  justSaved: boolean
  onClick: () => void
  scoreA: string | number | undefined | null
  scoreB: string | number | undefined | null
  setScoreA: (v: string) => void
  setScoreB: (v: string) => void
  winner: string | undefined | null
  setWinner: (v: string) => void
  onSave: () => void
  saving: boolean
}

export interface MatchPreviewRowProps {
  match: MatchPreview
  index: number
  onRemove?: () => void
}

export interface TeamSelectProps {
  value: string
  onChange: (id: string) => void
  teams: TeamReg[]
  exclude: string
  placeholder: string
}

export interface TeamPillProps {
  team: TeamReg | null
}

export interface StatBoxProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}

export interface MetaChipProps {
  icon: React.ReactNode
  label: string
  value?: string | number | null
}

export interface StatusPillProps {
  status?: string
}

export interface TeamCardProps {
  team: TeamReg
  index: number
}

export interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export interface SpinnerProps {
  size?: number
  color?: string
}