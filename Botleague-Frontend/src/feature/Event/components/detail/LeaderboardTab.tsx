import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, XCircle, TrendingUp, Trophy } from "lucide-react";
import type { EventLeaderboard } from "../../../Rankings/api/rankings.api";
import { useRaceRounds } from "../../../../feature/RaceRounds/hooks/useRaceRounds";
import type { RoundEntryDTO, RoundParticipantStatus } from "../../../../feature/RaceRounds/api/raceRounds.api";

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

/** One robot's time for one round — "—" if it never ran that round, "DNF" if it started but didn't finish. */
function RoundTimeCell({ entry }: { entry?: RoundEntryDTO }) {
  if (!entry) return <span className="lb-round-value muted">—</span>;
  if (entry.dnf) return <span className="lb-round-value dnf">DNF</span>;
  return <span className="lb-round-value">{formatMillis(entry.timeMillis)}</span>;
}

export default function LeaderboardTab({ leaderboard, loading, error }: LeaderboardTabProps) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { rounds } = useRaceRounds(leaderboard?.eventSportId ?? "");

  // Round numbers this techsport actually has, oldest first (Round 1 leftmost)
  // — empty for a non-time-trial sport, which just renders zero round columns.
  const roundNumbers = useMemo(
    () => Array.from(new Set(rounds.map((r) => r.roundNumber))).sort((a, b) => a - b),
    [rounds]
  );

  // The round marked FINALIZED (if any) is the one whose ranking decides the
  // event's actual winner — mirrors PublicRaceRoundsView's own "which round
  // is the champion round" logic.
  const finalRoundNumber = useMemo(
    () => rounds.find((r) => r.status === "FINALIZED")?.roundNumber ?? null,
    [rounds]
  );

  // Per-robot: every round's entry (for the per-round time columns), plus
  // its rank in the final round specifically (for who actually won) and its
  // most recent status (for the Status column). RoundEntryDTO carries no
  // robotId to match against LeaderboardEntry.robotId, so normalized
  // robot/team name is the only join key available across both DTOs.
  const dataByRobot = useMemo(() => {
    const map = new Map<
      string,
      { roundTimes: Map<number, RoundEntryDTO>; latestStatus: RoundParticipantStatus | null; latestRound: number; finalRank: number | null }
    >();
    for (const round of rounds) {
      for (const entry of round.entries) {
        const key = normalize(entry.robotName) || normalize(entry.teamName);
        if (!key) continue;
        let rec = map.get(key);
        if (!rec) {
          rec = { roundTimes: new Map(), latestStatus: null, latestRound: -1, finalRank: null };
          map.set(key, rec);
        }
        rec.roundTimes.set(round.roundNumber, entry);
        if (round.roundNumber >= rec.latestRound) {
          rec.latestRound = round.roundNumber;
          rec.latestStatus = entry.status;
        }
        if (finalRoundNumber != null && round.roundNumber === finalRoundNumber) {
          rec.finalRank = entry.rankInRound ?? null;
        }
      }
    }
    return map;
  }, [rounds, finalRoundNumber]);

  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading leaderboard…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;
  if (!leaderboard || leaderboard.entries.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>Standings will appear here once the bracket is generated.</p>;
  }

  const withRounds = leaderboard.entries.map((entry) => {
    const key = normalize(entry.robotName) || normalize(entry.teamName);
    const match = dataByRobot.get(key);
    return {
      entry,
      roundTimes: match?.roundTimes ?? new Map<number, RoundEntryDTO>(),
      status: match?.latestStatus ?? null,
      finalRank: match?.finalRank ?? null,
    };
  });

  // The final round's own ranking decides placement whenever one exists —
  // that's the actual competition result. Entries that never reached the
  // final round (eliminated earlier, or DNF) sink to the bottom, ordered by
  // the leaderboard's own rank. Before any round is finalized, standings
  // simply follow the leaderboard's rank order.
  const ranked = [...withRounds].sort((a, b) => {
    if (a.finalRank != null && b.finalRank != null) return a.finalRank - b.finalRank;
    if (a.finalRank != null) return -1;
    if (b.finalRank != null) return 1;
    return a.entry.rank - b.entry.rank;
  });

  const visible = ranked.slice(0, visibleCount);
  const hasMore = visibleCount < ranked.length;

  const roundColTemplate = roundNumbers.map(() => "minmax(84px, 100px)").join(" ");
  const gridColumns = `64px minmax(0, 1.5fr) ${roundColTemplate}${roundNumbers.length ? " " : ""}minmax(0, 0.9fr) 130px 100px`;

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
          column-gap: 24px;
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
          column-gap: 24px;
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

        .lb-rank { display: flex; align-items: center; }
        .lb-medal {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef1f6;
          color: #5d6a7b;
          font-family: var(--lb-font-body);
          font-weight: 700;
          font-size: 15px;
          border-radius: 10px;
        }
        .lb-medal.gold {
          background: linear-gradient(180deg, #e8a700, #c98600);
          color: #fff;
          box-shadow: 0 3px 8px rgba(201, 134, 0, 0.35);
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
        .lb-robot-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .lb-robot-name {
          font-family: var(--lb-font-body);
          font-size: clamp(14px, 1.6vw, 16px);
          font-weight: 600;
          color: #263241;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lb-round-cell { display: flex; flex-direction: column; gap: 3px; }
        .lb-round-cell .lb-time-label {
          font-family: var(--lb-font-body);
          color: #8b96a6;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .lb-round-value {
          font-family: var(--lb-font-body);
          font-size: 14px;
          font-weight: 700;
          color: #263241;
        }
        .lb-round-value.muted { color: #b8c0cc; font-weight: 600; }
        .lb-round-value.dnf { color: #c2483f; }

        /* Compact round-time chips — shown only under the robot name on
           narrow screens, where a real column per round has no room. */
        .lb-rounds-mobile { display: none; flex-wrap: wrap; gap: 6px 10px; margin-top: 2px; }
        .lb-round-chip {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-family: var(--lb-font-body);
          font-size: 11.5px;
        }
        .lb-round-chip-label { color: #8b96a6; font-weight: 700; }

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

        .lb-point { text-align: right; font-family: var(--lb-font-body); font-size: 16px; font-weight: 700; color: #263241; }
        .lb-point-label { display: none; }

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
          .lb-heading, .lb-row { column-gap: 16px; padding: 20px 26px; }
        }

        @media (max-width: 767.98px) {
          .lb-page { padding: 0 12px 24px; }
          .lb-heading { display: none; }
          .lb-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            row-gap: 12px;
            padding: 20px 20px;
          }
          .lb-round-cell { display: none; }
          .lb-rounds-mobile { display: flex; }
          .lb-rank { order: 1; }
          .lb-robot { order: 2; flex: 1; min-width: 0; }
          .lb-view-cell { order: 3; margin-left: auto; flex-direction: row; }
          .lb-status { order: 4; flex-direction: row; gap: 6px; justify-content: flex-start; height: auto; width: 100%; }
          .lb-point { order: 5; text-align: left; width: 100%; }
          .lb-point::before { content: attr(data-label) ": "; color: #8b96a6; font-weight: 700; font-size: 11px; text-transform: uppercase; }
          .lb-profile-btn { padding: 7px 16px; }
          .lb-avatar { width: 32px; height: 32px; font-size: 11px; }
          .lb-medal { width: 32px; height: 32px; font-size: 13px; }
          .lb-robot-name { font-size: 13.5px; }
        }
      `}</style>

      <div className="lb-card">
        <div className="lb-heading" style={{ gridTemplateColumns: gridColumns }}>
          <span>Rank</span>
          <span>Robot name</span>
          {roundNumbers.map((rn) => (
            <span key={rn} className="lb-h-center">Round {rn}</span>
          ))}
          <span className="lb-h-center">Status</span>
          <span className="lb-h-center">View</span>
          <span className="lb-h-right">Points</span>
        </div>

        {visible.map(({ entry, roundTimes, status, finalRank }, idx) => {
          const displayRank = idx + 1;
          // Only a genuine final-round win earns the trophy — never show it
          // while standings are still provisional (rounds in progress).
          const isChampion = displayRank === 1 && finalRoundNumber != null && finalRank === 1;
          const meta = status ? STATUS_META[status] : null;
          const StatusIcon = meta?.icon ?? Clock3;

          return (
            <div
              className={`lb-row${isChampion ? " leading" : ""}`}
              key={`${entry.teamId}-${entry.robotId ?? entry.rank}`}
              style={{ gridTemplateColumns: gridColumns }}
            >
              <div className="lb-rank">
                {isChampion ? (
                  <span className="lb-medal gold" title="Winner">
                    <Trophy size={18} strokeWidth={2.3} />
                  </span>
                ) : (
                  <span className="lb-medal">{displayRank}</span>
                )}
              </div>

              <div className="lb-robot">
                <div className="lb-avatar">{initials(entry.robotName ?? entry.teamName)}</div>
                <div className="lb-robot-text">
                  <span className="lb-robot-name">{entry.robotName ?? entry.teamName ?? "—"}</span>
                  {roundNumbers.length > 0 && (
                    <div className="lb-rounds-mobile">
                      {roundNumbers.map((rn) => (
                        <span className="lb-round-chip" key={rn}>
                          <span className="lb-round-chip-label">R{rn}</span>
                          <RoundTimeCell entry={roundTimes.get(rn)} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {roundNumbers.map((rn) => (
                <div className="lb-round-cell" key={rn}>
                  <span className="lb-time-label">ROUND {rn}</span>
                  <RoundTimeCell entry={roundTimes.get(rn)} />
                </div>
              ))}

              <div className={`lb-status ${meta?.className ?? "progress"}`}>
                <span className="lb-status-value">
                  <StatusIcon size={14} strokeWidth={2.3} aria-hidden="true" />
                  {meta?.text ?? "Not started"}
                </span>
              </div>

              <div className="lb-view-cell">
                <button
                  type="button"
                  className="lb-profile-btn"
                  disabled={!entry.robotId}
                  onClick={() => entry.robotId && navigate(`/robot/${entry.robotId}`)}
                >
                  Profile
                </button>
              </div>

              <div className="lb-point" data-label="Points">{entry.pointsEarned}</div>
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
