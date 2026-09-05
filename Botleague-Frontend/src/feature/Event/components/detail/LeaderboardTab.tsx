import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, XCircle, TrendingUp } from "lucide-react";
import type { EventLeaderboard } from "../../../Rankings/api/rankings.api";
import { useRaceRounds } from "../../../../feature/RaceRounds/hooks/useRaceRounds";
import type { RoundParticipantStatus } from "../../../../feature/RaceRounds/api/raceRounds.api";

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

function formatMillis(ms?: number | null): string {
  if (ms == null) return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = (ms % 60000) / 1000;
  const secStr = seconds.toFixed(3).padStart(6, "0");
  return minutes > 0 ? `${minutes}:${secStr}` : `${seconds.toFixed(3)}s`;
}

function normalize(name?: string | null) {
  return (name ?? "").trim().toLowerCase();
}

const STATUS_META: Record<RoundParticipantStatus, { text: string; className: string; icon: typeof CheckCircle2 }> = {
  PENDING: { text: "Awaiting time", className: "progress", icon: Clock3 },
  TIMED: { text: "Recorded", className: "progress", icon: CheckCircle2 },
  DNF: { text: "DNF", className: "eliminated", icon: XCircle },
  ADVANCED: { text: "Advanced", className: "advanced", icon: TrendingUp },
  ELIMINATED: { text: "Eliminated", className: "eliminated", icon: XCircle },
  FINISHED: { text: "Finished", className: "finished", icon: CheckCircle2 },
};

