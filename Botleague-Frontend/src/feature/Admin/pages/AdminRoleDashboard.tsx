import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import { getRecentAuditLogs, type AuditLogEntry } from "../api/auditLog.api"

// ── helpers ───────────────────────────────────────────────────────────────────

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

function fmtTime(d?: string | null) {
  if (!d) return "—"
  try { return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }
  catch { return d }
}

const STATUS_PILL: Record<string, { label: string; color: string; bg: string }> = {
  live:     { label: "Live",      color: "#4ade80", bg: "rgba(74,222,128,.14)" },
  upcoming: { label: "Upcoming",  color: "#fa7545", bg: "rgba(250,117,69,.14)" },
  completed:{ label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,.14)" },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[normalizeStatus(status)] ?? STATUS_PILL.upcoming
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {normalizeStatus(status) === "live" && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      )}
      {cfg.label}
    </span>
  )
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, accent, href,
}: { label: string; value: number | string; accent: string; href?: string }) {
  const inner = (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 transition-colors hover:border-white/10">
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

// ── quick action card ─────────────────────────────────────────────────────────

function QuickAction({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <Link
      to={href}
      className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4 transition-colors hover:border-[#fa4715]/30 hover:bg-white/[0.03]"
    >
      <span className="text-sm font-semibold text-neutral-200">{label}</span>
      <span className="text-xs text-neutral-500">{desc}</span>
    </Link>
  )
}

// ── event row ─────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: AdminEventResponse }) {
  const sportCount = event.sports?.length ?? 0
  return (
    <Link
      to={`/admin/event/${event.id}`}
      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-200">{event.eventName}</p>
        <p className="text-xs text-neutral-500">
          {event.venueName} · {fmt(event.startDate)} – {fmt(event.endDate)}
          {sportCount > 0 && ` · ${sportCount} sport${sportCount !== 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="ml-4 shrink-0">
        <StatusPill status={event.status ?? "upcoming"} />
      </div>
    </Link>
  )
}

// ── audit log row ─────────────────────────────────────────────────────────────

function AuditRow({ log }: { log: AuditLogEntry }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3">
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#fa4715]" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-200">
          <span className="text-[#fa4715]">{log.action}</span>
          {log.entityName ? ` · ${log.entityName}` : ""}
        </p>
        <p className="text-xs text-neutral-500">
          {log.actorEmail ?? "System"} · {fmtTime(log.createdAt)}
        </p>
      </div>
    </div>
  )
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ rows = 3, h = "h-14" }: { rows?: number; h?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${h} animate-pulse rounded-xl bg-white/[0.04]`} />
      ))}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function AdminRoleDashboard() {
  const [events, setEvents]   = useState<AdminEventResponse[]>([])
  const [logs, setLogs]       = useState<AuditLogEntry[]>([])
  const [loadingE, setLoadingE] = useState(true)
  const [loadingL, setLoadingL] = useState(true)

  useEffect(() => {
    getAllEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoadingE(false))
    getRecentAuditLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoadingL(false))
  }, [])

  const live      = events.filter(e => normalizeStatus(e.status) === "live")
  const upcoming  = events.filter(e => normalizeStatus(e.status) === "upcoming")
  const completed = events.filter(e => normalizeStatus(e.status) === "completed")
  const totalSports = events.reduce((n, e) => n + (e.sports?.length ?? 0), 0)

  return (
    <div className="min-h-full p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500">Platform overview and quick management access</p>
      </div>

      {/* ── Platform Stats ── */}
      <section>
        <SectionHead title="Platform Overview" />
        {loadingE ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Events"   value={events.length}    accent="#e2e8f0" href="/admin/user" />
            <StatCard label="Live Now"        value={live.length}      accent="#4ade80" href="/admin/user" />
            <StatCard label="Upcoming"        value={upcoming.length}  accent="#fa7545" href="/admin/user" />
            <StatCard label="Total Sports"    value={totalSports}      accent="#a78bfa" href="/admin/sports" />
          </div>
        )}
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <SectionHead title="Quick Actions" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction label="Create Event"     desc="Set up a new competition"   href="/admin/events/create" />
          <QuickAction label="All Teams"         desc="Browse registered teams"   href="/admin/teams" />
          <QuickAction label="Rankings"          desc="View leaderboard"          href="/rankings" />
          <QuickAction label="Audit Logs"        desc="Recent system activity"    href="/admin/audit-logs" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Recent Events ── */}
        <section>
          <SectionHead title="Recent Events" href="/admin/user" linkLabel="View all" />
          {loadingE ? (
            <Skeleton rows={4} />
          ) : events.length === 0 ? (
            <p className="text-sm text-neutral-500">No events found.</p>
          ) : (
            <div className="space-y-2">
              {[...live, ...upcoming].slice(0, 6).map(e => (
                <EventRow key={e.id} event={e} />
              ))}
              {completed.slice(0, 2).map(e => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Audit Logs ── */}
        <section>
          <SectionHead title="Recent Activity" href="/admin/audit-logs" linkLabel="View all" />
          {loadingL ? (
            <Skeleton rows={5} h="h-12" />
          ) : logs.length === 0 ? (
            <p className="text-sm text-neutral-500">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 8).map(l => <AuditRow key={l.id} log={l} />)}
            </div>
          )}
        </section>
      </div>

      {/* ── Management Links ── */}
      <section>
        <SectionHead title="Management" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: "All Robots",      href: "/admin/robots",         desc: "Browse registered robots" },
            { label: "Registrations",   href: "/admin/registrations",  desc: "Team registrations" },
            { label: "Matches",         href: "/admin/matches",        desc: "Match schedule & results" },
            { label: "Judges",          href: "/admin/judges",         desc: "Judge assignments" },
            { label: "Sponsors",        href: "/admin/sponsors",       desc: "Sponsor partnerships" },
            { label: "Analytics",       href: "/admin/analytics",      desc: "Platform analytics" },
            { label: "Reports",         href: "/admin/reports",        desc: "Generate reports" },
            { label: "Support Tickets", href: "/admin/support-tickets",desc: "Open support issues" },
          ].map(item => (
            <QuickAction key={item.href} {...item} />
          ))}
        </div>
      </section>
    </div>
  )
}
