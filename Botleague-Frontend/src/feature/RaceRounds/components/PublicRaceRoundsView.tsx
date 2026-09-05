import { Timer, Trophy, CheckCircle2, TrendingUp, XCircle, Clock3, AlertCircle } from "lucide-react"

import { useRaceRounds } from "../hooks/useRaceRounds"
import type { RoundEntryDTO } from "../api/raceRounds.api"

function formatMillis(ms?: number | null): string {
  if (ms == null) return "—"
  const minutes = Math.floor(ms / 60000)
  const seconds = (ms % 60000) / 1000
  const secStr = seconds.toFixed(3).padStart(6, "0")
  return minutes > 0 ? `${minutes}:${secStr}` : `${seconds.toFixed(3)}s`
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: "status-eliminated",
  TIMED: "status-advanced",
  DNF: "status-eliminated",
  ADVANCED: "status-advanced",
  ELIMINATED: "status-eliminated",
  FINISHED: "status-finished",
}

const STATUS_TEXT: Record<string, string> = {
  PENDING: "Awaiting time",
  TIMED: "Recorded",
  DNF: "DNF",
  ADVANCED: "Advanced",
  ELIMINATED: "Eliminated",
  FINISHED: "Finished",
}

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  PENDING: Clock3,
  TIMED: CheckCircle2,
  DNF: AlertCircle,
  ADVANCED: TrendingUp,
  ELIMINATED: XCircle,
  FINISHED: CheckCircle2,
}

function RoundEntryRow({ entry, isFinalRound }: { entry: RoundEntryDTO; isFinalRound: boolean }) {
  const champion = isFinalRound && entry.rankInRound === 1
  const statusText = STATUS_TEXT[entry.status] ?? entry.status
  const statusClass = STATUS_CLASS[entry.status] ?? "status-eliminated"
  const StatusIcon = STATUS_ICON[entry.status] ?? AlertCircle

  return (
    <div className={`rr-row${champion ? " winner" : ""}`}>
      <div className="rr-rank">
        <div className={`rr-medal${champion ? " gold" : ""}`}>
          {champion ? <Trophy size={18} strokeWidth={2.3} /> : (entry.rankInRound ?? "—")}
        </div>
      </div>

      <div className="rr-robot-info">
        <span className="rr-robot-name">{entry.robotName ?? "—"}</span>
        {entry.teamName && <span className="rr-team-name">{entry.teamName}</span>}
      </div>

      <div className="rr-time">
        <span className="rr-time-label">TIME</span>
        <span className="rr-time-value">{formatMillis(entry.timeMillis)}</span>
      </div>

      <div className="rr-result-wrap">
        <div className={`rr-result ${statusClass}`}>
          <StatusIcon size={14} strokeWidth={2.3} aria-hidden="true" />
          {statusText}
        </div>
      </div>
    </div>
  )
}

