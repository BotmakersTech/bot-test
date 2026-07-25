import { useState } from "react";
import type { LeaderboardResponseDTO, LeaderboardStatus } from "../../../Leaderboard/api/leaderboard.api";

interface LeaderboardTabProps {
  leaderboard: LeaderboardResponseDTO | null;
  loading: boolean;
  error: string | null;
}

const STATUS_LABEL: Record<LeaderboardStatus, string> = {
  CHAMPION: "🏆 Champion",
  ACTIVE: "In Progress",
  ELIMINATED: "Eliminated",
};

const PAGE_SIZE = 8;

function initials(name?: string | null) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

export default function LeaderboardTab({ leaderboard, loading, error }: LeaderboardTabProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading leaderboard…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;
  if (!leaderboard || leaderboard.entries.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>Rankings will appear here once matches begin.</p>;
  }

  const visible = leaderboard.entries.slice(0, visibleCount);
  const hasMore = visibleCount < leaderboard.entries.length;

  return (
    <div className="leaderboard">
      {leaderboard.championTeamName && (
        <div className="champion-banner">
          🏆 Champion: {leaderboard.championTeamName}
          {leaderboard.championRobotName ? ` — ${leaderboard.championRobotName}` : ""}
        </div>
      )}

      <div className="heading">
        <span>Rank</span>
        <span>Team</span>
        <span>Status</span>
        <span>Record</span>
        <span>Diff</span>
      </div>

      {visible.map((entry) => (
        <div className="player-card" key={entry.registrationId}>
          <div>{entry.tied ? `T-${entry.rank}` : entry.rank}</div>

          <div className="user">
            <div className="avatar">{initials(entry.teamName ?? entry.robotName)}</div>
            <span>
              {entry.teamName ?? "—"}
              {entry.robotName ? ` — ${entry.robotName}` : ""}
            </span>
          </div>

          <button type="button" className="profile-btn" disabled style={{ opacity: 0.85, cursor: "default" }}>
            {STATUS_LABEL[entry.status]}
          </button>

          <div>{entry.wins}-{entry.losses}</div>

          <div>{entry.pointDifferential > 0 ? `+${entry.pointDifferential}` : entry.pointDifferential}</div>
        </div>
      ))}

      {hasMore && (
        <h4 className="more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
          See More ↓
        </h4>
      )}
    </div>
  );
}
