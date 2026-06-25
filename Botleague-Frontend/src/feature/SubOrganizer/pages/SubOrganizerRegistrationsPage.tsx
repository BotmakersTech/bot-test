import { useEffect, useState } from "react"
import { getMySports, getRegistrationsForSport, type OrganizerSport, type OrganizerTeamRegistration } from "../../Organizer/api/organizer.api"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function SubOrganizerRegistrationsPage() {
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedSportId, setSelectedSportId] = useState<string>("")
  const [registrations, setRegistrations] = useState<OrganizerTeamRegistration[]>([])
  const [search, setSearch] = useState("")
  const [loadingSports, setLoadingSports] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoadingSports(true)
    getMySports()
      .then((data) => {
        setSports(data)
        if (data.length > 0) setSelectedSportId(data[0].id)
      })
      .catch(() => setError("Failed to load your sports"))
      .finally(() => setLoadingSports(false))
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

  const selectedSport = sports.find((s) => s.id === selectedSportId)
  const filtered = registrations.filter((r) =>
    !search || (r.teamName ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Registrations</h1>
        <p className="text-gray-400 text-sm mt-1">
          Teams registered for your assigned sports
        </p>
      </div>

      {loadingSports ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : sports.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-gray-500">
          No sports are assigned to you yet.
        </div>
      ) : (
        <>
          {/* Sport selector */}
          <div className="flex flex-wrap gap-3 mb-5">
            <select
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
            >
              {sports.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {toLabel(sp.sport)}{sp.ageGroup ? ` · ${toLabel(sp.ageGroup)}` : ""}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams…"
              className="flex-1 min-w-48 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs text-gray-500">Teams</p>
              <p className="text-2xl font-bold text-orange-400">{registrations.length}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs text-gray-500">Capacity</p>
              <p className="text-sm font-semibold text-white mt-1">
                {selectedSport?.maxTeams ? `${registrations.length}/${selectedSport.maxTeams}` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-semibold text-white mt-1">
                {toLabel(selectedSport?.status)}
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
          ) : loadingRegs ? (
            <div className="flex items-center justify-center py-16 text-gray-400">Loading registrations…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              {search ? "No teams match your search" : "No teams registered yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((reg, idx) => (
                <div key={reg.id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  {reg.teamLogoUrl ? (
                    <img src={reg.teamLogoUrl} alt={reg.teamName} className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center shrink-0">
                      {(reg.teamName ?? "?").charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{reg.teamName}</p>
                    {reg.lineup && reg.lineup.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {reg.lineup.map((m) => m.fullName).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">Members</p>
                    <p className="text-sm font-semibold text-white">{reg.lineup?.length ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
