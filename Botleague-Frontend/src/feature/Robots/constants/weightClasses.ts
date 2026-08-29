// Official weight-class catalogue shared by every robot create/update form
// (team create wizard, team edit modal, admin create modal, admin edit page).
// Keyed by the robot's `sport` value so the dropdown only ever shows the
// weight class(es) that sport is actually allowed to compete at.

export const WEIGHT_CLASS_LABELS: Record<string, string> = {
  "1KG":   "1 KG",
  "1_5KG": "1.5 KG",
  "3KG":   "3 KG",
  "5KG":   "5 KG",
  "8KG":   "8 KG",
  "15KG":  "15 KG",
  "30KG":  "30 KG",
  "60KG":  "60 KG",
};

// Empty array = this sport has no weight-class concept (e.g. drones, RC).
export const WEIGHT_CLASS_OPTIONS_BY_SPORT: Record<string, string[]> = {
  // Junior Innovators — single fixed class, 1kg / 20x20x20cm box
  ROBO_SUMO:            ["1KG"],
  LINE_FOLLOWER:        ["1KG"],

  // Young Engineers
  LINE_FOLLOWER_AUTO:   ["1_5KG"],
  ROBOWAR_1_5KG:        ["1_5KG"],

  // Spans both Young Engineers (3kg) and Robo Minds (5kg) — let the team pick
  // whichever matches their robot's actual build weight.
  ROBO_SOCCER:           ["3KG", "5KG"],

  // Robo Minds — RoboWar weight classes (one EventSports row per class)
  ROBOWAR_8KG:   ["8KG"],
  ROBOWAR_15KG:  ["15KG"],
  ROBOWAR_30KG:  ["30KG"],
  ROBOWAR_60KG:  ["60KG"],

  // No weight class — sport/dimension limits apply instead (or none at all)
  DRONE_RACING:   [],
  DRONE_SOCCER:   [],
  RC_RACING:      [],
};

export function getWeightClassOptions(sport?: string | null): string[] {
  if (!sport) return [];
  return WEIGHT_CLASS_OPTIONS_BY_SPORT[sport.toUpperCase()] ?? [];
}

export function weightClassLabel(code: string): string {
  return WEIGHT_CLASS_LABELS[code] ?? formatWeightClass(code);
}

/**
 * Render ANY stored weight-class string as a clean "N KG":
 *   "1_5KG" | "1_5" | "1.5kg" | "1.5 kg"  ->  "1.5 KG"
 *   "15KG"  | "15"                        ->  "15 KG"
 *   "Featherweight" | "Open" | "" | null   ->  tidied text, no invented "KG"
 *
 * Robots persist their class via toWeightClassCode ("1_5KG") and catalog
 * labels are free text, so every UI weight-class render funnels through this
 * instead of ad-hoc toLabel()/titleCase() calls that leak "1_5" / "1 5KG".
 */
export function formatWeightClass(raw?: string | null): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  // Whole string is just a number (with _ . or , as the decimal) + optional "kg".
  if (/^[\d._,\s]*(?:kg)?$/i.test(s)) {
    const m = s.match(/(\d+)(?:[._,](\d+))?/);
    if (m) {
      const n = Number(m[2] != null ? `${m[1]}.${m[2]}` : m[1]);
      if (Number.isFinite(n)) return `${n} KG`;
    }
  }
  // Named class ("Featherweight", "OPEN") — tidy separators + title-case only.
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
