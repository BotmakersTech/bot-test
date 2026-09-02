import { Timer, Trophy } from "lucide-react"

import { useRaceRounds } from "../hooks/useRaceRounds"
import type { RoundEntryDTO } from "../api/raceRounds.api"

function formatMillis(ms?: number | null): string {
  if (ms == null) return "—"
  const minutes = Math.floor(ms / 60000)
  const seconds = (ms % 60000) / 1000
  const secStr = seconds.toFixed(3).padStart(6, "0")
  return minutes > 0 ? `${minutes}:${secStr}` : `${seconds.toFixed(3)}s`
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Awaiting time", color: "#9ca3af" },
  TIMED: { text: "Recorded", color: "#0162d1" },
  DNF: { text: "DNF", color: "#dc2626" },
  ADVANCED: { text: "Advanced", color: "#16a34a" },
  ELIMINATED: { text: "Eliminated", color: "#9ca3af" },
  FINISHED: { text: "Finished", color: "#7c3aed" },
}

function RoundEntryRow({ entry, isFinalRound }: { entry: RoundEntryDTO; isFinalRound: boolean }) {
  const champion = isFinalRound && entry.rankInRound === 1
  const label = STATUS_LABEL[entry.status] ?? { text: entry.status, color: "#9ca3af" }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 16px", borderTop: "1px solid rgba(17,17,17,0.06)" }}>
      <div style={{ width: 28, fontWeight: 800, color: champion ? "#a16207" : "#111" }}>
        {champion ? <Trophy size={16} /> : (entry.rankInRound ?? "—")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.robotName ?? "—"}
        </div>
        {entry.teamName && <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{entry.teamName}</div>}
      </div>
      <div style={{ width: 100, textAlign: "right", fontSize: "0.85rem", fontWeight: 600, color: "#111" }}>
        {formatMillis(entry.timeMillis)}
      </div>
      <div style={{ width: 100, textAlign: "right", fontSize: "0.72rem", fontWeight: 700, color: label.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label.text}
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
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {orderedRounds.map(round => {
        const isFinal = round.roundNumber === finalRoundNumber
        const sorted = [...round.entries].sort((a, b) => (a.rankInRound ?? 999999) - (b.rankInRound ?? 999999))
        return (
          <div key={round.roundId} style={{ marginBottom: 28, border: "1px solid rgba(75,134,232,0.25)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(1,98,209,0.06)" }}>
              <Timer size={16} color="#0162d1" />
              <span style={{ fontWeight: 800, color: "#0162d1" }}>
                {isFinal ? "FINAL ROUND" : `ROUND ${round.roundNumber}`}
              </span>
              {round.status === "OPEN" && <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>— in progress</span>}
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
