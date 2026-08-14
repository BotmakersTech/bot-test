import api from "./Base";

/**
 * Public reads of the backend-driven League/Sport catalog — replaces the
 * old hardcoded sportCatalogue.ts / leagueData.ts. Only ever returns
 * ACTIVE leagues/sports and LIVE league/sport pairings; DRAFT/DISABLED
 * rows are admin-only (see adminCatalog.api.ts).
 */

export type CatalogStatus = "ACTIVE" | "DISABLED";
export type LeagueSportStatus = "DRAFT" | "LIVE";
export type ControlType = "WIRED" | "WIRELESS" | "ANY";

export interface WeightClass {
  label: string;
  weightKg: number;
}

export interface League {
  id: string;
  slug: string;
  ageGroupCode: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  tagline: string | null;
  description: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  whatYouGet: string[];
  rankingScope: string | null;
  nextLeagueId: string | null;
  status: CatalogStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  competitionTypeHint: string | null;
  description: string | null;
  iconUrl: string | null;
  status: CatalogStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

/** A Sport's specs *within* one League — this is what "picking a sport" during event setup pre-fills. */
export interface LeagueSport {
  id: string;
  leagueId: string;
  leagueSlug: string;
  leagueName: string;
  sportId: string;
  sportSlug: string;
  sportName: string;
  weightLimitKg: number | null;
  maxLengthCm: number | null;
  maxWidthCm: number | null;
  maxHeightCm: number | null;
  controlType: ControlType | null;
  maxBotsPerTeam: number | null;
  weightClasses: WeightClass[];
  extraSpecs: Record<string, string>;
  entryNote: string | null;
  status: LeagueSportStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export const getPublicLeagues = async (): Promise<League[]> => {
  const res = await api.get("/catalog/leagues");
  return res.data;
};

export const getPublicLeague = async (slug: string): Promise<League> => {
  const res = await api.get(`/catalog/leagues/${encodeURIComponent(slug)}`);
  return res.data;
};

/** Only LIVE pairings — the direct replacement for the old SPORT_SPEC_PRESETS lookup. */
export const getPublicLeagueSports = async (slug: string): Promise<LeagueSport[]> => {
  const res = await api.get(`/catalog/leagues/${encodeURIComponent(slug)}/sports`);
  return res.data;
};

export const getPublicSports = async (): Promise<Sport[]> => {
  const res = await api.get("/catalog/sports");
  return res.data;
};

/** LeagueSport.weightClasses if set (Apex-style multi-class), else a single
 *  implicit class synthesized from weightLimitKg (Ignite/Inferno-style). */
export function toWeightClasses(ls: LeagueSport): { value: string; label: string }[] {
  if (ls.weightClasses.length > 0) {
    return ls.weightClasses.map((wc) => ({ value: wc.label, label: wc.label }));
  }
  if (ls.weightLimitKg != null) {
    return [{ value: `${ls.weightLimitKg}kg`, label: `${ls.weightLimitKg} kg` }];
  }
  return [];
}
