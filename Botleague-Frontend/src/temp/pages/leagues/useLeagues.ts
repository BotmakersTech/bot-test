import { useEffect, useState } from "react";
import { getPublicLeagues, type League } from "../../../shared/api/catalog.api";
import { getLeaguePresentation, type LeaguePresentation } from "./leaguePresentation";

/** A backend League enriched with the presentation-only fields Tailwind/copy needs. */
export interface PresentedLeague extends LeaguePresentation {
  id: string;
  slug: string;
  /** Display name, e.g. "IGNITE LEAGUE" (API's own `name` is just "Ignite"). */
  name: string;
  /** Un-branded short form, e.g. "Ignite" — the raw catalog name, for admin UI contexts where the all-caps hero treatment doesn't fit. */
  shortName: string;
  ageGroupValue: string;
  startingAge: string;
  minAge: number | null;
  maxAge: number | null;
  colorPrimary: string;
  colorSecondary: string;
  tagline: string;
  whatYouGet: string[];
  rankingScope: string;
  nextSlug: string | null;
}

/** e.g. "8–11", "18+", or "" when the league has no age bounds configured. */
export function formatAgeRange(minAge: number | null, maxAge: number | null): string {
  if (minAge == null && maxAge == null) return "";
  if (maxAge == null) return `${minAge}+`;
  if (minAge == null) return `up to ${maxAge}`;
  return `${minAge}–${maxAge}`;
}

function present(league: League): PresentedLeague {
  const p = getLeaguePresentation(league.ageGroupCode, league.name);
  return {
    ...p,
    id: league.id,
    slug: league.slug,
    name: `${league.name.toUpperCase()} LEAGUE`,
    shortName: league.name,
    ageGroupValue: league.ageGroupCode,
    minAge: league.minAge,
    maxAge: league.maxAge,
    startingAge: league.minAge != null ? `${league.minAge}+` : "—",
    colorPrimary: league.primaryColor || p.colorPrimary,
    colorSecondary: league.secondaryColor || p.colorSecondary,
    tagline: league.tagline ?? p.desc,
    whatYouGet: league.whatYouGet,
    rankingScope: league.rankingScope ?? "National ranking",
    nextSlug: null, // resolved below, once every league is loaded
  };
}

let cache: PresentedLeague[] | null = null;

/** Fetches + presents the ACTIVE league catalog once per session (module-level cache — this data changes rarely and every consumer needs the full list). */
export function useLeagues() {
  const [leagues, setLeagues] = useState<PresentedLeague[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    getPublicLeagues()
      .then((raw) => {
        const presented = raw.map(present);
        const byId = new Map(raw.map((l) => [l.id, l]));
        presented.forEach((p, i) => {
          const next = raw[i].nextLeagueId ? byId.get(raw[i].nextLeagueId as string) : null;
          p.nextSlug = next?.slug ?? null;
        });
        cache = presented;
        setLeagues(presented);
      })
      .finally(() => setLoading(false));
  }, []);

  return { leagues, loading };
}

export function getLeagueBySlug(leagues: PresentedLeague[], slug?: string): PresentedLeague | undefined {
  return leagues.find((l) => l.slug === slug);
}

/**
 * Best-effort synchronous read of the loaded league catalog. Empty until
 * useLeagues() has run once this session; callers must tolerate that.
 */
export function getCachedLeagues(): PresentedLeague[] {
  return cache ?? [];
}
