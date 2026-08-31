import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import api from "../../../shared/api/Base"
import { useMultiSportMatchRealtime } from "../../../shared/realtime/useMatchRealtime"

interface LiveMatch {
  matchId: string
  eventSportId: string
  roundNumber?: number
  matchNumber?: number
  status: string
  teamARobotName?: string
  teamAName?: string
  teamARegistrationId?: string
  teamBRobotName?: string
  teamBName?: string
  teamBRegistrationId?: string
  teamAScore?: number
  teamBScore?: number
  winnerRegistrationId?: string
}

export default function JudgeScoresPage() {
  const [searchParams] = useSearchParams()
  const preselect = searchParams.get("matchId") ?? ""

  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [selectedId, setSelectedId]   = useState(preselect)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittedInfo, setSubmittedInfo] = useState<string | null>(null)

  useEffect(() => {
    api.get("/v1/matches/my-judge-matches")
      .then(r => {
        const live = (r.data ?? []).filter((m: LiveMatch) => m.status === "LIVE")
        setLiveMatches(live)
        if (!preselect && live.length > 0) setSelectedId(live[0].matchId)
      })
      .catch(() => setLiveMatches([]))
      .finally(() => setLoading(false))
  }, [preselect])

  const selected = liveMatches.find(m => m.matchId === selectedId)

  useEffect(() => {
    if (!selected) return
    setScoreA(selected.teamAScore ?? 0)
    setScoreB(selected.teamBScore ?? 0)
  }, [selected?.matchId])

  // Live-sync the match picker: if someone else's action moves a match out
  // of LIVE (completed or cancelled elsewhere), drop it from the list
  // instead of leaving a stale entry a judge could still try to score.
  // Deliberately does NOT touch scoreA/scoreB — never clobber an in-progress edit.
  const liveSportIds = useMemo(
    () => liveMatches.map(m => m.eventSportId).filter(Boolean),
    [liveMatches]
  )
  useMultiSportMatchRealtime(liveSportIds, (type, payload) => {
    if (type === 'RANKINGS_UPDATED' || type === 'BRACKET_CREATED') return
    const updated = payload as Partial<LiveMatch> & { matchId: string; status?: string }
    setLiveMatches(prev => {
      if (!prev.some(m => m.matchId === updated.matchId)) return prev
      if (updated.status && updated.status !== "LIVE") {
        return prev.filter(m => m.matchId !== updated.matchId)
      }
      return prev.map(m => (m.matchId === updated.matchId ? { ...m, ...updated } : m))
    })
  })

  // If the selected match just got removed from the list above (someone
  // else took it out of LIVE), fall back to whichever match is now first.
  useEffect(() => {
    if (selectedId && !liveMatches.some(m => m.matchId === selectedId)) {
      setSelectedId(liveMatches[0]?.matchId ?? "")
    }
  }, [liveMatches, selectedId])

  const handleSaveScore = async () => {
    if (!selectedId) return
    setSaving(true); setError(null); setSaved(false)
    try {
      await api.patch(`/v1/matches/${selectedId}/score`, { teamAScore: scoreA, teamBScore: scoreB })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save score")
    } finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!selectedId || !confirm("Submit this as the final score? This completes the match and advances the winner — it can't be undone here.")) return
    setSaving(true); setError(null)
    try {
      await api.patch(`/v1/matches/${selectedId}/complete`)
      setLiveMatches(p => p.filter(m => m.matchId !== selectedId))
      setSelectedId(liveMatches.find(m => m.matchId !== selectedId)?.matchId ?? "")
      setSubmittedInfo("Result submitted — match completed and the winner has advanced.")
      setTimeout(() => setSubmittedInfo(null), 5000)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to complete match")
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-full p-8 space-y-6">
      <div>
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1]">Score Entry</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">Submit scores for live matches you are judging</p>
      </div>

      {submittedInfo && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm font-medium text-amber-700">
          {submittedInfo}
        </div>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-[#4b86e8]/8" />
      ) : liveMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#6b7280] text-sm">No live matches to score right now.</p>
        </div>
      ) : (
        <>
          {/* Match selector */}
          <div>
            <label className="text-xs text-[#6b7280] mb-1 block">Select Live Match</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
              {liveMatches.map(m => (
                <option key={m.matchId} value={m.matchId}>
                  R{m.roundNumber} · M{m.matchNumber} — {m.teamARobotName || m.teamAName || "TBD"} vs {m.teamBRobotName || m.teamBName || "TBD"}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-600">LIVE</span>
                <span className="text-xs text-[#9a9a9a] ml-auto">R{selected.roundNumber} · M{selected.matchNumber}</span>
              </div>

              {/* Score counters */}
              {[
                { label: selected.teamARobotName || selected.teamAName || "Team A", val: scoreA, set: setScoreA },
                { label: selected.teamBRobotName || selected.teamBName || "Team B", val: scoreB, set: setScoreB },
              ].map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <div className="text-xs text-[#6b7280] font-medium">{label}</div>
                  <div className="flex items-center rounded-lg overflow-hidden ring-1 ring-[#4b86e8]/30 bg-white">
                    <button onClick={() => set(v => Math.max(0, v - 1))}
                      className="w-10 h-10 text-lg font-bold text-[#111] hover:bg-[#4b86e8]/10 transition-colors">−</button>
                    <span className="flex-1 text-center text-xl font-bold text-[#111]">{val}</span>
                    <button onClick={() => set(v => v + 1)}
                      className="w-10 h-10 text-lg font-bold text-[#111] hover:bg-[#4b86e8]/10 transition-colors">+</button>
                  </div>
                </div>
              ))}

              {error && <p className="text-red-600 text-xs">{error}</p>}
              {saved  && <p className="text-green-600 text-xs">Score saved!</p>}

              <div className="flex gap-3">
                <button onClick={handleSaveScore} disabled={saving}
                  className="flex-1 rounded-xl bg-blue-500/10 border border-blue-500/30 py-2.5 text-sm font-semibold text-blue-600 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Score"}
                </button>
                <button onClick={handleComplete} disabled={saving}
                  className="flex-1 rounded-xl bg-green-500/10 border border-green-500/30 py-2.5 text-sm font-semibold text-green-600 disabled:opacity-50">
                  Submit Final Score
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
