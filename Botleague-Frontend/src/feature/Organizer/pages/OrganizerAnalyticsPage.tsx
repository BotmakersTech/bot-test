import { useEffect, useState } from "react"
import {
  CalendarDays, Trophy, Users, Activity, TrendingUp, Clock, Zap, CheckCircle2
} from "lucide-react"
import { getMyEvents, getDashboardStats, type OrganizerEvent, type DashboardStats } from "../api/organizer.api"
import { ORG } from "../theme/organizerTheme"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8c6cff"
const BLUE   = "#4c8ee7"
const BG     = ORG.pageBg
const SURF   = "rgba(255,255,255,0.9)"
const BORDER = "#4b86e8"
const TEXT   = "#111111"
const MUTED  = "#5d5d5d"

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function BigStat({ icon, label, value, color, subtitle }: { icon: React.ReactNode; label: string; value: number; color: string; subtitle?: string }) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "22px 26px", display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ background: `${color}1A`, color, borderRadius: "12px", width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ color: MUTED, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
        <p style={{ color: TEXT, fontSize: "2rem", fontWeight: 700, fontFamily: "'Sarpanch',sans-serif", margin: "2px 0 0", lineHeight: 1 }}>{value}</p>
        {subtitle && <p style={{ color: MUTED, fontSize: "0.75rem", margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: TEXT, fontSize: "0.82rem", fontWeight: 500 }}>{label}</span>
        <span style={{ color: MUTED, fontSize: "0.78rem" }}>{value} ({pct}%)</span>
      </div>
      <div style={{ height: "6px", background: BORDER, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  )
}

export default function OrganizerAnalyticsPage() {
  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyEvents(), getDashboardStats().catch(() => null)])
      .then(([evts, st]) => { setEvents(evts); setStats(st) })
      .finally(() => setLoading(false))
  }, [])

  const totalEvents  = events.length
  const liveCount    = events.filter(e => e.status?.toUpperCase() === "LIVE").length
  const draftCount   = events.filter(e => e.status?.toUpperCase() === "DRAFT").length
  const pubCount     = events.filter(e => e.status?.toUpperCase() === "PUBLISHED").length
  const doneCount    = events.filter(e => e.status?.toUpperCase() === "COMPLETED").length
  const allSports    = events.flatMap(e => e.sports ?? [])
  const totalSports  = allSports.length
  const totalTeams   = allSports.reduce((a, s) => a + (s.registeredTeamsCount ?? 0), 0)
  const totalVols    = stats?.totalVolunteers ?? 0
  const totalJudges  = stats?.totalJudges ?? 0
  const totalStaff   = stats?.totalStaff ?? 0
  const totalMatches = stats?.totalMatches ?? 0
  const openIncidents = stats?.openIncidents ?? 0

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontFamily: "'Inter',sans-serif" }}>
      Loading analytics…
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "28px 32px", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Analytics</h1>
        <p style={{ color: MUTED, fontSize: "0.85rem", margin: "4px 0 0" }}>Overview of your event portfolio</p>
      </div>

      {/* Big stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "14px", marginBottom: "28px" }}>
        <BigStat icon={<CalendarDays size={22} />} label="Total Events"    value={totalEvents}  color={P}       />
        <BigStat icon={<Zap size={22} />}           label="Live Now"       value={liveCount}    color="#10b981" />
        <BigStat icon={<Clock size={22} />}          label="Upcoming"      value={pubCount}     color={BLUE}    />
        <BigStat icon={<Trophy size={22} />}         label="Sports"        value={totalSports}  color="#f59e0b" />
        <BigStat icon={<Users size={22} />}          label="Teams"         value={totalTeams}   color="#0ea5e9" />
        <BigStat icon={<Activity size={22} />}       label="Matches"       value={totalMatches} color="#8b5cf6" />
        <BigStat icon={<CheckCircle2 size={22} />}   label="Completed"     value={doneCount}    color="#94a3b8" />
        <BigStat icon={<TrendingUp size={22} />}     label="Open Incidents" value={openIncidents} color="#ef4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Event status breakdown */}
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "22px 26px" }}>
          <h2 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1rem", fontWeight: 700, margin: "0 0 18px" }}>Event Status Breakdown</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <ProgressBar label="Live"      value={liveCount}  total={totalEvents} color="#10b981" />
            <ProgressBar label="Published" value={pubCount}   total={totalEvents} color={P}       />
            <ProgressBar label="Draft"     value={draftCount} total={totalEvents} color="#f59e0b" />
            <ProgressBar label="Completed" value={doneCount}  total={totalEvents} color="#94a3b8" />
          </div>
        </div>

        {/* Personnel overview */}
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "22px 26px" }}>
          <h2 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1rem", fontWeight: 700, margin: "0 0 18px" }}>Personnel Overview</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Volunteers", value: totalVols,   color: "#0ea5e9" },
              { label: "Judges",     value: totalJudges, color: "#8b5cf6" },
              { label: "Staff",      value: totalStaff,  color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: BG, borderRadius: "10px" }}>
                <span style={{ color: TEXT, fontWeight: 500, fontSize: "0.875rem" }}>{label}</span>
                <span style={{ color, fontWeight: 700, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.1rem" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-event sports table */}
      <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "22px 26px" }}>
        <h2 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px" }}>Events at a Glance</h2>
        {events.length === 0 ? (
          <p style={{ color: MUTED, textAlign: "center", padding: "20px 0" }}>No events found</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Event", "Status", "Sports", "Teams", "Dates"].map((h, i) => (
                    <th key={i} style={{ textAlign: i >= 2 ? "center" : "left", padding: "10px 12px", color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => {
                  const sc  = ev.sports?.length ?? 0
                  const tc  = ev.sports?.reduce((a, s) => a + (s.registeredTeamsCount ?? 0), 0) ?? 0
                  const cfg = { LIVE: "#10b981", PUBLISHED: P, DRAFT: "#f59e0b", COMPLETED: "#94a3b8", ARCHIVED: "#64748b" }
                  const statusColor = (cfg as any)[ev.status?.toUpperCase() ?? ""] ?? MUTED
                  return (
                    <tr key={ev.id} style={{ borderBottom: i < events.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                      <td style={{ padding: "12px 12px", color: TEXT, fontWeight: 600 }}>{ev.eventName}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, borderRadius: "999px", padding: "3px 10px", fontSize: "0.67rem", fontWeight: 700 }}>
                          {toLabel(ev.status)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "center", color: TEXT, fontWeight: 600 }}>{sc}</td>
                      <td style={{ padding: "12px 12px", textAlign: "center", color: TEXT, fontWeight: 600 }}>{tc}</td>
                      <td style={{ padding: "12px 12px", color: MUTED, fontSize: "0.8rem", textAlign: "center" }}>
                        {ev.startDate ? new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        {ev.endDate ? ` – ${new Date(ev.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
