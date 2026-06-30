// Official weight-class catalogue shared by every robot create/update form
// (team create wizard, team edit modal, admin create modal, admin edit page).
// Keyed by the robot's `sport` value so the dropdown only ever shows the
// weight class(es) that sport is actually allowed to compete at.

export const WEIGHT_CLASS_LABELS: Record<string, string> = {
  "1KG":   "1 kg",
  "1_5KG": "1.5 kg",
  "3KG":   "3 kg",
  "5KG":   "5 kg",
  "8KG":   "8 kg",
  "15KG":  "15 kg",
  "30KG":  "30 kg",
  "60KG":  "60 kg",
};

// Empty array = this sport has no weight-class concept (e.g. drones, RC, project-based).
export const WEIGHT_CLASS_OPTIONS_BY_SPORT: Record<string, string[]> = {
  // Junior Innovators — single fixed class, 1kg / 20x20x20cm box
  PLUG_N_PLAY_SOCCER:  ["1KG"],
  ROBO_SUMO:            ["1KG"],
  LINE_FOLLOWER:        ["1KG"],
  MANUAL_TASK:          ["1KG"],

  // Young Engineers
  LINE_FOLLOWER_AUTO:   ["1_5KG"],
  ROBOWAR_1_5KG:        ["1_5KG"],

  // Spans both Young Engineers (3kg) and Robo Minds (5kg) — let the team pick
  // whichever matches their robot's actual build weight.
  ROBO_SOCCER:           ["3KG", "5KG"],
  THEME_BASED_TASKING:   ["3KG", "5KG"],

  // Robo Minds — RoboWar weight classes (one EventSports row per class)
  ROBOWAR_8KG:   ["8KG"],
  ROBOWAR_15KG:  ["15KG"],
  ROBOWAR_30KG:  ["30KG"],
  ROBOWAR_60KG:  ["60KG"],

  // No weight class — sport/dimension limits apply instead (or none at all)
  DRONE_RACING:   [],
  DRONE_SOCCER:   [],
  RC_RACING:      [],
  AEROMODELLING:  [],
  PROJECT_BASED:  [],
};

export function getWeightClassOptions(sport?: string | null): string[] {
  if (!sport) return [];
  return WEIGHT_CLASS_OPTIONS_BY_SPORT[sport.toUpperCase()] ?? [];
}

export function weightClassLabel(code: string): string {
  return WEIGHT_CLASS_LABELS[code] ?? code;
}
