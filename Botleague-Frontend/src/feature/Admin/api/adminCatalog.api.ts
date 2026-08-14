import api from "../../../shared/api/Base";
import type {
  CatalogStatus,
  ControlType,
  League,
  LeagueSport,
  LeagueSportStatus,
  Sport,
  WeightClass,
} from "../../../shared/api/catalog.api";

const BASE = "/admin/catalog";

// ── Leagues ────────────────────────────────────────────────────────────

export interface CreateLeagueRequest {
  slug: string;
  ageGroupCode: string;
  name: string;
  minAge?: number | null;
  maxAge?: number | null;
  tagline?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  whatYouGet?: string[];
  rankingScope?: string;
  nextLeagueId?: string | null;
  displayOrder?: number;
}

export type UpdateLeagueRequest = Partial<CreateLeagueRequest> & { status?: CatalogStatus };

export const getAdminLeagues = async (): Promise<League[]> => {
  const res = await api.get(`${BASE}/leagues`);
  return res.data;
};

export const getAdminLeague = async (id: string): Promise<League> => {
  const res = await api.get(`${BASE}/leagues/${id}`);
  return res.data;
};

export const createAdminLeague = async (req: CreateLeagueRequest): Promise<League> => {
  const res = await api.post(`${BASE}/leagues`, req);
  return res.data;
};

export const updateAdminLeague = async (id: string, req: UpdateLeagueRequest): Promise<League> => {
  const res = await api.patch(`${BASE}/leagues/${id}`, req);
  return res.data;
};

// ── Sports ─────────────────────────────────────────────────────────────

export interface CreateSportRequest {
  name: string;
  slug: string;
  competitionTypeHint?: string;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
}

export type UpdateSportRequest = Partial<CreateSportRequest> & { status?: CatalogStatus };

export const getAdminSports = async (): Promise<Sport[]> => {
  const res = await api.get(`${BASE}/sports`);
  return res.data;
};

export const getAdminSport = async (id: string): Promise<Sport> => {
  const res = await api.get(`${BASE}/sports/${id}`);
  return res.data;
};

export const createAdminSport = async (req: CreateSportRequest): Promise<Sport> => {
  const res = await api.post(`${BASE}/sports`, req);
  return res.data;
};

export const updateAdminSport = async (id: string, req: UpdateSportRequest): Promise<Sport> => {
  const res = await api.patch(`${BASE}/sports/${id}`, req);
  return res.data;
};

// ── League/Sport pairings ──────────────────────────────────────────────

export interface CreateLeagueSportRequest {
  leagueId: string;
  sportId: string;
  weightLimitKg?: number | null;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  controlType?: ControlType | null;
  maxBotsPerTeam?: number | null;
  weightClasses?: WeightClass[];
  extraSpecs?: Record<string, string>;
  entryNote?: string;
  status?: LeagueSportStatus;
  displayOrder?: number;
}

export type UpdateLeagueSportRequest = Partial<Omit<CreateLeagueSportRequest, "leagueId" | "sportId">>;

export const getAdminLeagueSports = async (leagueId?: string): Promise<LeagueSport[]> => {
  const res = await api.get(`${BASE}/league-sports`, { params: leagueId ? { leagueId } : undefined });
  return res.data;
};

export const getAdminLeagueSport = async (id: string): Promise<LeagueSport> => {
  const res = await api.get(`${BASE}/league-sports/${id}`);
  return res.data;
};

export const createAdminLeagueSport = async (req: CreateLeagueSportRequest): Promise<LeagueSport> => {
  const res = await api.post(`${BASE}/league-sports`, req);
  return res.data;
};

export const updateAdminLeagueSport = async (id: string, req: UpdateLeagueSportRequest): Promise<LeagueSport> => {
  const res = await api.patch(`${BASE}/league-sports/${id}`, req);
  return res.data;
};
