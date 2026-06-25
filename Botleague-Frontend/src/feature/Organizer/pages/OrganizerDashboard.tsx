import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  getMyEvents, getDashboardStats,
  type OrganizerEvent, type DashboardStats,
} from "../api/organizer.api"

// ── helpers ──────────────────────────────────────────────────────────────────

function normalizeStatus(s?: string) {
  const v = s?.toLowerCase() ?? ""
  if (v === "live" || v === "ongoing") return "live"
  if (v === "completed") return "completed"
  return "upcoming"
}

function fmt(d?: string | null) {
  if (!d) return "—"
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }
  catch { return d }
}

const STATUS_PILL: Record<string, { label: string; color: string; bg: string }> = {
  live:      { label: "Live",      color: "#4ade80", bg: "rgba(74,222,128,.14)" },
  upcoming:  { label: "Upcoming",  color: "#fa7545", bg: "rgba(250,117,69,.14)" },
  completed: { label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,.14)" },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[normalizeStatus(status)] ?? STATUS_PILL.upcoming
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}>
      {normalizeStatus(status) === "live" && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      )}
      {cfg.label}
    </span>
  )
}

function StatCard({ label, value, accent, href }: { label: string; value: number; accent: string; href?: string }) {
  const inner = (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 h-full hover:border-white/10 transition-colors">
      <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

function SectionHead({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-neutral-200">{title}</h2>
      {href && linkLabel && (
        <Link to={href} className="text-xs text-[#fa4715] hover:underline">{linkLabel}</Link>
      )}
    </div>
  )
}

function EventRow({ event }: { event: OrganizerEvent }) {
  return (
    <Link to={`/organizer/events/${event.id}`}
      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-200">{event.eventName}</p>
        <p className="text-xs text-neutral-500">
          {event.organizationName ?? "—"} · {fmt(event.startDate)} – {fmt(event.endDate)}
        </p>
      </div>
      <div className="ml-4 shrink-0"><StatusPill status={event.status} /></div>
    </Link>
  )
}

function QuickAction({ label, href, icon }: { label: string; href: string; icon: string }) {
  return (
    <Link to={href}
      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 hover:border-[#fa4715]/30 hover:bg-white/[0.03] transition-colors group">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{label}</span>
    </Link>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [stats, setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyEvents(),
      getDashboardStats().catch(() => null),
    ]).then(([ev, st]) => {
      setEvents(ev)
      setStats(st)
    }).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [])

  const live      = events.filter(e => normalizeStatus(e.status) === "live")
  const upcoming  = events.filter(e => normalizeStatus(e.status) === "upcoming")
  const completed = events.filter(e => normalizeStatus(e.status) === "completed")

  return (
    <div className="min-h-full p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Organiser Dashboard</h1>
        <p className="text-sm text-neutral-500">Overview of your hosted events</p>
      </div>

      {/* ── Event Stats ── */}
      <section>
        <SectionHead title="Event Overview" href="/organizer/events" linkLabel="View all" />
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Events"    value={stats?.totalEvents    ?? events.length}      accent="#e2e8f0" href="/organizer/events" />
            <StatCard label="Live Now"        value={stats?.liveEvents     ?? live.length}         accent="#4ade80" />
            <StatCard label="Upcoming"        value={stats?.upcomingEvents ?? upcoming.length}     accent="#fa7545" />
            <StatCard label="Completed"       value={stats?.completedEvents ?? completed.length}   accent="#94a3b8" />
          </div>
        )}
      </section>

      {/* ── Operational Stats ── */}
      {stats && !loading && (
        <section>
          <SectionHead title="Operational Summary" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Registrations"    value={stats.totalRegistrations} accent="#60a5fa" href="/organizer/registrations" />
            <StatCard label="Total Matches"    value={stats.totalMatches}       accent="#a78bfa" href="/organizer/matches" />
            <StatCard label="Volunteers"       value={stats.totalVolunteers}    accent="#34d399" href="/organizer/volunteers" />
            <StatCard label="Judges"           value={stats.totalJudges}        accent="#f59e0b" href="/organizer/judges" />
          </div>
        </section>
      )}

      {/* ── Alerts ── */}
      {stats && (stats.pendingApprovals > 0 || stats.openIncidents > 0) && (
        <section>
          <SectionHead title="Attention Required" />
          <div className="space-y-2">
            {stats.pendingApprovals > 0 && (
              <Link to="/organizer/registrations"
                className="flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 hover:bg-orange-500/10 transition-colors">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
                <span className="text-sm text-orange-300">
                  <strong>{stats.pendingApprovals}</strong> team registration{stats.pendingApprovals !== 1 ? "s" : ""} pending approval
                </span>
              </Link>
            )}
            {stats.openIncidents > 0 && (
              <Link to="/organizer/monitoring"
                className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 hover:bg-red-500/10 transition-colors">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                <span className="text-sm text-red-300">
                  <strong>{stats.openIncidents}</strong> open incident{stats.openIncidents !== 1 ? "s" : ""} need attention
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Quick Actions ── */}
        <section>
          <SectionHead title="Quick Actions" />
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Manage Volunteers",   href: "/organizer/volunteers",  icon: "👥" },
              { label: "Manage Judges",       href: "/organizer/judges",      icon: "⚖️" },
              { label: "Post Announcement",   href: "/organizer/communication", icon: "📢" },
              { label: "View Schedule",       href: "/organizer/schedule",    icon: "📅" },
              { label: "Venue & Logistics",   href: "/organizer/venue",       icon: "🏟️" },
              { label: "Event Monitoring",    href: "/organizer/monitoring",  icon: "🎯" },
              { label: "Issue Certificates",  href: "/organizer/certificates", icon: "🎖️" },
              { label: "Analytics",           href: "/organizer/analytics",   icon: "📊" },
            ].map(a => <QuickAction key={a.label} {...a} />)}
          </div>
        </section>

        {/* ── Events ── */}
        <section>
          <SectionHead title="Your Events" href="/organizer/events" linkLabel="Manage all" />
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-neutral-400 text-sm">No events assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...live, ...upcoming, ...completed].map(e => <EventRow key={e.id} event={e} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
