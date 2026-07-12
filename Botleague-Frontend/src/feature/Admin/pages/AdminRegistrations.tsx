import { useEffect, useState } from "react"
import { getAllEvents, type AdminEventResponse, type AdminEventSportResponse } from "../api/admin.api"
import { getRegistrationsForSport, type EventSportRegistration } from "../../Organizer/api/organizer.api"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AdminRegistrations() {
  const [events, setEvents] = useState<AdminEventResponse[]>([])
  const [sports, setSports] = useState<AdminEventSportResponse[]>([])
  const [registrations, setRegistrations] = useState<EventSportRegistration[]>([])

  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedSportId, setSelectedSportId] = useState<string>("")
  const [search, setSearch] = useState("")

  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoadingEvents(true)
    getAllEvents()
      .then((evts) => {
        setEvents(evts)
        if (evts.length > 0) {
          const first = evts[0]
          setSelectedEventId(first.id)
          setSports(first.sports ?? [])
          if ((first.sports ?? []).length > 0) {
            setSelectedSportId(first.sports![0].id)
          }
        }
      })
      .catch(() => setError("Failed to load events"))
      .finally(() => setLoadingEvents(false))
  }, [])

  useEffect(() => {
    if (!selectedSportId) { setRegistrations([]); return }
    setLoadingRegs(true)
    setError(null)
    getRegistrationsForSport(selectedSportId)
      .then(setRegistrations)
      .catch(() => setError("Failed to load registrations"))
      .finally(() => setLoadingRegs(false))
  }, [selectedSportId])

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId)
    const ev = events.find((e) => e.id === eventId)
    const evSports = ev?.sports ?? []
    setSports(evSports)
    setSelectedSportId(evSports[0]?.id ?? "")
    setRegistrations([])
  }

  const filtered = registrations.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.teamName ?? "").toLowerCase().includes(q)
  })

  const selectedSport = sports.find((s) => s.id === selectedSportId)

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Registrations</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loadingRegs ? "Loading…" : `${filtered.length} team${filtered.length !== 1 ? "s" : ""} registered`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-xs text-gray-500">Total Teams</p>
          <p className="text-2xl font-bold mt-0.5 text-orange-400">{registrations.length}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-xs text-gray-500">Sport</p>
          <p className="text-sm font-semibold mt-0.5 text-white truncate">
            {selectedSport ? toLabel(selectedSport.sport) : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-xs text-gray-500">Age Group</p>
          <p className="text-sm font-semibold mt-0.5 text-white">
            {selectedSport?.ageGroup ? toLabel(selectedSport.ageGroup) : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-xs text-gray-500">Capacity</p>
          <p className="text-sm font-semibold mt-0.5 text-white">
            {selectedSport?.maxTeams
              ? `${registrations.length} / ${selectedSport.maxTeams}`
              : String(registrations.length)}
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 mb-5">
        {loadingEvents ? (
          <p className="text-sm text-gray-500">Loading events…</p>
        ) : (
          <>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.eventName}</option>
              ))}
            </select>

            <select
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              disabled={sports.length === 0}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 disabled:opacity-40"
            >
              {sports.length === 0 ? (
                <option value="">No sports</option>
              ) : (
                sports.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {toLabel(sp.sport)}{sp.ageGroup ? ` · ${toLabel(sp.ageGroup)}` : ""}
                  </option>
                ))
              )}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team name…"
              className="flex-1 min-w-48 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </>
        )}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loadingRegs ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading registrations…</div>
      ) : !selectedSportId ? (
        <div className="flex items-center justify-center py-20 text-gray-500">Select an event and sport to view registrations</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">No teams registered yet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg, idx) => (
            <div
              key={reg.registrationId}
              className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start gap-4 hover:bg-white/8 transition-colors"
            >
              <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white font-bold shrink-0">
                {(reg.teamName ?? "?").charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{reg.teamName}</p>
                {reg.robotName && (
                  <p className="text-xs text-gray-400 mt-1">{reg.robotName}</p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-semibold text-white">{toLabel(reg.status)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
