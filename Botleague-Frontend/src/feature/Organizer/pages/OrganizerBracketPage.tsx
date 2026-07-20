import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useMatches } from "../../Admin/hooks/useMatches"
import { useOrganizerSportDetail } from "../hooks/useOrganizerSportDetail"
import type { RootState } from "../../../app/store"
import { hasRole, AppRole } from "../../../shared/constants/roles"
import {
  Trophy, X, Zap, CheckCircle2, Play,
  Clock, Swords, Shuffle, ChevronRight,
  AlertTriangle, RefreshCw, Calendar,
  BarChart2, Hand, Scale, Flag, Ban
} from "lucide-react"
import type {
  MatchDTO,
  MatchType,
  MatchResultType,
  TournamentFormat,
  SubmitMatchResultDTO
} from "../../Admin/api/adminMatches.api"

// =====================================================
// TOKENS
// =====================================================

const T = {
  bg: "#0f0f10",
  surface: "#181819",
  surfaceHover: "#1e1e20",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(250,71,21,0.4)",
  accent: "#fa4715",
  accentDim: "rgba(250,71,21,0.15)",
  accentBorder: "rgba(250,71,21,0.3)",
  gold: "#f59e0b",
  green: "#22c55e",
  blue: "#60a5fa",
  purple: "#a78bfa",
  text: "#f1f5f9",
  textMuted: "#6b7280",
  textSub: "#9ca3af",
}

// =====================================================
// LAYOUT CONSTANTS
// =====================================================

const BOX_W_1V1 = 200
const BOX_W_MULTI = 220
const BOX_H_1V1 = 72
const BOX_H_TRIPLE = 100
const BOX_H_FATAL = 126
const H_GAP = 80
const V_GAP = 20

function getBoxDimensions(matchType?: MatchType) {
  if (matchType === "FATAL_FOUR") return { w: BOX_W_MULTI, h: BOX_H_FATAL }
  if (matchType === "TRIPLE_THREAT") return { w: BOX_W_MULTI, h: BOX_H_TRIPLE }
  return { w: BOX_W_1V1, h: BOX_H_1V1 }
}

// =====================================================
// HELPERS
// =====================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function resolveWinnerName(m: MatchDTO): string | null {
  if (!m.winnerRegistrationId) return null
  if (m.winnerRegistrationId === m.teamARegistrationId) return m.teamARobotName ?? m.teamAName ?? null
  if (m.winnerRegistrationId === m.teamBRegistrationId) return m.teamBRobotName ?? m.teamBName ?? null
  if (m.winnerRegistrationId === m.teamCRegistrationId) return m.teamCRobotName ?? m.teamCName ?? null
  if (m.winnerRegistrationId === m.teamDRegistrationId) return m.teamDRobotName ?? m.teamDName ?? null
  return null
}

function getTeams(m: MatchDTO) {
  const teams: {
    id: string | undefined
    name: string | undefined
    score: number | undefined
    slot: 1 | 2 | 3 | 4
  }[] = [
    { id: m.teamARegistrationId, name: m.teamARobotName || m.teamAName, score: m.teamAScore, slot: 1 },
    { id: m.teamBRegistrationId, name: m.teamBRobotName || m.teamBName, score: m.teamBScore, slot: 2 },
  ]
  if (m.matchType === "TRIPLE_THREAT" || m.matchType === "FATAL_FOUR") {
    teams.push({ id: m.teamCRegistrationId, name: m.teamCRobotName || m.teamCName, score: m.teamCScore, slot: 3 })
  }
  if (m.matchType === "FATAL_FOUR") {
    teams.push({ id: m.teamDRegistrationId, name: m.teamDRobotName || m.teamDName, score: m.teamDScore, slot: 4 })
  }
  return teams
}

// =====================================================
// BRACKET LAYOUT
// Excludes leaderboardPosition === 3 (3rd place match)
// from the main grid — rendered separately in HTML.
// =====================================================

function getBracketLayout(matches: MatchDTO[]) {
  if (!matches.length) return {
    rounds: [] as MatchDTO[][],
    positions: {} as Record<string, { x: number; y: number; w: number; h: number }>,
    svgW: 0,
    svgH: 0,
  }

  const roundMap: Record<number, MatchDTO[]> = {}
  matches.forEach(m => {
    // 3rd place match is rendered outside the SVG grid
    if (m.leaderboardPosition === 3) return
    const r = m.roundNumber ?? 0
    if (!roundMap[r]) roundMap[r] = []
    roundMap[r].push(m)
  })

  const roundNums = Object.keys(roundMap).map(Number).sort((a, b) => a - b)
  const rounds = roundNums.map(r =>
    [...roundMap[r]].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  )

  const maxMatchesR1 = rounds[0]?.length || 1

  const roundBoxH = rounds.map(round => {
    const maxH = round.reduce((acc, m) => {
      const { h } = getBoxDimensions(m.matchType)
      return Math.max(acc, h)
    }, BOX_H_1V1)
    return maxH
  })
  const roundBoxW = rounds.map(round => {
    const maxW = round.reduce((acc, m) => {
      const { w } = getBoxDimensions(m.matchType)
      return Math.max(acc, w)
    }, BOX_W_1V1)
    return maxW
  })

  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {}

  const xOffsets: number[] = []
  let xCursor = 0
  rounds.forEach((_, ri) => {
    xOffsets.push(xCursor)
    xCursor += roundBoxW[ri] + H_GAP
  })

  rounds.forEach((round, ri) => {
    const x = xOffsets[ri]
    const boxH = roundBoxH[ri]
    const spacingFactor = Math.pow(2, ri)
    const slotH = boxH + V_GAP
    const firstOffset = (spacingFactor - 1) * slotH / 2

    round.forEach((match, mi) => {
      const y = firstOffset + mi * spacingFactor * slotH
      const { w, h } = getBoxDimensions(match.matchType)
      positions[match.matchId] = { x, y, w, h }
    })
  })

  const svgW = xCursor - H_GAP + 40
  const svgH = maxMatchesR1 * (roundBoxH[0] + V_GAP) + 20

  return { rounds, positions, svgW, svgH }
}

function statusColor(status?: string) {
  if (status === "COMPLETED") return T.green
  if (status === "LIVE") return T.accent
  if (status === "PENDING_APPROVAL") return T.gold
  if (status === "CANCELLED") return T.textMuted
  return T.blue
}

function statusLabel(status?: string) {
  if (status === "COMPLETED") return "Done"
  if (status === "LIVE") return "Live"
  if (status === "PENDING_APPROVAL") return "Pending Approval"
  if (status === "CANCELLED") return "Cancelled"
  if (status === "SCHEDULED") return "Scheduled"
  return status || "—"
}

function matchTypeLabel(t?: MatchType): string {
  if (t === "TRIPLE_THREAT") return "Triple Threat"
  if (t === "FATAL_FOUR") return "Fatal Four"
  return "1v1"
}

function roundLabel(ri: number, total: number) {
  if (ri === total - 1) return "Final"
  if (ri === total - 2 && total > 2) return "Semifinal"
  return `Round ${ri + 1}`
}

// =====================================================
// SETUP OPTIONS
// =====================================================

const TOURNAMENT_FORMAT_OPTIONS: { value: TournamentFormat; label: string; desc: string }[] = [
  { value: "SINGLE_ELIMINATION", label: "Single Elimination", desc: "One loss and you're out" },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination", desc: "Two losses to be eliminated" },
]

const MATCH_TYPE_OPTIONS: { value: MatchType; label: string; desc: string; minTeams: number }[] = [
  { value: "ONE_VS_ONE",    label: "1v1",           desc: "Head-to-head",          minTeams: 2 },
  { value: "TRIPLE_THREAT", label: "Triple Threat", desc: "3-way match",           minTeams: 3 },
  { value: "FATAL_FOUR",    label: "Fatal Four",    desc: "4-way match",           minTeams: 4 },
]

// =====================================================
// RESULT METHOD OPTIONS (1v1 matches)
// =====================================================

