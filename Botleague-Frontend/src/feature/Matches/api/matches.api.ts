import  api  from "../../../shared/api/Base";

export interface PublicMatchView {

  matchId: string;

  eventSportId: string;

  format: string;

  // MatchResponseDTO already sends these — the type just didn't declare
  // them yet. Needed to lay out the public Schedule tab as the same
  // connected bracket graph the admin bracket page renders (view-only).
  tournamentFormat?: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  matchType?: "ONE_VS_ONE" | "TRIPLE_THREAT" | "FATAL_FOUR";
  bracketSide?: "WINNERS" | "LOSERS" | "GRAND_FINAL" | "THIRD_PLACE";
  loserNextMatchId?: string;
  leaderboardPosition?: number;
  isBracketReset?: boolean;

  roundNumber?: number;

  matchNumber?: number;

  bracketPosition?: number;


  teamARegistrationId?: string;
  teamBRegistrationId?: string;
  teamCRegistrationId?: string;
  teamDRegistrationId?: string;

  teamAName?: string;
  teamARobotName?: string;

  teamBName?: string;
  teamBRobotName?: string;

  teamCName?: string;
  teamCRobotName?: string;

  teamDName?: string;
  teamDRobotName?: string;

  teamAScore?: number;
  teamBScore?: number;
  teamCScore?: number;
  teamDScore?: number;

  winnerRegistrationId?: string;
  winnerTeamName?: string;
  winnerRobotName?: string;

  nextMatchId?: string;

  isBye?: boolean;

  autoAdvanced?: boolean;

 
  status: string;


  scheduledAt?: string;

  startedAt?: string;

  endedAt?: string;
}

export const publicGetEventsSportMatches = async (
  eventSportId: string
): Promise<PublicMatchView[]> => {
  const response = await api.get(
    `/v1/matches/event-sport/${eventSportId}`
  );

  return response.data;
};
export const publicGetAllMatches = async (
  
): Promise<PublicMatchView[]> => {
  const response = await api.get(
    `/v1/matches/all`
  );

  return response.data;
};
