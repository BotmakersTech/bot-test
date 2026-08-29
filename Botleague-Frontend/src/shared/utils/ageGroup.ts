import { getCachedLeagues } from "../../temp/pages/leagues/useLeagues";

// Age-group eligibility codes map 1:1 to a League. Source of truth is the
// backend catalog (leagues.age_group_code -> leagues.name); this fallback
// mirrors V27__catalog_seed_data.sql and covers the first render before the
// catalog has loaded (or if it's ever unavailable).
const FALLBACK_BY_CODE: Record<string, string> = {
  JUNIOR_INNOVATORS: "Ignite",
  YOUNG_ENGINEERS: "Inferno",
  ROBO_MINDS: "Apex",
};

/**
 * Turn a stored age-group code ("JUNIOR_INNOVATORS", "ROBO_MINDS", …) into its
 * League name ("Ignite", "Apex", …) for display. Use this everywhere instead
 * of toLabel()/titleCase() on an ageGroup value so users never see the raw
 * eligibility vocabulary.
 */
export function ageGroupLabel(code?: string | null): string {
  if (!code) return "—";
  const fromCatalog = getCachedLeagues().find((l) => l.ageGroupValue === code);
  if (fromCatalog) return fromCatalog.shortName;
  return (
    FALLBACK_BY_CODE[code] ??
    code.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
