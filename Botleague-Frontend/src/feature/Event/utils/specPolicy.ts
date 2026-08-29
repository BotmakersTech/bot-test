// Mirror of backend SportSpecPolicy — the ONLY physical spec(s) that gate
// robot registration for a given (league, sport). A robot only has to satisfy
// the constraint(s) listed here; every other value on the event-sport row is
// informational.
//
//   League   Sport            Constraint
//   Ignite   Robo Sumo        Weight
//   Ignite   Robo Race        Weight
//   Ignite   Robo Soccer      Weight
//   Ignite   Drone Soccer     Dimension
//   Ignite   Line Follower    Dimension
//   Inferno  Robo War         Weight
//   Inferno  Robo Race        Weight + Dimension
//   Inferno  Robo Soccer      Weight + Dimension
//   Inferno  Drone Soccer     Dimension
//   Inferno  RC Racing Car    Scale
//   Apex     Robo War         Weight
//   Apex     Robo Race        Weight + Dimension
//   Apex     Robo Soccer      Weight + Dimension
//   Apex     Drone Soccer     Dimension
//   Apex     RC Racing Car    Scale

export interface SpecConstraints {
  weight: boolean;
  dimension: boolean;
  scale: boolean;
}

const ALL: SpecConstraints = { weight: true, dimension: true, scale: true };
const WEIGHT: SpecConstraints = { weight: true, dimension: false, scale: false };
const DIMENSION: SpecConstraints = { weight: false, dimension: true, scale: false };
const SCALE: SpecConstraints = { weight: false, dimension: false, scale: true };
const WEIGHT_DIM: SpecConstraints = { weight: true, dimension: true, scale: false };

const norm = (s?: string | null) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, "");

function sportKey(sport?: string | null): string {
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
    DRONESOCCER: DIMENSION,
    LINEFOLLOWER: DIMENSION,
  },
  YOUNGENGINEERS: {
    ROBOWAR: WEIGHT,
    ROBORACE: WEIGHT_DIM,
    ROBOSOCCER: WEIGHT_DIM,
    DRONESOCCER: DIMENSION,
    RCRACINGCAR: SCALE,
  },
  ROBOMINDS: {
    ROBOWAR: WEIGHT,
    ROBORACE: WEIGHT_DIM,
    ROBOSOCCER: WEIGHT_DIM,
    DRONESOCCER: DIMENSION,
    RCRACINGCAR: SCALE,
  },
};

/** @param ageGroup event-sport age group — JUNIOR_INNOVATORS | YOUNG_ENGINEERS | ROBO_MINDS */
export function constraintsFor(ageGroup?: string | null, sport?: string | null): SpecConstraints {
  return MATRIX[norm(ageGroup)]?.[sportKey(sport)] ?? ALL;
}
