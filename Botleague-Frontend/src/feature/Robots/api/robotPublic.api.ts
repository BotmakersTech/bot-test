import api from "../../../shared/api/Base";

export interface RobotTournamentRecord {
  eventId:      string;
  eventName:    string | null;
  eventSportId: string;
  sport:        string | null;
  ageGroup:     string | null;
  weightClass:  string | null;
  eventRank:    number | null;
  matchesPlayed:number;
  wins:         number;
  losses:       number;
  pointsEarned: number;
  isFinalized:  boolean;
}

export interface PublicRobotProfile {
  robotId:     string;
  robotCode:   string;
  robotName:   string;
  description: string | null;
  status:      string | null;
  imageUrl:    string | null;
  robotType:   string | null;
  sport:       string | null;
  ageCategory: string | null;
  controlType: string | null;
  controlMode: string | null;
  weightClass: string | null;
  weightKg:    number | null;
  lengthCm:    number | null;
  widthCm:     number | null;
  heightCm:    number | null;
  teamId:      string | null;
  teamName:    string | null;
  teamCode:    string | null;
  teamLogoUrl: string | null;
  totalMatches:  number;
  totalWins:     number;
  totalLosses:   number;
  totalPoints:   number;
  eventsPlayed:  number;
  goldMedals:    number;
  silverMedals:  number;
  bronzeMedals:  number;
  records: RobotTournamentRecord[];
}

// Look up by UUID
export const getPublicRobotProfile = async (robotId: string): Promise<PublicRobotProfile> => {
  const res = await api.get<PublicRobotProfile>(`/robots/public/${robotId}`);
  return res.data;
};

// Look up by robot code e.g. BLR0000001 (share links)
export const getPublicRobotProfileByCode = async (robotCode: string): Promise<PublicRobotProfile> => {
  const res = await api.get<PublicRobotProfile>(`/robots/public/code/${robotCode}`);
  return res.data;
};
