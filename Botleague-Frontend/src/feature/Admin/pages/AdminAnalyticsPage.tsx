import { useEffect, useState } from "react"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"

function StatCard({ label, value, sub, color = "text-orange-400" }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

function HorizBar({ label, value, max, color = "bg-orange-500" }: {
  label: string; value: number; max: number; color?: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-xs text-gray-400 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10">
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

  const tierCounts = (() => {
    const counts: Record<string, number> = {}
    events.forEach((e) => { const t = e.tier ?? "UNRANKED"; counts[t] = (counts[t] ?? 0) + 1 })
    return counts
  })()

  const maxSportCount = sportCounts[0]?.[1] ?? 1

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide metrics and trends</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading analytics…</div>
      ) : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Events"    value={totalEvents}   color="text-orange-400" />
            <StatCard label="Total Sports"    value={totalSports}   color="text-blue-400" />
            <StatCard label="Teams Registered" value={totalTeams}   color="text-purple-400" />
            <StatCard label="Avg Fill Rate"   value={avgFill ? `${avgFill}%` : "—"} color="text-green-400" sub="across capped sports" />
          </div>

          {/* Event status breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Status</h3>
              <div className="space-y-3">
                <HorizBar label="Live / Active" value={liveEvents}     max={totalEvents} color="bg-green-500" />
                <HorizBar label="Upcoming"      value={upcomingEvents} max={totalEvents} color="bg-yellow-500" />
                <HorizBar label="Completed"     value={completedEvents}max={totalEvents} color="bg-blue-500" />
                <HorizBar
                  label="Other / Cancelled"
                  value={totalEvents - liveEvents - upcomingEvents - completedEvents}
                  max={totalEvents}
                  color="bg-gray-500"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Tiers</h3>
              {Object.keys(tierCounts).length === 0 ? (
                <p className="text-gray-600 text-sm">No tier data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(tierCounts).map(([tier, count]) => (
                    <HorizBar key={tier} label={tier.replace(/_/g, " ")} value={count} max={totalEvents} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popular sports */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Most Popular Sports</h3>
            {sportCounts.length === 0 ? (
              <p className="text-gray-600 text-sm">No sports data yet</p>
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
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Registration Funnel</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-400">{totalEvents}</p>
                <p className="text-xs text-gray-500 mt-1">Events Created</p>
              </div>
              <div className="flex items-center justify-center text-gray-600 text-2xl">→</div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{totalTeams}</p>
                <p className="text-xs text-gray-500 mt-1">Teams Registered</p>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-600">
              {totalEvents > 0
                ? `${(totalTeams / totalEvents).toFixed(1)} teams per event on average`
                : "No events yet"}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
