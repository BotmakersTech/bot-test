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
  | 'MATCH_COMPLETED'
  | 'MATCH_UPDATED'
  | 'BRACKET_CREATED'
  // Rankings
  | 'RANKINGS_UPDATED'
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
