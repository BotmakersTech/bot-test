import api from "../../../shared/api/Base";

export interface EventRecord {
  eventId:      string;
  eventName:    string | null;
  eventSportId: string;
  sport:        string;
  ageGroup:     string | null;
  weightClass:  string | null;
  eventRank:    number | null;
  matchesPlayed:number;
  wins:         number;
  losses:       number;
  pointsEarned: number;
  isFinalized:  boolean;
  robotName:    string | null;
}

export interface PublicTeamProfile {
  teamId:          string;
  teamCode:        string;
  teamName:        string;
  status:          string | null;
  logoUrl:         string | null;
  description:     string | null;
  institutionName: string | null;
  city:            string | null;
  state:           string | null;
  country:         string | null;
  totalPoints:     number;
  totalWins:       number;
  totalLosses:     number;
  matchesPlayed:   number;
  eventsPlayed:    number;
  bestGlobalRank:  number | null;
  goldMedals:      number;
  silverMedals:    number;
  bronzeMedals:    number;
  eventRecords:    EventRecord[];
}

// Look up by UUID (internal links)
export const getPublicTeamProfile = async (teamId: string): Promise<PublicTeamProfile> => {
  const res = await api.get<PublicTeamProfile>(`/teams/public/${teamId}`);
  return res.data;
};

// Look up by team code e.g. BLT0000001 (share links)
export const getPublicTeamProfileByCode = async (teamCode: string): Promise<PublicTeamProfile> => {
  const res = await api.get<PublicTeamProfile>(`/teams/public/code/${teamCode}`);
  return res.data;
};
