import { useEffect, useState, useCallback } from "react"
import { getMySports, getMatchesForSport, type OrganizerSport, type OrganizerMatch } from "../../Organizer/api/organizer.api"
import { updateMatchScore, startMatch, completeMatch } from "../../Admin/api/adminMatches.api"

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

export default function SubOrganizerScoresPage() {
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedSportId, setSelectedSportId] = useState<string>("")
  const [matches, setMatches] = useState<OrganizerMatch[]>([])
  const [loadingSports, setLoadingSports] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)

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

  const loadMatches = useCallback(async (sportId: string) => {
    setLoadingMatches(true)
    setError(null)
    try {
      const data = await getMatchesForSport(sportId)
      setMatches(data)
      const initial: Record<string, { a: string; b: string }> = {}
      data.forEach((m) => {
        initial[m.matchId] = {
          a: m.teamAScore != null ? String(m.teamAScore) : "",
          b: m.teamBScore != null ? String(m.teamBScore) : "",
        }
      })
      setScores(initial)
    } catch {
      setError("Failed to load matches")
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSportId) loadMatches(selectedSportId)
  }, [selectedSportId, loadMatches])

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleScoreUpdate = async (matchId: string) => {
    const s = scores[matchId]
    if (!s) return
    setSaving(matchId)
    setError(null)
    try {
      await updateMatchScore(matchId, {
        teamAScore: s.a !== "" ? parseInt(s.a) : undefined,
        teamBScore: s.b !== "" ? parseInt(s.b) : undefined,
      })
      flash("Score updated.")
      await loadMatches(selectedSportId)
    } catch {
      setError("Failed to update score.")
    } finally {
      setSaving(null)
    }
  }

  const handleStart = async (matchId: string) => {
    setSaving(matchId)
    try {
      await startMatch(matchId)
      flash("Match started.")
      await loadMatches(selectedSportId)
    } catch {
      setError("Failed to start match.")
    } finally {
      setSaving(null)
    }
  }

  const handleComplete = async (matchId: string) => {
    setSaving(matchId)
    try {
      await completeMatch(matchId)
      flash("Match completed.")
      await loadMatches(selectedSportId)
    } catch {
      setError("Failed to complete match — scores may be tied.")
    } finally {
      setSaving(null)
    }
  }

  const live      = matches.filter((m) => m.status === "LIVE")
  const scheduled = matches.filter((m) => m.status === "SCHEDULED")
  const done      = matches.filter((m) => m.status === "COMPLETED")

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Score Management</h1>
        <p className="text-gray-400 text-sm mt-1">Update live scores and finalize match results</p>
      </div>

      {success && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
      )}

      {loadingSports ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : sports.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-gray-500">
          No sports are assigned to you yet.
        </div>
      ) : (
        <>
          <div className="mb-5">
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
              <p className="text-2xl font-bold text-gray-300">{done.length}</p>
            </div>
          </div>

          {loadingMatches ? (
            <div className="flex items-center justify-center py-16 text-gray-400">Loading matches…</div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-500">No matches created yet</div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const sc = scores[m.matchId] ?? { a: "", b: "" }
                const isLive = m.status === "LIVE"
                const isScheduled = m.status === "SCHEDULED"
                const isSaving = saving === m.matchId
                return (
                  <div key={m.matchId} className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 font-mono">
                            {m.matchNumber != null ? `#${m.matchNumber}` : ""}
                            {m.roundNumber != null ? ` R${m.roundNumber}` : ""}
                          </span>
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="font-semibold text-white mt-1">
                          {m.teamARobotName ?? m.teamAName ?? "TBD"} vs {m.teamBRobotName ?? m.teamBName ?? "TBD"}
                        </p>
                        {m.scheduledAt && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(m.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Current score display */}
                      {(m.teamAScore != null || m.teamBScore != null) && (
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">Score</p>
                          <p className="font-mono font-bold text-xl text-white">
                            {m.teamAScore ?? 0} – {m.teamBScore ?? 0}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Score inputs for live/scheduled matches */}
                    {(isLive || isScheduled) && (
                      <div className="border-t border-white/5 pt-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-20 truncate">{m.teamAName ?? "Team A"}</span>
                            <input
                              type="number"
                              min={0}
                              value={sc.a}
                              onChange={(e) => setScores((prev) => ({ ...prev, [m.matchId]: { ...sc, a: e.target.value } }))}
                              className="w-16 rounded-lg bg-white/5 border border-white/15 px-3 py-1.5 text-sm text-center text-white focus:outline-none focus:border-orange-500/50"
                            />
                          </div>
                          <span className="text-gray-600">–</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={sc.b}
                              onChange={(e) => setScores((prev) => ({ ...prev, [m.matchId]: { ...sc, b: e.target.value } }))}
                              className="w-16 rounded-lg bg-white/5 border border-white/15 px-3 py-1.5 text-sm text-center text-white focus:outline-none focus:border-orange-500/50"
                            />
                            <span className="text-xs text-gray-400 w-20 truncate">{m.teamBName ?? "Team B"}</span>
                          </div>
                          <button
                            onClick={() => handleScoreUpdate(m.matchId)}
                            disabled={isSaving}
                            className="rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition"
                          >
                            {isSaving ? "Saving…" : "Update Score"}
                          </button>
                          {isScheduled && (
                            <button
                              onClick={() => handleStart(m.matchId)}
                              disabled={isSaving}
                              className="rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition"
                            >
                              Start Match
                            </button>
                          )}
                          {isLive && (
                            <button
                              onClick={() => handleComplete(m.matchId)}
                              disabled={isSaving}
                              className="rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition"
                            >
                              Finalize
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
