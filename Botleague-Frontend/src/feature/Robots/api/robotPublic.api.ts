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
  // specs
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
  // team
  teamId:      string | null;
  teamName:    string | null;
  teamCode:    string | null;
  teamLogoUrl: string | null;
  // career
  totalMatches:  number;
  totalWins:     number;
  totalLosses:   number;
  totalPoints:   number;
  eventsPlayed:  number;
  goldMedals:    number;
  silverMedals:  number;
  bronzeMedals:  number;
  // records
  records: RobotTournamentRecord[];
}

export const getPublicRobotProfile = async (robotId: string): Promise<PublicRobotProfile> => {
  const res = await api.get<PublicRobotProfile>(`/robots/public/${robotId}`);
  return res.data;
};
