import { useEffect, useState } from "react"
import { FileText, Users } from "lucide-react"
import {
  getMyEvents, getRegistrationsForSport,
  type OrganizerEvent, type OrganizerSport,
} from "../api/organizer.api"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8C6CFF"
const BLUE   = "#0162D1"
const BG     = "#F4F3FF"
const SURF   = "#FFFFFF"
const BORDER = "#E0D9FF"
const TEXT   = "#111111"
const MUTED  = "#6B7280"

interface SportReport extends OrganizerSport {
  eventId: string
  eventName: string
  registrationCount: number
}

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  ACTIVE:            { background: "rgba(16,185,129,0.1)",  color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
  REGISTRATION_OPEN: { background: "rgba(140,108,255,0.1)", color: P,         border: `1px solid rgba(140,108,255,0.3)` },
  COMPLETED:         { background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" },
  REJECTED:          { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
  APPROVED:          { background: "rgba(16,185,129,0.1)",  color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
}

function SportStatusBadge({ status }: { status?: string }) {
  const s = STATUS_STYLE[(status ?? "").toUpperCase()] ?? { background: "rgba(0,0,0,0.06)", color: MUTED, border: "1px solid rgba(0,0,0,0.1)" }
  return <span style={{ borderRadius: "999px", padding: "3px 10px", fontSize: "0.67rem", fontWeight: 700, whiteSpace: "nowrap", ...s }}>{toLabel(status)}</span>
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div>
        <p style={{ color: MUTED, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
        <p style={{ color: TEXT, fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Sarpanch',sans-serif", margin: 0, lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  )
}

export default function OrganizerReportsPage() {
  const [events,   setEvents]   = useState<OrganizerEvent[]>([])
  const [reports,  setReports]  = useState<SportReport[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState("ALL")

  useEffect(() => {
    setLoading(true)
    getMyEvents()
      .then(async evts => {
        setEvents(evts)
        const flat: SportReport[] = []
        for (const ev of evts) {
          for (const sp of (ev.sports ?? [])) {
            let regCount = sp.registeredTeamsCount ?? 0
            try {
              const r = await getRegistrationsForSport(sp.id)
              regCount = r.length
            } catch { /* use pre-fetched count */ }
            flat.push({ ...sp as OrganizerSport, eventId: ev.id, eventName: ev.eventName, registrationCount: regCount })
          }
        }
        setReports(flat)
      })
      .finally(() => setLoading(false))
  }, [])

  const displayed = selected === "ALL" ? reports : reports.filter(r => r.eventId === selected)

  const totalTeams   = displayed.reduce((a, r) => a + r.registrationCount, 0)
  const totalSports  = displayed.length
  const totalMatches = 0
  const activeCount  = displayed.filter(r => ["ACTIVE","REGISTRATION_OPEN"].includes((r.status ?? "").toUpperCase())).length

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Reports</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>Sport-level registration and status report</p>
      </div>

      {/* Event filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          style={{ height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", padding: "0 14px", outline: "none", cursor: "pointer" }}>
          <option value="ALL">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
        </select>
        {loading && <span style={{ color: MUTED, fontSize: "0.82rem" }}>Loading…</span>}
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "12px", marginBottom: "24px" }}>
        <StatChip label="Sports"      value={totalSports}  color={P}        />
        <StatChip label="Teams"       value={totalTeams}   color={BLUE}     />
        <StatChip label="Active"      value={activeCount}  color="#10b981"  />
        <StatChip label="Total Matches" value={totalMatches} color="#f59e0b" />
      </div>

      {/* Sports table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>
          <FileText size={36} style={{ opacity: 0.2, margin: "0 auto 8px", display: "block" }} />
          Loading report data…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>No data available</div>
      ) : (
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(140,108,255,0.06)", borderBottom: `1px solid ${BORDER}` }}>
                {["Sport", "Event", "Age Group", "Format", "Teams", "Capacity", "Status"].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 4 ? "center" : "left", padding: "12px 14px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((r, i) => (
                <tr key={`${r.eventId}-${r.id}`} style={{ borderBottom: i < displayed.length - 1 ? `1px solid ${BORDER}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(140,108,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 14px" }}>
                    <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>{toLabel(r.sport)}</p>
                    {r.weightClass && <p style={{ color: MUTED, fontSize: "0.72rem", margin: "2px 0 0" }}>{toLabel(r.weightClass)}</p>}
                  </td>
                  <td style={{ padding: "13px 14px", color: MUTED }}>{r.eventName}</td>
                  <td style={{ padding: "13px 14px", color: MUTED }}>{toLabel(r.ageGroup)}</td>
                  <td style={{ padding: "13px 14px", color: MUTED }}>{toLabel(r.formatType)}</td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: TEXT, fontWeight: 600 }}>
                      <Users size={12} style={{ color: P }} />{r.registrationCount}
                    </span>
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    {r.maxTeams ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: TEXT, fontWeight: 600, fontSize: "0.82rem" }}>{r.registrationCount}/{r.maxTeams}</span>
                        <div style={{ width: "60px", height: "4px", background: BORDER, borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: P, width: `${Math.min(100, (r.registrationCount / r.maxTeams) * 100)}%`, borderRadius: "2px" }} />
                        </div>
                      </div>
                    ) : <span style={{ color: MUTED }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 14px", textAlign: "center" }}>
                    <SportStatusBadge status={r.status} />
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
