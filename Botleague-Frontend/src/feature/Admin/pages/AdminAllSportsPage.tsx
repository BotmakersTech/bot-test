import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllEvents, type AdminEventResponse, type AdminEventSportResponse } from "../api/admin.api"

interface FlatSport extends AdminEventSportResponse {
  eventId: string
  eventName: string
  eventStatus?: string
}

function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function SportStatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  const cls =
    s === "ACTIVE" || s === "REGISTRATION_OPEN"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : s === "REGISTRATION_CLOSED"
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      : s === "COMPLETED"
      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
      : s === "CANCELLED"
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : "bg-white/10 text-gray-400 border-white/10"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cls}`}>
      {toLabel(status)}
    </span>
  )
}

export default function AdminAllSportsPage() {
  const navigate = useNavigate()
  const [sports, setSports] = useState<FlatSport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("ALL")
  const [events, setEvents] = useState<AdminEventResponse[]>([])

  useEffect(() => {
    setLoading(true)
    getAllEvents()
      .then((evts) => {
        setEvents(evts)
        const flat: FlatSport[] = []
        evts.forEach((ev) => {
          ;(ev.sports ?? []).forEach((sp) => {
            flat.push({ ...sp, eventId: ev.id, eventName: ev.eventName, eventStatus: ev.status })
          })
        })
        setSports(flat)
      })
      .catch(() => setError("Failed to load sports"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sports.filter((sp) => {
    const matchesEvent = eventFilter === "ALL" || sp.eventId === eventFilter
    const q = activeSearch.toLowerCase()
    const matchesSearch =
      !q ||
      (sp.sport ?? "").toLowerCase().includes(q) ||
      sp.eventName.toLowerCase().includes(q) ||
      (sp.ageGroup ?? "").toLowerCase().includes(q) ||
      (sp.weightClass ?? "").toLowerCase().includes(q)
    return matchesEvent && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Sports</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${filtered.length} sport${filtered.length !== 1 ? "s" : ""} across ${events.length} event${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="flex flex-1 min-w-60 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setActiveSearch(search)}
            placeholder="Search by sport name, event, age group…"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
          <button
            onClick={() => setActiveSearch(search)}
            className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition"
          >
            Search
          </button>
        </div>

        {/* Event filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
        >
          <option value="ALL">All Events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.eventName}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading sports…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">No sports found</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Sport</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Age Group</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Weight Class</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Teams</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((sp) => (
                <tr
                  key={`${sp.eventId}-${sp.id}`}
                  className="hover:bg-white/5 transition-colors"
                >
                  {/* Sport */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{toLabel(sp.sport)}</p>
                    {sp.formatType && (
                      <p className="text-xs text-gray-500 mt-0.5">{toLabel(sp.formatType)}</p>
                    )}
                  </td>

                  {/* Event */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-200 font-medium">{sp.eventName}</p>
                    {sp.eventStatus && (
                      <p className="text-xs text-gray-500 mt-0.5">{toLabel(sp.eventStatus)}</p>
                    )}
                  </td>

                  {/* Age Group */}
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {toLabel(sp.ageGroup)}
                  </td>

                  {/* Weight Class */}
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                    {toLabel(sp.weightClass)}
                  </td>

                  {/* Teams */}
                  <td className="px-4 py-3 text-center text-gray-300 hidden sm:table-cell">
                    <span className="font-mono text-sm">
                      {sp.registeredTeamsCount ?? 0}
                      {sp.maxTeams ? `/${sp.maxTeams}` : ""}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <SportStatusBadge status={sp.status} />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        navigate(`/admin/event/${sp.eventId}/sports/${sp.id}`)
                      }
                      className="rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition"
                    >
                      View →
                    </button>
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
