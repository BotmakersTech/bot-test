import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EventLeaderboard } from "../../../Rankings/api/rankings.api";

interface LeaderboardTabProps {
  leaderboard: EventLeaderboard | null;
  loading: boolean;
  error: string | null;
}

const PAGE_SIZE = 8;

function initials(name?: string | null) {
  if (!name) return "?";
  return name.trim().slice(0, 2).toUpperCase();
}

export default function LeaderboardTab({ leaderboard, loading, error }: LeaderboardTabProps) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading leaderboard…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;
  if (!leaderboard || leaderboard.entries.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>Standings will appear here once the bracket is generated.</p>;
  }

  const visible = leaderboard.entries.slice(0, visibleCount);
  const hasMore = visibleCount < leaderboard.entries.length;

  return (
    <div className="leaderboard">
      <div className="heading">
        <span>Rank</span>
        <span>Robot Name</span>
        <span>View</span>
        <span>Point</span>
      </div>

      {visible.map((entry) => (
        <div className="player-card" key={`${entry.teamId}-${entry.robotId ?? entry.rank}`}>
          <div>{entry.rank}</div>

          <div className="user">
            <div className="avatar">{initials(entry.robotName ?? entry.teamName)}</div>
            <span>{entry.robotName ?? entry.teamName ?? "—"}</span>
          </div>

          <button
            type="button"
            className="profile-btn"
            disabled={!entry.robotId}
            onClick={() => entry.robotId && navigate(`/robot/${entry.robotId}`)}
          >
            Profile
          </button>

          <div className="point">{entry.pointsEarned}</div>
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