const RESULT_METHODS: {
  value: MatchResultType
  label: string
  loserQuestion: string | null
  icon: React.ReactNode
}[] = [
  { value: "SCORE",            label: "Score",          loserQuestion: null,                          icon: <BarChart2 size={13} /> },
  { value: "TAPOUT",           label: "Tapout",         loserQuestion: "Which team tapped out?",      icon: <Hand size={13} /> },
  { value: "JUDGE_DECISION",   label: "Judge Decision", loserQuestion: null,                          icon: <Scale size={13} /> },
  { value: "FORFEIT",          label: "Forfeit",        loserQuestion: "Which team forfeited?",       icon: <Flag size={13} /> },
  { value: "DISQUALIFICATION", label: "DQ",             loserQuestion: "Which team was disqualified?",icon: <Ban size={13} /> },
]

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function OrganizerBracketPage() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()

  const { registrations } = useOrganizerSportDetail(eventId, sportId)

  const {
    matches,
    loading,
    createLoading,
    updateLoading,
    startMatch,
    updateMatchScore,
    submitMatchResult,
    completeMatch,
    approveMatchResult,
    rejectMatchResult,
    cancelMatch,
    fetchMatches,
    generateBracket,
    scheduleMatch,
  } = useMatches(sportId)

  // SPORT_HEAD/JUDGE can submit results but shouldn't self-approve — this is
  // a UI-level hint only, the backend is the actual enforcement.
  const user = useSelector((state: RootState) => state.auth.user)
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])
  const canApprove = hasRole(userRoles, [AppRole.ADMIN, AppRole.SUPER_ADMIN, AppRole.ORGANISER, AppRole.EVENT_HEAD])

  // ── Bracket generation state ──
  const [view, setView] = useState<"bracket" | "setup">("bracket")
  const [orderedTeams, setOrderedTeams] = useState<typeof registrations>([])
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>("SINGLE_ELIMINATION")
  const [matchType, setMatchType] = useState<MatchType>("ONE_VS_ONE")
  const [generateError, setGenerateError] = useState<string | null>(null)

  // ── Match popup state ──
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [scoreC, setScoreC] = useState(0)
  const [scoreD, setScoreD] = useState(0)

  const [pos1, setPos1] = useState<string>("")
  const [pos2, setPos2] = useState<string>("")
  const [pos3, setPos3] = useState<string>("")
  const [pos4, setPos4] = useState<string>("")

  const [scheduleDate, setScheduleDate] = useState<string>("")
  const [scheduleTime, setScheduleTime] = useState<string>("")

  // ── Result method state (1v1 LIVE) ──
  const [resultMethod, setResultMethod] = useState<MatchResultType>("SCORE")
  const [losingTeamId, setLosingTeamId] = useState<string>("")
  const [judgeWinnerId, setJudgeWinnerId] = useState<string>("")

  const svgRef = useRef<SVGSVGElement>(null)

  const selectedMatch = selectedMatchId
    ? matches.find(m => m.matchId === selectedMatchId) ?? null
    : null

  const isMultiTeam = selectedMatch?.matchType === "TRIPLE_THREAT" || selectedMatch?.matchType === "FATAL_FOUR"
  const isFatalFour = selectedMatch?.matchType === "FATAL_FOUR"

  // ── Init ordered teams ──
  useEffect(() => {
    if (registrations.length) {
      setOrderedTeams([...registrations])
    }
  }, [registrations])

  // ── Auto-switch to setup if no matches yet ──
  useEffect(() => {
    if (!loading && matches.length === 0 && registrations.length > 0) {
      setView("setup")
    }
  }, [loading, matches.length, registrations.length])

  // ── Sync score inputs when popup opens or match data changes ──
  useEffect(() => {
    if (!selectedMatch) return
    setScoreA(selectedMatch.teamAScore ?? 0)
    setScoreB(selectedMatch.teamBScore ?? 0)
    setScoreC(selectedMatch.teamCScore ?? 0)
    setScoreD(selectedMatch.teamDScore ?? 0)
    setPos1(selectedMatch.positionFirstRegistrationId ?? "")
    setPos2(selectedMatch.positionSecondRegistrationId ?? "")
    setPos3(selectedMatch.positionThirdRegistrationId ?? "")
    setPos4(selectedMatch.positionFourthRegistrationId ?? "")
  }, [
    selectedMatch?.matchId,
    selectedMatch?.teamAScore,
    selectedMatch?.teamBScore,
    selectedMatch?.teamCScore,
    selectedMatch?.teamDScore,
    selectedMatch?.positionFirstRegistrationId,
    selectedMatch?.positionSecondRegistrationId,
    selectedMatch?.positionThirdRegistrationId,
    selectedMatch?.positionFourthRegistrationId,
  ])

  // ── Reset result method when a different match is opened ──
  useEffect(() => {
    setResultMethod("SCORE")
    setLosingTeamId("")
    setJudgeWinnerId("")
  }, [selectedMatch?.matchId])

  // ── Sync schedule inputs when popup opens or scheduledAt changes ──
  useEffect(() => {
    if (!selectedMatch?.scheduledAt) {
      setScheduleDate("")
      setScheduleTime("")
      return
    }
    const d = new Date(selectedMatch.scheduledAt)
    setScheduleDate(d.toISOString().slice(0, 10))
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    setScheduleTime(`${hh}:${mm}`)
  }, [selectedMatch?.matchId, selectedMatch?.scheduledAt])

  // =====================================================
  // REFRESH
  // =====================================================

  const refreshMatches = useCallback(async () => {
    if (!sportId) return
    await fetchMatches(sportId)
  }, [sportId, fetchMatches])

  // =====================================================
  // GENERATE BRACKET
  // =====================================================

  const handleGenerateBracket = async () => {
    if (!sportId || orderedTeams.length < 2) return
    setGenerateError(null)
    try {
      await generateBracket({
        eventSportId: sportId,
        tournamentFormat,
        matchType,
        teamRegistrationIds: orderedTeams.map(t => t.id),
      })
      setView("bracket")
    } catch (err: any) {
      setGenerateError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to generate bracket"
      )
    }
  }

  const handleShuffle = () => setOrderedTeams(prev => shuffle(prev))

  // =====================================================
  // START MATCH
  // =====================================================

  const describeActionError = (err: any, fallback: string): string =>
    err?.response?.data?.message || err?.response?.data?.error || fallback

  const handleStart = async () => {
    if (!selectedMatchId) return
    setActionError(null)
    try {
      await startMatch(selectedMatchId)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to start match"))
    }
  }

  // =====================================================
  // SAVE SCORE (LIVE ONLY)
  // =====================================================

  const handleSaveScore = async () => {
    if (!selectedMatchId || !selectedMatch) return
    setActionError(null)
    const payload: Parameters<typeof updateMatchScore>[1] = {
      teamAScore: scoreA,
      teamBScore: scoreB,
    }
    if (selectedMatch.matchType === "TRIPLE_THREAT" || selectedMatch.matchType === "FATAL_FOUR") {
      payload.teamCScore = scoreC
    }
    if (selectedMatch.matchType === "FATAL_FOUR") {
      payload.teamDScore = scoreD
    }
    try {
      await updateMatchScore(selectedMatchId, payload)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to save score"))
    }
  }

  // =====================================================
  // SUBMIT RESULT
  // =====================================================

  const handleSubmitResult = async () => {
    if (!selectedMatchId || !selectedMatch) return
    setActionError(null)

    try {
      if (!isMultiTeam) {
        if (resultMethod === "SCORE") {
          // infer winner from scores
          await completeMatch(selectedMatchId)
        } else if (resultMethod === "JUDGE_DECISION") {
          if (!judgeWinnerId) return
          await submitMatchResult(selectedMatchId, {
            teamAScore: scoreA,
            teamBScore: scoreB,
            winnerRegistrationId: judgeWinnerId,
            winMethod: "JUDGE_DECISION",
          })
        } else {
          // TAPOUT / FORFEIT / DISQUALIFICATION — pick the loser, other team wins
          if (!losingTeamId) return
          const allIds = getTeams(selectedMatch).map(t => t.id).filter(Boolean) as string[]
          const winnerId = allIds.find(id => id !== losingTeamId)
          if (!winnerId) return
          await submitMatchResult(selectedMatchId, {
            teamAScore: scoreA,
            teamBScore: scoreB,
            winnerRegistrationId: winnerId,
            winMethod: resultMethod,
          })
        }
      } else {
        // Multi-team: score + finish positions
        const payload: SubmitMatchResultDTO = {
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
        await submitMatchResult(selectedMatchId, payload)
      }
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to submit match result"))
    }
  }

  // =====================================================
  // APPROVE / REJECT PENDING RESULT
  // =====================================================

  const handleApprove = async () => {
    if (!selectedMatchId) return
    setActionError(null)
    try {
      await approveMatchResult(selectedMatchId)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to approve match result"))
    }
  }

  const handleReject = async () => {
    if (!selectedMatchId) return
    const reason = window.prompt("Reason for rejecting this result (optional):") || undefined
    setActionError(null)
    try {
      await rejectMatchResult(selectedMatchId, reason)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to reject match result"))
    }
  }

  // =====================================================
  // CANCEL MATCH
  // =====================================================

  const handleCancel = async () => {
    if (!selectedMatchId) return
    if (!confirm("Cancel this match?")) return
    setActionError(null)
    try {
      await cancelMatch(selectedMatchId)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to cancel match"))
    }
  }

  // =====================================================
  // SET / UPDATE SCHEDULE
  // =====================================================

  const handleSetSchedule = async () => {
    if (!selectedMatchId || !scheduleDate || !scheduleTime) return
    setActionError(null)
    const isoString = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
    try {
      await scheduleMatch(selectedMatchId, isoString)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to update schedule"))
    }
  }

  // =====================================================
  // BRACKET LAYOUT
  // =====================================================

  const { rounds, positions, svgW, svgH } = getBracketLayout(matches)

  // Connector lines (only for matches that exist in the SVG layout)
  const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
  matches.forEach(m => {
    if (!m.nextMatchId || !positions[m.matchId] || !positions[m.nextMatchId]) return
    const from = positions[m.matchId]
    const to = positions[m.nextMatchId]
    lines.push({
      x1: from.x + from.w,
      y1: from.y + from.h / 2,
      x2: to.x,
      y2: to.y + to.h / 2,
      color: m.status === "COMPLETED" && m.winnerRegistrationId
        ? T.accent
        : "rgba(255,255,255,0.1)"
    })
  })

  // Champion = grand final completed match (exclude 3rd place)
  const champion = matches.find(
    m => !m.nextMatchId
      && m.leaderboardPosition !== 3
      && m.status === "COMPLETED"
      && m.winnerRegistrationId
  )

  // 3rd place match — derived at component level, NOT inside getBracketLayout
  const thirdPlaceMatch = matches.find(m => m.leaderboardPosition === 3) ?? null

  const minTeams = MATCH_TYPE_OPTIONS.find(o => o.value === matchType)?.minTeams ?? 2

  // =====================================================
  // SETUP VIEW
  // =====================================================

  if (view === "setup") {
    return (
      <div style={styles.page}>
        <div style={styles.setupWrap}>

          <div style={styles.setupHeader}>
            <div style={styles.eyebrow}>Tournament Setup</div>
            <h2 style={styles.title}>Generate Bracket</h2>
            <p style={styles.setupSub}>
              {orderedTeams.length} registered team{orderedTeams.length !== 1 ? "s" : ""} found.
              Choose a format, shuffle seeding, then generate.
            </p>
          </div>

          <div style={styles.optionSection}>
            <div style={styles.optionSectionLabel}>Tournament Format</div>
            <div style={styles.optionGrid}>
              {TOURNAMENT_FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  style={{
                    ...styles.optionBtn,
                    ...(tournamentFormat === opt.value ? styles.optionBtnActive : {}),
                  }}
                  onClick={() => setTournamentFormat(opt.value)}
                >
                  <span style={styles.optionBtnLabel}>{opt.label}</span>
                  <span style={styles.optionBtnDesc}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.optionSection}>
            <div style={styles.optionSectionLabel}>Match Type</div>
            <div style={styles.optionGrid}>
              {MATCH_TYPE_OPTIONS.map(opt => {
                const disabled = orderedTeams.length < opt.minTeams
                return (
                  <button
                    key={opt.value}
                    style={{
                      ...styles.optionBtn,
                      ...(matchType === opt.value ? styles.optionBtnActive : {}),
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                    onClick={() => !disabled && setMatchType(opt.value)}
                    disabled={disabled}
                    title={disabled ? `Requires at least ${opt.minTeams} teams` : undefined}
                  >
                    <span style={styles.optionBtnLabel}>{opt.label}</span>
                    <span style={styles.optionBtnDesc}>{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {tournamentFormat === "DOUBLE_ELIMINATION" && matchType !== "ONE_VS_ONE" && (
            <div style={{ ...styles.errorBanner, background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)", color: "#fbbf24" }}>
              <AlertTriangle size={14} />
              Double Elimination only supports 1v1 matches. Loser routing will be set manually after generation.
            </div>
          )}

          <div style={styles.seedCard}>
            <div style={styles.seedCardHeader}>
              <span style={styles.seedCardTitle}>Seeding Order</span>
              <button style={styles.shuffleBtn} onClick={handleShuffle}>
                <Shuffle size={13} />
                Shuffle
              </button>
            </div>
            <div style={styles.seedList}>
              {orderedTeams.map((team, i) => (
                <div key={team.id} style={styles.seedRow}>
                  <div style={styles.seedNum}>{i + 1}</div>
                  <div style={styles.seedName}>{team.teamName}</div>
                  {i === 0 && (
                    <div style={styles.seedBadge}>Top Seed</div>
                  )}
                  {matchType === "ONE_VS_ONE" && orderedTeams.length % 2 !== 0 && i === orderedTeams.length - 1 && (
                    <div style={{ ...styles.seedBadge, background: "rgba(107,114,128,0.15)", color: T.textMuted, borderColor: "rgba(107,114,128,0.25)" }}>Gets Bye</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.bracketPreviewInfo}>
            {(() => {
              let b = 1
              while (b < orderedTeams.length) b *= 2
              return [
                { label: "Teams",   val: orderedTeams.length },
                { label: "Size",    val: b },
                { label: "Rounds",  val: Math.log2(b) },
                { label: "Byes",    val: b - orderedTeams.length },
              ]
            })().map((item, i, arr) => (
              <>
                <div key={item.label} style={styles.previewInfoItem}>
                  <span style={styles.previewInfoLabel}>{item.label}</span>
                  <span style={styles.previewInfoVal}>{item.val}</span>
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight key={`sep-${i}`} size={14} color={T.textMuted} />
                )}
              </>
            ))}
          </div>

          {generateError && (
            <div style={styles.errorBanner}>
              <AlertTriangle size={14} />
              {generateError}
            </div>
          )}

          <button
            style={{
              ...styles.generateBtn,
              opacity: createLoading || orderedTeams.length < minTeams ? 0.6 : 1,
              cursor: createLoading || orderedTeams.length < minTeams ? "not-allowed" : "pointer",
            }}
            onClick={handleGenerateBracket}
            disabled={createLoading || orderedTeams.length < minTeams}
          >
            {createLoading
              ? <><div style={styles.btnSpinner} /> Generating…</>
              : <><Swords size={16} /> Generate {matchTypeLabel(matchType)} Bracket</>
            }
          </button>

          {matches.length > 0 && (
            <button style={styles.backBtn} onClick={() => setView("bracket")}>
              ← Back to existing bracket
            </button>
          )}

          {orderedTeams.length < minTeams && (
            <p style={{ color: T.textMuted, fontSize: "0.8rem", textAlign: "center", marginTop: 12 }}>
              At least {minTeams} registered teams are required for {matchTypeLabel(matchType)}.
            </p>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading && !matches.length) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingSpinner} />
        <span style={{ color: T.textMuted, fontSize: "0.85rem" }}>Loading bracket…</span>
      </div>
    )
  }

  // =====================================================
  // BRACKET VIEW
  // =====================================================

  return (
    <div style={styles.page}>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Tournament Bracket</div>
          <h2 style={styles.title}>
            {rounds.length > 0
              ? `${rounds[0].length * 2}-Team ${
                  matches[0]?.tournamentFormat === "DOUBLE_ELIMINATION"
                    ? "Double Elimination"
                    : "Single Elimination"
                } · ${matchTypeLabel(matches[0]?.matchType)}`
              : "Bracket"}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
          <div style={styles.legend}>
            {[
              { color: T.blue,   label: "Scheduled" },
              { color: T.accent, label: "Live" },
              { color: T.green,  label: "Completed" },
            ].map(l => (
              <div key={l.label} style={styles.legendItem}>
                <div style={{ ...styles.legendDot, background: l.color }} />
                <span style={{ fontSize: "0.72rem", color: T.textSub }}>{l.label}</span>
              </div>
            ))}
          </div>
          {!matches.some(m => m.status === "LIVE" || m.status === "COMPLETED") && (
            <button style={styles.regenBtn} onClick={() => setView("setup")}>
              <RefreshCw size={12} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Champion banner */}
      {champion && (
        <div style={styles.championBanner}>
          <Trophy size={20} color={T.gold} />
          <span style={styles.championText}>
            Champion: {resolveWinnerName(champion) ?? "—"}
          </span>
          🎉
        </div>
      )}

      {/* ── BRACKET SVG ── */}
      <div style={styles.svgScroll}>
        <svg
          ref={svgRef}
          width={svgW + 40}
          height={svgH + 60}
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Round labels */}
          {rounds.map((round, ri) => {
            const pos0 = positions[round[0]?.matchId]
            return (
              <text
                key={ri}
                x={(pos0?.x ?? 0) + (pos0?.w ?? BOX_W_1V1) / 2 + 20}
                y={16}
                textAnchor="middle"
                fill={ri === rounds.length - 1 ? T.accent : T.textMuted}
                fontSize={11}
                fontWeight={700}
                fontFamily="'Inter', sans-serif"
                letterSpacing={1.5}
                style={{ textTransform: "uppercase" }}
              >
                {roundLabel(ri, rounds.length)}
              </text>
            )
          })}

          <g transform="translate(20, 28)">

            {/* Connector lines */}
            {lines.map((l, i) => {
              const mx = l.x1 + H_GAP / 2
              return (
                <path
                  key={i}
                  d={`M${l.x1},${l.y1} C${mx},${l.y1} ${mx},${l.y2} ${l.x2},${l.y2}`}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={l.color === T.accent ? 1.5 : 1}
                  opacity={l.color === T.accent ? 0.7 : 0.3}
                  filter={l.color === T.accent ? "url(#glow)" : undefined}
                />
              )
            })}

            {/* Match boxes */}
            {matches.map(match => {
              const pos = positions[match.matchId]
              if (!pos) return null
              const { x, y, w, h } = pos
              const isSelected = selectedMatchId === match.matchId
              const sc = statusColor(match.status)
              const isCompleted = match.status === "COMPLETED"
              const isLive = match.status === "LIVE"
              const isBye = match.isBye
              const teams = getTeams(match)
              const rowH = h / teams.length

              return (
                <g
                  key={match.matchId}
                  onClick={() => { setActionError(null); setSelectedMatchId(match.matchId) }}
                  style={{ cursor: "pointer" }}
                >
                  {isSelected && (
                    <rect
                      x={x - 3} y={y - 3}
                      width={w + 6} height={h + 6}
                      rx={16} ry={16}
                      fill={T.accentDim}
                      stroke={T.accent}
                      strokeWidth={1}
                      opacity={0.6}
                    />
                  )}

                  <rect
                    x={x} y={y} width={w} height={h}
                    rx={13} ry={13}
                    fill={isBye ? "rgba(255,255,255,0.02)" : isSelected ? "#1e1e22" : T.surface}
                    stroke={isSelected ? T.accent : isLive ? "rgba(250,71,21,0.4)" : "rgba(255,255,255,0.07)"}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />

                  <rect x={x} y={y} width={3} height={h} rx={2} ry={2}
                    fill={sc} opacity={isBye ? 0.2 : 0.8} />

                  {match.matchType && match.matchType !== "ONE_VS_ONE" && (
                    <text
                      x={x + w - 8} y={y + 13}
                      fontSize={8} fontWeight={700}
                      fill={match.matchType === "FATAL_FOUR" ? T.purple : T.gold}
                      fontFamily="'Inter', sans-serif"
                      textAnchor="end" letterSpacing={0.5}
                    >
                      {matchTypeLabel(match.matchType).toUpperCase()}
                    </text>
                  )}

                  {teams.map((team, ti) => {
                    const rowY = y + ti * rowH
                    const isWinner = !!match.winnerRegistrationId && match.winnerRegistrationId === team.id
                    const nameColor = isBye ? T.textMuted
                      : isWinner ? T.green
                      : team.name ? T.text : T.textMuted

                    return (
                      <g key={ti}>
                        {ti > 0 && (
                          <line
                            x1={x + 10} y1={rowY}
                            x2={x + w - 10} y2={rowY}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          />
                        )}
                        <text
                          x={x + 16}
                          y={rowY + rowH / 2 + 5}
                          fontSize={11}
                          fontWeight={isWinner ? 700 : 400}
                          fill={nameColor}
                          fontFamily="'Inter', sans-serif"
                        >
                          {team.name || (team.id ? "…" : "TBD")}
                        </text>
                        {(isCompleted || isLive) && (
                          <text
                            x={x + w - 14}
                            y={rowY + rowH / 2 + 5}
                            fontSize={12} fontWeight={700}
                            fill={isWinner ? T.green : T.textSub}
                            fontFamily="'Inter', sans-serif"
                            textAnchor="end"
                          >
                            {team.score ?? 0}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {isBye && (
                    <text
                      x={x + w - 10} y={y + h / 2 + 4}
                      fontSize={9} fontWeight={700}
                      fill={T.textMuted}
                      fontFamily="'Inter', sans-serif"
                      textAnchor="end" letterSpacing={1}
                    >BYE</text>
                  )}

                  {isLive && (
                    <circle cx={x + w - 10} cy={y + 10} r={4} fill={T.accent} opacity={0.9}>
                      <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {isCompleted && !match.nextMatchId && match.leaderboardPosition !== 3 && match.winnerRegistrationId && (
                    <text x={x + w / 2} y={y - 8} textAnchor="middle" fontSize={14}>🏆</text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* ── 3RD PLACE MATCH (below bracket SVG) ── */}
      {thirdPlaceMatch && (
        <div style={styles.thirdPlaceWrap}>
          <div style={styles.thirdPlaceLabel}>🥉 3rd Place Match</div>

          <div
            onClick={() => { setActionError(null); setSelectedMatchId(thirdPlaceMatch.matchId) }}
            style={{
              ...styles.thirdPlaceCard,
              background: selectedMatchId === thirdPlaceMatch.matchId ? "#1e1e22" : T.surface,
              border: `1px solid ${
                selectedMatchId === thirdPlaceMatch.matchId
                  ? T.accent
                  : "rgba(167,139,250,0.35)"
              }`,
            }}
          >
            {/* Left status bar */}
            <div style={{
              position: "absolute" as const, left: 0, top: 0, bottom: 0, width: 3,
              background: statusColor(thirdPlaceMatch.status),
              borderRadius: "2px 0 0 2px",
            }} />

            {/* Match type badge */}
            {thirdPlaceMatch.matchType && thirdPlaceMatch.matchType !== "ONE_VS_ONE" && (
              <div style={styles.thirdPlaceTypeBadge}>
                {matchTypeLabel(thirdPlaceMatch.matchType).toUpperCase()}
              </div>
            )}

            {/* Team rows */}
            {getTeams(thirdPlaceMatch).map((team, i, arr) => {
              const isWinner = !!thirdPlaceMatch.winnerRegistrationId
                && thirdPlaceMatch.winnerRegistrationId === team.id
              const showScore = thirdPlaceMatch.status === "LIVE"
                || thirdPlaceMatch.status === "COMPLETED"

              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 14px 9px 20px",
                    borderBottom: i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 700,
                      background: isWinner ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                      color: isWinner ? T.green : T.textMuted,
                    }}>
                      {isWinner ? "🥉" : String.fromCharCode(64 + team.slot)}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: isWinner ? 700 : 400,
                      color: isWinner ? T.green : team.name ? T.text : T.textMuted,
                      fontFamily: "'Inter',sans-serif",
                    }}>
                      {team.name || "TBD"}
                    </span>
                  </div>
                  {showScore && (
                    <span style={{
                      fontSize: 14, fontWeight: 800, lineHeight: 1,
                      fontFamily: "'Inter',sans-serif",
                      color: isWinner ? T.green : T.textSub,
                    }}>
                      {team.score ?? 0}
                    </span>
                  )}
                </div>
              )
            })}

            {/* Live pulse dot */}
            {thirdPlaceMatch.status === "LIVE" && (
              <div style={{
                position: "absolute" as const, right: 10, top: 10,
                width: 7, height: 7, borderRadius: "50%", background: T.accent,
              }} />
            )}
          </div>

          <div style={styles.thirdPlaceStatus}>
            <div style={{ ...styles.legendDot, background: statusColor(thirdPlaceMatch.status) }} />
            {statusLabel(thirdPlaceMatch.status)}
            {thirdPlaceMatch.status === "SCHEDULED"
              && !thirdPlaceMatch.teamARegistrationId
              && !thirdPlaceMatch.teamBRegistrationId
              && <span style={{ color: T.textMuted, marginLeft: 4 }}>· Waiting for semi-finals</span>}
            {thirdPlaceMatch.status === "COMPLETED" && thirdPlaceMatch.winnerRegistrationId && (
              <span style={{ color: T.purple, marginLeft: 6, fontWeight: 700 }}>
                🥉 {resolveWinnerName(thirdPlaceMatch)} takes 3rd
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── MATCH POPUP ── */}
      {selectedMatch && (
        <div style={styles.overlay} onClick={() => { setActionError(null); setSelectedMatchId(null) }}>
          <div style={styles.popup} onClick={e => e.stopPropagation()}>

            <button style={styles.closeBtn} onClick={() => { setActionError(null); setSelectedMatchId(null) }}>
              <X size={16} />
            </button>

            {/* Popup header */}
            <div style={styles.popupHeader}>
              <div style={styles.popupEyebrow}>
                <div style={{ ...styles.statusDot, background: statusColor(selectedMatch.status) }} />
                {statusLabel(selectedMatch.status)}
                {selectedMatch.isBye && <span style={styles.byeTag}>BYE</span>}
                {selectedMatch.matchType && selectedMatch.matchType !== "ONE_VS_ONE" && (
                  <span style={{
                    ...styles.byeTag,
                    background: selectedMatch.matchType === "FATAL_FOUR"
                      ? "rgba(167,139,250,0.12)" : "rgba(245,158,11,0.1)",
                    color: selectedMatch.matchType === "FATAL_FOUR" ? T.purple : T.gold,
                    borderColor: selectedMatch.matchType === "FATAL_FOUR"
                      ? "rgba(167,139,250,0.25)" : "rgba(245,158,11,0.25)",
                  }}>
                    {matchTypeLabel(selectedMatch.matchType)}
                  </span>
                )}
                {selectedMatch.leaderboardPosition === 1 && (
                  <span style={{ ...styles.byeTag, background: "rgba(245,158,11,0.12)", color: T.gold, borderColor: "rgba(245,158,11,0.3)" }}>
                    🏆 Grand Final
                  </span>
                )}
                {selectedMatch.leaderboardPosition === 3 && (
                  <span style={{ ...styles.byeTag, background: "rgba(167,139,250,0.12)", color: T.purple, borderColor: "rgba(167,139,250,0.3)" }}>
                    🥉 3rd Place
                  </span>
                )}
                {selectedMatch.isBracketReset && (
                  <span style={{ ...styles.byeTag, background: "rgba(250,71,21,0.12)", color: T.accent, borderColor: T.accentBorder }}>
                    Bracket Reset
                  </span>
                )}
              </div>
              <div style={styles.popupTitle}>
                Round {selectedMatch.roundNumber} — Match {selectedMatch.matchNumber}
                {selectedMatch.bracketSide && (
                  <span style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 400, marginLeft: 8 }}>
                    [{selectedMatch.bracketSide.replace("_", " ")}]
                  </span>
                )}
              </div>
            </div>

            {actionError && (
              <div style={{ ...styles.errorBanner, marginBottom: 12 }}>
                <AlertTriangle size={14} />
                {actionError}
              </div>
            )}

            {/* Teams display */}
            <div style={styles.teamsDisplay}>
              {getTeams(selectedMatch).map((team, i) => {
                const isWinner = !!selectedMatch.winnerRegistrationId
                  && selectedMatch.winnerRegistrationId === team.id
                const showScore = selectedMatch.status === "LIVE"
                  || selectedMatch.status === "COMPLETED"

                return (
                  <div key={i} style={{
                    ...styles.teamRow,
                    background: isWinner ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.03)",
                    borderColor: isWinner ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                  }}>
                    <div style={styles.teamRowLeft}>
                      <div style={{
                        ...styles.teamRowSlot,
                        background: isWinner ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                        color: isWinner ? T.green : T.textMuted,
                      }}>
                        {isWinner
                          ? (selectedMatch.leaderboardPosition === 3 ? "🥉" : "🏆")
                          : String.fromCharCode(64 + team.slot)}
                      </div>
                      <span style={{
                        ...styles.teamRowName,
                        fontWeight: isWinner ? 700 : 500,
                        color: isWinner ? T.green : T.text,
                      }}>
                        {team.name || "TBD"}
                      </span>
                    </div>
                    {showScore && (
                      <span style={{
                        ...styles.teamRowScore,
                        color: isWinner ? T.green : T.textMuted,
                      }}>
                        {team.score ?? 0}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── SCHEDULE (SCHEDULED and LIVE, non-bye) ── */}
            {(selectedMatch.status === "SCHEDULED" || selectedMatch.status === "LIVE") && !selectedMatch.isBye && (
              <div style={styles.scheduleSection}>
                <div style={styles.scheduleSectionLabel}>
                  <Calendar size={13} />
                  {selectedMatch.scheduledAt ? "Update Schedule" : "Set Schedule"}
                </div>
                <div style={styles.scheduleInputRow}>
                  <div style={styles.scheduleInputWrap}>
                    <label style={styles.scheduleLabel}>Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      style={styles.scheduleInput}
                    />
                  </div>
                  <div style={styles.scheduleInputWrap}>
                    <label style={styles.scheduleLabel}>Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      style={styles.scheduleInput}
                    />
                  </div>
                </div>
                <button
                  style={{
                    ...styles.actionBtn,
                    background: "rgba(96,165,250,0.12)",
                    borderColor: "rgba(96,165,250,0.3)",
                    color: T.blue,
                    opacity: updateLoading || !scheduleDate || !scheduleTime ? 0.5 : 1,
                  }}
                  onClick={handleSetSchedule}
                  disabled={updateLoading || !scheduleDate || !scheduleTime}
                >
                  {updateLoading
                    ? <><div style={styles.actionSpinner} /> Saving…</>
                    : <><Calendar size={14} /> {selectedMatch.scheduledAt ? "Update Schedule" : "Set Schedule"}</>
                  }
                </button>
              </div>
            )}

            {/* ── BYE MATCH INFO ── */}
            {selectedMatch.isBye && (
              <div style={styles.byeInfoCard}>
                <div style={styles.byeInfoTitle}>BYE — Automatic Advance</div>
                <div style={styles.byeInfoSub}>
                  Only one team is in this match. The team advances automatically once the bracket is ready.
                </div>
                {selectedMatch.autoAdvanced && (
                  <div style={styles.byeAdvancedBadge}>Auto-advanced</div>
                )}
              </div>
            )}

            {/* ── LIVE RESULT SECTION (1v1 non-bye) ── */}
            {selectedMatch.status === "LIVE" && !isMultiTeam && !selectedMatch.isBye && (
              <div style={styles.resultSection}>
                <div style={styles.resultSectionLabel}>How was this match decided?</div>

                {/* Method tabs */}
                <div style={styles.methodTabs}>
                  {RESULT_METHODS.map(m => (
                    <button
                      key={m.value}
                      style={{
                        ...styles.methodTab,
                        ...(resultMethod === m.value ? styles.methodTabActive : {}),
                      }}
                      onClick={() => setResultMethod(m.value)}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* SCORE — counters + save + complete */}
                {resultMethod === "SCORE" && (
                  <>
                    <div style={styles.scoreGrid}>
                      {[
                        { label: selectedMatch.teamARobotName || selectedMatch.teamAName || "Team A", val: scoreA, set: setScoreA },
                        { label: selectedMatch.teamBRobotName || selectedMatch.teamBName || "Team B", val: scoreB, set: setScoreB },
                      ].map(({ label, val, set }) => (
                        <div key={label} style={styles.scoreInputWrap}>
                          <div style={styles.scoreInputLabel}>{label}</div>
                          <div style={styles.scoreCounter}>
                            <button style={styles.counterBtn} onClick={() => set(s => Math.max(0, s - 1))}>−</button>
                            <span style={styles.counterVal}>{val}</span>
                            <button style={styles.counterBtn} onClick={() => set(s => s + 1)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={{ ...styles.actionBtn, flex: 1, background: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.3)", color: T.blue, opacity: updateLoading ? 0.5 : 1 }}
                        onClick={handleSaveScore}
                        disabled={updateLoading}
                      >
                        <Swords size={14} /> Save Score
                      </button>
                      <button
                        style={{ ...styles.actionBtn, flex: 1, background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: T.green, opacity: updateLoading ? 0.5 : 1 }}
                        onClick={handleSubmitResult}
                        disabled={updateLoading}
                      >
                        {updateLoading ? <><div style={styles.actionSpinner} /> Submitting…</> : <><CheckCircle2 size={14} /> Complete &amp; Advance</>}
                      </button>
                    </div>
                  </>
                )}

                {/* JUDGE DECISION — pick winner */}
                {resultMethod === "JUDGE_DECISION" && (
                  <>
                    <div style={styles.resultSubLabel}>Select the winner by judges' decision</div>
                    <div style={styles.teamPickGrid}>
                      {getTeams(selectedMatch).map(team => (
                        <button
                          key={team.slot}
                          style={{
                            ...styles.teamPickBtn,
                            ...(judgeWinnerId === team.id ? styles.teamPickBtnWinner : {}),
                          }}
                          onClick={() => setJudgeWinnerId(team.id ?? "")}
                        >
                          <span style={styles.teamPickBtnName}>{team.name || "TBD"}</span>
                          {judgeWinnerId === team.id && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                    <button
                      style={{ ...styles.actionBtn, background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: T.green, opacity: updateLoading || !judgeWinnerId ? 0.5 : 1 }}
                      onClick={handleSubmitResult}
                      disabled={updateLoading || !judgeWinnerId}
                    >
                      {updateLoading ? <><div style={styles.actionSpinner} /> Submitting…</> : <><CheckCircle2 size={14} /> Submit Decision &amp; Advance</>}
                    </button>
                  </>
                )}

                {/* TAPOUT / FORFEIT / DQ — pick loser */}
                {(resultMethod === "TAPOUT" || resultMethod === "FORFEIT" || resultMethod === "DISQUALIFICATION") && (
                  <>
                    <div style={styles.resultSubLabel}>
                      {RESULT_METHODS.find(m => m.value === resultMethod)?.loserQuestion}
                    </div>
                    <div style={styles.teamPickGrid}>
                      {getTeams(selectedMatch).map(team => (
                        <button
                          key={team.slot}
                          style={{
                            ...styles.teamPickBtn,
                            ...(losingTeamId === team.id ? styles.teamPickBtnLoser : {}),
                          }}
                          onClick={() => setLosingTeamId(team.id ?? "")}
                        >
                          <span style={styles.teamPickBtnName}>{team.name || "TBD"}</span>
                          {losingTeamId === team.id && <X size={14} />}
                        </button>
                      ))}
                    </div>
                    {losingTeamId && (
                      <div style={styles.winnerPreview}>
                        <CheckCircle2 size={13} color={T.green} />
                        <span>Winner: <strong>{getTeams(selectedMatch).find(t => t.id !== losingTeamId)?.name || "—"}</strong></span>
                      </div>
                    )}
                    <button
                      style={{ ...styles.actionBtn, background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: T.green, opacity: updateLoading || !losingTeamId ? 0.5 : 1 }}
                      onClick={handleSubmitResult}
                      disabled={updateLoading || !losingTeamId}
                    >
                      {updateLoading ? <><div style={styles.actionSpinner} /> Submitting…</> : <><CheckCircle2 size={14} /> Submit &amp; Advance Winner</>}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── LIVE RESULT SECTION (multi-team non-bye) ── */}
            {selectedMatch.status === "LIVE" && isMultiTeam && !selectedMatch.isBye && (
              <>
                {/* Score counters */}
                <div style={styles.scoreSection}>
                  <div style={styles.scoreSectionLabel}>Live Score</div>
                  <div style={styles.scoreGrid}>
                    {[
                      { label: selectedMatch.teamARobotName || selectedMatch.teamAName || "Team A", val: scoreA, set: setScoreA },
                      { label: selectedMatch.teamBRobotName || selectedMatch.teamBName || "Team B", val: scoreB, set: setScoreB },
                      ...(isMultiTeam ? [{ label: selectedMatch.teamCRobotName || selectedMatch.teamCName || "Team C", val: scoreC, set: setScoreC }] : []),
                      ...(isFatalFour ? [{ label: selectedMatch.teamDRobotName || selectedMatch.teamDName || "Team D", val: scoreD, set: setScoreD }] : []),
                    ].map(({ label, val, set }) => (
                      <div key={label} style={styles.scoreInputWrap}>
                        <div style={styles.scoreInputLabel}>{label}</div>
                        <div style={styles.scoreCounter}>
                          <button style={styles.counterBtn} onClick={() => set(s => Math.max(0, s - 1))}>−</button>
                          <span style={styles.counterVal}>{val}</span>
                          <button style={styles.counterBtn} onClick={() => set(s => s + 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    style={{ ...styles.actionBtn, background: "rgba(96,165,250,0.15)", borderColor: "rgba(96,165,250,0.3)", color: T.blue, opacity: updateLoading ? 0.5 : 1 }}
                    onClick={handleSaveScore}
                    disabled={updateLoading}
                  >
                    <Swords size={14} /> Save Score
                  </button>
                </div>

                {/* Finish positions */}
                <div style={{ ...styles.scoreSection, marginTop: 10, background: "rgba(167,139,250,0.06)", borderColor: "rgba(167,139,250,0.2)" }}>
                  <div style={{ ...styles.scoreSectionLabel, color: T.purple }}>Finish Positions</div>
                  <div style={styles.scoreGrid}>
                    {[
                      { medal: "🥇", label: "1st Place", val: pos1, set: setPos1 },
                      { medal: "🥈", label: "2nd Place", val: pos2, set: setPos2 },
                      { medal: "🥉", label: "3rd Place", val: pos3, set: setPos3 },
                      ...(isFatalFour ? [{ medal: "4️⃣", label: "4th Place", val: pos4, set: setPos4 }] : []),
                    ].map(({ medal, label, val, set }) => (
                      <div key={label} style={styles.scoreInputWrap}>
                        <div style={styles.scoreInputLabel}>{medal} {label}</div>
                        <select value={val} onChange={e => set(e.target.value)} style={styles.positionSelect}>
                          <option value="">— Select —</option>
                          {getTeams(selectedMatch).map(t => (
                            <option key={t.id ?? t.slot} value={t.id ?? ""}>
                              {t.name || `Team ${String.fromCharCode(64 + t.slot)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    style={{ ...styles.actionBtn, background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: T.green, marginTop: 6, opacity: updateLoading ? 0.5 : 1 }}
                    onClick={handleSubmitResult}
                    disabled={updateLoading}
                  >
                    {updateLoading ? <><div style={styles.actionSpinner} /> Submitting…</> : <><CheckCircle2 size={14} /> Submit Result &amp; Advance</>}
                  </button>
                </div>
              </>
            )}

            {/* ── PENDING APPROVAL — result submitted, waiting on EVENT_HEAD/ORGANISER/ADMIN ── */}
            {selectedMatch.status === "PENDING_APPROVAL" && (
              <div style={{
                display: "flex", flexDirection: "column", gap: 10,
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.gold, fontWeight: 700, fontSize: "0.85rem" }}>
                  <Clock size={15} /> Result pending approval
                  {selectedMatch.winnerRegistrationId && (
                    <span style={{ color: T.textSub, fontWeight: 500 }}>— {resolveWinnerName(selectedMatch)} currently winning</span>
                  )}
                </div>
                {canApprove ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...styles.actionBtn, background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: T.green, opacity: updateLoading ? 0.5 : 1 }}
                      onClick={handleApprove}
                      disabled={updateLoading}
                    >
                      <CheckCircle2 size={14} /> Approve Result
                    </button>
                    <button
                      style={{ ...styles.actionBtn, background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171", opacity: updateLoading ? 0.5 : 1 }}
                      onClick={handleReject}
                      disabled={updateLoading}
                    >
                      <Ban size={14} /> Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ color: T.textSub, fontSize: "0.78rem" }}>Waiting for an event head or admin to approve.</div>
                )}
              </div>
            )}

            {/* ── READ-ONLY SCORES (COMPLETED multi-team) ── */}
            {selectedMatch.status === "COMPLETED" && isMultiTeam && (
              <div style={{ ...styles.scoreSection, background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", marginBottom: 14 }}>
                <div style={{ ...styles.scoreSectionLabel, color: T.textSub }}>Final Scores</div>
                <div style={styles.scoreGrid}>
                  {getTeams(selectedMatch).map(team => (
                    <div key={team.slot} style={styles.scoreInputWrap}>
                      <div style={styles.scoreInputLabel}>{team.name || `Team ${String.fromCharCode(64 + team.slot)}`}</div>
                      <div style={{ ...styles.scoreCounter, pointerEvents: "none" as const }}>
                        <span style={{ ...styles.counterVal, padding: "8px 0" }}>{team.score ?? 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Winner / result banner (completed) */}
            {selectedMatch.status === "COMPLETED" && selectedMatch.winnerRegistrationId && (
              <div style={{
                ...styles.winnerBanner,
                background: selectedMatch.leaderboardPosition === 3
                  ? "rgba(167,139,250,0.1)"
                  : "rgba(245,158,11,0.1)",
                borderColor: selectedMatch.leaderboardPosition === 3
                  ? "rgba(167,139,250,0.25)"
                  : "rgba(245,158,11,0.25)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedMatch.leaderboardPosition === 3
                    ? <span style={{ fontSize: "1rem" }}>🥉</span>
                    : <Trophy size={16} color={T.gold} />
                  }
                  <span style={{
                    fontWeight: 700, fontSize: "0.9rem",
                    color: selectedMatch.leaderboardPosition === 3 ? T.purple : T.gold,
                  }}>
                    {resolveWinnerName(selectedMatch)}{" "}
                    {selectedMatch.leaderboardPosition === 3
                      ? "wins 3rd place!"
                      : selectedMatch.nextMatchId
                        ? "advances!"
                        : "is Champion!"}
                  </span>
                </div>
                {selectedMatch.winMethod && (
                  <div style={styles.winMethodBadge}>
                    {selectedMatch.winMethod === "TAPOUT"           && <Hand size={11} />}
                    {selectedMatch.winMethod === "JUDGE_DECISION"   && <Scale size={11} />}
                    {selectedMatch.winMethod === "FORFEIT"          && <Flag size={11} />}
                    {selectedMatch.winMethod === "DISQUALIFICATION" && <Ban size={11} />}
                    {selectedMatch.winMethod === "SCORE"            && <BarChart2 size={11} />}
                    <span>{selectedMatch.winMethod.replace("_", " ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div style={styles.popupActions}>

              {/* Start */}
              {selectedMatch.status === "SCHEDULED" && !selectedMatch.isBye && (
                <button
                  style={{
                    ...styles.actionBtn,
                    background: T.accentDim,
                    borderColor: T.accentBorder,
                    color: T.accent,
                    opacity: updateLoading
                      || !selectedMatch.teamARegistrationId
                      || !selectedMatch.teamBRegistrationId
                      ? 0.5 : 1,
                  }}
                  onClick={handleStart}
                  disabled={
                    updateLoading
                    || !selectedMatch.teamARegistrationId
                    || !selectedMatch.teamBRegistrationId
                  }
                >
                  {updateLoading
                    ? <><div style={styles.actionSpinner} /> Starting…</>
                    : <><Play size={14} /> Start Match</>
                  }
                </button>
              )}

              {/* Cancel */}
              {(selectedMatch.status === "SCHEDULED" || selectedMatch.status === "LIVE") && (
                <button
                  style={{
                    ...styles.actionBtn,
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: T.textMuted,
                    opacity: updateLoading ? 0.5 : 1,
                  }}
                  onClick={handleCancel}
                  disabled={updateLoading}
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>

            {/* Timing */}
            {(selectedMatch.scheduledAt || selectedMatch.startedAt || selectedMatch.endedAt) && (
              <div style={styles.timingRow}>
                {selectedMatch.scheduledAt && (
                  <div style={styles.timingItem}>
                    <Clock size={11} color={T.textMuted} />
                    <span style={{ color: T.textMuted, fontSize: "0.72rem" }}>
                      Scheduled: {new Date(selectedMatch.scheduledAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}
                {selectedMatch.startedAt && (
                  <div style={styles.timingItem}>
                    <Zap size={11} color={T.accent} />
                    <span style={{ color: T.textMuted, fontSize: "0.72rem" }}>
                      Started: {new Date(selectedMatch.startedAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}
                {selectedMatch.endedAt && (
                  <div style={styles.timingItem}>
                    <CheckCircle2 size={11} color={T.green} />
                    <span style={{ color: T.textMuted, fontSize: "0.72rem" }}>
                      Ended: {new Date(selectedMatch.endedAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn    { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// =====================================================
// STYLES
// =====================================================

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: T.bg, minHeight: "100vh",
    padding: "28px 32px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: T.text,
  },

  loadingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "60vh", gap: 16,
  },
  loadingSpinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.1)",
    borderTopColor: T.accent, animation: "spin 0.8s linear infinite",
  },

  // ── Setup ──
  setupWrap: { maxWidth: 520, margin: "0 auto", paddingTop: 20 },
  setupHeader: { marginBottom: 28 },
  setupSub: { fontSize: "0.85rem", color: T.textSub, marginTop: 8, lineHeight: 1.6 },

  optionSection: { marginBottom: 18 },
  optionSectionLabel: {
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 10,
  },
  optionGrid: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  optionBtn: {
    flex: 1, minWidth: 130,
    display: "flex", flexDirection: "column" as const, gap: 3,
    padding: "12px 14px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: T.text, cursor: "pointer", fontFamily: "inherit",
    textAlign: "left" as const, transition: "all 0.15s",
  },
  optionBtnActive: {
    background: T.accentDim,
    border: `1px solid ${T.accentBorder}`,
  },
  optionBtnLabel: { fontSize: "0.88rem", fontWeight: 700, color: T.text },
  optionBtnDesc: { fontSize: "0.72rem", color: T.textMuted },

  seedCard: {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 16, overflow: "hidden", marginBottom: 18,
  },
  seedCardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  seedCardTitle: {
    fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: T.textSub,
  },
  shuffleBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 13px", borderRadius: 8,
    background: T.accentDim, border: `1px solid ${T.accentBorder}`,
    color: T.accent, fontSize: "0.78rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  seedList: { padding: "8px 0" },
  seedRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "9px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  seedNum: {
    width: 24, height: 24, borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.72rem", fontWeight: 700, color: T.textMuted, flexShrink: 0,
  },
  seedName: { flex: 1, fontSize: "0.88rem", fontWeight: 600, color: T.text },
  seedBadge: {
    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em",
    padding: "2px 8px", borderRadius: 4,
    background: T.accentDim, color: T.accent, border: `1px solid ${T.accentBorder}`,
  },

  bracketPreviewInfo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 18px", borderRadius: 12,
    background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
    marginBottom: 18, flexWrap: "wrap" as const,
  },
  previewInfoItem: { display: "flex", flexDirection: "column" as const, gap: 2 },
  previewInfoLabel: {
    fontSize: "0.65rem", color: T.textMuted, fontWeight: 700,
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
  },
  previewInfoVal: { fontSize: "1.1rem", fontWeight: 800, color: T.text },

  errorBanner: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px", borderRadius: 10,
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    color: "#f87171", fontSize: "0.82rem", marginBottom: 14,
  },
  generateBtn: {
    width: "100%", padding: "14px 20px", borderRadius: 13,
    background: `linear-gradient(135deg, #ff4d4d, ${T.accent})`,
    border: "none", color: "#fff",
    fontSize: "0.95rem", fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  },
  btnSpinner: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", animation: "spin 0.7s linear infinite",
  },
  backBtn: {
    width: "100%", marginTop: 12, padding: "10px",
    background: "transparent", border: "none",
    color: T.textMuted, fontSize: "0.82rem",
    cursor: "pointer", fontFamily: "inherit",
  },

  // ── Bracket header ──
  header: {
    display: "flex", alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 20, flexWrap: "wrap" as const, gap: 12,
  },
  eyebrow: {
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const, color: T.accent, marginBottom: 4,
  },
  title: { fontSize: "1.5rem", fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.02em" },
  legend: { display: "flex", gap: 16, alignItems: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: "50%" },
  regenBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 13px", borderRadius: 8,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: T.textSub, fontSize: "0.75rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  championBanner: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 18px", borderRadius: 12,
    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
    marginBottom: 20,
  },
  championText: { fontSize: "1rem", fontWeight: 800, color: T.gold },
  svgScroll: {
    overflowX: "auto", overflowY: "visible",
    paddingBottom: 16, scrollbarWidth: "thin" as const,
  },

  // ── 3rd place match ──
  thirdPlaceWrap: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: "1px solid rgba(167,139,250,0.15)",
    display: "flex", flexDirection: "column" as const, gap: 10,
  },
  thirdPlaceLabel: {
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: T.purple,
  },
  thirdPlaceCard: {
    cursor: "pointer",
    borderRadius: 13,
    width: 260,
    overflow: "hidden" as const,
    position: "relative" as const,
    transition: "border-color 0.15s",
  },
  thirdPlaceTypeBadge: {
    position: "absolute" as const, right: 10, top: 8,
    fontSize: 7, fontWeight: 700, color: T.purple,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.05em",
  },
  thirdPlaceStatus: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: "0.72rem", color: T.textSub,
  },

  // ── Popup ──
  overlay: {
    position: "fixed" as const, inset: 0,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, animation: "overlayIn 0.15s ease",
  },
  popup: {
    background: "#16161a", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: "28px 28px 22px",
    width: "100%", maxWidth: 480, position: "relative" as const,
    animation: "fadeIn 0.2s ease",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    maxHeight: "90vh", overflowY: "auto" as const,
  },
  closeBtn: {
    position: "absolute" as const, top: 16, right: 16,
    width: 30, height: 30, borderRadius: "50%",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: T.textSub, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  popupHeader: { marginBottom: 16 },
  popupEyebrow: {
    display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" as const,
    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: T.textSub, marginBottom: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: "50%" },
  byeTag: {
    background: "rgba(255,255,255,0.06)", padding: "1px 7px",
    borderRadius: 4, fontSize: "0.65rem", color: T.textMuted,
    letterSpacing: 1, border: "1px solid rgba(255,255,255,0.1)",
  },
  popupTitle: { fontSize: "1.1rem", fontWeight: 800, color: T.text, letterSpacing: "-0.01em" },

  teamsDisplay: { display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16 },
  teamRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px", borderRadius: 10, border: "1px solid",
  },
  teamRowLeft: { display: "flex", alignItems: "center", gap: 10 },
  teamRowSlot: {
    width: 28, height: 28, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.72rem", fontWeight: 700, flexShrink: 0,
  },
  teamRowName: { fontSize: "0.9rem" },
  teamRowScore: { fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 },

  scoreSection: {
    marginBottom: 14, padding: "14px 16px",
    background: T.accentDim, border: `1px solid ${T.accentBorder}`, borderRadius: 14,
  },
  scoreSectionLabel: {
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: T.accent, marginBottom: 12,
  },
  scoreGrid: {
    display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 12,
  },
  scoreInputWrap: { flex: "1 1 120px", display: "flex", flexDirection: "column" as const, gap: 6 },
  scoreInputLabel: { fontSize: "0.72rem", color: T.textSub, fontWeight: 600 },
  scoreCounter: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.06)", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
  },
  counterBtn: {
    width: 34, height: 34, border: "none",
    background: "transparent", color: T.text,
    fontSize: "1.1rem", fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },
  counterVal: {
    flex: 1, textAlign: "center" as const,
    fontSize: "1rem", fontWeight: 800, color: T.text,
  },
  positionSelect: {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: T.text, fontSize: "0.82rem", fontFamily: "inherit",
    cursor: "pointer",
  },

  winnerBanner: {
    display: "flex", flexDirection: "column" as const, gap: 4,
    padding: "10px 14px", borderRadius: 10,
    marginBottom: 14,
  },

  popupActions: { display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 14 },
  actionBtn: {
    width: "100%", padding: "11px 16px", borderRadius: 11,
    border: "1px solid", fontFamily: "inherit",
    fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  actionSpinner: {
    width: 13, height: 13, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "currentColor", animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },

  timingRow: { display: "flex", flexDirection: "column" as const, gap: 5 },
  timingItem: { display: "flex", alignItems: "center", gap: 5 },

  scheduleSection: {
    marginBottom: 14, padding: "14px 16px",
    background: "rgba(96,165,250,0.06)",
    border: "1px solid rgba(96,165,250,0.2)", borderRadius: 14,
  },
  scheduleSectionLabel: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: T.blue, marginBottom: 12,
  },
  scheduleInputRow: { display: "flex", gap: 10, marginBottom: 12 },
  scheduleInputWrap: { flex: 1, display: "flex", flexDirection: "column" as const, gap: 5 },
  scheduleLabel: {
    fontSize: "0.68rem", color: T.textSub, fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.06em",
  },
  scheduleInput: {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: T.text, fontSize: "0.85rem", fontFamily: "inherit",
    colorScheme: "dark" as const,
    boxSizing: "border-box" as const,
  },

  // ── Bye match info card ──
  byeInfoCard: {
    marginBottom: 14, padding: "14px 16px", borderRadius: 12,
    background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)",
  },
  byeInfoTitle: {
    fontSize: "0.82rem", fontWeight: 700, color: T.textSub, marginBottom: 4,
  },
  byeInfoSub: { fontSize: "0.75rem", color: T.textMuted, lineHeight: 1.5 },
  byeAdvancedBadge: {
    display: "inline-block", marginTop: 8,
    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em",
    padding: "2px 8px", borderRadius: 4,
    background: "rgba(34,197,94,0.12)", color: T.green, border: "1px solid rgba(34,197,94,0.25)",
  },

  // ── 1v1 result section ──
  resultSection: {
    marginBottom: 14, padding: "14px 16px", borderRadius: 14,
    background: "rgba(250,71,21,0.05)", border: `1px solid ${T.accentBorder}`,
    display: "flex", flexDirection: "column" as const, gap: 12,
  },
  resultSectionLabel: {
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: T.accent,
  },
  methodTabs: {
    display: "flex", gap: 6, flexWrap: "wrap" as const,
  },
  methodTab: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "6px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: T.textSub, fontSize: "0.78rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
  },
  methodTabActive: {
    background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent,
  },
  resultSubLabel: {
    fontSize: "0.78rem", color: T.textSub, fontWeight: 600,
  },
  teamPickGrid: {
    display: "flex", gap: 8, flexWrap: "wrap" as const,
  },
  teamPickBtn: {
    flex: 1, minWidth: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
    padding: "12px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: T.text, fontSize: "0.85rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
    textAlign: "left" as const,
  },
  teamPickBtnName: { flex: 1 },
  teamPickBtnWinner: {
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: T.green,
  },
  teamPickBtnLoser: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171",
  },
  winnerPreview: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 12px", borderRadius: 8,
    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
    fontSize: "0.82rem", color: T.textSub,
  },

  // ── Win method badge (in completed banner) ──
  winMethodBadge: {
    display: "flex", alignItems: "center", gap: 4,
    padding: "2px 8px", borderRadius: 4, marginTop: 6,
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase" as const, color: T.textMuted,
    alignSelf: "flex-start" as const,
  },
}
