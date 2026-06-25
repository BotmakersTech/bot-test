import { useEffect, useState } from "react"
import { getMySports, getMatchesForSport, type OrganizerSport, type OrganizerMatch } from "../../Organizer/api/organizer.api"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    LIVE:      "bg-green-500/15 text-green-400 border-green-500/30",
    COMPLETED: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${map[status] ?? "bg-white/10 text-gray-400 border-white/10"}`}>
      {toLabel(status)}
    </span>
  )
}

export default function SubOrganizerMatchesPage() {
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedSportId, setSelectedSportId] = useState<string>("")
  const [matches, setMatches] = useState<OrganizerMatch[]>([])
  const [loadingSports, setLoadingSports] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
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
    if (!selectedSportId) { setMatches([]); return }
    setLoadingMatches(true)
    setError(null)
    getMatchesForSport(selectedSportId)
      .then(setMatches)
      .catch(() => setError("Failed to load matches"))
      .finally(() => setLoadingMatches(false))
  }, [selectedSportId])

  const live      = matches.filter((m) => m.status === "LIVE")
  const scheduled = matches.filter((m) => m.status === "SCHEDULED")
  const completed = matches.filter((m) => m.status === "COMPLETED")

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Matches</h1>
        <p className="text-gray-400 text-sm mt-1">Match schedule for your assigned sports</p>
      </div>

      {loadingSports ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : sports.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-gray-500">
          No sports are assigned to you yet.
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-5">
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
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
              <p className="text-xs text-gray-500">Live</p>
              <p className="text-2xl font-bold text-green-400">{live.length}</p>
            </div>
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
              <p className="text-xs text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-blue-400">{scheduled.length}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-300">{completed.length}</p>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
          ) : loadingMatches ? (
            <div className="flex items-center justify-center py-16 text-gray-400">Loading matches…</div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-500">No matches created yet for this sport</div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matches.map((m) => (
                    <tr key={m.matchId} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{m.matchNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{m.teamARobotName ?? m.teamAName ?? "TBD"}</p>
                        <p className="text-sm text-gray-400">vs {m.teamBRobotName ?? m.teamBName ?? "TBD"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">
                        {m.roundNumber != null ? `Round ${m.roundNumber}` : "—"}
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
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
