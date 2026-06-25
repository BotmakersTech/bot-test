import  api  from "../../../shared/api/Base";

export interface PublicMatchView {

  matchId: string;

  eventSportId: string;

  format: string;


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
