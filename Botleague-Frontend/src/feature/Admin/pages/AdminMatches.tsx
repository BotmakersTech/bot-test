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
import { useSportMatchRealtime, mergeMatchUpdate } from "../../../shared/realtime/useMatchRealtime"
import { ORG } from "../../Organizer/theme/organizerTheme"
import { ageGroupLabel } from "../../../shared/utils/ageGroup"
import "../../../styles/organizerTheme.css"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SCHEDULED:        "bg-blue-50 text-blue-600 border-blue-200",
    LIVE:              "bg-green-50 text-green-600 border-green-200",
    PENDING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200",
    COMPLETED:        "bg-gray-100 text-gray-500 border-gray-200",
    CANCELLED:        "bg-red-50 text-red-600 border-red-200",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${map[status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
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

  // Match results are often submitted from a different page (judge/organizer
  // scoring UI). When a specific sport is selected, useSportMatchRealtime
  // below merges live updates straight into `matches`. When viewing "ALL"
  // sports there's no single topic to subscribe to, so fall back to polling.
  useEffect(() => {
    if (selectedSportId !== "ALL") return
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
  }, [load, selectedSportId])

  useSportMatchRealtime(selectedSportId !== "ALL" ? selectedSportId : null, (type, payload) => {
    if (type === 'RANKINGS_UPDATED' || type === 'BRACKET_CREATED') return
    setMatches((prev) => mergeMatchUpdate(prev, payload as MatchDTO))
  })

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
    <div className="org-page-bg p-8">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">Match Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {loading ? "Loading…" : `${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <button onClick={() => load()} disabled={loading}
          className="rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] hover:bg-[#f8f9ff] transition disabled:opacity-50"
          style={{ borderColor: "rgba(75,134,232,0.3)" }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Scheduled", value: counts.SCHEDULED, color: "text-blue-600" },
          { label: "Live",      value: counts.LIVE,      color: "text-green-600" },
          { label: "Completed", value: counts.COMPLETED, color: "text-gray-500" },
          { label: "Cancelled", value: counts.CANCELLED, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white border px-4 py-3" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          className="rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] outline-none"
          style={{ borderColor: "rgba(75,134,232,0.3)" }}
        >
          <option value="ALL">All Techfects</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.eventName}</option>
          ))}
        </select>

        <select
          value={selectedSportId}
          onChange={(e) => setSelectedSportId(e.target.value)}
          disabled={selectedEventId === "ALL"}
          className="rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] outline-none disabled:opacity-40"
          style={{ borderColor: "rgba(75,134,232,0.3)" }}
        >
          <option value="ALL">All Sports</option>
          {sports.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {toLabel(sp.sport)}{sp.ageGroup ? ` · ${ageGroupLabel(sp.ageGroup)}` : ""}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team name…"
          className="flex-1 min-w-48 rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] placeholder-gray-400 outline-none"
          style={{ borderColor: "rgba(75,134,232,0.3)" }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
            style={
              statusFilter === s
                ? { background: "rgba(250,146,25,0.12)", color: "#c2620a", border: "1px solid rgba(250,146,25,0.35)" }
                : { background: "#f8f9ff", color: ORG.muted, border: "1px solid rgba(75,134,232,0.2)" }
            }
          >
            {s === "ALL" ? "All Status" : toLabel(s)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading matches…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">No matches found</div>
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: ORG.gradientPill }}>
                <th className="px-4 py-3.5 text-left font-semibold text-white">#</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white">Teams</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white hidden sm:table-cell">Round</th>
                <th className="px-4 py-3.5 text-center font-semibold text-white hidden md:table-cell">Score</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white hidden lg:table-cell">Scheduled</th>
                <th className="px-4 py-3.5 text-center font-semibold text-white">Status</th>
                <th className="px-4 py-3.5 text-center font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.map((m) => (
                <tr key={m.matchId} className="border-t transition-colors hover:bg-[#f8f9ff]" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {m.matchNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#374151]">
                        {m.teamAName ?? "TBD"}
                        {m.teamARobotName && (
                          <span className="ml-1.5 text-xs text-gray-400">({m.teamARobotName})</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        vs {m.teamBName ?? "TBD"}
                        {m.teamBRobotName && (
                          <span className="ml-1.5 text-xs text-gray-400">({m.teamBRobotName})</span>
                        )}
                      </p>
                      {m.teamCName && (
                        <p className="text-xs text-gray-400">& {m.teamCName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {m.roundNumber != null ? (
                      <span className="text-gray-600">Round {m.roundNumber}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                    {m.bracketSide && (
                      <p className="text-xs text-gray-400 mt-0.5">{toLabel(m.bracketSide)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {m.teamAScore != null && m.teamBScore != null ? (
                      <span className="font-mono font-bold text-[#374151]">
                        {m.teamAScore} – {m.teamBScore}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
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
                          className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600 hover:bg-green-100 disabled:opacity-50">
                          Approve
                        </button>
                        <button onClick={() => handleReject(m.matchId)} disabled={actingOnId === m.matchId}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
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
