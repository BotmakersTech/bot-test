import { useEffect, useState } from "react"
import { getAllEvents, type AdminEventResponse, type AdminEventSportResponse } from "../api/admin.api"
import { getRegistrationsForSport, type EventSportRegistration } from "../../Organizer/api/organizer.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import "../../../styles/organizerTheme.css"

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
    <div className="org-page-bg p-8">
      <div className="mb-6">
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-bold text-[#0162d1] tracking-wide">Registrations</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loadingRegs ? "Loading…" : `${filtered.length} team${filtered.length !== 1 ? "s" : ""} registered`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white border px-4 py-3" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          <p className="text-xs text-gray-400">Total Teams</p>
          <p className="text-2xl font-bold mt-0.5 text-orange-600">{registrations.length}</p>
        </div>
        <div className="rounded-xl bg-white border px-4 py-3" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          <p className="text-xs text-gray-400">Sport</p>
          <p className="text-sm font-semibold mt-0.5 text-[#374151] truncate">
            {selectedSport ? toLabel(selectedSport.sport) : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white border px-4 py-3" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          <p className="text-xs text-gray-400">Age Group</p>
          <p className="text-sm font-semibold mt-0.5 text-[#374151]">
            {selectedSport?.ageGroup ? toLabel(selectedSport.ageGroup) : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-white border px-4 py-3" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          <p className="text-xs text-gray-400">Capacity</p>
          <p className="text-sm font-semibold mt-0.5 text-[#374151]">
            {selectedSport?.maxTeams
              ? `${registrations.length} / ${selectedSport.maxTeams}`
              : String(registrations.length)}
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 mb-5">
        {loadingEvents ? (
          <p className="text-sm text-gray-400">Loading events…</p>
        ) : (
          <>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] outline-none"
              style={{ borderColor: "rgba(75,134,232,0.3)" }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.eventName}</option>
              ))}
            </select>

            <select
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              disabled={sports.length === 0}
              className="rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] outline-none disabled:opacity-40"
              style={{ borderColor: "rgba(75,134,232,0.3)" }}
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
              className="flex-1 min-w-48 rounded-xl bg-white border px-4 py-2 text-sm text-[#374151] placeholder-gray-400 outline-none"
              style={{ borderColor: "rgba(75,134,232,0.3)" }}
            />
          </>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600 text-sm text-center">{error}</div>
      ) : loadingRegs ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading registrations…</div>
      ) : !selectedSportId ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Select an event and sport to view registrations</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">No teams registered yet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reg, idx) => (
            <div
              key={reg.registrationId}
              className="rounded-xl bg-white border p-4 flex items-start gap-4 hover:bg-[#f8f9ff] transition-colors"
              style={{ borderColor: "rgba(75,134,232,0.2)" }}
            >
              <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </div>

              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold shrink-0"
                style={{ background: ORG.gradientCta }}
              >
                {(reg.teamName ?? "?").charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#374151]">{reg.teamName}</p>
                {reg.robotName && (
                  <p className="text-xs text-gray-400 mt-1">{reg.robotName}</p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm font-semibold text-[#374151]">{toLabel(reg.status)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
