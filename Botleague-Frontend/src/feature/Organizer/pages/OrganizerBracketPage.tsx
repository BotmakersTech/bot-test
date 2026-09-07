import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { useMatches } from "../../Admin/hooks/useMatches"
import { useOrganizerSportDetail } from "../hooks/useOrganizerSportDetail"
import { ORG } from "../theme/organizerTheme"
import type { RootState } from "../../../app/store"
import { hasRole, AppRole } from "../../../shared/constants/roles"
import {
  Trophy, X, Zap, CheckCircle2, Play,
  Clock, Swords, Shuffle, ChevronRight,
  AlertTriangle, RefreshCw, Calendar,
  BarChart2, Hand, Scale, Flag, Ban,
  Lock, Unlock, PartyPopper, Medal, Printer, Maximize2
} from "lucide-react"
import type {
  MatchDTO,
  MatchType,
  MatchResultType,
  TournamentFormat,
  SubmitMatchResultDTO
} from "../../Admin/api/adminMatches.api"

import {
  getBracketLayout,
  getTeams,
  BOX_W_1V1,
  slotCount,
  largestMatchType,
  previewBracket,
  headlineMatchWarning,
} from "../../Matches/bracketLayout"
import { getLeaderboard } from "../../Leaderboard/api/leaderboard.api"

// =====================================================
// TOKENS
// =====================================================

const T = {
  bg: ORG.pageBg,
  surface: "#ffffff",
  surfaceHover: "#f2f6fd",
  border: "rgba(75,134,232,0.22)",
  borderHover: "rgba(75,134,232,0.45)",
  brand: "#0162d1",
  brandDim: "rgba(1,98,209,0.08)",
  brandBorder: "rgba(1,98,209,0.3)",
  accent: "#e04b4b",
  accentDim: "rgba(224,75,75,0.08)",
  accentBorder: "rgba(224,75,75,0.3)",
  gold: "#a16207",
  goldDim: "rgba(161,98,7,0.1)",
  goldBorder: "rgba(161,98,7,0.3)",
  green: "#1fa952",
  blue: "#4b86e8",
  purple: "#8c6cff",
  text: "#111111",
  textMuted: "#7c7c7c",
  textSub: "#5d5d5d",
}

// =====================================================
// LAYOUT CONSTANTS
// =====================================================

// Box sizes and the layout math are shared with the other bracket
// renderers — see feature/Matches/bracketLayout. The gaps below are this
// screen's own visual rhythm, so they are passed in as parameters.
const H_GAP = 80
const V_GAP = 20

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

