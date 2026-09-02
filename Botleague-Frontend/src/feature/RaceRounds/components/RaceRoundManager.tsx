import { useEffect, useMemo, useState } from "react"
import { Timer, Flag, ChevronRight, AlertTriangle, CheckCircle2, Trash2, Trophy } from "lucide-react"

import { useRaceRounds } from "../hooks/useRaceRounds"
import { ORG } from "../../Organizer/theme/organizerTheme"
import type { RoundEntryDTO } from "../api/raceRounds.api"

// ─────────────────────────────────────────────────────────────
// TIME HELPERS — accepts "12.345" (seconds) or "1:02.345" (mm:ss.sss)
// ─────────────────────────────────────────────────────────────

function parseTimeToMillis(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  const colon = s.match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/)
  if (colon) {
    const [, m, sec, ms] = colon
    return (parseInt(m, 10) * 60 + parseInt(sec, 10)) * 1000 + (ms ? parseInt(ms.padEnd(3, "0"), 10) : 0)
  }
  const plain = s.match(/^(\d+)(?:\.(\d{1,3}))?$/)
  if (plain) {
    const [, sec, ms] = plain
    return parseInt(sec, 10) * 1000 + (ms ? parseInt(ms.padEnd(3, "0"), 10) : 0)
  }
  return null
}

function formatMillis(ms?: number | null): string {
  if (ms == null) return "—"
  const minutes = Math.floor(ms / 60000)
  const seconds = (ms % 60000) / 1000
  const secStr = seconds.toFixed(3).padStart(6, "0")
  return minutes > 0 ? `${minutes}:${secStr}` : `${seconds.toFixed(3)}s`
}

// ─────────────────────────────────────────────────────────────
// SMALL PIECES
// ─────────────────────────────────────────────────────────────

