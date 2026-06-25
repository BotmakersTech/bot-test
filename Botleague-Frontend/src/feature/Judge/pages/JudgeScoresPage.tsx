import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import api from "../../../shared/api/Base"

interface LiveMatch {
  matchId: string
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

  useEffect(() => {
    api.get("/v1/matches/my")
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
    if (!selectedId || !confirm("Mark match as complete and advance winner?")) return
    setSaving(true); setError(null)
    try {
      await api.patch(`/v1/matches/${selectedId}/complete`)
      setLiveMatches(p => p.filter(m => m.matchId !== selectedId))
      setSelectedId(liveMatches.find(m => m.matchId !== selectedId)?.matchId ?? "")
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to complete match")
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-full p-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-white">Score Entry</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Submit scores for live matches you are judging</p>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : liveMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No live matches to score right now.</p>
        </div>
      ) : (
        <>
          {/* Match selector */}
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Select Live Match</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
              {liveMatches.map(m => (
                <option key={m.matchId} value={m.matchId}>
                  R{m.roundNumber} · M{m.matchNumber} — {m.teamARobotName || m.teamAName || "TBD"} vs {m.teamBRobotName || m.teamBName || "TBD"}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-green-400">LIVE</span>
                <span className="text-xs text-neutral-500 ml-auto">R{selected.roundNumber} · M{selected.matchNumber}</span>
              </div>

              {/* Score counters */}
              {[
                { label: selected.teamARobotName || selected.teamAName || "Team A", val: scoreA, set: setScoreA },
                { label: selected.teamBRobotName || selected.teamBName || "Team B", val: scoreB, set: setScoreB },
              ].map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <div className="text-xs text-neutral-400 font-medium">{label}</div>
                  <div className="flex items-center rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/[0.06]">
                    <button onClick={() => set(v => Math.max(0, v - 1))}
                      className="w-10 h-10 text-lg font-bold text-white hover:bg-white/10 transition-colors">−</button>
                    <span className="flex-1 text-center text-xl font-bold text-white">{val}</span>
                    <button onClick={() => set(v => v + 1)}
                      className="w-10 h-10 text-lg font-bold text-white hover:bg-white/10 transition-colors">+</button>
                  </div>
                </div>
              ))}

              {error && <p className="text-red-400 text-xs">{error}</p>}
              {saved  && <p className="text-green-400 text-xs">Score saved!</p>}

              <div className="flex gap-3">
                <button onClick={handleSaveScore} disabled={saving}
                  className="flex-1 rounded-xl bg-blue-500/15 border border-blue-500/30 py-2.5 text-sm font-semibold text-blue-400 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Score"}
                </button>
                <button onClick={handleComplete} disabled={saving}
                  className="flex-1 rounded-xl bg-green-500/15 border border-green-500/30 py-2.5 text-sm font-semibold text-green-400 disabled:opacity-50">
                  Complete & Advance
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
