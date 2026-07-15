import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, MapPin, CalendarDays, Trophy, Users, ChevronRight } from "lucide-react"
import { getMyEvents, type OrganizerEvent } from "../api/organizer.api"
import { ORG } from "../theme/organizerTheme"
import "../../../styles/organizerTheme.css"

// ── theme — Organizer light theme (organizerTheme.ts), matching the
// User Dashboard / Team Dashboard / Robot Profile reference pages ──────────────
const P      = ORG.violet
const SURF   = ORG.cardBg
const BORDER = "rgba(75,134,232,0.3)"
const TEXT   = ORG.text
const MUTED  = ORG.muted

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; dot?: boolean }> = {
  LIVE:      { label: "Live",      color: ORG.success, bg: "rgba(31,169,82,0.12)",  border: "rgba(31,169,82,0.3)", dot: true },
  PUBLISHED: { label: "Published", color: ORG.blueHeading, bg: "rgba(75,134,232,0.1)", border: "rgba(75,134,232,0.28)" },
  DRAFT:     { label: "Draft",     color: "#a16207", bg: "rgba(161,98,7,0.1)",  border: "rgba(161,98,7,0.28)" },
  COMPLETED: { label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)" },
  ARCHIVED:  { label: "Archived",  color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)" },
}

const TABS = ["ALL", "LIVE", "PUBLISHED", "DRAFT", "COMPLETED", "ARCHIVED"]

const fmt = (d?: string | null) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status?.toUpperCase()] ?? STATUS_MAP.DRAFT
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />}
      {s.label}
    </span>
  )
}

export default function OrganizerEventsPage() {
  const navigate = useNavigate()
  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [tab,     setTab]     = useState("ALL")

  useEffect(() => {
    getMyEvents().then(setEvents).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => events.filter(ev => {
    if (tab !== "ALL" && ev.status?.toUpperCase() !== tab) return false
    if (!search) return true
    const q = search.toLowerCase()
    return ev.eventName.toLowerCase().includes(q) ||
      (ev.city ?? "").toLowerCase().includes(q) ||
      (ev.eventCode ?? "").toLowerCase().includes(q)
  }), [events, tab, search])

  return (
    <div className="org-page-bg" style={{ padding: "28px 32px", fontFamily: ORG.fontBody }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: ORG.blueHeading, fontFamily: ORG.fontHeading, fontSize: "1.75rem", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>Event Management</h1>
          <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>
            {loading ? "Loading…" : `${filtered.length} of ${events.length} event${events.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => navigate("/organizer/events/create")}
          style={{ background: ORG.gradientCta, color: "#fff", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", boxShadow: ORG.btnShadow }}
        >
          + Create Event
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, or code…"
            style={{ width: "100%", paddingLeft: "36px", paddingRight: "12px", height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ background: tab === t ? "rgba(140,108,255,0.12)" : "rgba(75,134,232,0.04)", border: `1px solid ${tab === t ? "rgba(140,108,255,0.4)" : BORDER}`, color: tab === t ? P : MUTED, borderRadius: "8px", padding: "5px 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
          >
            {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            {t !== "ALL" && ` (${events.filter(e => e.status?.toUpperCase() === t).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Loading events…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>No events found</div>
      ) : (
        <div style={{ background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(75,134,232,0.06)", borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Event</th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Dates</th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: MUTED, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Venue</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: MUTED, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sports</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: MUTED, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Teams</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: MUTED, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                <th style={{ textAlign: "right", padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, i) => {
                const sportCount = ev.sports?.length ?? 0
                const teamCount  = ev.sports?.reduce((a, s) => a + (s.registeredTeamsCount ?? 0), 0) ?? 0
                return (
                  <tr
                    key={ev.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(140,108,255,0.04)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    onClick={() => navigate(`/organizer/events/${ev.id}`)}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ color: TEXT, fontWeight: 600, margin: 0 }}>{ev.eventName}</p>
                      {ev.eventCode && <p style={{ color: MUTED, fontSize: "0.72rem", fontFamily: "monospace", margin: "2px 0 0" }}>{ev.eventCode}</p>}
                    </td>
                    <td style={{ padding: "14px 16px", color: MUTED, fontSize: "0.82rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <CalendarDays size={12} />{fmt(ev.startDate)}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <CalendarDays size={12} style={{ opacity: 0 }} />{fmt(ev.endDate)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {ev.city ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: MUTED, fontSize: "0.82rem" }}>
                          <MapPin size={12} />{ev.city}{ev.state ? `, ${ev.state}` : ""}
                        </span>
                      ) : <span style={{ color: MUTED }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: TEXT, fontWeight: 600 }}>
                        <Trophy size={12} style={{ color: P }} />{sportCount}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: TEXT, fontWeight: 600 }}>
                        <Users size={12} style={{ color: P }} />{teamCount}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <StatusBadge status={ev.status} />
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ color: P, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <ChevronRight size={16} />
                      </span>
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
