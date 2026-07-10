import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ExternalLink } from "lucide-react"
import { getMyEvents, type OrganizerEvent, type OrganizerSport } from "../api/organizer.api"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8C6CFF"
const BG     = "#F4F3FF"
const SURF   = "#FFFFFF"
const BORDER = "#E0D9FF"
const TEXT   = "#111111"
const MUTED  = "#6B7280"

interface FlatSport extends OrganizerSport {
  eventId: string
  eventName: string
  eventStatus?: string
}

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_CLS: Record<string, React.CSSProperties> = {
  ACTIVE:               { background: "rgba(16,185,129,0.1)",   color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
  REGISTRATION_OPEN:    { background: "rgba(140,108,255,0.1)",  color: P,         border: `1px solid rgba(140,108,255,0.3)` },
  REGISTRATION_CLOSED:  { background: "rgba(245,158,11,0.1)",  color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
  COMPLETED:            { background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" },
  REJECTED:             { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
  PENDING_APPROVAL:     { background: "rgba(245,158,11,0.1)",  color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
  APPROVED:             { background: "rgba(16,185,129,0.1)",  color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
}

function SportStatusBadge({ status }: { status?: string }) {
  const k   = (status ?? "").toUpperCase()
  const cls = STATUS_CLS[k] ?? { background: "rgba(0,0,0,0.06)", color: MUTED, border: "1px solid rgba(0,0,0,0.1)" }
  return (
    <span style={{ borderRadius: "999px", padding: "3px 10px", fontSize: "0.67rem", fontWeight: 700, whiteSpace: "nowrap", ...cls }}>
      {toLabel(status)}
    </span>
  )
}

export default function OrganizerSportsPage() {
  const navigate = useNavigate()
  const [sports,  setSports]  = useState<FlatSport[]>([])
  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [search,  setSearch]  = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [eventFilter, setEventFilter]   = useState("ALL")

  useEffect(() => {
    setLoading(true)
    getMyEvents()
      .then(evts => {
        setEvents(evts)
        const flat: FlatSport[] = []
        evts.forEach(ev => (ev.sports ?? []).forEach(sp => flat.push({ ...sp, eventId: ev.id, eventName: ev.eventName, eventStatus: ev.status })))
        setSports(flat)
      })
      .catch(() => setError("Failed to load sports"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sports.filter(sp => {
    if (eventFilter !== "ALL" && sp.eventId !== eventFilter) return false
    const q = activeSearch.toLowerCase()
    return !q ||
      (sp.sport ?? "").toLowerCase().includes(q) ||
      sp.eventName.toLowerCase().includes(q) ||
      (sp.ageGroup ?? "").toLowerCase().includes(q) ||
      (sp.weightClass ?? "").toLowerCase().includes(q)
  })

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>All Sports</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>
          {loading ? "Loading…" : `${filtered.length} sport${filtered.length !== 1 ? "s" : ""} across ${events.length} event${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "240px", display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setActiveSearch(search)}
              placeholder="Search by sport, event, age group…"
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "12px", height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button onClick={() => setActiveSearch(search)}
            style={{ background: `linear-gradient(135deg,${P},#0162D1)`, color: "#fff", border: "none", borderRadius: "10px", padding: "0 16px", height: "40px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
            Search
          </button>
        </div>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)}
          style={{ height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", padding: "0 14px", outline: "none", cursor: "pointer" }}>
          <option value="ALL">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
        </select>
      </div>

      {error ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "20px", color: "#ef4444", textAlign: "center" }}>{error}</div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Loading sports…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>No sports found</div>
      ) : (
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(140,108,255,0.06)", borderBottom: `1px solid ${BORDER}` }}>
                {["Sport", "Event", "Age Group", "Weight Class", "Teams", "Status", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 4 ? "center" : "left", padding: "12px 14px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sp, i) => (
                <tr key={`${sp.eventId}-${sp.id}`}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(140,108,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 14px" }}>
                    <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>{toLabel(sp.sport)}</p>
                    {sp.formatType && <p style={{ color: MUTED, fontSize: "0.72rem", margin: "2px 0 0" }}>{toLabel(sp.formatType)}</p>}
                  </td>
                  <td style={{ padding: "13px 14px" }}>
                    <p style={{ color: TEXT, fontWeight: 500, margin: 0 }}>{sp.eventName}</p>
                    {sp.eventStatus && <p style={{ color: MUTED, fontSize: "0.72rem", margin: "2px 0 0" }}>{toLabel(sp.eventStatus)}</p>}
                  </td>
                  <td style={{ padding: "13px 14px", color: MUTED }}>{toLabel(sp.ageGroup)}</td>
                  <td style={{ padding: "13px 14px", color: MUTED }}>{toLabel(sp.weightClass)}</td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    <span style={{ fontFamily: "monospace", color: TEXT, fontWeight: 600 }}>
                      {sp.registeredTeamsCount ?? 0}{sp.maxTeams ? `/${sp.maxTeams}` : ""}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    <SportStatusBadge status={sp.status} />
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    <button
                      onClick={() => navigate(`/organizer/events/${sp.eventId}/sports/${sp.id}`)}
                      style={{ background: "rgba(140,108,255,0.1)", color: P, border: `1px solid rgba(140,108,255,0.25)`, borderRadius: "7px", padding: "5px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <ExternalLink size={11} /> Manage
                    </button>
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