// minTeams is 2 for EVERY type, matching handleGenerateBracket's own < 2 guard.
// Triple Threat and Fatal Four no longer need 3 or 4 entrants: the backend
// partitions each round into matches of 2..S competitors, so any field of 2 or
// more generates cleanly and without byes.
//
// The real hazard is different and is surfaced as a WARNING rather than a
// block: for some small fields the chosen format never actually occurs (Triple
// Threat with 4 teams is all 1v1; Fatal Four with 5, 6 or 9 teams produces no
// 4-way at all). That is computed from the simulated partition — see
// headlineMatchWarning — never from a hardcoded list of team counts.
const MATCH_TYPE_OPTIONS: { value: MatchType; label: string; desc: string; minTeams: number }[] = [
  { value: "ONE_VS_ONE",    label: "1v1",           desc: "Head-to-head",          minTeams: 2 },
  { value: "TRIPLE_THREAT", label: "Triple Threat", desc: "Up to 3 per match",     minTeams: 2 },
  { value: "FATAL_FOUR",    label: "Fatal Four",    desc: "Up to 4 per match",     minTeams: 2 },
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
    lockMatchScore,
    unlockMatchScore,
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

  // The organiser's chosen tournament-wide match type is persisted on
  // EventSports.bracketMatchType and surfaced on the leaderboard response. It
  // is NOT recoverable from any single match row — a partitioned bracket tags
  // every row with its own participant count — so the bracket header reads it
  // from here, falling back to the widest type present if the fetch fails.
  const [persistedBracketType, setPersistedBracketType] = useState<MatchType | null>(null)

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
  const canvasRef = useRef<HTMLDivElement>(null)

  // ── Pan / zoom canvas — drag OR wheel to PAN; zoom is on the +/− buttons only ──
  const ZOOM_MIN = 0.25
  const ZOOM_MAX = 2.5
  const ZOOM_STEP = 0.1
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const dragStateRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 })
  const hasDraggedRef = useRef(false)

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100))
  const zoomIn = () => setZoom(z => clampZoom(z + ZOOM_STEP))
  const zoomOut = () => setZoom(z => clampZoom(z - ZOOM_STEP))

  // The wheel PANS the canvas now (both axes). It used to zoom, which fired on
  // an ordinary scroll and yanked the view around — zoom is the +/− buttons.
  // Bound natively with { passive: false } so preventDefault is honoured and the
  // page behind the canvas doesn't scroll at the same time.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [view, loading])

  // Scale the whole bracket down to fit the visible canvas, then centre it.
  const fitToView = () => {
    const el = canvasRef.current
    if (!el) return
    const contentW = svgW + 40
    const contentH = svgH + 60
    if (contentW <= 0 || contentH <= 0) return
    const next = clampZoom(Math.min((el.clientWidth - 48) / contentW, (el.clientHeight - 48) / contentH, 1))
    setZoom(next)
    setPan({
      x: Math.max(24, (el.clientWidth - contentW * next) / 2),
      y: Math.max(24, (el.clientHeight - contentH * next) / 2),
    })
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)
    hasDraggedRef.current = false
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const dx = e.clientX - dragStateRef.current.startX
    const dy = e.clientY - dragStateRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDraggedRef.current = true
    if (hasDraggedRef.current) {
      setPan({ x: dragStateRef.current.panX + dx, y: dragStateRef.current.panY + dy })
    }
  }

  const handleCanvasMouseUp = () => setIsPanning(false)

  const resetCanvasView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  /** Match boxes check this before opening the popup, so a pan-drag that started on a box doesn't also click it. */
  const guardedClick = (fn: () => void) => () => { if (!hasDraggedRef.current) fn() }

  const selectedMatch = selectedMatchId
    ? matches.find(m => m.matchId === selectedMatchId) ?? null
    : null

  const isMultiTeam = selectedMatch?.matchType === "TRIPLE_THREAT" || selectedMatch?.matchType === "FATAL_FOUR"
  const isFatalFour = selectedMatch?.matchType === "FATAL_FOUR"

  // A match may only start once EVERY one of its own slots is filled. Gating on
  // teamA && teamB alone let a Triple Threat / Fatal Four match go LIVE with an
  // empty C or D slot, showing "TBD" as a competitor.
  const selectedMatchSlots = selectedMatch ? slotCount(selectedMatch.matchType) : 0
  const selectedMatchFilledSlots = selectedMatch
    ? getTeams(selectedMatch).filter(t => !!t.id).length
    : 0
  const selectedMatchIsFull = !!selectedMatch && selectedMatchFilledSlots === selectedMatchSlots

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

  // ── Persisted tournament-wide match type (for the bracket header) ──
  // Best-effort: the leaderboard response carries EventSports.bracketMatchType.
  // A failure here is not worth surfacing — the header falls back to the widest
  // match type actually present, which is the backend's own fallback too.
  const hasBracket = matches.length > 0
  useEffect(() => {
    if (!sportId || !hasBracket) return
    let cancelled = false
    getLeaderboard("", sportId)
      .then(res => {
        const t = res?.matchType
        if (cancelled) return
        if (t === "ONE_VS_ONE" || t === "TRIPLE_THREAT" || t === "FATAL_FOUR") {
          setPersistedBracketType(t)
        }
      })
      .catch(() => { /* fall back to largest-present */ })
    return () => { cancelled = true }
  }, [sportId, hasBracket])

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
  // LOCK / UNLOCK SCORE
  // =====================================================

  const handleLockScore = async () => {
    if (!selectedMatchId) return
    setActionError(null)
    try {
      await lockMatchScore(selectedMatchId)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to lock match score"))
    }
  }

  const handleUnlockScore = async () => {
    if (!selectedMatchId) return
    setActionError(null)
    try {
      await unlockMatchScore(selectedMatchId)
      await refreshMatches()
    } catch (err: any) {
      setActionError(describeActionError(err, "Failed to unlock match score"))
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

  const { rounds, positions, svgW, svgH, roundLabels } = getBracketLayout(matches, { hGap: H_GAP, vGap: V_GAP, roundLabel })

  // The bracket's identity cannot be read off an arbitrary row any more.
  //   • Team count is NOT rounds[0].length * 2 — a partitioned round holds
  //     ceil(teams / S) matches of 2..S competitors, so the field size is the
  //     sum of each round-1 match's OWN slot count.
  //   • The label is NOT matches[0].matchType — round 1 match 1 is deliberately
  //     the SMALLEST match of the round, so a 10-team Triple Threat bracket
  //     would report itself as 1v1.
  // Prefer the persisted tournament-wide type; fall back to the widest type
  // actually present, exactly as LeaderboardService does for legacy brackets.
  const bracketTeamCount = (rounds[0] ?? []).reduce((n, m) => n + slotCount(m.matchType), 0)
  const bracketType = persistedBracketType ?? largestMatchType(matches)

  const bracketTitle =
    rounds.length > 0
      ? `${bracketTeamCount}-Team ${
          matches[0]?.tournamentFormat === "DOUBLE_ELIMINATION" ? "Double Elimination" : "Single Elimination"
        } · ${matchTypeLabel(bracketType)}`
      : "Tournament Bracket"

  // Open the bracket SVG in a clean window at natural size and print it
  // (the browser's print dialog also covers "Save as PDF").
  const printBracket = () => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.removeAttribute("style")
    clone.setAttribute("width", String(svgW + 40))
    clone.setAttribute("height", String(svgH + 60))
    const markup = new XMLSerializer().serializeToString(clone)
    const win = window.open("", "_blank", "width=1200,height=800")
    if (!win) return
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${bracketTitle}</title>` +
      `<style>@page{size:landscape;margin:12mm}` +
      `body{margin:0;padding:24px;font-family:'Inter',system-ui,sans-serif;color:#111}` +
      `h1{font-size:16px;margin:0 0 16px}svg{max-width:100%;height:auto}</style></head>` +
      `<body><h1>${bracketTitle}</h1>${markup}</body></html>`
    )
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 350)
  }

  // Connector lines — traditional straight right-angle elbows, solid.
  // Only winner-advancement (nextMatchId) edges are drawn; loser-routing
  // (loserNextMatchId, double elimination) is intentionally left un-lined so
  // the losers bracket reads as its own tree instead of crossing the winners.
  const lines: { x1: number; y1: number; x2: number; y2: number; hot: boolean }[] = []
  matches.forEach(m => {
    if (m.nextMatchId && positions[m.matchId] && positions[m.nextMatchId]) {
      const from = positions[m.matchId]
      const to = positions[m.nextMatchId]
      lines.push({
        x1: from.x + from.w,
        y1: from.y + from.h / 2,
        x2: to.x,
        y2: to.y + to.h / 2,
        hot: m.status === "COMPLETED" && !!m.winnerRegistrationId,
      })
    }
  })

  // Champion = the DECISIVE grand final (the bracket-reset rematch if one
  // was played, otherwise the original grand final; exclude 3rd place).
  const grandFinalResults = matches.filter(
    m => !m.nextMatchId
      && m.leaderboardPosition !== 3
      && m.status === "COMPLETED"
      && m.winnerRegistrationId
  )
  const champion = grandFinalResults.find(m => m.isBracketReset) ?? grandFinalResults[0]

  // 3rd place match — derived at component level, NOT inside getBracketLayout
  const thirdPlaceMatch = matches.find(m => m.leaderboardPosition === 3) ?? null

  const minTeams = MATCH_TYPE_OPTIONS.find(o => o.value === matchType)?.minTeams ?? 2

  // What the backend will ACTUALLY generate for the current selection, and the
  // warning (if any) that the chosen format will never occur in it.
  const preview = previewBracket(orderedTeams.length, matchType)
  const formatWarning = headlineMatchWarning(preview)

  // =====================================================
  // SETUP VIEW
  // =====================================================

  if (view === "setup") {
    return (
      <div className="p-8" style={styles.page}>
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
                  onClick={() => {
                    setTournamentFormat(opt.value)
                    if (opt.value === "DOUBLE_ELIMINATION") setMatchType("ONE_VS_ONE")
                  }}
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
                const tooFewTeams = orderedTeams.length < opt.minTeams
                const notOneVsOneInDoubleElim = tournamentFormat === "DOUBLE_ELIMINATION" && opt.value !== "ONE_VS_ONE"
                const disabled = tooFewTeams || notOneVsOneInDoubleElim
                // Not a reason to disable the option — just a heads-up on it.
                const noHeadlineMatch = disabled
                  ? null
                  : headlineMatchWarning(previewBracket(orderedTeams.length, opt.value))
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
                    title={
                      notOneVsOneInDoubleElim ? "Double Elimination only supports 1v1 matches"
                        : tooFewTeams ? `A bracket needs at least ${opt.minTeams} teams`
                        : noHeadlineMatch ?? undefined
                    }
                  >
                    <span style={styles.optionBtnLabel}>{opt.label}</span>
                    <span style={styles.optionBtnDesc}>{opt.desc}</span>
                    {noHeadlineMatch && (
                      <span style={{ ...styles.optionBtnDesc, color: T.gold, marginTop: 2 }}>
                        Never occurs at {orderedTeams.length} teams
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {tournamentFormat === "DOUBLE_ELIMINATION" && (
            <div style={{ ...styles.errorBanner, background: "rgba(75,134,232,0.08)", borderColor: "rgba(75,134,232,0.25)", color: T.blue }}>
              <AlertTriangle size={14} />
              Double Elimination is 1v1 only. Teams get a second chance in the losers bracket after their first loss — the bracket below will show both.
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
                  <div style={styles.seedName}>{team.robotName || team.teamName}</div>
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

          {/* What will ACTUALLY be generated. Size / Rounds / Byes are
              power-of-2 facts and belong to 1v1 only. Triple Threat and Fatal
              Four are partitioned — ceil(field / S) matches per round, sizes
              differing by at most 1, and no byes — so they show their real
              round-1 shape, round count and match count instead. */}
          <div style={styles.bracketPreviewInfo}>
            {(preview.powerOfTwo
              ? [
                  { label: "Teams",   val: String(preview.teams) },
                  { label: "Size",    val: String(preview.bracketSize) },
                  { label: "Rounds",  val: String(preview.totalRounds) },
                  { label: "Byes",    val: String(preview.byes) },
                ]
              : [
                  { label: "Teams",   val: String(preview.teams) },
                  { label: "Round 1", val: preview.firstRoundShape || "—" },
                  { label: "Rounds",  val: String(preview.totalRounds) },
                  { label: "Matches", val: String(preview.totalMatches) },
                  { label: "Byes",    val: "No byes" },
                ]
            ).flatMap((item, i, arr) => [
              <div key={item.label} style={styles.previewInfoItem}>
                <span style={styles.previewInfoLabel}>{item.label}</span>
                <span style={styles.previewInfoVal}>{item.val}</span>
              </div>,
              ...(i < arr.length - 1
                ? [<ChevronRight key={`sep-${item.label}`} size={14} color={T.textMuted} />]
                : []),
            ])}
          </div>

          {/* The whole shape, round by round — makes it plain that the fan-in
              is not 2 and that a 4-way format can still end in a 1v1 final. */}
          {!preview.powerOfTwo && preview.roundSizes.length > 1 && (
            <p style={{ margin: "-8px 0 16px", textAlign: "center", fontSize: "0.75rem", color: T.textMuted }}>
              {preview.roundSizes.map(r => r.join(" + ")).join("  →  ")}
            </p>
          )}

          {/* A warning, not a block: the bracket generates fine and every match
              is a real contest — it just will not contain the format that was
              picked. Derived from the simulated partition above. */}
          {formatWarning && (
            <div style={{ ...styles.errorBanner, background: T.goldDim, borderColor: T.goldBorder, color: T.gold }}>
              <AlertTriangle size={14} />
              {formatWarning}
            </div>
          )}

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
              At least {minTeams} registered teams are required to generate a bracket.
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
    <div className="p-8" style={styles.page}>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Tournament Bracket</div>
          <h2 style={styles.title}>{bracketTitle}</h2>
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
          <button style={styles.regenBtn} onClick={printBracket} title="Print / save as PDF">
            <Printer size={12} />
            Print
          </button>
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
          <PartyPopper size={18} color={T.gold} />
        </div>
      )}

      {/* ── BRACKET SVG (pan/zoom canvas — drag or wheel to pan; +/− to zoom) ── */}
      <div
        ref={canvasRef}
        style={{
          ...styles.svgScroll,
          position: "relative",
          height: "65vh",
          minHeight: 420,
          overflow: "hidden",
          cursor: isPanning ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          background: T.surface,
          boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        data-testid="bracket-canvas"
      >
        <svg
          ref={svgRef}
          width={svgW + 40}
          height={svgH + 60}
          style={{
            display: "block",
            overflow: "visible",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.16s ease-out",
            willChange: "transform",
          }}
        >
          {/* Round labels */}
          {rounds.map((round, ri) => {
            const pos0 = positions[round[0]?.matchId]
            return (
              <text
                key={ri}
                x={(pos0?.x ?? 0) + (pos0?.w ?? BOX_W_1V1) / 2 + 20}
                y={(pos0?.y ?? 0) + 18}
                textAnchor="middle"
                fill={ri === rounds.length - 1 ? T.brand : T.textMuted}
                fontSize={11}
                fontWeight={700}
                fontFamily="'Inter', sans-serif"
                letterSpacing={1.5}
                style={{ textTransform: "uppercase" }}
              >
                {roundLabels[ri] ?? roundLabel(ri, rounds.length)}
              </text>
            )
          })}

          <g transform="translate(20, 28)">

            {/* Connector lines — straight right-angle elbows, solid */}
            {lines.map((l, i) => {
              const midX = Math.round((l.x1 + l.x2) / 2)
              return (
                <path
                  key={i}
                  d={`M ${l.x1} ${l.y1} H ${midX} V ${l.y2} H ${l.x2}`}
                  fill="none"
                  stroke={l.hot ? T.brand : "#c9d4ec"}
                  strokeWidth={l.hot ? 2 : 1.5}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  shapeRendering="crispEdges"
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
                  onClick={guardedClick(() => { setActionError(null); setSelectedMatchId(match.matchId) })}
                  style={{ cursor: "pointer" }}
                >
                  {isSelected && (
                    <rect
                      x={x - 3} y={y - 3}
                      width={w + 6} height={h + 6}
                      rx={16} ry={16}
                      fill={T.brandDim}
                      stroke={T.brand}
                      strokeWidth={1}
                      opacity={0.6}
                    />
                  )}

                  <rect
                    x={x} y={y} width={w} height={h}
                    rx={13} ry={13}
                    fill={isBye ? "#f6f8fd" : isSelected ? "#eaf1fd" : T.surface}
                    stroke={isSelected ? T.brand : isLive ? "rgba(224,75,75,0.5)" : "rgba(75,134,232,0.18)"}
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
                            stroke="rgba(17,17,17,0.08)"
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

                  {champion?.matchId === match.matchId && (
                    <svg x={x + w / 2 - 7} y={y - 21} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v9a6 6 0 01-12 0V4z" />
                      <path d="M12 19v3M8 22h8" />
                    </svg>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Zoom controls (bottom-right) — zoom lives here, not on the wheel */}
        <div style={styles.zoomControls}>
          <button
            type="button"
            style={{ ...styles.zoomBtn, opacity: zoom <= ZOOM_MIN ? 0.4 : 1, cursor: zoom <= ZOOM_MIN ? "not-allowed" : "pointer" }}
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            title="Zoom out"
          >−</button>
          <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            style={{ ...styles.zoomBtn, opacity: zoom >= ZOOM_MAX ? 0.4 : 1, cursor: zoom >= ZOOM_MAX ? "not-allowed" : "pointer" }}
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            title="Zoom in"
          >+</button>
          <button type="button" style={styles.zoomResetBtn} onClick={fitToView} title="Fit to screen">
            <Maximize2 size={12} />
          </button>
          <button type="button" style={styles.zoomResetBtn} onClick={resetCanvasView} title="Reset to 100%">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* ── 3RD PLACE MATCH (below bracket SVG) ── */}
      {thirdPlaceMatch && (
        <div style={styles.thirdPlaceWrap}>
          <div style={{ ...styles.thirdPlaceLabel, display: "flex", alignItems: "center", gap: 5 }}><Medal size={13} /> 3rd Place Match</div>

          <div
            onClick={() => { setActionError(null); setSelectedMatchId(thirdPlaceMatch.matchId) }}
            style={{
              ...styles.thirdPlaceCard,
              background: selectedMatchId === thirdPlaceMatch.matchId ? "#eaf1fd" : T.surface,
              border: `1px solid ${
                selectedMatchId === thirdPlaceMatch.matchId
                  ? T.brand
                  : "rgba(140,108,255,0.35)"
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
                      ? "1px solid rgba(17,17,17,0.07)"
                      : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 700,
                      background: isWinner ? "rgba(31,169,82,0.14)" : "rgba(75,134,232,0.07)",
                      color: isWinner ? T.green : T.textMuted,
                    }}>
                      {isWinner ? <Medal size={12} /> : String.fromCharCode(64 + team.slot)}
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
              <span style={{ color: T.purple, marginLeft: 6, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Medal size={12} /> {resolveWinnerName(thirdPlaceMatch)} takes 3rd
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
                      ? "rgba(140,108,255,0.12)" : "rgba(161,98,7,0.1)",
                    color: selectedMatch.matchType === "FATAL_FOUR" ? T.purple : T.gold,
                    borderColor: selectedMatch.matchType === "FATAL_FOUR"
                      ? "rgba(140,108,255,0.25)" : "rgba(161,98,7,0.25)",
                  }}>
                    {matchTypeLabel(selectedMatch.matchType)}
                  </span>
                )}
                {selectedMatch.leaderboardPosition === 1 && (
                  <span style={{ ...styles.byeTag, background: "rgba(161,98,7,0.12)", color: T.gold, borderColor: "rgba(161,98,7,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Trophy size={11} /> Grand Final
                  </span>
                )}
                {selectedMatch.leaderboardPosition === 3 && (
                  <span style={{ ...styles.byeTag, background: "rgba(140,108,255,0.12)", color: T.purple, borderColor: "rgba(140,108,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Medal size={11} /> 3rd Place
                  </span>
                )}
                {selectedMatch.isBracketReset && (
                  <span style={{ ...styles.byeTag, background: T.brandDim, color: T.brand, borderColor: T.brandBorder }}>
                    Bracket Reset
                  </span>
                )}
                {selectedMatch.scoreLocked && (
                  <span style={{ ...styles.byeTag, background: T.accentDim, color: T.accent, borderColor: T.accentBorder, display: "flex", alignItems: "center", gap: 4 }}>
                    <Lock size={10} /> Score Locked
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={styles.popupTitle}>
                  Round {selectedMatch.roundNumber} — Match {selectedMatch.matchNumber}
                  {selectedMatch.bracketSide && (
                    <span style={{ fontSize: "0.72rem", color: T.textMuted, fontWeight: 400, marginLeft: 8 }}>
                      [{selectedMatch.bracketSide.replace("_", " ")}]
                    </span>
                  )}
                </div>
                {canApprove && selectedMatch.status !== "COMPLETED" && selectedMatch.status !== "CANCELLED" && (
                  selectedMatch.scoreLocked ? (
                    <button
                      style={{ ...styles.actionBtn, background: "rgba(31,169,82,0.12)", borderColor: "rgba(31,169,82,0.3)", color: T.green, opacity: updateLoading ? 0.5 : 1 }}
                      onClick={handleUnlockScore}
                      disabled={updateLoading}
                    >
                      <Unlock size={13} /> Unlock Score
                    </button>
                  ) : (
                    <button
                      style={{ ...styles.actionBtn, background: T.accentDim, borderColor: T.accentBorder, color: T.accent, opacity: updateLoading ? 0.5 : 1 }}
                      onClick={handleLockScore}
                      disabled={updateLoading}
                    >
                      <Lock size={13} /> Lock Score
                    </button>
                  )
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
                    background: isWinner ? "rgba(31,169,82,0.07)" : "rgba(75,134,232,0.05)",
                    borderColor: isWinner ? "rgba(31,169,82,0.25)" : "rgba(75,134,232,0.18)",
                  }}>
                    <div style={styles.teamRowLeft}>
                      <div style={{
                        ...styles.teamRowSlot,
                        background: isWinner ? "rgba(31,169,82,0.14)" : "rgba(75,134,232,0.07)",
                        color: isWinner ? T.green : T.textMuted,
                      }}>
                        {isWinner
                          ? (selectedMatch.leaderboardPosition === 3 ? <Medal size={13} /> : <Trophy size={13} />)
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
                    background: "rgba(75,134,232,0.12)",
                    borderColor: "rgba(75,134,232,0.3)",
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
                        style={{ ...styles.actionBtn, flex: 1, background: "rgba(75,134,232,0.12)", borderColor: "rgba(75,134,232,0.3)", color: T.blue, opacity: updateLoading ? 0.5 : 1 }}
                        onClick={handleSaveScore}
                        disabled={updateLoading}
                      >
                        <Swords size={14} /> Save Score
                      </button>
                      <button
                        style={{ ...styles.actionBtn, flex: 1, background: "rgba(31,169,82,0.12)", borderColor: "rgba(31,169,82,0.3)", color: T.green, opacity: updateLoading ? 0.5 : 1 }}
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
                      style={{ ...styles.actionBtn, background: "rgba(31,169,82,0.12)", borderColor: "rgba(31,169,82,0.3)", color: T.green, opacity: updateLoading || !judgeWinnerId ? 0.5 : 1 }}
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
                      style={{ ...styles.actionBtn, background: "rgba(31,169,82,0.12)", borderColor: "rgba(31,169,82,0.3)", color: T.green, opacity: updateLoading || !losingTeamId ? 0.5 : 1 }}
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
                    style={{ ...styles.actionBtn, background: "rgba(75,134,232,0.15)", borderColor: "rgba(75,134,232,0.3)", color: T.blue, opacity: updateLoading ? 0.5 : 1 }}
                    onClick={handleSaveScore}
                    disabled={updateLoading}
                  >
                    <Swords size={14} /> Save Score
                  </button>
                </div>

                {/* Finish positions */}
                <div style={{ ...styles.scoreSection, marginTop: 10, background: "rgba(140,108,255,0.06)", borderColor: "rgba(140,108,255,0.2)" }}>
                  <div style={{ ...styles.scoreSectionLabel, color: T.purple }}>Finish Positions</div>
                  <div style={styles.scoreGrid}>
                    {[
                      { color: "#eab308", label: "1st Place", val: pos1, set: setPos1 },
                      { color: "#9ca3af", label: "2nd Place", val: pos2, set: setPos2 },
                      { color: "#b45309", label: "3rd Place", val: pos3, set: setPos3 },
                      ...(isFatalFour ? [{ color: undefined, label: "4th Place", val: pos4, set: setPos4 }] : []),
                    ].map(({ color, label, val, set }) => (
                      <div key={label} style={styles.scoreInputWrap}>
                        <div style={{ ...styles.scoreInputLabel, display: "flex", alignItems: "center", gap: 4 }}>
                          {color && <Medal size={12} color={color} />} {label}
                        </div>
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
                    style={{ ...styles.actionBtn, background: "rgba(31,169,82,0.12)", borderColor: "rgba(31,169,82,0.3)", color: T.green, marginTop: 6, opacity: updateLoading ? 0.5 : 1 }}
                    onClick={handleSubmitResult}
                    disabled={updateLoading}
                  >
                    {updateLoading ? <><div style={styles.actionSpinner} /> Submitting…</> : <><CheckCircle2 size={14} /> Submit Result &amp; Advance</>}
                  </button>
                </div>
              </>
            )}

            {/* ── READ-ONLY SCORES (COMPLETED multi-team) ── */}
            {selectedMatch.status === "COMPLETED" && isMultiTeam && (
              <div style={{ ...styles.scoreSection, background: "rgba(75,134,232,0.05)", borderColor: "rgba(75,134,232,0.18)", marginBottom: 14 }}>
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
                  ? "rgba(140,108,255,0.1)"
                  : "rgba(161,98,7,0.1)",
                borderColor: selectedMatch.leaderboardPosition === 3
                  ? "rgba(140,108,255,0.25)"
                  : "rgba(161,98,7,0.25)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedMatch.leaderboardPosition === 3
                    ? <Medal size={16} color="#b45309" />
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
                <>
                <button
                  style={{
                    ...styles.actionBtn,
                    background: T.accentDim,
                    borderColor: T.accentBorder,
                    color: T.accent,
                    opacity: updateLoading || !selectedMatchIsFull ? 0.5 : 1,
                  }}
                  onClick={handleStart}
                  disabled={updateLoading || !selectedMatchIsFull}
                  title={
                    selectedMatchIsFull
                      ? undefined
                      : `${matchTypeLabel(selectedMatch.matchType)} needs ${selectedMatchSlots} competitors — ${selectedMatchFilledSlots} of ${selectedMatchSlots} slots filled.`
                  }
                >
                  {updateLoading
                    ? <><div style={styles.actionSpinner} /> Starting…</>
                    : <><Play size={14} /> Start Match</>
                  }
                </button>
                {!selectedMatchIsFull && (
                  <p style={{ width: "100%", margin: 0, fontSize: "0.72rem", color: T.textMuted, textAlign: "center" }}>
                    {selectedMatchFilledSlots} of {selectedMatchSlots} slots filled — every competitor must be resolved before this match can start.
                  </p>
                )}
                </>
              )}

              {/* Cancel */}
              {(selectedMatch.status === "SCHEDULED" || selectedMatch.status === "LIVE") && (
                <button
                  style={{
                    ...styles.actionBtn,
                    background: "rgba(75,134,232,0.06)",
                    borderColor: "rgba(75,134,232,0.2)",
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
    fontFamily: "'Inter', system-ui, sans-serif",
    color: T.text,
  },

  loadingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "60vh", gap: 16,
  },
  loadingSpinner: {
    width: 32, height: 32, borderRadius: "50%",
    border: "2px solid rgba(75,134,232,0.15)",
    borderTopColor: T.brand, animation: "spin 0.8s linear infinite",
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
    background: T.surface,
    border: `1px solid ${T.border}`,
    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
    color: T.text, cursor: "pointer", fontFamily: "inherit",
    textAlign: "left" as const, transition: "all 0.15s",
  },
  optionBtnActive: {
    background: T.brandDim,
    border: `1px solid ${T.brandBorder}`,
  },
  optionBtnLabel: { fontSize: "0.88rem", fontWeight: 700, color: T.text },
  optionBtnDesc: { fontSize: "0.72rem", color: T.textMuted },

  seedCard: {
    background: T.surface, border: `1px solid ${T.border}`,
    boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    borderRadius: 16, overflow: "hidden", marginBottom: 18,
  },
  seedCardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: "1px solid rgba(75,134,232,0.15)",
  },
  seedCardTitle: {
    fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase" as const, color: T.textSub,
  },
  shuffleBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 13px", borderRadius: 8,
    background: T.brandDim, border: `1px solid ${T.brandBorder}`,
    color: T.brand, fontSize: "0.78rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  seedList: { padding: "8px 0" },
  seedRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "9px 18px", borderBottom: "1px solid rgba(75,134,232,0.1)",
  },
  seedNum: {
    width: 24, height: 24, borderRadius: "50%",
    background: "rgba(75,134,232,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.72rem", fontWeight: 700, color: T.textMuted, flexShrink: 0,
  },
  seedName: { flex: 1, fontSize: "0.88rem", fontWeight: 600, color: T.text },
  seedBadge: {
    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em",
    padding: "2px 8px", borderRadius: 4,
    background: T.goldDim, color: T.gold, border: `1px solid ${T.goldBorder}`,
  },

  bracketPreviewInfo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 18px", borderRadius: 12,
    background: "rgba(75,134,232,0.05)", border: `1px solid ${T.border}`,
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
    background: T.accentDim, border: `1px solid ${T.accentBorder}`,
    color: T.accent, fontSize: "0.82rem", marginBottom: 14,
  },
  generateBtn: {
    width: "100%", padding: "14px 20px", borderRadius: 13,
    background: ORG.gradientCta,
    border: "none", color: "#fff",
    fontSize: "0.95rem", fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit", boxShadow: ORG.btnShadow,
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
    textTransform: "uppercase" as const, color: T.brand, marginBottom: 4,
  },
  title: { fontSize: "38px", fontWeight: 500, color: "#0162d1", fontFamily: "'Sarpanch', sans-serif", margin: 0, letterSpacing: "-0.02em" },
  legend: { display: "flex", gap: 16, alignItems: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: "50%" },
  regenBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 13px", borderRadius: 8,
    background: T.surfaceHover, border: `1px solid ${T.border}`,
    color: T.textSub, fontSize: "0.75rem", fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  championBanner: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 18px", borderRadius: 12,
    background: "rgba(161,98,7,0.1)", border: "1px solid rgba(161,98,7,0.3)",
    marginBottom: 20,
  },
  championText: { fontSize: "1rem", fontWeight: 800, color: T.gold },
  svgScroll: {
    overflowX: "auto", overflowY: "visible",
    paddingBottom: 16, scrollbarWidth: "thin" as const,
  },
  zoomControls: {
    position: "absolute" as const, bottom: 14, right: 14,
    display: "flex", alignItems: "center", gap: 5,
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: "6px 8px", boxShadow: "0 4px 16px rgba(15,23,42,0.16)",
  },
  zoomBtn: {
    width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
    background: T.surfaceHover, border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.text, fontSize: "1rem", fontWeight: 700, lineHeight: 1,
    cursor: "pointer", fontFamily: "inherit", padding: 0,
  },
  zoomLabel: {
    fontSize: "0.75rem", fontWeight: 700, color: T.textSub,
    minWidth: 40, textAlign: "center" as const, fontVariantNumeric: "tabular-nums" as const,
  },
  zoomResetBtn: {
    width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
    background: T.surfaceHover, border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.textSub, cursor: "pointer", marginLeft: 2, padding: 0,
  },

  // ── 3rd place match ──
  thirdPlaceWrap: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: "1px solid rgba(140,108,255,0.15)",
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
    boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
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
    background: "#ffffff", border: `1px solid ${T.border}`,
    borderRadius: 20, padding: "28px 28px 22px",
    width: "100%", maxWidth: 480, position: "relative" as const,
    animation: "fadeIn 0.2s ease",
    boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
    maxHeight: "90vh", overflowY: "auto" as const,
  },
  closeBtn: {
    position: "absolute" as const, top: 16, right: 16,
    width: 30, height: 30, borderRadius: "50%",
    background: "rgba(75,134,232,0.08)", border: `1px solid ${T.border}`,
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
    background: "rgba(75,134,232,0.08)", padding: "1px 7px",
    borderRadius: 4, fontSize: "0.65rem", color: T.textMuted,
    letterSpacing: 1, border: `1px solid ${T.border}`,
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
    background: T.surface, borderRadius: 10,
    border: `1px solid ${T.border}`, overflow: "hidden",
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
    background: T.surface,
    border: `1px solid ${T.border}`,
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
    border: "2px solid rgba(17,17,17,0.15)",
    borderTopColor: "currentColor", animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },

  timingRow: { display: "flex", flexDirection: "column" as const, gap: 5 },
  timingItem: { display: "flex", alignItems: "center", gap: 5 },

  scheduleSection: {
    marginBottom: 14, padding: "14px 16px",
    background: "rgba(75,134,232,0.06)",
    border: "1px solid rgba(75,134,232,0.2)", borderRadius: 14,
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
    background: T.surface,
    border: `1px solid ${T.border}`,
    color: T.text, fontSize: "0.85rem", fontFamily: "inherit",
    colorScheme: "light" as const,
    boxSizing: "border-box" as const,
  },

  // ── Bye match info card ──
  byeInfoCard: {
    marginBottom: 14, padding: "14px 16px", borderRadius: 12,
    background: "rgba(75,134,232,0.05)", border: `1px solid ${T.border}`,
  },
  byeInfoTitle: {
    fontSize: "0.82rem", fontWeight: 700, color: T.textSub, marginBottom: 4,
  },
  byeInfoSub: { fontSize: "0.75rem", color: T.textMuted, lineHeight: 1.5 },
  byeAdvancedBadge: {
    display: "inline-block", marginTop: 8,
    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.05em",
    padding: "2px 8px", borderRadius: 4,
    background: "rgba(31,169,82,0.12)", color: T.green, border: "1px solid rgba(31,169,82,0.25)",
  },

  // ── 1v1 result section ──
  resultSection: {
    marginBottom: 14, padding: "14px 16px", borderRadius: 14,
    background: T.accentDim, border: `1px solid ${T.accentBorder}`,
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
    background: T.surfaceHover, border: `1px solid ${T.border}`,
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
    background: T.surface, border: `1px solid ${T.border}`,
    color: T.text, fontSize: "0.85rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
    textAlign: "left" as const,
  },
  teamPickBtnName: { flex: 1 },
  teamPickBtnWinner: {
    background: "rgba(31,169,82,0.1)", border: "1px solid rgba(31,169,82,0.3)", color: T.green,
  },
  teamPickBtnLoser: {
    background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent,
  },
  winnerPreview: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 12px", borderRadius: 8,
    background: "rgba(31,169,82,0.08)", border: "1px solid rgba(31,169,82,0.22)",
    fontSize: "0.82rem", color: T.textSub,
  },

  // ── Win method badge (in completed banner) ──
  winMethodBadge: {
    display: "flex", alignItems: "center", gap: 4,
    padding: "2px 8px", borderRadius: 4, marginTop: 6,
    background: "rgba(75,134,232,0.08)", border: "1px solid rgba(75,134,232,0.2)",
    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
    textTransform: "uppercase" as const, color: T.textMuted,
    alignSelf: "flex-start" as const,
  },
}
