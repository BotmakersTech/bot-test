import { useEffect, useState } from "react"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import "../../../styles/organizerTheme.css"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  const cls =
    s === "ACTIVE" || s === "LIVE"
      ? "bg-green-50 text-green-600 border-green-200"
      : s === "COMPLETED"
      ? "bg-blue-50 text-blue-600 border-blue-200"
      : s === "UPCOMING" || s === "REGISTRATION_OPEN"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : s === "CANCELLED"
      ? "bg-red-50 text-red-600 border-red-200"
      : "bg-gray-50 text-gray-500 border-gray-200"
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${cls}`}>
      {toLabel(status)}
    </span>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function AdminReportsPage() {
  const [events, setEvents] = useState<AdminEventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAllEvents()
      .then(setEvents)
      .catch(() => setError("Failed to load report data"))
      .finally(() => setLoading(false))
  }, [])

  const totalSports = events.reduce((s, e) => s + (e.sports?.length ?? 0), 0)
  const totalTeams  = events.reduce((s, e) => s + (e.sports?.reduce((ss, sp) => ss + (sp.registeredTeamsCount ?? 0), 0) ?? 0), 0)
  const activeCount = events.filter((e) => ["ACTIVE", "LIVE"].includes((e.status ?? "").toUpperCase())).length
  const completedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "COMPLETED").length

  return (
    <div className="org-page-bg p-8">
      <div className="mb-6">
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-bold text-[#0162d1] tracking-wide">Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide overview across all events</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading reports…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600 text-sm text-center">{error}</div>
      ) : (
        <>
          {/* Top-level KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Events",    value: events.length,  color: "text-orange-600" },
              { label: "Active Events",   value: activeCount,    color: "text-green-600" },
              { label: "Total Sports",    value: totalSports,    color: "text-blue-600" },
              { label: "Teams Registered",value: totalTeams,     color: "text-purple-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-white border px-4 py-4" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Per-event breakdown */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Event Breakdown
          </h2>

          {events.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400">No events yet</div>
          ) : (
            <div className="space-y-4">
              {events.map((ev) => {
                const evTeams   = ev.sports?.reduce((s, sp) => s + (sp.registeredTeamsCount ?? 0), 0) ?? 0
                const evSports  = ev.sports?.length ?? 0
                const maxTeamsTotal = ev.sports?.reduce((s, sp) => s + (sp.maxTeams ?? 0), 0) ?? 0

                return (
                  <div key={ev.id} className="rounded-2xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[#374151]">{ev.eventName}</h3>
                          <StatusBadge status={ev.status} />
                        </div>
                        {ev.city && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {ev.city}{ev.country ? `, ${ev.country}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">Dates</p>
                        <p className="text-xs text-gray-600">
                          {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "—"}
                          {ev.endDate ? ` – ${new Date(ev.endDate).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Event stats row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg bg-[#f8f9ff] p-3 text-center">
                        <p className="text-lg font-bold text-orange-600">{evSports}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-0.5">Sports</p>
                      </div>
                      <div className="rounded-lg bg-[#f8f9ff] p-3 text-center">
                        <p className="text-lg font-bold text-blue-600">{evTeams}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-0.5">Teams</p>
                      </div>
                    </div>

                    {/* Overall fill */}
                    {maxTeamsTotal > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Registration fill</span>
                          <span>{evTeams}/{maxTeamsTotal} slots</span>
                        </div>
                        <ProgressBar value={evTeams} max={maxTeamsTotal} />
                      </div>
                    )}

                    {/* Per-sport rows */}
                    {ev.sports && ev.sports.length > 0 && (
                      <div className="space-y-2 border-t pt-3" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                        {ev.sports.map((sp) => (
                          <div key={sp.id} className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 w-36 shrink-0 truncate">
                              {toLabel(sp.sport)}
                              {sp.ageGroup ? ` · ${toLabel(sp.ageGroup)}` : ""}
                            </span>
                            <div className="flex-1">
                              <ProgressBar value={sp.registeredTeamsCount ?? 0} max={sp.maxTeams ?? (sp.registeredTeamsCount ?? 0)} />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0 w-14 text-right">
                              {sp.registeredTeamsCount ?? 0}
                              {sp.maxTeams ? `/${sp.maxTeams}` : ""} teams
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary footer */}
          <div className="mt-8 rounded-xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Completed Events</p>
                <p className="text-[#374151] font-semibold mt-0.5">{completedCount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Upcoming Events</p>
                <p className="text-[#374151] font-semibold mt-0.5">
                  {events.filter((e) => ["UPCOMING", "REGISTRATION_OPEN"].includes((e.status ?? "").toUpperCase())).length}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Avg Teams / Event</p>
                <p className="text-[#374151] font-semibold mt-0.5">
                  {events.length > 0 ? (totalTeams / events.length).toFixed(1) : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Avg Sports / Event</p>
                <p className="text-[#374151] font-semibold mt-0.5">
                  {events.length > 0 ? (totalSports / events.length).toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
