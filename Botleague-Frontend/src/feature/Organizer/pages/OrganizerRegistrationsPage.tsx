import { useEffect, useState } from "react"
import { Search, Users, Bot } from "lucide-react"
import {
  getMyEvents, getMySports, getAllRegistrationsForSport, updateRegistrationStatus,
  type OrganizerEvent, type OrganizerSport, type EventSportRegistration,
} from "../api/organizer.api"
import { ORG } from "../theme/organizerTheme"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8c6cff"
const BG     = ORG.pageBg
const SURF   = "rgba(255,255,255,0.9)"
const BORDER = "#4b86e8"
const TEXT   = "#111111"
const MUTED  = "#5d5d5d"

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  REGISTERED:  { bg: "rgba(31,169,82,0.1)",  color: "#1fa952", border: "rgba(31,169,82,0.3)" },
  CHECKED_IN:  { bg: "rgba(75,134,232,0.1)", color: "#3567cf", border: "rgba(75,134,232,0.3)" },
  WAITLISTED:  { bg: "rgba(234,179,8,0.1)",  color: "#a16207", border: "rgba(234,179,8,0.3)" },
  REJECTED:    { bg: "rgba(224,75,75,0.1)",  color: "#e04b4b", border: "rgba(224,75,75,0.3)" },
  CANCELLED:   { bg: "rgba(0,0,0,0.05)",     color: "#5d5d5d", border: "rgba(0,0,0,0.1)" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status?.toUpperCase()] ?? { bg: "rgba(0,0,0,0.05)", color: "#5d5d5d", border: "rgba(0,0,0,0.1)" }
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.7rem", padding: "2px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {toLabel(status)}
    </span>
  )
}

