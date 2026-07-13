import { useEffect, useState, useCallback } from "react"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import {
  getAllMatches,
  getMatchesByEventSport,
  approveMatchResult,
  rejectMatchResult,
  type MatchDTO,
  type MatchStatus,
} from "../api/adminMatches.api"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SCHEDULED:        "bg-blue-500/15 text-blue-400 border-blue-500/30",
    LIVE:             "bg-green-500/15 text-green-400 border-green-500/30",
    PENDING_APPROVAL: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    COMPLETED:        "bg-gray-500/15 text-gray-400 border-gray-500/30",
    CANCELLED:        "bg-red-500/15 text-red-400 border-red-500/30",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${map[status] ?? "bg-white/10 text-gray-400 border-white/10"}`}>
      {toLabel(status)}
    </span>
  )
}

const STATUS_FILTERS: Array<MatchStatus | "ALL"> = ["ALL", "SCHEDULED", "LIVE", "PENDING_APPROVAL", "COMPLETED", "CANCELLED"]

export default function AdminMatches() {
  const [events, setEvents] = useState<AdminEventResponse[]>([])
  const [matches, setMatches] = useState<MatchDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedEventId, setSelectedEventId] = useState<string>("ALL")
  const [selectedSportId, setSelectedSportId] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "ALL">("ALL")
  const [search, setSearch] = useState("")

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const sports = selectedEvent?.sports ?? []

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (selectedSportId !== "ALL") {
        const data = await getMatchesByEventSport(selectedSportId)
        setMatches(data)
      } else {
        const data = await getAllMatches()
        setMatches(data)
      }
    } catch {
      setError("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }, [selectedSportId])

  useEffect(() => {
    getAllEvents().then(setEvents).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const [actingOnId, setActingOnId] = useState<string | null>(null)

  const handleApprove = async (matchId: string) => {
    setActingOnId(matchId)
    try { await approveMatchResult(matchId); await load() }
    catch { setError("Failed to approve match result") }
    finally { setActingOnId(null) }
  }

  const handleReject = async (matchId: string) => {
    const reason = window.prompt("Reason for rejecting this result (optional):") ?? undefined
    setActingOnId(matchId)
    try { await rejectMatchResult(matchId, reason); await load() }
    catch { setError("Failed to reject match result") }
    finally { setActingOnId(null) }
  }

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
    setSelectedSportId("ALL")
  }

  const filtered = matches.filter((m) => {
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (m.teamAName ?? "").toLowerCase().includes(q) ||
      (m.teamBName ?? "").toLowerCase().includes(q) ||
      (m.matchId ?? "").toLowerCase().includes(q)
    )
  })

  const counts = {
    SCHEDULED: matches.filter((m) => m.status === "SCHEDULED").length,
    LIVE:      matches.filter((m) => m.status === "LIVE").length,
    COMPLETED: matches.filter((m) => m.status === "COMPLETED").length,
    CANCELLED: matches.filter((m) => m.status === "CANCELLED").length,
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Match Management</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Scheduled", value: counts.SCHEDULED, color: "text-blue-400" },
          { label: "Live",      value: counts.LIVE,      color: "text-green-400" },
          { label: "Completed", value: counts.COMPLETED, color: "text-gray-300" },
          { label: "Cancelled", value: counts.CANCELLED, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
        >
          <option value="ALL">All Events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.eventName}</option>
          ))}
        </select>

        <select
          value={selectedSportId}
          onChange={(e) => setSelectedSportId(e.target.value)}
          disabled={selectedEventId === "ALL"}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-40"
        >
          <option value="ALL">All Sports</option>
          {sports.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {toLabel(sp.sport)}{sp.ageGroup ? ` · ${toLabel(sp.ageGroup)}` : ""}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team name…"
          className="flex-1 min-w-48 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
              statusFilter === s
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
            }`}
          >
            {s === "ALL" ? "All Status" : toLabel(s)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading matches…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">No matches found</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Teams</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Round</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Score</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Scheduled</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((m) => (
                <tr key={m.matchId} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {m.matchNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-white">
                        {m.teamAName ?? "TBD"}
                        {m.teamARobotName && (
                          <span className="ml-1.5 text-xs text-gray-500">({m.teamARobotName})</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        vs {m.teamBName ?? "TBD"}
                        {m.teamBRobotName && (
                          <span className="ml-1.5 text-xs text-gray-500">({m.teamBRobotName})</span>
                        )}
                      </p>
                      {m.teamCName && (
                        <p className="text-xs text-gray-500">& {m.teamCName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {m.roundNumber != null ? (
                      <span className="text-gray-300">Round {m.roundNumber}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                    {m.bracketSide && (
                      <p className="text-xs text-gray-500 mt-0.5">{toLabel(m.bracketSide)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {m.teamAScore != null && m.teamBScore != null ? (
                      <span className="font-mono font-bold text-white">
                        {m.teamAScore} – {m.teamBScore}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                    {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={m.status ?? ""} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.status === "PENDING_APPROVAL" ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleApprove(m.matchId)} disabled={actingOnId === m.matchId}
                          className="rounded-lg bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400 hover:bg-green-500/20 disabled:opacity-50">
                          Approve
                        </button>
                        <button onClick={() => handleReject(m.matchId)} disabled={actingOnId === m.matchId}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
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
