import api from "../../../shared/api/Base";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GlobalRankingEntry {
  rank:           number;
  previousRank:   number | null;
  rankDelta:      number | null;
  robotId?:       string | null;
  robotName?:     string | null;
  teamId:         string;
  teamName:       string;
  avatarUrl?:     string | null;
  state?:         string | null;
  city?:          string | null;
  sport:          string;
  ageGroup:       string;
  ageGroupLabel:  string;
  weightClass:    string | null;
  totalPoints:    number;
  eventsPlayed:   number;
  matchesPlayed:  number;
  wins:           number;
  losses:         number;
  winPercentage:  number;
  goldMedals:     number;
  silverMedals:   number;
  bronzeMedals:   number;
  lastEventId?:   string | null;
  lastEventDate?: string | null;
  lastUpdated?:   string | null;
}

export interface GlobalRankingPage {
  sport:       string;
  ageGroup:    string;
  weightClass: string | null;
  total:       number;
  page:        number;
  size:        number;
  entries:     GlobalRankingEntry[];
}

export interface LeaderboardEntry {
  rank:          number;
  robotId?:      string | null;
  teamId:        string;
  teamName:      string;
  robotName:     string | null;
  wins:          number;
  losses:        number;
  matchesPlayed: number;
  pointsEarned:  number;
  winPercentage: number;
  isFinalized:   boolean;
}

export interface EventLeaderboard {
  eventId:     string;
  eventSportId:string;
  eventName:   string | null;
  sport:       string;
  ageGroup:    string;
  weightClass: string | null;
  isFinalized: boolean;
  entries:     LeaderboardEntry[];
}

// ── Global Ranking ────────────────────────────────────────────────────────────

export const getGlobalRanking = async (params: {
  sport:        string;
  ageGroup:     string;
  weightClass?: string;
  page?:        number;
  size?:        number;
}): Promise<GlobalRankingPage> => {
  const res = await api.get("/rankings/global", {
    params: {
      sport:       params.sport,
      ageGroup:    params.ageGroup,
      weightClass: params.weightClass,
      page:        params.page ?? 0,
      size:        params.size ?? 50,
    },
  });
  return res.data;
};

export const getTopRanked = async (params: {
  sport:        string;
  ageGroup:     string;
  weightClass?: string;
  n?:           number;
}): Promise<GlobalRankingEntry[]> => {
  const res = await api.get("/rankings/global/top", {
    params: {
      sport:       params.sport,
      ageGroup:    params.ageGroup,
      weightClass: params.weightClass,
      n:           params.n ?? 50,
    },
  });
  return res.data;
};

export const getAvailableSports = async (): Promise<string[]> => {
  const res = await api.get("/rankings/sports");
  return res.data ?? [];
};

export const getAvailablePools = async (): Promise<{ sport: string; ageGroup: string }[]> => {
  const res = await api.get("/rankings/pools");
  return res.data ?? [];
};

export const getWeightClasses = async (sport: string): Promise<string[]> => {
  const res = await api.get(`/rankings/sports/${encodeURIComponent(sport)}/weight-classes`);
  return res.data ?? [];
};

// ── Finalize event leaderboard (event-tier only — sort, assign ranks, mark
//    finalized. Does NOT touch the global ranking pool.) ─────────────────────

export const finalizeEventLeaderboard = async (eventSportId: string): Promise<string> => {
  const res = await api.post(`/rankings/finalize/${eventSportId}`);
  return res.data;
};

// ── Push to GLOBAL rankings — ADMIN/SUPER_ADMIN only, no exceptions ───────────

export const pushToGlobalRankings = async (eventSportId: string): Promise<string> => {
  const res = await api.post(`/rankings/global/push/${eventSportId}`);
  return res.data;
};

// ── Event Leaderboard ─────────────────────────────────────────────────────────

export const getEventLeaderboard = async (eventSportId: string): Promise<EventLeaderboard> => {
  const res = await api.get(`/rankings/leaderboard/${eventSportId}`);
  return res.data;
};
