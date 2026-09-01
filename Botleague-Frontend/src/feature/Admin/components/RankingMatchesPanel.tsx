import { useEffect, useMemo, useState } from "react"
import { Edit3, Flag, Lock, X, AlertTriangle, Trophy } from "lucide-react"
import { useMatches } from "../hooks/useMatches"
import type { MatchDTO, MatchResultType, SubmitMatchResultDTO, UpdateMatchScoreDTO } from "../api/adminMatches.api"
import { ORG } from "../../Organizer/theme/organizerTheme"

// Edit Score / Change Result for the sport's matches, surfaced directly on
// the ranking page — an admin catching a wrong score/result while looking
// at standings shouldn't have to go find the separate bracket page to fix
// it. Uses the same admin match endpoints (updateMatchScore/submitMatchResult)
// the bracket page (Creatematch.tsx) uses; this panel only exposes the two
// actions asked for here, not the full bracket-management surface.

const BORDER = "rgba(75,134,232,0.18)"
const CARD = "#ffffff"
const CARD2 = "#f8faff"
const TEXT = ORG.text
const MUTED = ORG.muted
const DANGER = ORG.danger

const WIN_METHODS: { value: MatchResultType; label: string }[] = [
  { value: "SCORE", label: "By Score" },
  { value: "JUDGE_DECISION", label: "Judge Decision" },
  { value: "TAPOUT", label: "Tapout" },
  { value: "FORFEIT", label: "Forfeit" },
  { value: "DISQUALIFICATION", label: "Disqualification" },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  SCHEDULED:        { bg: "rgba(75,134,232,0.08)",  color: ORG.blueHeading },
  LIVE:              { bg: "rgba(224,75,75,0.1)",    color: DANGER },
  PENDING_APPROVAL:  { bg: "rgba(234,179,8,0.12)",   color: "#92660a" },
  COMPLETED:         { bg: "rgba(31,169,82,0.1)",    color: ORG.success },
  CANCELLED:         { bg: "rgba(93,93,93,0.1)",     color: MUTED },
}

function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

interface TeamSlot {
  key: "A" | "B" | "C" | "D"
  id?: string
  name: string
  robotName?: string
  score?: number
}

function teamsOf(m: MatchDTO): TeamSlot[] {
  const slots: TeamSlot[] = []
  if (m.teamARegistrationId || m.teamAName) slots.push({ key: "A", id: m.teamARegistrationId, name: m.teamAName || "TBD", robotName: m.teamARobotName, score: m.teamAScore })
  if (m.teamBRegistrationId || m.teamBName) slots.push({ key: "B", id: m.teamBRegistrationId, name: m.teamBName || "TBD", robotName: m.teamBRobotName, score: m.teamBScore })
  if (m.teamCRegistrationId || m.teamCName) slots.push({ key: "C", id: m.teamCRegistrationId, name: m.teamCName || "TBD", robotName: m.teamCRobotName, score: m.teamCScore })
  if (m.teamDRegistrationId || m.teamDName) slots.push({ key: "D", id: m.teamDRegistrationId, name: m.teamDName || "TBD", robotName: m.teamDRobotName, score: m.teamDScore })
  return slots
}

type ScoreDraft = { teamAScore: number; teamBScore: number; teamCScore: number; teamDScore: number }

function draftFromMatch(m: MatchDTO): ScoreDraft {
  return {
    teamAScore: m.teamAScore ?? 0,
    teamBScore: m.teamBScore ?? 0,
    teamCScore: m.teamCScore ?? 0,
    teamDScore: m.teamDScore ?? 0,
  }
}

interface RankingMatchesPanelProps {
  sportId: string
  onChanged: () => void
}

