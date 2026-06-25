// features/Dashboard/api/dashboard.api.ts
import api from "../../../shared/api/Base";

/* ──────────────────────────────────────────────────────────────────────────
   These interfaces now match the ACTUAL backend JSON 1:1.

   What changed vs the old file:
   • ProfileDTO:  botleagueId  -> botLeagueId
                  accountType  -> role
                  createdAt    -> memberSince
                  + rank, + seasonPoints   (were missing)
                  - avatarUrl, - bio       (API never sends these; they come
                                            from the auth user, not /dashboard)
   • RobotResponseDTO: + robotIMG          (was missing)
   • MatchDTO:    + teamAName, + teamBName  (were missing)
                  teamARegistrationId / teamBRegistrationId are nullable
   • DashboardResponse.invite stays SINGULAR — the backend key is "invite".
   ────────────────────────────────────────────────────────────────────────── */

export interface ProfileDTO {
  firstName: string;
  lastName: string;
  botLeagueId: string;            // e.g. "BLU2600001"
  location: string;              // e.g. "pune, MH"
  memberSince: string;           // ISO date e.g. "2026-04-02"
  rank: number | null;           // null until ranked
  seasonPoints: number | null;   // null until points are earned
  role: string;                  // e.g. "USER"
}

export interface RobotResponseDTO {
  id: string;
  robotCode: string;             // e.g. "BLR2600001"
  robotName: string;
  robotIMG: string | null;       // image url (often null)
  category: string;              // e.g. "COMBAT"
  weightClass: string;           // e.g. "15kg" / "Lightweight (<5kg)"
  controlType: string;           // e.g. "MANUAL"
  description: string;
  status: string;                // e.g. "ACTIVE"
  teamId: string;
  createdAt: string;             // ISO datetime
}

export interface TeamsDTO {
  teamId: string;
  teamName: string;
  teamCode: string;              // e.g. "BLT2600002"
  role: string; 
  teamLogo: string | null;       // image url (often null)
  status: string;                // ACTIVE | LEFT ...
}

export interface InvitesDTO {
  inviteId: string;
  teamId: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  status: string;                // PENDING | ACCEPTED | DECLINED | CANCELLED
  expiresAt: string;
}

export interface MatchDTO {
  matchId: string;
  roundNumber: number;
  matchNumber: number;
  status: string;                // SCHEDULED | COMPLETED ...
  teamAScore: number | null;
  teamBScore: number | null;
  teamAName: string | null;      // resolved team name (can be null = TBD/bye)
  teamBName: string | null;
  teamARegistrationId: string | null;
  teamBRegistrationId: string | null;
  winnerRegistrationId: string | null;
  scheduledAt: string | null;
}

export interface SportDTO {
  eventSportId: string;
  sport: string;                 // e.g. "15KG Robo War" / "LINE_FOLLOWER"
  ageGroup: string | null;       // e.g. "JUNIOR_INNOVATORS"
  weightClass: string;
  formatType: string;            // KNOCKOUT | DOUBLE_ELIMINATION ...
  registrationStatus: string;    // REGISTERED | CANCELLED ...
  matches: MatchDTO[];
}

export interface EventDTO {
  eventId: string;
  eventCode: string;             // e.g. "BLE2600002"
  eventName: string;
  logoURL: string | null;
  eventDescription: string;
  organizationName: string;
  venueName: string;
  city: string;
  state: string;
  startDate: string;             // ISO date
  endDate: string;               // ISO date
  eventStatus: string;           // PUBLISHED | DRAFT ...
  sport: SportDTO;               // the sport/category this registration is for
}

export interface DashboardResponse {
  profile: ProfileDTO;
  robots: RobotResponseDTO[];
  teams: TeamsDTO[];
  invite: InvitesDTO[];          // NOTE: singular key, matches backend
  events: EventDTO[];
}

export const getDashboard = async (): Promise<DashboardResponse> => {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
};