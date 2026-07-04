import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays, Trophy, Users, Search, MapPin,
  Activity, Clock, Zap, CheckCircle2, TrendingUp,
} from "lucide-react"
import {
  getMyEvents, getDashboardStats,
  type OrganizerEvent, type DashboardStats,
} from "../api/organizer.api"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8C6CFF"
const BLUE   = "#0162D1"
const BG     = "#F4F3FF"
const SURF   = "#FFFFFF"
const BORDER = "#E0D9FF"
const TEXT   = "#111111"
const MUTED  = "#6B7280"

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; dot: boolean }> = {
  LIVE:      { label: "Live",      color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",   dot: true  },
  PUBLISHED: { label: "Published", color: P,          bg: "rgba(140,108,255,0.1)", border: "rgba(140,108,255,0.28)", dot: false },
  DRAFT:     { label: "Draft",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.28)",  dot: false },
  COMPLETED: { label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)", dot: false },
  ARCHIVED:  { label: "Archived",  color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)", dot: false },
}

const TABS = ["ALL", "LIVE", "PUBLISHED", "DRAFT", "COMPLETED", "ARCHIVED"]

const fmt = (d?: string | null) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "150px" }}>
      <span style={{ background: `${color}1A`, color, borderRadius: "10px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ color: MUTED, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
        <p style={{ color: TEXT, fontSize: "1.55rem", fontWeight: 700, fontFamily: "'Sarpanch',sans-serif", margin: 0, lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status?.toUpperCase()] ?? STATUS.DRAFT
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />}
      {s.label}
    </span>
  )
}

function EventCard({ event, onClick }: { event: OrganizerEvent; onClick: () => void }) {
  const sportCount = event.sports?.length ?? 0
  const teamCount  = event.sports?.reduce((a, s) => a + (s.registeredTeamsCount ?? 0), 0) ?? 0
  return (
    <div
      onClick={onClick}
      style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "20px 22px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "14px", transition: "box-shadow 0.15s, border-color 0.15s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 6px 24px rgba(140,108,255,0.15)"; el.style.borderColor = "rgba(140,108,255,0.45)" }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "none"; el.style.borderColor = BORDER }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ color: TEXT, fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Sarpanch',sans-serif", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.eventName}</h3>
          {event.eventCode && <span style={{ color: MUTED, fontSize: "0.7rem", fontFamily: "monospace" }}>{event.eventCode}</span>}
        </div>
        <StatusBadge status={event.status} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {event.city && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: MUTED, fontSize: "0.75rem" }}>
            <MapPin size={12} />{event.city}{event.state ? `, ${event.state}` : ""}
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: MUTED, fontSize: "0.75rem" }}>
          <CalendarDays size={12} />{fmt(event.startDate)} – {fmt(event.endDate)}
        </span>
      </div>
      <div style={{ display: "flex", gap: "16px", borderTop: `1px solid ${BORDER}`, paddingTop: "12px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: MUTED, fontSize: "0.78rem" }}>
          <Trophy size={12} style={{ color: P }} /><strong style={{ color: TEXT }}>{sportCount}</strong> sport{sportCount !== 1 ? "s" : ""}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px", color: MUTED, fontSize: "0.78rem" }}>
          <Users size={12} style={{ color: P }} /><strong style={{ color: TEXT }}>{teamCount}</strong> team{teamCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [tab,     setTab]     = useState("ALL")

  useEffect(() => {
    Promise.all([getMyEvents(), getDashboardStats().catch(() => null)])
      .then(([evts, st]) => { setEvents(evts); setStats(st) })
      .finally(() => setLoading(false))
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
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Events Dashboard</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>
          {loading ? "Loading…" : `${events.length} event${events.length !== 1 ? "s" : ""} assigned to you`}
        </p>
      </div>

      {stats && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
          <StatCard icon={<CalendarDays size={20} />} label="Total Events"    value={stats.totalEvents}        color={P}       />
          <StatCard icon={<Zap size={20} />}           label="Live"           value={stats.liveEvents}         color="#10b981" />
          <StatCard icon={<Clock size={20} />}          label="Upcoming"      value={stats.upcomingEvents}     color={BLUE}    />
          <StatCard icon={<Users size={20} />}          label="Registrations" value={stats.totalRegistrations} color="#f59e0b" />
          <StatCard icon={<Activity size={20} />}       label="Matches"       value={stats.totalMatches}       color="#ef4444" />
          <StatCard icon={<CheckCircle2 size={20} />}   label="Completed"     value={stats.completedEvents}    color="#94a3b8" />
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            style={{ width: "100%", paddingLeft: "36px", paddingRight: "12px", height: "40px", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "10px", color: TEXT, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <button
          onClick={() => navigate("/organizer/events")}
          style={{ background: `linear-gradient(135deg,${P},${BLUE})`, color: "#fff", border: "none", borderRadius: "10px", padding: "0 18px", height: "40px", fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <TrendingUp size={15} /> View All
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ background: tab === t ? "rgba(140,108,255,0.12)" : "rgba(0,0,0,0.04)", border: `1px solid ${tab === t ? "rgba(140,108,255,0.4)" : BORDER}`, color: tab === t ? P : MUTED, borderRadius: "8px", padding: "5px 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
          >
            {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            {t !== "ALL" && ` (${events.filter(e => e.status?.toUpperCase() === t).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: MUTED }}>Loading events…</div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: MUTED, gap: "8px" }}>
          <CalendarDays size={40} style={{ opacity: 0.25 }} />
          <p style={{ margin: 0 }}>No events found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "16px" }}>
          {filtered.map(ev => (
            <EventCard key={ev.id} event={ev} onClick={() => navigate(`/organizer/events/${ev.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
