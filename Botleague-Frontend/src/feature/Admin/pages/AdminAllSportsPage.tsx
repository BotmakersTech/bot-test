import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllEvents, type AdminEventResponse, type AdminEventSportResponse } from "../api/admin.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import "../../../styles/organizerTheme.css"

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
      ? "bg-green-50 text-green-600 border-green-200"
      : s === "REGISTRATION_CLOSED"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : s === "COMPLETED"
      ? "bg-blue-50 text-blue-600 border-blue-200"
      : s === "CANCELLED"
      ? "bg-red-50 text-red-600 border-red-200"
      : "bg-gray-50 text-gray-500 border-gray-200"
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
    <div className="org-page-bg p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-[38px] font-medium text-[#0162d1] tracking-wide">All Sports</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${filtered.length} sport${filtered.length !== 1 ? "s" : ""} across ${events.length} event${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div
          className="flex flex-1 min-w-60 overflow-hidden rounded-xl border shadow-sm"
          style={{ borderColor: "rgba(75,134,232,0.3)" }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setActiveSearch(search)}
            placeholder="Search by sport name, event, age group…"
            className="flex-1 min-w-0 px-4 py-2 text-sm text-[#374151] placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => setActiveSearch(search)}
            className="px-5 text-sm font-semibold text-white transition"
            style={{ background: ORG.gradientCta }}
          >
            Search
          </button>
        </div>

        {/* Event filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] outline-none"
          style={{ borderColor: "rgba(75,134,232,0.3)" }}
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600 text-sm text-center">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading sports…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">No sports found</div>
      ) : (
        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: ORG.gradientPill }}>
                <th className="px-4 py-3.5 text-left font-semibold text-white">Sport</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white">Event</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white hidden md:table-cell">Age Group</th>
                <th className="px-4 py-3.5 text-left font-semibold text-white hidden lg:table-cell">Weight Class</th>
                <th className="px-4 py-3.5 text-center font-semibold text-white hidden sm:table-cell">Teams</th>
                <th className="px-4 py-3.5 text-center font-semibold text-white">Status</th>
                <th className="px-4 py-3.5 text-right font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.map((sp) => (
                <tr
                  key={`${sp.eventId}-${sp.id}`}
                  className="border-t transition-colors hover:bg-[#f8f9ff]"
                  style={{ borderColor: "rgba(75,134,232,0.14)" }}
                >
                  {/* Sport */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#374151]">{toLabel(sp.sport)}</p>
                    {sp.formatType && (
                      <p className="text-xs text-gray-400 mt-0.5">{toLabel(sp.formatType)}</p>
                    )}
                  </td>

                  {/* Event */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#374151] font-medium">{sp.eventName}</p>
                    {sp.eventStatus && (
                      <p className="text-xs text-gray-400 mt-0.5">{toLabel(sp.eventStatus)}</p>
                    )}
                  </td>

                  {/* Age Group */}
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {toLabel(sp.ageGroup)}
                  </td>

                  {/* Weight Class */}
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {toLabel(sp.weightClass)}
                  </td>

                  {/* Teams */}
                  <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
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
                      className="rounded-lg bg-[#f8f9ff] hover:bg-[#eef2ff] border px-3 py-1.5 text-xs font-medium text-[#374151] transition"
                      style={{ borderColor: "rgba(75,134,232,0.25)" }}
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