export default function PublicRaceRoundsView({ sportId }: { sportId: string }) {
  const { rounds, loading, error } = useRaceRounds(sportId)

  if (loading && rounds.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading rounds…</p>
  }
  if (error) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>
  }
  if (rounds.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>Rounds haven't started for this techsport yet.</p>
  }

  const orderedRounds = [...rounds].sort((a, b) => b.roundNumber - a.roundNumber)
  const finalRoundNumber = rounds.find(r => r.status === "FINALIZED")?.roundNumber ?? null

  return (
    <div className="rr-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarpanch:wght@600;700;800;900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700&family=Inter:wght@400;500;600;700&display=swap');

        .rr-page {
          --rr-font-heading: 'Sarpanch', sans-serif;
          --rr-font-body: 'Poppins', 'Segoe UI', sans-serif;
          font-family: 'Inter', sans-serif;
          max-width: 1080px;
          width: 100%;
          margin: 0 auto;
          padding: 0 8px;
        }
        .rr-page * { box-sizing: border-box; }

        .rr-card {
          margin-bottom: 24px;
          background: #fff;
          border: 1px solid #d3dfec;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 18px rgba(31, 71, 120, 0.05);
          transition: box-shadow 0.2s ease;
        }
        .rr-card:hover { box-shadow: 0 10px 26px rgba(31, 71, 120, 0.1); }

        .rr-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 32px;
          background: linear-gradient(90deg, rgba(233,240,250,0.9), rgba(247,249,253,0.9));
          border-bottom: 1px solid #dbe4ef;
        }
        .rr-header-icon { color: #2464c7; display: inline-flex; align-items: center; }
        .rr-header-title {
          margin: 0;
          font-family: var(--rr-font-heading);
          color: #2464c7;
          font-size: clamp(15px, 1.9vw, 19px);
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rr-progress-badge {
          font-family: var(--rr-font-body);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #6541b5;
          background: #eee8ff;
          padding: 4px 9px;
          border-radius: 5px;
        }

        .rr-row {
          display: grid;
          grid-template-columns: 64px minmax(0, 1.8fr) minmax(0, 1fr) minmax(140px, 170px);
          column-gap: 24px;
          align-items: center;
          padding: 16px 32px;
          border-bottom: 1px solid #e3e9f0;
          transition: background 0.2s ease;
        }
        .rr-row:last-child { border-bottom: none; }
        .rr-row:hover { background: #f8fbff; }
        .rr-row.winner {
          background: linear-gradient(90deg, rgba(255,250,238,0.95), rgba(255,255,255,1));
          border-top: 1px solid #f0d496;
          border-bottom: 1px solid #f0d496;
        }

        .rr-rank { display: flex; align-items: center; }
        .rr-medal {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e9eef5;
          color: #5d6a7b;
          font-family: var(--rr-font-body);
          font-weight: 700;
          font-size: 15px;
          border-radius: 10px;
        }
        .rr-medal.gold {
          background: linear-gradient(180deg, #e8a700, #c98600);
          color: #fff;
        }

        .rr-robot-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .rr-robot-name {
          font-family: var(--rr-font-body);
          font-size: clamp(14px, 1.6vw, 17px);
          font-weight: 600;
          color: #263241;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rr-team-name {
          font-family: var(--rr-font-body);
          color: #6d7888;
          font-size: 13px;
        }

        .rr-time { display: flex; flex-direction: column; gap: 3px; }
        .rr-time-label {
          font-family: var(--rr-font-body);
          color: #8b96a6;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .rr-time-value {
          font-family: var(--rr-font-body);
          font-size: clamp(13px, 1.5vw, 16px);
          font-weight: 700;
          color: #263241;
        }

        .rr-result-wrap { display: flex; justify-content: flex-end; }
        .rr-result {
          font-family: var(--rr-font-body);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-finished { color: #6942bf; }
        .status-advanced { color: #25804b; }
        .status-eliminated { color: #87919f; }

        @media (max-width: 991.98px) {
          .rr-row { grid-template-columns: 56px minmax(0,1.6fr) minmax(0,1fr) 130px; padding: 14px 24px; }
          .rr-header { padding: 16px 24px; }
        }

        @media (max-width: 767.98px) {
          .rr-page { padding: 0 12px; }
          .rr-header { padding: 14px 16px; }
          .rr-header-title { font-size: 14.5px; }
          .rr-row {
            grid-template-columns: 42px 1fr auto;
            row-gap: 6px;
            padding: 12px 16px;
          }
          .rr-medal { width: 36px; height: 36px; font-size: 13px; border-radius: 8px; }
          .rr-time { display: none; }
          .rr-result-wrap { justify-content: flex-end; }
          .rr-result { font-size: 10.5px; }
        }

        @media (max-width: 480px) {
          .rr-header-title { gap: 6px; }
          .rr-progress-badge { display: none; }
          .rr-robot-name { font-size: 13.5px; }
          .rr-team-name { font-size: 11.5px; }
        }
      `}</style>

      {orderedRounds.map(round => {
        const isFinal = round.roundNumber === finalRoundNumber
        const sorted = [...round.entries].sort((a, b) => (a.rankInRound ?? 999999) - (b.rankInRound ?? 999999))
        return (
          <div className="rr-card" key={round.roundId}>
            <div className="rr-header">
              <span className="rr-header-icon" aria-hidden="true">
                <Timer size={20} strokeWidth={2.2} />
              </span>
              <h3 className="rr-header-title">
                {isFinal ? "FINAL ROUND" : `ROUND ${round.roundNumber}`}
                {round.status === "OPEN" && (
                  <span className="rr-progress-badge">In progress</span>
                )}
              </h3>
            </div>
            {sorted.map(entry => (
              <RoundEntryRow key={entry.entryId} entry={entry} isFinalRound={isFinal} />
            ))}
          </div>
        )
      })}
    </div>
  )
}