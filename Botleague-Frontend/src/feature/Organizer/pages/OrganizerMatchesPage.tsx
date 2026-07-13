import { useEffect, useState, useCallback } from "react"
import { Search } from "lucide-react"
import {
  getMyEvents, getMySports, getMatchesForSport,
  approveMatchResult, rejectMatchResult,
  type OrganizerEvent, type OrganizerSport, type OrganizerMatch,
} from "../api/organizer.api"
import { ORG } from "../theme/organizerTheme"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8c6cff"
const BG     = ORG.pageBg
const SURF   = "rgba(255,255,255,0.9)"
const BORDER = "#4b86e8"
const TEXT   = "#111111"
const MUTED  = "#5d5d5d"

type MatchStatus = "ALL" | "SCHEDULED" | "LIVE" | "PENDING_APPROVAL" | "COMPLETED" | "CANCELLED"
const STATUS_FILTERS: MatchStatus[] = ["ALL", "SCHEDULED", "LIVE", "PENDING_APPROVAL", "COMPLETED", "CANCELLED"]

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  SCHEDULED:        { background: "rgba(76,142,231,0.1)",   color: "#4c8ee7", border: "1px solid rgba(76,142,231,0.3)" },
  LIVE:             { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
  PENDING_APPROVAL: { background: "rgba(234,179,8,0.12)",  color: "#a16207", border: "1px solid rgba(234,179,8,0.3)" },
  COMPLETED:        { background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" },
  CANCELLED:        { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
}

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status?.toUpperCase()] ?? { background: "rgba(0,0,0,0.06)", color: MUTED, border: "1px solid rgba(0,0,0,0.1)" }
  return <span style={{ borderRadius: "999px", padding: "3px 10px", fontSize: "0.67rem", fontWeight: 700, whiteSpace: "nowrap", ...s }}>{toLabel(status)}</span>
}

