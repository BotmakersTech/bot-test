import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import api from "../../../shared/api/Base"
import { useMultiSportMatchRealtime } from "../../../shared/realtime/useMatchRealtime"
import { getTeams, slotCount, type BracketMatchType } from "../../Matches/bracketLayout"

// =====================================================
// A judge is handed whatever the bracket generator produced. Since
// TRIPLE_THREAT / FATAL_FOUR brackets are partitioned, ONE bracket now
// contains matches of DIFFERENT match types — a judge on a Fatal Four event
// can be assigned a 4-way, a 3-way and a 1v1 in the same evening. So this page
// reads matchType off each match and sizes itself to that match, instead of
// assuming two slots the way it used to.
// =====================================================

interface LiveMatch {
  matchId: string
  eventSportId: string
  matchType?: BracketMatchType
  roundNumber?: number
  matchNumber?: number
  status: string

  teamARobotName?: string
  teamAName?: string
  teamARegistrationId?: string
  teamBRobotName?: string
  teamBName?: string
  teamBRegistrationId?: string
  teamCRobotName?: string
  teamCName?: string
  teamCRegistrationId?: string
  teamDRobotName?: string
  teamDName?: string
  teamDRegistrationId?: string

  teamAScore?: number
  teamBScore?: number
  teamCScore?: number
  teamDScore?: number

  positionFirstRegistrationId?: string
  positionSecondRegistrationId?: string
  positionThirdRegistrationId?: string
  positionFourthRegistrationId?: string

  winnerRegistrationId?: string
}

/** All competitors of a match, in slot order, as one line. */
function describeMatch(m: LiveMatch): string {
  return getTeams(m)
    .map((t, i) => t.name || `Team ${String.fromCharCode(65 + i)}`)
    .join(" vs ")
}

