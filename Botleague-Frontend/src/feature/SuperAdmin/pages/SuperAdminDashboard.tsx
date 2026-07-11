import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { listUsers, type UserSummary } from "../api/userManagement.api"
import { getRecentAuditLogs, type AuditLogEntry } from "../../Admin/api/auditLog.api"
import { getAllEvents, type AdminEventResponse } from "../../Admin/api/admin.api"

// ── helpers ───────────────────────────────────────────────────────────────────

function normalizeStatus(s?: string) {
  const v = s?.toUpperCase() ?? ""
  if (v === "LIVE")      return "live"
  if (v === "COMPLETED") return "completed"
  if (v === "ARCHIVED")  return "archived"
  if (v === "DRAFT")     return "draft"
  return "upcoming"  // PUBLISHED
}

function fmtTime(d?: string | null) {
  if (!d) return "—"
  try { return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }
  catch { return d }
}

function fmt(d?: string | null) {
  if (!d) return "—"
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }
  catch { return d }
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, href,
}: { label: string; value: number | string; sub?: string; accent: string; href?: string }) {
  const inner = (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 transition-colors hover:border-white/10">
      <span className="text-3xl font-bold" style={{ color: accent }}>{value}</span>
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      {sub && <span className="text-xs text-neutral-500">{sub}</span>}
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

// ── role distribution row ─────────────────────────────────────────────────────

function RoleBar({ role, count, total }: { role: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const colors: Record<string, string> = {
    SUPER_ADMIN: "#f43f5e",
    ADMIN: "#fb923c",
    ORGANISER: "#10b981",
    EVENT_HEAD: "#34d399",
    SPORT_HEAD: "#60a5fa",
    USER: "#a78bfa",
  }
  const color = colors[role] ?? "#94a3b8"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-neutral-300">{role.replace("_", " ")}</span>
        <span className="text-neutral-500">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ── user row ──────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: UserSummary }) {
  const roleColor: Record<string, string> = {
    SUPER_ADMIN: "#f43f5e",
    ADMIN: "#fb923c",
    ORGANISER: "#10b981",
    EVENT_HEAD: "#34d399",
    SPORT_HEAD: "#60a5fa",
    USER: "#a78bfa",
  }
  const color = roleColor[user.primaryRole] ?? "#94a3b8"
  return (
    <Link
      to={`/admin/users/${user.id}`}
      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-200">
          {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}
        </p>
        <p className="text-xs text-neutral-500">{user.email} · {user.botleagueId}</p>
      </div>
      <span className="ml-4 shrink-0 text-xs font-semibold" style={{ color }}>
        {user.primaryRole.replace("_", " ")}
      </span>
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

// ── live event chip ───────────────────────────────────────────────────────────

function LiveEventChip({ event }: { event: AdminEventResponse }) {
  return (
    <Link
      to={`/admin/event/${event.id}`}
      className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/[0.07] px-4 py-3 transition-colors hover:bg-green-500/[0.12]"
    >
      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-green-200">{event.eventName}</p>
        <p className="text-xs text-green-400/70">{event.venueName ?? "—"} · {[event.city, event.state].filter(Boolean).join(", ")}</p>
      </div>
    </Link>
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

export default function SuperAdminDashboard() {
  const [users,    setUsers]    = useState<UserSummary[]>([])
  const [events,   setEvents]   = useState<AdminEventResponse[]>([])
  const [logs,     setLogs]     = useState<AuditLogEntry[]>([])
  const [loadingU, setLoadingU] = useState(true)
  const [loadingE, setLoadingE] = useState(true)
  const [loadingL, setLoadingL] = useState(true)

  useEffect(() => {
    listUsers(undefined, 0, 50)
      .then(p => setUsers(p.content))
      .catch(() => setUsers([]))
      .finally(() => setLoadingU(false))
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

  // Role distribution from first page of users (up to 50)
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.primaryRole] = (acc[u.primaryRole] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-full p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Executive Dashboard</h1>
        <p className="text-sm text-neutral-500">Full platform visibility — Super Admin view</p>
      </div>

      {/* ── Executive Metrics ── */}
      <section>
        <SectionHead title="Platform Metrics" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Users"   value={loadingU ? "…" : users.length} accent="#e2e8f0"  href="/admin/users" />
          <StatCard label="Total Events"  value={loadingE ? "…" : events.length} accent="#a78bfa" href="/admin/user" />
          <StatCard label="Live Events"   value={loadingE ? "…" : live.length}   accent="#4ade80" href="/admin/user" />
          <StatCard label="Upcoming"      value={loadingE ? "…" : upcoming.length}  accent="#fa7545" href="/admin/user" />
          <StatCard label="Completed"     value={loadingE ? "…" : completed.length} accent="#94a3b8" href="/admin/user" />
          <StatCard label="Total Sports"  value={loadingE ? "…" : totalSports}   accent="#60a5fa" href="/admin/sports" />
        </div>
      </section>

      {/* ── Live Events ── */}
      {(live.length > 0 || loadingE) && (
        <section>
          <SectionHead title="Live Events" href="/admin/user" linkLabel="View all" />
          {loadingE ? (
            <Skeleton rows={2} h="h-14" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {live.map(e => <LiveEventChip key={e.id} event={e} />)}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── User Role Distribution ── */}
        <section className="lg:col-span-1">
          <SectionHead title="User Role Distribution" href="/admin/users" linkLabel="Manage" />
          {loadingU ? (
            <Skeleton rows={5} h="h-8" />
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4 space-y-3">
              {Object.entries(roleCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => (
                  <RoleBar key={role} role={role} count={count} total={users.length} />
                ))}
            </div>
          )}
        </section>

        {/* ── Recent Users ── */}
        <section className="lg:col-span-2">
          <SectionHead title="Recent Users" href="/admin/users" linkLabel="View all" />
          {loadingU ? (
            <Skeleton rows={5} />
          ) : users.length === 0 ? (
            <p className="text-sm text-neutral-500">No users found.</p>
          ) : (
            <div className="space-y-2">
              {[...users]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 6)
                .map(u => <UserRow key={u.id} user={u} />)}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Upcoming Events ── */}
        <section>
          <SectionHead title="Upcoming Events" href="/admin/user" linkLabel="View all" />
          {loadingE ? (
            <Skeleton rows={4} />
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-neutral-500">No upcoming events.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map(e => (
                <Link
                  key={e.id}
                  to={`/admin/event/${e.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-200">{e.eventName}</p>
                    <p className="text-xs text-neutral-500">{fmt(e.startDate)} – {fmt(e.endDate)}</p>
                  </div>
                  <span className="ml-4 shrink-0 text-xs font-semibold text-[#fa7545]">
                    {(e.sports?.length ?? 0)} sport{(e.sports?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Audit Logs ── */}
        <section>
          <SectionHead title="Recent Audit Logs" href="/admin/audit-logs" linkLabel="View all" />
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

      {/* ── Platform Management ── */}
      <section>
        <SectionHead title="Platform Management" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "All Users",          href: "/admin/users",   desc: "User accounts & roles" },
            { label: "All Teams",           href: "/admin/teams",   desc: "Registered teams" },
            { label: "All Robots",          href: "/admin/robots",  desc: "Robot registry" },
            { label: "All Events",          href: "/admin/user",    desc: "Event management" },
            { label: "All Sports",          href: "/admin/sports",  desc: "Sport configurations" },
            { label: "Sponsors & Partners", href: "/admin/sponsors",desc: "Partnership management" },
            { label: "Judge Ecosystem",     href: "/admin/judges",  desc: "Judge assignments" },
            { label: "Reports",             href: "/admin/reports", desc: "Platform reports" },
            { label: "Audit Logs",          href: "/admin/audit-logs",desc: "System audit trail" },
            { label: "System Notifications",href: "/admin/system-notifications",desc: "Platform-wide alerts" },
          ].map(item => (
            <Link
              key={item.href}
              to={item.href}
              className="flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4 transition-colors hover:border-[#fa4715]/30 hover:bg-white/[0.03]"
            >
              <span className="text-sm font-semibold text-neutral-200">{item.label}</span>
              <span className="text-xs text-neutral-500">{item.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
