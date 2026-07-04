import { useEffect, useState } from "react"
import { Search, Users } from "lucide-react"
import {
  getMyEvents, getMySports, getRegistrationsForSport,
  type OrganizerEvent, type OrganizerSport, type OrganizerTeamRegistration,
} from "../api/organizer.api"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8C6CFF"
const BG     = "#F4F3FF"
const SURF   = "#FFFFFF"
const BORDER = "#E0D9FF"
const TEXT   = "#111111"
const MUTED  = "#6B7280"

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function OrganizerRegistrationsPage() {
  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [sports,  setSports]  = useState<OrganizerSport[]>([])
  const [regs,    setRegs]    = useState<OrganizerTeamRegistration[]>([])

  const [selectedEventId, setSelectedEventId] = useState("")
  const [selectedSportId, setSelectedSportId] = useState("")
  const [search,          setSearch]          = useState("")

  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingRegs,   setLoadingRegs]   = useState(false)
  const [error,         setError]         = useState<string | null>(null)

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
    setLoadingRegs(true)
    setError(null)
    getRegistrationsForSport(selectedSportId)
      .then(setRegs)
      .catch(() => setError("Failed to load registrations"))
      .finally(() => setLoadingRegs(false))
  }, [selectedSportId])

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

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Registrations</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>
          {loadingRegs ? "Loading…" : `${filtered.length} team${filtered.length !== 1 ? "s" : ""} registered`}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          ["Total Teams",  String(regs.length),                             P],
          ["Sport",        selectedSport ? toLabel(selectedSport.sport) : "—",  TEXT],
          ["Age Group",    selectedSport?.ageGroup ? toLabel(selectedSport.ageGroup) : "—", TEXT],
          ["Capacity",     selectedSport?.maxTeams ? `${regs.length}/${selectedSport.maxTeams}` : String(regs.length), TEXT],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 18px" }}>
            <p style={{ color: MUTED, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>{label}</p>
            <p style={{ color, fontSize: label === "Total Teams" ? "1.75rem" : "0.9rem", fontWeight: 700, fontFamily: label === "Total Teams" ? "'Sarpanch',sans-serif" : "inherit", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</p>
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
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Members</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(140,108,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", color: MUTED, fontFamily: "monospace", fontSize: "0.78rem" }}>{i + 1}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>{r.teamName}</p>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {r.lineup && r.lineup.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {r.lineup.map(m => (
                          <span key={m.id} style={{ background: "rgba(140,108,255,0.08)", color: P, border: `1px solid rgba(140,108,255,0.2)`, borderRadius: "6px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 500 }}>
                            {m.fullName}{m.role ? ` · ${m.role}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: MUTED, fontSize: "0.8rem" }}>No members</span>
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