export default function OrganizerRegistrationsPage() {
  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [sports,  setSports]  = useState<OrganizerSport[]>([])
  const [regs,    setRegs]    = useState<EventSportRegistration[]>([])

  const [selectedEventId, setSelectedEventId] = useState("")
  const [selectedSportId, setSelectedSportId] = useState("")
  const [search,          setSearch]          = useState("")

  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingRegs,   setLoadingRegs]   = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [actingOnId,    setActingOnId]    = useState<string | null>(null)

  useEffect(() => {
    setLoadingEvents(true)
    getMyEvents()
      .then(evts => {
        if (evts.length > 0) {
          setEvents(evts)
          const first = evts[0]
          setSelectedEventId(first.id)
          const evSports = (first.sports ?? []) as OrganizerSport[]
          setSports(evSports)
          if (evSports.length > 0) setSelectedSportId(evSports[0].id)
        } else {
          getMySports().then(sps => {
            setSports(sps)
            if (sps.length > 0) setSelectedSportId(sps[0].id)
          }).catch(() => {})
        }
      })
      .catch(() => {
        getMySports()
          .then(sps => { setSports(sps); if (sps.length > 0) setSelectedSportId(sps[0].id) })
          .catch(() => setError("Failed to load sports"))
      })
      .finally(() => setLoadingEvents(false))
  }, [])

  useEffect(() => {
    if (!selectedSportId) { setRegs([]); return }
    const eventId = sports.find(s => s.id === selectedSportId)?.eventId ?? selectedEventId
    if (!eventId) { setRegs([]); return }
    setLoadingRegs(true)
    setError(null)
    getAllRegistrationsForSport(eventId, selectedSportId)
      .then(setRegs)
      .catch(() => setError("Failed to load registrations"))
      .finally(() => setLoadingRegs(false))
  }, [selectedSportId])

  const refreshRegs = () => {
    if (!selectedSportId) return
    const eventId = sports.find(s => s.id === selectedSportId)?.eventId ?? selectedEventId
    if (!eventId) return
    getAllRegistrationsForSport(eventId, selectedSportId).then(setRegs).catch(() => {})
  }

  const handleStatusChange = async (reg: EventSportRegistration, status: string) => {
    let reason: string | undefined
    if (status === "REJECTED") {
      reason = window.prompt("Reason for rejecting this registration (optional):") ?? undefined
    }
    setActingOnId(reg.registrationId)
    try {
      await updateRegistrationStatus(reg.eventId, reg.registrationId, status, reason)
      refreshRegs()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to update registration status")
    } finally {
      setActingOnId(null)
    }
  }

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
    const ev = events.find(e => e.id === eventId)
    const evSports = (ev?.sports ?? []) as OrganizerSport[]
    setSports(evSports)
    setSelectedSportId(evSports[0]?.id ?? "")
    setRegs([])
  }

  const filtered = regs.filter(r => {
    if (!search) return true
    return (r.teamName ?? "").toLowerCase().includes(search.toLowerCase())
  })

  const selectedSport = sports.find(s => s.id === selectedSportId)
  const activeCount = regs.filter(r => ["REGISTERED", "CHECKED_IN"].includes((r.status ?? "").toUpperCase())).length

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Registrations</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>
          {loadingRegs ? "Loading…" : `${filtered.length} registration${filtered.length !== 1 ? "s" : ""} (${activeCount} active)`}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          ["Active Teams",  String(activeCount),                             P],
          ["Sport",        selectedSport ? toLabel(selectedSport.sport) : "—",  TEXT],
          ["Age Group",    selectedSport?.ageGroup ? toLabel(selectedSport.ageGroup) : "—", TEXT],
          ["Capacity",     selectedSport?.maxTeams ? `${activeCount}/${selectedSport.maxTeams}` : String(activeCount), TEXT],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 18px" }}>
            <p style={{ color: MUTED, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>{label}</p>
            <p style={{ color, fontSize: label === "Active Teams" ? "1.75rem" : "0.9rem", fontWeight: 700, fontFamily: label === "Active Teams" ? "'Sarpanch',sans-serif" : "inherit", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
        {events.length > 0 && (
          <select value={selectedEventId} onChange={e => handleEventChange(e.target.value)} disabled={loadingEvents}
            style={{ height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", padding: "0 14px", outline: "none", cursor: "pointer" }}>
            <option value="">— Select Event —</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
          </select>
        )}
        <select value={selectedSportId} onChange={e => setSelectedSportId(e.target.value)}
          style={{ height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", padding: "0 14px", outline: "none", cursor: "pointer" }}>
          <option value="">— Select Sport —</option>
          {sports.map(sp => <option key={sp.id} value={sp.id}>{toLabel(sp.sport)}{sp.ageGroup ? ` · ${toLabel(sp.ageGroup)}` : ""}</option>)}
        </select>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by team name…"
            style={{ width: "100%", paddingLeft: "36px", height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {error ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "20px", color: "#ef4444", textAlign: "center" }}>{error}</div>
      ) : !selectedSportId ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Select an event and sport to view registrations</div>
      ) : loadingRegs ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Loading registrations…</div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", color: MUTED, gap: "8px" }}>
          <Users size={40} style={{ opacity: 0.2 }} />
          <p style={{ margin: 0 }}>No teams registered yet</p>
        </div>
      ) : (
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(140,108,255,0.06)", borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team</th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Robot</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const status = (r.status ?? "").toUpperCase()
                const busy = actingOnId === r.registrationId
                return (
                <tr key={r.registrationId} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(140,108,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", color: MUTED, fontFamily: "monospace", fontSize: "0.78rem" }}>{i + 1}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>{r.teamName}</p>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {r.robotName ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(140,108,255,0.08)", color: P, border: `1px solid rgba(140,108,255,0.2)`, borderRadius: "6px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 500 }}>
                        <Bot size={12} /> {r.robotName}
                      </span>
                    ) : (
                      <span style={{ color: MUTED, fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}>
                    <StatusBadge status={status} />
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                      {status === "REGISTERED" && (
                        <>
                          <button onClick={() => handleStatusChange(r, "CHECKED_IN")} disabled={busy}
                            style={{ background: "rgba(75,134,232,0.1)", border: "1px solid rgba(75,134,232,0.3)", color: "#3567cf", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
                            Check In
                          </button>
                          <button onClick={() => handleStatusChange(r, "WAITLISTED")} disabled={busy}
                            style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "#a16207", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
                            Waitlist
                          </button>
                          <button onClick={() => handleStatusChange(r, "REJECTED")} disabled={busy}
                            style={{ background: "rgba(224,75,75,0.1)", border: "1px solid rgba(224,75,75,0.3)", color: "#e04b4b", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
                            Reject
                          </button>
                        </>
                      )}
                      {status === "WAITLISTED" && (
                        <button onClick={() => handleStatusChange(r, "REGISTERED")} disabled={busy}
                          style={{ background: "rgba(31,169,82,0.1)", border: "1px solid rgba(31,169,82,0.3)", color: "#1fa952", borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1 }}>
                          Restore
                        </button>
                      )}
                      {(status === "REJECTED" || status === "CHECKED_IN" || status === "CANCELLED") && (
                        <span style={{ color: MUTED, fontSize: "0.75rem" }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
