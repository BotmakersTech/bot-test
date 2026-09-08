// Mirror of backend SportSpecPolicy — the ONLY physical spec(s) that gate
// robot registration for a given (league, sport). A robot only has to satisfy
// the constraint(s) listed here; every other value on the event-sport row is
// informational.
//
//   League   Sport            Constraint
//   Ignite   Robo Sumo        Weight
//   Ignite   Robo Race        Weight
//   Ignite   Robo Soccer      Weight
//   Ignite   Drone Soccer     Diameter
//   Ignite   Line Follower    Dimension
//   Inferno  Robo War         Weight
//   Inferno  Robo Race        Weight + Dimension
//   Inferno  Robo Soccer      Weight + Dimension
//   Inferno  Drone Soccer     Diameter
//   Inferno  RC Racing Car    Scale
//   Apex     Robo War         Weight
//   Apex     Robo Race        Weight + Dimension
//   Apex     Robo Soccer      Weight + Dimension
//   Apex     Drone Soccer     Diameter
//   Apex     RC Racing Car    Scale

export interface SpecConstraints {
  weight: boolean;
  dimension: boolean;
  scale: boolean;
  /** Drone Soccer's real gate — 12.5 cm at Ignite, 20 cm at Inferno/Apex. */
  diameter: boolean;
}

// Drone Soccer used to be filed under `dimension`, but its catalog rows carry no
// length/width/height at all — only extraSpecs.diameterCm — so every check was
// skipped and any drone could enter. `diameter` is deliberately absent from ALL:
// it is that one sport's gate, and applying it to an unrecognised sport would
// reject robots for a spec that sport never asked for.
const ALL: SpecConstraints        = { weight: true,  dimension: true,  scale: true,  diameter: false };
const WEIGHT: SpecConstraints     = { weight: true,  dimension: false, scale: false, diameter: false };
const DIMENSION: SpecConstraints  = { weight: false, dimension: true,  scale: false, diameter: false };
const SCALE: SpecConstraints      = { weight: false, dimension: false, scale: true,  diameter: false };
const DIAMETER: SpecConstraints   = { weight: false, dimension: false, scale: false, diameter: true  };
const WEIGHT_DIM: SpecConstraints = { weight: true,  dimension: true,  scale: false, diameter: false };

const norm = (s?: string | null) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, "");

/**
 * Canonical bucket for "which real sport is this" — RCRACINGCAR and ROBORACE
 * are deliberately distinct results (both are RC vehicles, but gated on
 * different specs: scale vs weight/dimension — see the matrix below). Used
 * to compare a robot's sport against an event-sport's, instead of a
 * hand-maintained name-to-name allowlist that has to be kept in sync with
 * every naming variant on both sides and silently drifts when it isn't
 * (see git history on RegistrationTab.tsx's old ROBOT_TO_EVENT_SPORT map).
 */
export function sportKey(sport?: string | null): string {
  const n = norm(sport);
  if (n.includes("ROBOWAR") || n.includes("ROBOTWAR") || n.includes("COMBAT")) return "ROBOWAR";
  if (n.includes("ROBOSUMO") || n.includes("SUMO")) return "ROBOSUMO";
  if (n.includes("LINEFOLLOWER") || n.includes("LINEFOLLOW")) return "LINEFOLLOWER";
  if (n.includes("DRONESOCCER") || n.includes("DRONE")) return "DRONESOCCER";
  if (n.includes("RCRACING") || n.includes("RCROBO") || n.includes("RCCAR")) return "RCRACINGCAR";
  if (n.includes("ROBOSOCCER") || n.includes("SOCCER")) return "ROBOSOCCER";
  if (n.includes("ROBORACE") || n.includes("ROBORACING") || n.includes("RACE")) return "ROBORACE";
  return n;
}

const MATRIX: Record<string, Record<string, SpecConstraints>> = {
  JUNIORINNOVATORS: {
    ROBOSUMO: WEIGHT,
    ROBORACE: WEIGHT,
    ROBOSOCCER: WEIGHT,
    DRONESOCCER: DIAMETER,
    LINEFOLLOWER: DIMENSION,
  },
  YOUNGENGINEERS: {
    ROBOWAR: WEIGHT,
    ROBORACE: WEIGHT_DIM,
    ROBOSOCCER: WEIGHT_DIM,
    DRONESOCCER: DIAMETER,
    RCRACINGCAR: SCALE,
  },
  ROBOMINDS: {
    ROBOWAR: WEIGHT,
    ROBORACE: WEIGHT_DIM,
    ROBOSOCCER: WEIGHT_DIM,
    DRONESOCCER: DIAMETER,
    RCRACINGCAR: SCALE,
  },
};

/** @param ageGroup event-sport age group — JUNIOR_INNOVATORS | YOUNG_ENGINEERS | ROBO_MINDS */
export function constraintsFor(ageGroup?: string | null, sport?: string | null): SpecConstraints {
  return MATRIX[norm(ageGroup)]?.[sportKey(sport)] ?? ALL;
}