export default function JudgeScoresPage() {
  const [searchParams] = useSearchParams()
  const preselect = searchParams.get("matchId") ?? ""

  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [selectedId, setSelectedId]   = useState(preselect)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [scoreC, setScoreC] = useState(0)
  const [scoreD, setScoreD] = useState(0)
  const [pos1, setPos1] = useState("")
  const [pos2, setPos2] = useState("")
  const [pos3, setPos3] = useState("")
  const [pos4, setPos4] = useState("")
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

  // How many competitors THIS match holds — 2, 3 or 4, from its own matchType.
  const slots      = selected ? slotCount(selected.matchType) : 2
  const isMulti    = slots > 2
  const isFatalFour = slots > 3

  useEffect(() => {
    if (!selected) return
    setScoreA(selected.teamAScore ?? 0)
    setScoreB(selected.teamBScore ?? 0)
    setScoreC(selected.teamCScore ?? 0)
    setScoreD(selected.teamDScore ?? 0)
    setPos1(selected.positionFirstRegistrationId ?? "")
    setPos2(selected.positionSecondRegistrationId ?? "")
    setPos3(selected.positionThirdRegistrationId ?? "")
    setPos4(selected.positionFourthRegistrationId ?? "")
    setError(null)
  }, [selected?.matchId])

  // Live-sync the match picker: if someone else's action moves a match out
  // of LIVE (completed or cancelled elsewhere), drop it from the list
  // instead of leaving a stale entry a judge could still try to score.
  // Deliberately does NOT touch the score inputs — never clobber an in-progress edit.
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

  // ── Score counters, sized to this match ──
  const counters = selected
    ? [
        { key: "A", label: selected.teamARobotName || selected.teamAName || "Team A", val: scoreA, set: setScoreA },
        { key: "B", label: selected.teamBRobotName || selected.teamBName || "Team B", val: scoreB, set: setScoreB },
        ...(isMulti     ? [{ key: "C", label: selected.teamCRobotName || selected.teamCName || "Team C", val: scoreC, set: setScoreC }] : []),
        ...(isFatalFour ? [{ key: "D", label: selected.teamDRobotName || selected.teamDName || "Team D", val: scoreD, set: setScoreD }] : []),
      ]
    : []

  // ── Finish-position pickers (multi-way only) ──
  const positionPickers = [
    { key: "1st", label: "1st Place", val: pos1, set: setPos1 },
    { key: "2nd", label: "2nd Place", val: pos2, set: setPos2 },
    { key: "3rd", label: "3rd Place", val: pos3, set: setPos3 },
    ...(isFatalFour ? [{ key: "4th", label: "4th Place", val: pos4, set: setPos4 }] : []),
  ]

  const chosenPositions = positionPickers.map(p => p.val)
  const positionsComplete =
    chosenPositions.every(Boolean) &&
    new Set(chosenPositions).size === chosenPositions.length

  const handleSaveScore = async () => {
    if (!selectedId || !selected) return
    setSaving(true); setError(null); setSaved(false)
    try {
      // Only send the slots this match actually has — a 1v1 must not carry a
      // teamCScore, and a Fatal Four must not silently drop teamD's.
      const payload: Record<string, number> = { teamAScore: scoreA, teamBScore: scoreB }
      if (isMulti)     payload.teamCScore = scoreC
      if (isFatalFour) payload.teamDScore = scoreD
      await api.patch(`/v1/matches/${selectedId}/score`, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save score")
    } finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!selectedId || !selected) return

    // A multi-way match cannot be decided from "highest score wins" — the
    // backend needs the finish order, exactly as the organiser bracket sends it.
    if (isMulti && !positionsComplete) {
      setError(`Pick a different team for each of the ${slots} finish positions before submitting.`)
      return
    }

    if (!confirm("Submit this as the final result? This completes the match and advances the winner — it can't be undone here.")) return

    setSaving(true); setError(null)
    try {
      if (isMulti) {
        // Mirrors OrganizerBracketPage's multi-team submission: scores plus
        // explicit finish positions, PATCHed to /result.
        const payload: Record<string, unknown> = {
          teamAScore: scoreA,
          teamBScore: scoreB,
          teamCScore: scoreC,
          positionFirstRegistrationId:  pos1 || undefined,
          positionSecondRegistrationId: pos2 || undefined,
          positionThirdRegistrationId:  pos3 || undefined,
          winMethod: "SCORE",
        }
        if (isFatalFour) {
          payload.teamDScore = scoreD
          payload.positionFourthRegistrationId = pos4 || undefined
        }
        await api.patch(`/v1/matches/${selectedId}/result`, payload)
      } else {
        await api.patch(`/v1/matches/${selectedId}/complete`)
      }
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
                  R{m.roundNumber} · M{m.matchNumber} — {describeMatch(m)}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-600">LIVE</span>
                <span className="text-xs font-semibold text-[#0162d1] ml-2">
                  {slots === 4 ? "Fatal Four" : slots === 3 ? "Triple Threat" : "1v1"}
                </span>
                <span className="text-xs text-[#9a9a9a] ml-auto">R{selected.roundNumber} · M{selected.matchNumber}</span>
              </div>

              {/* Score counters — one per slot this match actually has */}
              {counters.map(({ key, label, val, set }) => (
                <div key={key} className="space-y-1">
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

              {/* Finish positions — a 3- or 4-way match has no "the winner is
                  whoever scored more", so the judge states the finish order. */}
              {isMulti && (
                <div className="rounded-xl border border-[#8c6cff]/25 bg-[#8c6cff]/5 p-4 space-y-3">
                  <div className="text-xs font-semibold text-[#8c6cff]">Finish Positions</div>
                  {positionPickers.map(({ key, label, val, set }) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs text-[#6b7280] font-medium">{label}</div>
                      <select value={val} onChange={e => set(e.target.value)}
                        className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
                        <option value="">— Select —</option>
                        {getTeams(selected).map(t => (
                          <option key={t.id ?? t.slot} value={t.id ?? ""}>
                            {t.name || `Team ${String.fromCharCode(64 + t.slot)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-red-600 text-xs">{error}</p>}
              {saved  && <p className="text-green-600 text-xs">Score saved!</p>}

              <div className="flex gap-3">
                <button onClick={handleSaveScore} disabled={saving}
                  className="flex-1 rounded-xl bg-blue-500/10 border border-blue-500/30 py-2.5 text-sm font-semibold text-blue-600 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Score"}
                </button>
                <button onClick={handleComplete} disabled={saving || (isMulti && !positionsComplete)}
                  className="flex-1 rounded-xl bg-green-500/10 border border-green-500/30 py-2.5 text-sm font-semibold text-green-600 disabled:opacity-50">
                  Submit Final Result
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
