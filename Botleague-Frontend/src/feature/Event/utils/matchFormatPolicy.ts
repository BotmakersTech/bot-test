// Mirror of backend MatchFormatPolicy — which match-generation system a sport
// uses: the existing elimination bracket (combat/team sports) or the newer
// round-wise time trial (timed-run sports). See specPolicy.ts for the sibling
// weight/dimension policy this file's normalization approach is copied from.
//
//   Sport            Format
//   Robo War         BRACKET
//   Robo Sumo        BRACKET
//   Drone Soccer     BRACKET
//   Robo Soccer      BRACKET
//   Robo Race        ROUND_TIME_TRIAL
//   RC Racing Car    ROUND_TIME_TRIAL
//   Line Follower    ROUND_TIME_TRIAL

export type MatchFormatKind = "BRACKET" | "ROUND_TIME_TRIAL";

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

const ROUND_TIME_TRIAL_SPORTS = new Set(["ROBORACE", "RCRACINGCAR", "LINEFOLLOWER"]);

export function formatFor(sport?: string | null): MatchFormatKind {
  return ROUND_TIME_TRIAL_SPORTS.has(sportKey(sport)) ? "ROUND_TIME_TRIAL" : "BRACKET";
}