export default function OrganizerMatchesPage() {
  const [events,     setEvents]     = useState<OrganizerEvent[]>([])
  const [sportsList, setSportsList] = useState<OrganizerSport[]>([])
  const [matches,    setMatches]    = useState<OrganizerMatch[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [selectedEventId,  setSelectedEventId]  = useState("")
  const [selectedSportId,  setSelectedSportId]  = useState("")
  const [statusFilter,     setStatusFilter]     = useState<MatchStatus>("ALL")
  const [search,           setSearch]           = useState("")

  const loadFallbackSports = () => {
    getMySports().then(sps => {
      setSportsList(sps)
      if (sps.length > 0) setSelectedSportId(sps[0].id)
    }).catch(() => {})
  }

  useEffect(() => {
    getMyEvents()
      .then(evts => {
        if (evts.length > 0) {
          setEvents(evts)
          setSelectedEventId(evts[0].id)
          const evSports = (evts[0].sports ?? []) as OrganizerSport[]
          setSportsList(evSports)
          if (evSports.length > 0) setSelectedSportId(evSports[0].id)
        } else {
          loadFallbackSports()
        }
      })
      .catch(loadFallbackSports)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMatches = useCallback(async () => {
    if (!selectedSportId) { setMatches([]); return }
    setLoading(true)
    setError(null)
    try {
      const data = await getMatchesForSport(selectedSportId)
      setMatches(data)
    } catch { setError("Failed to load matches") } finally { setLoading(false) }
  }, [selectedSportId])

  useEffect(() => { loadMatches() }, [loadMatches])

  const [actingOnId, setActingOnId] = useState<string | null>(null)

  const handleApprove = async (matchId: string) => {
    setActingOnId(matchId)
    try { await approveMatchResult(matchId); await loadMatches() }
    catch { setError("Failed to approve match result") }
    finally { setActingOnId(null) }
  }

  const handleReject = async (matchId: string) => {
    const reason = window.prompt("Reason for rejecting this result (optional):") ?? undefined
    setActingOnId(matchId)
    try { await rejectMatchResult(matchId, reason); await loadMatches() }
    catch { setError("Failed to reject match result") }
    finally { setActingOnId(null) }
  }

  const handleEventChange = (evId: string) => {
    setSelectedEventId(evId)
    const ev = events.find(e => e.id === evId)
    const evSports = (ev?.sports ?? []) as OrganizerSport[]
    setSportsList(evSports)
    setSelectedSportId(evSports[0]?.id ?? "")
    setMatches([])
  }

  const filtered = matches.filter(m => {
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (m.teamAName ?? "").toLowerCase().includes(q) ||
      (m.teamBName ?? "").toLowerCase().includes(q) ||
      (m.matchId ?? "").toLowerCase().includes(q)
  })

  const counts = {
    SCHEDULED: matches.filter(m => m.status === "SCHEDULED").length,
    LIVE:      matches.filter(m => m.status === "LIVE").length,
    COMPLETED: matches.filter(m => m.status === "COMPLETED").length,
    CANCELLED: matches.filter(m => m.status === "CANCELLED").length,
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Match Management</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>
          {loading ? "Loading…" : `${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        {([
          ["Scheduled", counts.SCHEDULED, "#4c8ee7"],
          ["Live",      counts.LIVE,      "#10b981"],
          ["Completed", counts.COMPLETED, "#94a3b8"],
          ["Cancelled", counts.CANCELLED, "#ef4444"],
        ] as [string, number, string][]).map(([label, val, color]) => (
          <div key={label} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 18px" }}>
            <p style={{ color: MUTED, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>{label}</p>
            <p style={{ color, fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Sarpanch',sans-serif", margin: "4px 0 0" }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        {events.length > 0 && (
          <select value={selectedEventId} onChange={e => handleEventChange(e.target.value)}
            style={{ height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", padding: "0 14px", outline: "none", cursor: "pointer" }}>
            <option value="">— Select Event —</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
          </select>
        )}
        <select value={selectedSportId} onChange={e => setSelectedSportId(e.target.value)}
          style={{ height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", padding: "0 14px", outline: "none", cursor: "pointer" }}>
          <option value="">— Select Sport —</option>
          {sportsList.map(sp => <option key={sp.id} value={sp.id}>{toLabel(sp.sport)}{sp.ageGroup ? ` · ${toLabel(sp.ageGroup)}` : ""}</option>)}
        </select>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by team name…"
            style={{ width: "100%", paddingLeft: "36px", height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ background: statusFilter === s ? "rgba(140,108,255,0.12)" : "rgba(0,0,0,0.04)", border: `1px solid ${statusFilter === s ? "rgba(140,108,255,0.4)" : BORDER}`, color: statusFilter === s ? P : MUTED, borderRadius: "8px", padding: "5px 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
            {s === "ALL" ? "All Status" : toLabel(s)}
          </button>
        ))}
      </div>

      {error ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "20px", color: "#ef4444", textAlign: "center" }}>{error}</div>
      ) : !selectedSportId ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Select an event and sport to view matches</div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Loading matches…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>No matches found</div>
      ) : (
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(140,108,255,0.06)", borderBottom: `1px solid ${BORDER}` }}>
                {["#", "Teams", "Round", "Score", "Scheduled", "Status", "Actions"].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 3 || i === 5 || i === 6 ? "center" : "left", padding: "12px 14px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.matchId} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(140,108,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 14px", fontFamily: "monospace", color: MUTED, fontSize: "0.78rem" }}>{m.matchNumber ?? "—"}</td>
                  <td style={{ padding: "13px 14px" }}>
                    <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>
                      {m.teamAName ?? "TBD"}
                      {m.teamARobotName && <span style={{ color: MUTED, fontWeight: 400, fontSize: "0.78rem", marginLeft: "6px" }}>({m.teamARobotName})</span>}
                    </p>
                    <p style={{ color: MUTED, margin: "2px 0 0", fontSize: "0.82rem" }}>
                      vs {m.teamBName ?? "TBD"}
                      {m.teamBRobotName && <span style={{ fontSize: "0.78rem", marginLeft: "6px" }}>({m.teamBRobotName})</span>}
                    </p>
                  </td>
                  <td style={{ padding: "13px 14px", color: MUTED }}>
                    {m.roundNumber != null ? `Round ${m.roundNumber}` : "—"}
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    {m.teamAScore != null && m.teamBScore != null
                      ? <span style={{ fontFamily: "monospace", fontWeight: 700, color: TEXT }}>{m.teamAScore} – {m.teamBScore}</span>
                      : <span style={{ color: MUTED }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 14px", color: MUTED, fontSize: "0.8rem" }}>
                    {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    <StatusBadge status={m.status} />
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    {m.status === "PENDING_APPROVAL" ? (
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button onClick={() => handleApprove(m.matchId)} disabled={actingOnId === m.matchId}
                          style={{ background: "rgba(31,169,82,0.1)", border: "1px solid rgba(31,169,82,0.3)", color: "#1fa952", borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: actingOnId === m.matchId ? "not-allowed" : "pointer", opacity: actingOnId === m.matchId ? 0.6 : 1 }}>
                          Approve
                        </button>
                        <button onClick={() => handleReject(m.matchId)} disabled={actingOnId === m.matchId}
                          style={{ background: "rgba(224,75,75,0.1)", border: "1px solid rgba(224,75,75,0.3)", color: "#e04b4b", borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: actingOnId === m.matchId ? "not-allowed" : "pointer", opacity: actingOnId === m.matchId ? 0.6 : 1 }}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: MUTED, fontSize: "0.75rem" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
