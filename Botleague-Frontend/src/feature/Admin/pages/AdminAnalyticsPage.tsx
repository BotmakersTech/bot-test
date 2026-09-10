import { useEffect, useState } from "react"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import "../../../styles/organizerTheme.css"

function StatCard({ label, value, sub, color = "text-orange-600" }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function HorizBar({ label, value, max, color = "bg-orange-500" }: {
  label: string; value: number; max: number; color?: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-xs text-gray-500 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs text-gray-500 text-right">{value}</span>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<AdminEventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAllEvents()
      .then(setEvents)
      .catch(() => setError("Failed to load analytics data"))
      .finally(() => setLoading(false))
  }, [])

  const totalEvents  = events.length
  const totalSports  = events.reduce((s, e) => s + (e.sports?.length ?? 0), 0)
  const totalTeams   = events.reduce((s, e) => s + (e.sports?.reduce((ss, sp) => ss + (sp.registeredTeamsCount ?? 0), 0) ?? 0), 0)
  const liveEvents   = events.filter((e) => ["ACTIVE", "LIVE"].includes((e.status ?? "").toUpperCase())).length
  const upcomingEvents = events.filter((e) => ["UPCOMING", "REGISTRATION_OPEN"].includes((e.status ?? "").toUpperCase())).length
  const completedEvents = events.filter((e) => (e.status ?? "").toUpperCase() === "COMPLETED").length

  const avgFill = (() => {
    const sportsWithCap = events.flatMap((e) => (e.sports ?? []).filter((sp) => sp.maxTeams))
    if (!sportsWithCap.length) return null
    const totalFill = sportsWithCap.reduce((s, sp) => s + ((sp.registeredTeamsCount ?? 0) / sp.maxTeams!) * 100, 0)
    return (totalFill / sportsWithCap.length).toFixed(1)
  })()

  const sportCounts = (() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => (e.sports ?? []).forEach((sp) => {
      counts[sp.sport] = (counts[sp.sport] ?? 0) + 1
    }))
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 8)
  })()

  const maxSportCount = sportCounts[0]?.[1] ?? 1

  return (
    <div className="org-page-bg p-8">
      <div className="mb-6">
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide metrics and trends</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading analytics…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600 text-sm text-center">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Techfests"    value={totalEvents}   color="text-orange-600" />
            <StatCard label="Total Sports"    value={totalSports}   color="text-blue-600" />
            <StatCard label="Teams Registered" value={totalTeams}   color="text-purple-600" />
            <StatCard label="Avg Fill Rate"   value={avgFill ? `${avgFill}%` : "—"} color="text-green-600" sub="across capped sports" />
          </div>

          {/* Event status breakdown */}
          <div className="grid grid-cols-1 gap-5">
            <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Techfest Status</h3>
              <div className="space-y-3">
                <HorizBar label="Live / Active" value={liveEvents}     max={totalEvents} color="bg-green-500" />
                <HorizBar label="Upcoming"      value={upcomingEvents} max={totalEvents} color="bg-yellow-500" />
                <HorizBar label="Completed"     value={completedEvents}max={totalEvents} color="bg-blue-500" />
                <HorizBar
                  label="Other / Cancelled"
                  value={totalEvents - liveEvents - upcomingEvents - completedEvents}
                  max={totalEvents}
                  color="bg-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Popular sports */}
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Most Popular Techsports</h3>
            {sportCounts.length === 0 ? (
              <p className="text-gray-400 text-sm">No sports data yet</p>
            ) : (
              <div className="space-y-3">
                {sportCounts.map(([sport, count]) => (
                  <HorizBar
                    key={sport}
                    label={sport.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={count}
                    max={maxSportCount}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Registration funnel */}
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Registration Funnel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600">{totalEvents}</p>
                <p className="text-xs text-gray-400 mt-1">Techfests Created</p>
              </div>
              <div className="flex items-center justify-center text-gray-400 text-2xl">→</div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalTeams}</p>
                <p className="text-xs text-gray-400 mt-1">Teams Registered</p>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-400">
              {totalEvents > 0
                ? `${(totalTeams / totalEvents).toFixed(1)} teams per event on average`
                : "No techfests yet"}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
