// ─────────────────────────────────────────────────────────────────────────────
// Realtime event types — must mirror backend RealtimeEventType enum
// ─────────────────────────────────────────────────────────────────────────────

export type RealtimeEventType =
  // Notifications
  | 'NOTIFICATION_NEW'
  | 'NOTIFICATION_COUNT'
  // Match lifecycle
  | 'MATCH_CREATED'    // emitted for each match when a bracket is generated
  | 'MATCH_SCHEDULED'
  | 'MATCH_STARTED'
  | 'MATCH_SCORE_UPDATED'
  | 'MATCH_RESULT_SUBMITTED'
  | 'MATCH_RESULT_PENDING_APPROVAL'
  | 'MATCH_RESULT_APPROVED'
  | 'MATCH_RESULT_REJECTED'
  | 'MATCH_COMPLETED'
  | 'MATCH_UPDATED'
  | 'BRACKET_CREATED'
  // Round-wise time trial (see feature/RaceRounds)
  | 'ROUND_GENERATED'
  | 'ROUND_TIMES_UPDATED'
  | 'ROUND_SHORTLISTED'
  | 'ROUND_FINALIZED'
  // Rankings
  | 'RANKINGS_UPDATED'
  // Achievements
  | 'ACHIEVEMENT_UNLOCKED'
  // Event
  | 'EVENT_UPDATED'
  | 'EVENT_STATUS_CHANGED'
  // Sport
  | 'SPORT_UPDATED'
  | 'SPORT_REGISTRATION_OPENED'
  | 'SPORT_REGISTRATION_CLOSED'
  // Registration
  | 'REGISTRATION_NEW'
  | 'REGISTRATION_CANCELLED'
  // Team
  | 'TEAM_UPDATED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'

// Generic envelope that wraps every pushed message
export interface RealtimeMessage<T = unknown> {
  type: RealtimeEventType
  payload: T
  timestamp: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed payloads for the most common events
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistrationRealtimePayload {
  sportId: string
  eventId: string
  registeredTeamsCount: number
  teamId: string
  teamName: string
  robotName: string
}

export interface RankingsUpdatedPayload {
  eventSportId: string
}
