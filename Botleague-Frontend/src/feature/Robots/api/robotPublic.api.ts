import api from "../../../shared/api/Base";

// The public robot endpoints return imageUrl as the raw R2 object key
// (e.g. "robots/<teamId>/<robotId>/images/<file>.png"), not a full URL —
// the authenticated robot endpoints prefix this same media host
// server-side (RobotService.mapRobot), but that step is missing here.
// Normalizing client-side, in one place, fixes every consumer of these
// two functions instead of each caller re-guessing the media host.
const MEDIA_BASE_URL = "https://media.botleague.in";

function resolveImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${MEDIA_BASE_URL}/${raw.replace(/^\/+/, "")}`;
}

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
  attributes:  Record<string, string> | null;
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
  return { ...res.data, imageUrl: resolveImageUrl(res.data.imageUrl) };
};

// Look up by robot code e.g. BLR0000001 (share links)
export const getPublicRobotProfileByCode = async (robotCode: string): Promise<PublicRobotProfile> => {
  const res = await api.get<PublicRobotProfile>(`/robots/public/code/${robotCode}`);
  return { ...res.data, imageUrl: resolveImageUrl(res.data.imageUrl) };
};
