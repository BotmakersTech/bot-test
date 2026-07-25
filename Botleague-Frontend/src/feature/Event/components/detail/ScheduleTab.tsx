import type { PublicMatchView } from "../../../Matches/api/matches.api";

interface ScheduleTabProps {
  matches: PublicMatchView[];
  loading: boolean;
  error: string | null;
  sportLabel: string;
}

function initials(name?: string) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

function fmtWhen(m: PublicMatchView) {
  const when = m.scheduledAt ?? m.startedAt;
  if (!when) return m.status;
  return new Date(when).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ScheduleMatchCard({ match }: { match: PublicMatchView }) {
  const teamA = match.teamAName;
  const teamB = match.teamBName;

  return (
    <div className="match-card">
      <div className="match-header">
        <span>Match {match.matchNumber ?? ""}</span>
        <span>{fmtWhen(match)}</span>
      </div>
      <div className="team-row">
        <div className="team">
          <div className="team-logo">{initials(teamA)}</div>
          <span>{teamA ?? "TBD"}{match.teamAScore != null ? ` (${match.teamAScore})` : ""}</span>
        </div>
        <span className="vs">VS</span>
        <div className="team">
          <span>{teamB ?? "TBD"}{match.teamBScore != null ? ` (${match.teamBScore})` : ""}</span>
          <div className="team-logo">{initials(teamB)}</div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleTab({ matches, loading, error, sportLabel }: ScheduleTabProps) {
  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading schedule…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;

  const roundNumbers = Array.from(new Set(matches.map((m) => m.roundNumber ?? 0))).sort((a, b) => a - b);

  return (
    <div className="schedule-page">
      <div className="schedule-title">
        <h1>{sportLabel} Schedule</h1>
        <p>Full match schedule and results, round by round.</p>
      </div>

      {roundNumbers.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No matches have been scheduled yet.</p>
      ) : (
        roundNumbers.map((round, idx) => {
          const roundMatches = matches
            .filter((m) => (m.roundNumber ?? 0) === round)
            .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
          return (
            <div className="round-section" key={round}>
              <h2>Round {round || idx + 1}</h2>
              <div className="match-grid">
                {roundMatches.map((m) => (
                  <ScheduleMatchCard key={m.matchId} match={m} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