export default function RankingMatchesPanel({ sportId, onChanged }: RankingMatchesPanelProps) {
  const { matches, loading, error, fetchMatches, updateMatchScore, submitMatchResult, updateLoading } = useMatches(sportId)

  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [scoreDraft, setScoreDraft] = useState<ScoreDraft>({ teamAScore: 0, teamBScore: 0, teamCScore: 0, teamDScore: 0 })
  const [resultWinner, setResultWinner] = useState("")
  const [resultMethod, setResultMethod] = useState<MatchResultType>("SCORE")
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (sportId) fetchMatches(sportId).catch(() => { /* error already surfaced via hook state */ })
  }, [sportId, fetchMatches])

  const rounds = useMemo(() => {
    const byRound = new Map<number, MatchDTO[]>()
    for (const m of matches) {
      const r = m.roundNumber ?? 0
      if (!byRound.has(r)) byRound.set(r, [])
      byRound.get(r)!.push(m)
    }
    return [...byRound.entries()].sort((a, b) => a[0] - b[0])
  }, [matches])

  const closeEditors = () => {
    setEditingScoreId(null)
    setEditingResultId(null)
    setActionError(null)
  }

  const startEditScore = (m: MatchDTO) => {
    closeEditors()
    setEditingScoreId(m.matchId)
    setScoreDraft(draftFromMatch(m))
  }

  const startChangeResult = (m: MatchDTO) => {
    closeEditors()
    setEditingResultId(m.matchId)
    setScoreDraft(draftFromMatch(m))
    setResultWinner(m.winnerRegistrationId ?? "")
    setResultMethod((m.winMethod as MatchResultType) ?? "SCORE")
  }

  const isMultiTeam = (m: MatchDTO) => m.matchType === "TRIPLE_THREAT" || m.matchType === "FATAL_FOUR"

  const saveScore = async (m: MatchDTO) => {
    setActionError(null)
    try {
      const payload: UpdateMatchScoreDTO = { teamAScore: scoreDraft.teamAScore, teamBScore: scoreDraft.teamBScore }
      if (isMultiTeam(m)) payload.teamCScore = scoreDraft.teamCScore
      if (m.matchType === "FATAL_FOUR") payload.teamDScore = scoreDraft.teamDScore
      await updateMatchScore(m.matchId, payload)
      closeEditors()
      await fetchMatches(sportId)
      onChanged()
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to update score")
    }
  }

  const saveResult = async (m: MatchDTO) => {
    if (!resultWinner) { setActionError("Pick a winner first"); return }
    setActionError(null)
    try {
      const payload: SubmitMatchResultDTO = {
        teamAScore: scoreDraft.teamAScore,
        teamBScore: scoreDraft.teamBScore,
        winnerRegistrationId: resultWinner,
        winMethod: resultMethod,
      }
      if (isMultiTeam(m)) payload.teamCScore = scoreDraft.teamCScore
      if (m.matchType === "FATAL_FOUR") payload.teamDScore = scoreDraft.teamDScore
      await submitMatchResult(m.matchId, payload)
      closeEditors()
      await fetchMatches(sportId)
      onChanged()
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to change result")
    }
  }

  if (loading && matches.length === 0) {
    return <div style={{ padding: "24px", color: MUTED, fontSize: "0.85rem" }}>Loading matches…</div>
  }

  if (error && matches.length === 0) {
    return <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "24px", color: DANGER, fontSize: "0.85rem", fontWeight: 600 }}><AlertTriangle size={15} /> {error}</div>
  }

  if (matches.length === 0) {
    return (
      <div style={{ padding: "24px", color: MUTED, fontSize: "0.85rem", textAlign: "center", border: `1px dashed ${BORDER}`, borderRadius: "12px" }}>
        No matches have been created for this sport yet.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {rounds.map(([round, roundMatches]) => (
        <div key={round}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
            Round {round || 1}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px", alignItems: "start" }}>
            {roundMatches.map(m => {
              const teams = teamsOf(m)
              const st = STATUS_STYLE[m.status ?? "SCHEDULED"] ?? STATUS_STYLE.SCHEDULED
              const canAct = m.status === "LIVE" || m.status === "COMPLETED" || m.status === "PENDING_APPROVAL"
              const scoreEditing = editingScoreId === m.matchId
              const resultEditing = editingResultId === m.matchId

              return (
                <div key={m.matchId} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      background: st.bg, color: st.color, borderRadius: "999px",
                      fontSize: "0.62rem", fontWeight: 700, padding: "2px 10px", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {m.scoreLocked && <Lock size={10} />}
                      {toLabel(m.status)}
                    </span>

                    {canAct && !m.scoreLocked && !scoreEditing && !resultEditing && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => startEditScore(m)} style={actionBtnStyle}>
                          <Edit3 size={12} /> Edit Score
                        </button>
                        <button type="button" onClick={() => startChangeResult(m)} style={actionBtnStyle}>
                          <Flag size={12} /> Change Result
                        </button>
                      </div>
                    )}
                    {m.scoreLocked && (
                      <span style={{ fontSize: "0.68rem", color: MUTED }}>Score locked — unlock from the bracket page to edit</span>
                    )}
                  </div>

                  {/* Team rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {teams.map(t => (
                      <div key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: "5px", minWidth: 0,
                          fontSize: "0.85rem", fontWeight: m.winnerRegistrationId === t.id ? 700 : 500,
                          color: m.winnerRegistrationId === t.id ? ORG.success : TEXT,
                        }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.name}{t.robotName ? ` — ${t.robotName}` : ""}
                          </span>
                          {m.winnerRegistrationId === t.id && <Trophy size={12} style={{ flexShrink: 0 }} />}
                        </span>
                        {scoreEditing ? (
                          <input
                            type="number"
                            value={scoreDraft[`team${t.key}Score` as keyof ScoreDraft]}
                            onChange={e => setScoreDraft(prev => ({ ...prev, [`team${t.key}Score`]: Number(e.target.value) }))}
                            style={scoreInputStyle}
                          />
                        ) : (
                          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT, fontFamily: ORG.fontHeading, minWidth: "24px", textAlign: "right" }}>
                            {t.score ?? 0}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Edit Score form actions */}
                  {scoreEditing && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                      <button type="button" onClick={closeEditors} style={cancelBtnStyle}>Cancel</button>
                      <button type="button" onClick={() => saveScore(m)} disabled={updateLoading} style={saveBtnStyle}>
                        {updateLoading ? "Saving…" : "Save Score"}
                      </button>
                    </div>
                  )}

                  {/* Change Result form */}
                  {resultEditing && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <div style={fieldLabelStyle}>Winner</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {teams.filter(t => t.id).map(t => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setResultWinner(t.id!)}
                              style={{
                                ...pillBtnStyle,
                                borderColor: resultWinner === t.id ? ORG.violet : BORDER,
                                background: resultWinner === t.id ? "rgba(140,108,255,0.1)" : "#fff",
                                color: resultWinner === t.id ? ORG.violetHeading : TEXT,
                              }}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={fieldLabelStyle}>Win Method</div>
                        <select value={resultMethod} onChange={e => setResultMethod(e.target.value as MatchResultType)} style={selectStyle}>
                          {WIN_METHODS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button type="button" onClick={closeEditors} style={cancelBtnStyle}>Cancel</button>
                        <button type="button" onClick={() => saveResult(m)} disabled={updateLoading} style={saveBtnStyle}>
                          {updateLoading ? "Saving…" : "Save Result"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(scoreEditing || resultEditing) && actionError && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", color: DANGER, fontSize: "0.75rem", fontWeight: 600 }}>
                      <X size={13} /> {actionError}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const actionBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "5px",
  background: CARD2, border: `1px solid ${BORDER}`, color: ORG.blueHeading,
  borderRadius: "7px", padding: "5px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
}

const cancelBtnStyle: React.CSSProperties = {
  background: "transparent", border: `1px solid ${BORDER}`, color: MUTED,
  borderRadius: "7px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
}

const saveBtnStyle: React.CSSProperties = {
  background: ORG.gradientCta, border: "none", color: "#fff",
  borderRadius: "7px", padding: "6px 16px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
}

const scoreInputStyle: React.CSSProperties = {
  width: "56px", textAlign: "right", padding: "4px 8px",
  border: `1.5px solid ${BORDER}`, borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700,
  color: TEXT, fontFamily: ORG.fontHeading,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.08em", marginBottom: "6px",
}

const pillBtnStyle: React.CSSProperties = {
  border: "1.5px solid", borderRadius: "999px", padding: "6px 14px",
  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
}

const selectStyle: React.CSSProperties = {
  width: "100%", maxWidth: "260px", padding: "8px 12px",
  border: `1.5px solid ${BORDER}`, borderRadius: "8px", fontSize: "0.8rem",
  color: TEXT, background: "#fff", cursor: "pointer",
}
