import type { PublicMatchView } from "../../../Matches/api/matches.api";

interface MatchesTabProps {
  matches: PublicMatchView[];
  loading: boolean;
  error: string | null;
}

interface TeamSlot {
  name: string;
  robotName?: string;
  registrationId?: string;
}

function teamsOf(m: PublicMatchView): TeamSlot[] {
  const slots: TeamSlot[] = [];
  if (m.teamAName) slots.push({ name: m.teamAName, robotName: m.teamARobotName, registrationId: m.teamARegistrationId });
  if (m.teamBName) slots.push({ name: m.teamBName, robotName: m.teamBRobotName, registrationId: m.teamBRegistrationId });
  if (m.teamCName) slots.push({ name: m.teamCName, robotName: m.teamCRobotName, registrationId: m.teamCRegistrationId });
  if (m.teamDName) slots.push({ name: m.teamDName, robotName: m.teamDRobotName, registrationId: m.teamDRegistrationId });
  return slots;
}

function MatchCard({ match }: { match: PublicMatchView }) {
  const teams = teamsOf(match);
  const left = teams[0];
  const right = teams[1];

  // Robot-vs-robot bracket slice: only a decided match highlights its
  // winner's slice in the blue-violet gradient — everything else (scheduled,
  // live, no winner recorded yet) renders both slices in the neutral pale
  // gradient so the tab never implies a result that hasn't happened.
  const decided = match.status === "COMPLETED" && !!match.winnerRegistrationId;
  const leftWon = decided && left?.registrationId === match.winnerRegistrationId;
  const rightWon = decided && right?.registrationId === match.winnerRegistrationId;

  return (
    <div className="match-grid" style={{ marginBottom: 24 }}>
      <div className={`match left${leftWon ? " winner" : ""}`}>
        <div className="team-slot">
          <div className="team-image" />
          <span>{left ? `${left.name}${left.robotName ? ` — ${left.robotName}` : ""}` : "TBD"}</span>
        </div>
      </div>
      <div className={`match right${rightWon ? " winner" : ""}`}>
        <div className="team-slot">
          <span>{right ? `${right.name}${right.robotName ? ` — ${right.robotName}` : ""}` : "TBD"}</span>
          <div className="team-image" />
        </div>
      </div>
      {teams.length > 2 && (
        <p style={{ gridColumn: "1 / -1", fontSize: 14, color: "#666" }}>
          + {teams.slice(2).map((t) => t.name).join(", ")}
        </p>
      )}
    </div>
  );
}

export default function MatchesTab({ matches, loading, error }: MatchesTabProps) {
  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading matches…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;
  if (matches.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>No matches have been scheduled for this sport yet.</p>;
  }

  const roundNumbers = Array.from(new Set(matches.map((m) => m.roundNumber ?? 0))).sort((a, b) => a - b);

  return (
    <>
      {roundNumbers.map((round, idx) => {
        const roundMatches = matches
          .filter((m) => (m.roundNumber ?? 0) === round)
          .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
        return (
          <div key={round}>
            <h2 className={idx > 0 ? "round2" : undefined}>ROUND {round || idx + 1}</h2>
            {roundMatches.map((m) => (
              <MatchCard key={m.matchId} match={m} />
            ))}
          </div>
        );
      })}
    </>
  );
}