export default function LeaderboardTab({ leaderboard, loading, error }: LeaderboardTabProps) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { rounds } = useRaceRounds(leaderboard?.eventSportId ?? "");

  // Build a per-robot lookup of best (fastest) recorded time and its most
  // recent round status, joined by robot/team name — RoundEntryDTO has no
  // robotId to match against LeaderboardEntry.robotId, so name is the only
  // shared key available across both DTOs.
  const timeByRobot = useMemo(() => {
    const map = new Map<string, { timeMillis: number | null; status: RoundParticipantStatus; roundNumber: number }>();
    for (const round of rounds) {
      for (const entry of round.entries) {
        const key = normalize(entry.robotName) || normalize(entry.teamName);
        if (!key) continue;
        const existing = map.get(key);
        const hasBetterTime =
          entry.timeMillis != null &&
          (existing?.timeMillis == null || entry.timeMillis < existing.timeMillis);
        const isMoreRecent = !existing || round.roundNumber >= existing.roundNumber;
        if (hasBetterTime || (isMoreRecent && !existing)) {
          map.set(key, {
            timeMillis: hasBetterTime ? entry.timeMillis! : existing?.timeMillis ?? null,
            status: entry.status,
            roundNumber: round.roundNumber,
          });
        } else if (isMoreRecent) {
          map.set(key, {
            timeMillis: existing?.timeMillis ?? null,
            status: entry.status,
            roundNumber: round.roundNumber,
          });
        }
      }
    }
    return map;
  }, [rounds]);

  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading leaderboard…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;
  if (!leaderboard || leaderboard.entries.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>Standings will appear here once the bracket is generated.</p>;
  }

  // Time decides who's leading: entries with a recorded race time are
  // sorted fastest-first. Entries with no time yet keep their original
  // leaderboard rank order and sink to the bottom.
  const withTime = leaderboard.entries.map((entry) => {
    const key = normalize(entry.robotName) || normalize(entry.teamName);
    const match = timeByRobot.get(key);
    return { entry, timeMillis: match?.timeMillis ?? null, status: match?.status ?? null };
  });

  const ranked = [...withTime].sort((a, b) => {
    if (a.timeMillis == null && b.timeMillis == null) return a.entry.rank - b.entry.rank;
    if (a.timeMillis == null) return 1;
    if (b.timeMillis == null) return -1;
    return a.timeMillis - b.timeMillis;
  });

  const visible = ranked.slice(0, visibleCount);
  const hasMore = visibleCount < ranked.length;

  return (
    <div className="lb-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarpanch:wght@600;700;800;900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700&family=Inter:wght@400;500;600;700&display=swap');

        .lb-page {
          --lb-font-heading: 'Sarpanch', sans-serif;
          --lb-font-body: 'Poppins', 'Segoe UI', sans-serif;
          font-family: 'Inter', sans-serif;
          max-width: 1180px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 20px 40px;
        }
        .lb-page * { box-sizing: border-box; }

        .lb-card {
          background: #fff;
          border: 1px solid #d3dfec;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 5px 18px rgba(31, 71, 120, 0.05);
        }

        .lb-heading {
          display: grid;
          grid-template-columns: 64px minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1fr) 130px 100px;
          column-gap: 32px;
          align-items: center;
          padding: 24px 40px;
          background: linear-gradient(90deg, rgba(233,240,250,0.9), rgba(247,249,253,0.9));
          border-bottom: 1px solid #dbe4ef;
        }
        .lb-heading span {
          font-family: var(--lb-font-body);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #2464c7;
        }
        .lb-heading .lb-h-right { text-align: right; }
        .lb-heading .lb-h-center { text-align: center; }

        .lb-row {
          display: grid;
          grid-template-columns: 64px minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1fr) 130px 100px;
          column-gap: 32px;
          align-items: center;
          padding: 26px 40px;
          border-bottom: 1px solid #e3e9f0;
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        }
        .lb-row:last-child { border-bottom: none; }
        .lb-row:hover {
          background: #f8fbff;
          box-shadow: inset 0 0 0 1px #dbe7f7;
          transform: translateY(-1px);
        }
        .lb-row.leading {
          background: linear-gradient(90deg, rgba(255,250,238,0.95), rgba(255,255,255,1));
          border-top: 1px solid #f0d496;
          border-bottom: 1px solid #f0d496;
        }
        .lb-row.leading:hover {
          background: linear-gradient(90deg, rgba(255,246,225,0.95), rgba(250,253,255,1));
        }

        .lb-rank {
          font-family: var(--lb-font-body);
          font-size: 16px;
          font-weight: 700;
          color: #263241;
        }

        .lb-robot {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .lb-avatar {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #6366f1;
          color: #fff;
          font-family: var(--lb-font-body);
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s ease;
        }
        .lb-row:hover .lb-avatar { transform: scale(1.06); }
        .lb-robot-name {
          font-family: var(--lb-font-body);
          font-size: clamp(14px, 1.6vw, 16px);
          font-weight: 600;
          color: #263241;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lb-time {
          font-family: var(--lb-font-body);
          font-size: 14px;
          font-weight: 700;
          color: #263241;
        }
        .lb-time-label,
        .lb-mobile-label {
          display: none;
          font-family: var(--lb-font-body);
          color: #8b96a6;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .lb-time-label { display: block; }

        .lb-status {
          font-family: var(--lb-font-body);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .lb-status-value {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .lb-status-value svg { transition: transform 0.18s ease; }
        .lb-row:hover .lb-status-value svg { transform: scale(1.15); }
        .lb-status.finished .lb-status-value { color: #6942bf; }
        .lb-status.advanced .lb-status-value { color: #25804b; }
        .lb-status.progress .lb-status-value { color: #0162d1; }
        .lb-status.eliminated .lb-status-value { color: #87919f; }

        .lb-view-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .lb-profile-btn {
          font-family: var(--lb-font-body);
          padding: 9px 20px;
          border-radius: 8px;
          border: none;
          background: #635bff;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
        }
        .lb-profile-btn:hover:not(:disabled) {
          background: #5147e6;
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(99, 91, 255, 0.3);
        }
        .lb-profile-btn:active:not(:disabled) { transform: translateY(0); }
        .lb-profile-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .lb-point {
          text-align: right;
          font-family: var(--lb-font-body);
          font-size: 16px;
          font-weight: 700;
          color: #263241;
        }

        .lb-more {
          text-align: center;
          padding: 22px;
          margin: 0;
          font-family: var(--lb-font-body);
          font-size: 14px;
          font-weight: 600;
          color: #2464c7;
          cursor: pointer;
          border-top: 1px solid #e3e9f0;
          transition: background 0.18s ease;
        }
        .lb-more:hover { background: #f8fbff; }

        @media (max-width: 991.98px) {
          .lb-page { padding: 18px 16px 32px; }
          .lb-heading, .lb-row {
            grid-template-columns: 46px minmax(0,1.5fr) minmax(0,0.8fr) minmax(0,0.9fr) 108px 76px;
            column-gap: 20px;
            padding: 20px 26px;
          }
        }

        @media (max-width: 767.98px) {
          .lb-page { padding: 0 12px 24px; }
          .lb-heading { display: none; }
          .lb-row {
            grid-template-columns: 36px 1fr auto;
            grid-template-areas:
              "rank robot profile"
              "rank time status"
              "rank point point";
            row-gap: 12px;
            padding: 20px 20px;
          }
          .lb-rank { grid-area: rank; align-self: start; }
          .lb-robot { grid-area: robot; }
          .lb-time { grid-area: time; }
          .lb-status { grid-area: status; justify-self: end; align-items: flex-end; height: auto; }
          .lb-view-cell { grid-area: profile; justify-self: end; align-items: flex-end; height: auto; }
          .lb-profile-btn { padding: 7px 16px; }
          .lb-point { grid-area: point; text-align: left; margin-top: 4px; }
          .lb-avatar { width: 32px; height: 32px; font-size: 11px; }
          .lb-robot-name { font-size: 13.5px; }
          .lb-mobile-label { display: block; }
        }
      `}</style>

      <div className="lb-card">
        <div className="lb-heading">
          <span>Rank</span>
          <span>Robot name</span>
          <span>Time</span>
          <span className="lb-h-center">Status</span>
          <span className="lb-h-center">View</span>
          <span className="lb-h-right">Points</span>
        </div>

        {visible.map(({ entry, timeMillis, status }, idx) => {
          const displayRank = idx + 1;
          const leading = displayRank === 1 && timeMillis != null;
          const meta = status ? STATUS_META[status] : null;
          const StatusIcon = meta?.icon ?? Clock3;

          return (
            <div className={`lb-row${leading ? " leading" : ""}`} key={`${entry.teamId}-${entry.robotId ?? entry.rank}`}>
              <div className="lb-rank">{displayRank}</div>

              <div className="lb-robot">
                <div className="lb-avatar">{initials(entry.robotName ?? entry.teamName)}</div>
                <span className="lb-robot-name">{entry.robotName ?? entry.teamName ?? "—"}</span>
              </div>

              <div className="lb-time">
                <span className="lb-time-label">TIME</span>
                {formatMillis(timeMillis)}
              </div>

              <div className={`lb-status ${meta?.className ?? "progress"}`}>
                <span className="lb-mobile-label">STATUS</span>
                <span className="lb-status-value">
                  <StatusIcon size={14} strokeWidth={2.3} aria-hidden="true" />
                  {meta?.text ?? "Not started"}
                </span>
              </div>

              <div className="lb-view-cell">
                <span className="lb-mobile-label">VIEW</span>
                <button
                  type="button"
                  className="lb-profile-btn"
                  disabled={!entry.robotId}
                  onClick={() => entry.robotId && navigate(`/robot/${entry.robotId}`)}
                >
                  Profile
                </button>
              </div>

              <div className="lb-point">{entry.pointsEarned}</div>
            </div>
          );
        })}

        {hasMore && (
          <p className="lb-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            See more ↓
          </p>
        )}
      </div>
    </div>
  );
}