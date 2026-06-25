// ======================================================
// leaderboard.api.ts
// Leaderboard API types & fetch
// Place alongside your matches.api.ts
// ======================================================

import api from "../../../shared/api/Base";

// ─── DTOs ─────────────────────────────────────────────

export type LeaderboardStatus = "CHAMPION" | "ELIMINATED" | "ACTIVE";

export interface LeaderboardEntryDTO {
  rank:               number;
  tied:               boolean;
  registrationId:     string;
  robotName:          string | null;
  teamName:           string | null;
  status:             LeaderboardStatus;
  eliminatedInRound:  number | null;
  played:             number;
  wins:               number;
  losses:             number;
  byes:               number;
  pointsFor:          number;
  pointsAgainst:      number;
  pointDifferential:  number;
}

export interface LeaderboardResponseDTO {
  eventSportId:            string;
  tournamentFormat:        string | null;
  matchType:               string | null;
  isFinal:                 boolean;
  totalTeams:              number;
  championRegistrationId:  string | null;
  championRobotName:       string | null;
  championTeamName:        string | null;
  entries:                 LeaderboardEntryDTO[];
}

// ─── API call ─────────────────────────────────────────

export const getLeaderboard = async (
    _eventId: string,
    sportId: string
): Promise<LeaderboardResponseDTO> => {
  const response = await api.get<LeaderboardResponseDTO>(
    `/v1/leaderboard/event-sport/${sportId}`
  );
  return response.data;
};