function Spinner({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: "2px solid rgba(255,255,255,0.3)", borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "rrm-spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#9ca3af",
  TIMED: ORG.blue,
  DNF: ORG.danger,
  ADVANCED: ORG.success,
  ELIMINATED: "#9ca3af",
  FINISHED: ORG.violet,
}

function EntryStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#9ca3af"
  return (
    <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "999px", padding: "2px 8px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export interface RaceRoundManagerProps {
  sportId: string
  isRegistrationClosed: boolean
}

export default function RaceRoundManager({ sportId, isRegistrationClosed }: RaceRoundManagerProps) {
  const { rounds, loading, actionLoading, error, generateFirstRound, recordTimes, shortlistRound, finalizeRound, deleteRound } = useRaceRounds(sportId)

  const currentRound = rounds.length > 0 ? rounds[rounds.length - 1] : null
  const historyRounds = rounds.length > 1 ? rounds.slice(0, -1) : []

  const [timeInputs, setTimeInputs] = useState<Record<string, string>>({})
  const [dnfFlags, setDnfFlags] = useState<Record<string, boolean>>({})
  const [cutoffInput, setCutoffInput] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  // Reset local editing state whenever the current round changes, seeded
  // from whatever's already saved (so re-editing before shortlisting works).
  useEffect(() => {
    if (!currentRound) return
    const times: Record<string, string> = {}
    const dnfs: Record<string, boolean> = {}
    currentRound.entries.forEach(e => {
      times[e.registrationId] = e.timeMillis != null ? String(e.timeMillis / 1000) : ""
      dnfs[e.registrationId] = !!e.dnf
    })
    setTimeInputs(times)
    setDnfFlags(dnfs)
    setCutoffInput("")
    setLocalError(null)
  }, [currentRound?.roundId, currentRound?.entries.length])

  const isEditable = currentRound?.status === "OPEN" || currentRound?.status === "TIMES_RECORDED"
  const isDecided = currentRound?.status === "TIMES_RECORDED"

  const sortedEntries = useMemo(() => {
    if (!currentRound) return [] as RoundEntryDTO[]
    return [...currentRound.entries].sort((a, b) => {
      const at = a.rankInRound ?? 999999
      const bt = b.rankInRound ?? 999999
      if (at !== bt) return at - bt
      return (a.robotName ?? "").localeCompare(b.robotName ?? "")
    })
  }, [currentRound])

  const handleGenerate = async () => {
    setLocalError(null)
    try {
      await generateFirstRound(sportId)
    } catch { /* surfaced via hook error state */ }
  }

  const handleSaveTimes = async () => {
    if (!currentRound) return
    setLocalError(null)
    const entries = currentRound.entries.map(e => {
      const dnf = !!dnfFlags[e.registrationId]
      if (dnf) return { registrationId: e.registrationId, dnf: true }
      const raw = timeInputs[e.registrationId] ?? ""
      const timeMillis = parseTimeToMillis(raw)
      return { registrationId: e.registrationId, timeMillis: timeMillis ?? undefined, dnf: false }
    })
    const missing = entries.some(e => !e.dnf && e.timeMillis == null)
    if (missing) {
      setLocalError("Enter a time or mark DNF for every bot before saving.")
      return
    }
    try {
      await recordTimes(currentRound.roundId, entries)
    } catch { /* surfaced via hook error state */ }
  }

  const handleShortlist = async () => {
    if (!currentRound) return
    const n = parseInt(cutoffInput, 10)
    if (!Number.isFinite(n) || n < 1) {
      setLocalError("Enter how many bots should advance to the next round.")
      return
    }
    setLocalError(null)
    try {
      await shortlistRound(currentRound.roundId, n, sportId)
    } catch { /* surfaced via hook error state */ }
  }

  const handleFinalize = async () => {
    if (!currentRound) return
    if (!confirm("Mark this round as final? Its ranking becomes the event's final standings.")) return
    try {
      await finalizeRound(currentRound.roundId)
    } catch { /* surfaced via hook error state */ }
  }

  const handleDeleteRound = async () => {
    if (!currentRound) return
    if (!confirm(`Delete Round ${currentRound.roundNumber}? This can't be undone.`)) return
    try {
      await deleteRound(currentRound.roundId)
    } catch { /* surfaced via hook error state */ }
  }

  const timedCount = currentRound?.entries.filter(e => e.status === "TIMED" || e.status === "DNF").length ?? 0
  const totalCount = currentRound?.entries.length ?? 0

  if (loading && rounds.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: ORG.muted }}>
        <Spinner size={28} color={ORG.blue} />
        <div style={{ marginTop: 10, fontSize: "0.85rem" }}>Loading rounds…</div>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px", maxWidth: 880, margin: "0 auto" }}>
      <style>{`@keyframes rrm-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Timer size={20} color={ORG.blue} />
        <h2 style={{ margin: 0, fontFamily: ORG.fontHeading, fontSize: "1.3rem", color: ORG.text }}>
          Round-Wise Time Trial
        </h2>
      </div>
      <p style={{ color: ORG.muted, fontSize: "0.85rem", marginTop: 0, marginBottom: 20 }}>
        Every bot runs each round and gets a time. Shortlist the fastest to the next round, or finalize to lock final standings.
      </p>

      {(error || localError) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.25)", borderRadius: 10, padding: "10px 14px", color: ORG.danger, fontSize: "0.82rem", fontWeight: 600, marginBottom: 16 }}>
          <AlertTriangle size={15} /> {localError || error}
        </div>
      )}

      {!currentRound && (
        <div style={{ textAlign: "center", padding: "48px 20px", border: `1.5px dashed ${ORG.borderColor}`, borderRadius: 14, background: "rgba(75,134,232,0.03)" }}>
          <Flag size={30} color={ORG.blue} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, color: ORG.text, marginBottom: 6 }}>No rounds yet</div>
          <div style={{ color: ORG.muted, fontSize: "0.82rem", marginBottom: 18 }}>
            {isRegistrationClosed
              ? "Generate Round 1 to bring every registered bot into the trial."
              : "Close registration for this techsport before generating Round 1."}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!isRegistrationClosed || actionLoading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: !isRegistrationClosed ? "#c9d4ec" : ORG.gradientCta,
              color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 22px", fontWeight: 700, fontSize: "0.88rem",
              cursor: !isRegistrationClosed || actionLoading ? "not-allowed" : "pointer",
            }}
          >
            {actionLoading ? <Spinner /> : <Flag size={15} />}
            Generate Round 1
          </button>
        </div>
      )}

      {currentRound && (
        <div style={{ border: `1.5px solid ${ORG.borderColor}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "14px 18px", background: "rgba(75,134,232,0.06)", borderBottom: `1px solid ${ORG.borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 800, color: ORG.blueHeading, fontFamily: ORG.fontHeading }}>Round {currentRound.roundNumber}</span>
              <EntryStatusBadge status={currentRound.status} />
              <span style={{ fontSize: "0.75rem", color: ORG.muted }}>{timedCount}/{totalCount} recorded</span>
            </div>
            {isEditable && currentRound.status === "OPEN" && (
              <button onClick={handleDeleteRound} title="Delete this round" style={{ background: "none", border: "none", color: ORG.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600 }}>
                <Trash2 size={13} /> Delete round
              </button>
            )}
          </div>

          <div style={{ padding: "6px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: ORG.muted }}>
                  <th style={{ padding: "8px 18px" }}>Rank</th>
                  <th style={{ padding: "8px 8px" }}>Bot / Team</th>
                  <th style={{ padding: "8px 8px" }}>Time</th>
                  <th style={{ padding: "8px 18px" }}>DNF</th>
                  <th style={{ padding: "8px 18px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map(entry => (
                  <tr key={entry.entryId} style={{ borderTop: "1px solid rgba(17,17,17,0.06)" }}>
                    <td style={{ padding: "8px 18px", fontWeight: 700, color: ORG.text }}>{entry.rankInRound ?? "—"}</td>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ fontWeight: 600, color: ORG.text, fontSize: "0.85rem" }}>{entry.robotName ?? "—"}</div>
                      <div style={{ fontSize: "0.7rem", color: ORG.muted }}>{entry.teamName ?? ""}</div>
                    </td>
                    <td style={{ padding: "8px 8px" }}>
                      {isEditable ? (
                        <input
                          type="text"
                          placeholder="12.345 or 1:02.345"
                          disabled={!!dnfFlags[entry.registrationId]}
                          value={timeInputs[entry.registrationId] ?? ""}
                          onChange={e => setTimeInputs(prev => ({ ...prev, [entry.registrationId]: e.target.value }))}
                          style={{ width: 130, padding: "6px 8px", border: `1px solid ${ORG.borderColor}`, borderRadius: 7, fontSize: "0.8rem", background: dnfFlags[entry.registrationId] ? "#f3f4f6" : "#fff" }}
                        />
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: ORG.text }}>{formatMillis(entry.timeMillis)}</span>
                      )}
                    </td>
                    <td style={{ padding: "8px 18px" }}>
                      {isEditable ? (
                        <input
                          type="checkbox"
                          checked={!!dnfFlags[entry.registrationId]}
                          onChange={e => setDnfFlags(prev => ({ ...prev, [entry.registrationId]: e.target.checked }))}
                        />
                      ) : (
                        entry.dnf ? "Yes" : "—"
                      )}
                    </td>
                    <td style={{ padding: "8px 18px" }}><EntryStatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(17,17,17,0.06)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            {isEditable && (
              <button
                onClick={handleSaveTimes}
                disabled={actionLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, background: ORG.gradientCta, color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: "0.82rem", cursor: actionLoading ? "not-allowed" : "pointer" }}
              >
                {actionLoading ? <Spinner /> : <CheckCircle2 size={14} />}
                Save Times
              </button>
            )}

            {isDecided && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min={1}
                    placeholder="How many advance?"
                    value={cutoffInput}
                    onChange={e => setCutoffInput(e.target.value)}
                    style={{ width: 150, padding: "8px 10px", border: `1px solid ${ORG.borderColor}`, borderRadius: 8, fontSize: "0.82rem" }}
                  />
                  <button
                    onClick={handleShortlist}
                    disabled={actionLoading}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: ORG.blueHeading, border: `1.5px solid ${ORG.blue}`, borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem", cursor: actionLoading ? "not-allowed" : "pointer" }}
                  >
                    <ChevronRight size={14} /> Shortlist to Round {currentRound.roundNumber + 1}
                  </button>
                </div>
                <button
                  onClick={handleFinalize}
                  disabled={actionLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: ORG.violetHeading, border: `1.5px solid ${ORG.violet}`, borderRadius: 9, padding: "9px 16px", fontWeight: 700, fontSize: "0.82rem", cursor: actionLoading ? "not-allowed" : "pointer" }}
                >
                  <Trophy size={14} /> Finalize — This Is the Final Round
                </button>
              </>
            )}

            {currentRound.status === "ADVANCED" && (
              <span style={{ fontSize: "0.8rem", color: ORG.muted }}>
                Requested {currentRound.cutoffCount}, advanced {currentRound.actualAdvancedCount}
                {currentRound.actualAdvancedCount != null && currentRound.cutoffCount != null && currentRound.actualAdvancedCount > currentRound.cutoffCount
                  ? " — tied bots at the cutoff all advanced." : "."}
              </span>
            )}

            {currentRound.status === "FINALIZED" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: ORG.violetHeading, fontWeight: 700 }}>
                <Trophy size={15} /> Final standings locked.
              </span>
            )}
          </div>
        </div>
      )}

      {historyRounds.length > 0 && (
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: ORG.muted, marginBottom: 10 }}>
            Previous Rounds
          </div>
          {historyRounds.slice().reverse().map(round => (
            <details key={round.roundId} style={{ border: "1px solid rgba(75,134,232,0.2)", borderRadius: 10, marginBottom: 8, padding: "10px 14px" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, color: ORG.text, display: "flex", alignItems: "center", gap: 10 }}>
                Round {round.roundNumber}
                <EntryStatusBadge status={round.status} />
                <span style={{ fontSize: "0.75rem", color: ORG.muted, fontWeight: 400 }}>{round.entries.length} bots</span>
              </summary>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <tbody>
                  {[...round.entries].sort((a, b) => (a.rankInRound ?? 999) - (b.rankInRound ?? 999)).map(entry => (
                    <tr key={entry.entryId} style={{ borderTop: "1px solid rgba(17,17,17,0.06)" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 700, width: 40 }}>{entry.rankInRound ?? "—"}</td>
                      <td style={{ padding: "6px 8px" }}>{entry.robotName ?? "—"}</td>
                      <td style={{ padding: "6px 8px" }}>{formatMillis(entry.timeMillis)}</td>
                      <td style={{ padding: "6px 8px" }}><EntryStatusBadge status={entry.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
