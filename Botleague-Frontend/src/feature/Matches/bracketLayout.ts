// =====================================================
// BRACKET LAYOUT — shared geometry for every bracket renderer
//
// One copy of the math used by:
//   Organizer/pages/OrganizerBracketPage.tsx      (organiser, editable)
//   Admin/components/Creatematch.tsx              (admin, editable)
//   Event/components/detail/BracketGraphView.tsx  (public, read-only)
//
// Only the geometry lives here. Colours, fonts and the per-renderer visual
// rhythm (the horizontal/vertical gaps, the round-label wording) stay in the
// callers and arrive as BracketLayoutOptions, so the three pages can keep
// looking different while agreeing on where every box goes.
//
// ── Why the layout is tree-driven and not a power-of-2 grid ──────────────
// A 1v1 bracket halves every round, so its old layout could get away with
// spacing round r by 2^r slots. TRIPLE_THREAT and FATAL_FOUR no longer work
// that way: the backend (MultiWayBracketPlanner and
// SingleEliminationBracketGenerator.generatePartitioned) PARTITIONS each round
// into matches of 2..S competitors, so a round holds ceil(competitors / S)
// matches and the fan-in is whatever that ratio happens to be — 10 -> 4 -> 2
// -> 1 for Triple Threat, 17 -> 5 -> 2 -> 1 for Fatal Four. There is no
// bracket size and there are no byes.
//
// Two consequences drive everything below:
//
//   1. Fan-in is not 2, and is not even constant between rounds, so positions
//      are read off the ACTUAL source tree (sourceMatchAId..D, or nextMatchId
//      inverted for legacy rows) instead of being computed from the round
//      index. Leaves are stacked in order; every other match is centred on
//      its children. For a 1v1 power-of-2 bracket this reproduces the old
//      spacing exactly, so nothing regresses there.
//
//   2. Every Match row is tagged with the MatchType matching its OWN
//      participant count, so one round column now mixes 72px (1v1), 100px
//      (triple) and 126px (fatal) boxes. Vertical space is therefore
//      accumulated per box, never as one round-wide grid pitch.
//
// Feeder links from the backend are contiguous and ordered by matchNumber, so
// ordering a column by matchNumber (as this module does) draws a planar tree
// with no crossing edges.
// =====================================================

// =====================================================
// BOX SIZES
// Identical in all three renderers, so they live here.
// =====================================================

export const BOX_W_1V1 = 200
export const BOX_W_MULTI = 220
export const BOX_H_1V1 = 72
export const BOX_H_TRIPLE = 100
export const BOX_H_FATAL = 126

export type BracketMatchType = "ONE_VS_ONE" | "TRIPLE_THREAT" | "FATAL_FOUR"

export function getBoxDimensions(matchType?: BracketMatchType): { w: number; h: number } {
  if (matchType === "FATAL_FOUR") return { w: BOX_W_MULTI, h: BOX_H_FATAL }
  if (matchType === "TRIPLE_THREAT") return { w: BOX_W_MULTI, h: BOX_H_TRIPLE }
  return { w: BOX_W_1V1, h: BOX_H_1V1 }
}

// =====================================================
// TYPES
//
// Structural, not tied to one API module: MatchDTO (admin) and PublicMatchView
// (public) both satisfy these, and the layout functions are generic so callers
// get their own concrete match type back out of `rounds`.
// =====================================================

/** The bracket-structure fields the layout reads. */
export interface BracketMatch {
  matchId: string
  matchType?: BracketMatchType
  roundNumber?: number
  matchNumber?: number
  /** WINNERS | LOSERS | GRAND_FINAL | THIRD_PLACE; absent for single elimination. */
  bracketSide?: string
  /** 3 = the 3rd-place match, which every renderer draws separately. */
  leaderboardPosition?: number
  isBracketReset?: boolean
  nextMatchId?: string
  sourceMatchAId?: string
  sourceMatchBId?: string
  sourceMatchCId?: string
  sourceMatchDId?: string
}

/** The competitor fields getTeams reads. */
export interface BracketMatchTeams {
  matchType?: BracketMatchType
  teamARegistrationId?: string
  teamBRegistrationId?: string
  teamCRegistrationId?: string
  teamDRegistrationId?: string
  teamAName?: string
  teamBName?: string
  teamCName?: string
  teamDName?: string
  teamARobotName?: string
  teamBRobotName?: string
  teamCRobotName?: string
  teamDRobotName?: string
  teamAScore?: number
  teamBScore?: number
  teamCScore?: number
  teamDScore?: number
}

export interface BracketTeamSlot {
  id: string | undefined
  name: string | undefined
  score: number | undefined
  slot: 1 | 2 | 3 | 4
}

export interface BoxPosition {
  x: number
  y: number
  w: number
  h: number
}

export interface BracketLayoutOptions {
  /** Horizontal gap between round columns. */
  hGap: number
  /** Vertical gap between two stacked boxes. */
  vGap: number
  /** Each renderer words its round headings its own way. */
  roundLabel: (roundIndex: number, totalRounds: number) => string
}

export interface BracketLayout<M> {
  rounds: M[][]
  positions: Record<string, BoxPosition>
  svgW: number
  svgH: number
  roundLabels: string[]
}

// =====================================================
// TEAM SLOTS
// The rows drawn inside a box — 2, 3 or 4 of them depending on the match's
// own type, which is also what makes the box 72 / 100 / 126 tall.
// =====================================================

export function getTeams(m: BracketMatchTeams): BracketTeamSlot[] {
  const teams: BracketTeamSlot[] = [
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
// ONE TRACK
// =====================================================

function byMatchNumber(a: BracketMatch, b: BracketMatch): number {
  return (a.matchNumber ?? 0) - (b.matchNumber ?? 0)
}

/**
 * Lays out one bracket track (a flat list of same-bracketSide rounds) as
 * round-columns, positioned from the real source tree.
 *
 * Columns come from roundNumber and are ordered by matchNumber — the backend
 * already emits round 1 in bracket order, so that ordering is the drawing
 * order and produces no crossing edges.
 *
 * Vertically:
 *   - a LEAF (nothing inside this track feeds it) takes the running cursor and
 *     advances it by its OWN height + vGap, so a column mixing 1v1, triple and
 *     fatal boxes stays tight and never overlaps;
 *   - every other match is centred on the mean centre of its children.
 *
 * On an 8-team 1v1 bracket this degenerates to the old power-of-2 spacing:
 * round-1 boxes land on 0, 92, 184, 276; the semifinals on 46 and 230; the
 * final on 138 — exactly what `spacingFactor = 2^ri` used to produce.
 */
function layoutTrack<M extends BracketMatch>(
  matches: M[],
  yOffset: number,
  labelPrefix: string,
  options: BracketLayoutOptions,
): BracketLayout<M> {

  const { hGap, vGap, roundLabel } = options

  // ── COLUMNS ───────────────────────────────────────
  const roundMap: Record<number, M[]> = {}
  matches.forEach(m => {
    if (m.leaderboardPosition === 3) return
    const r = m.roundNumber ?? 0
    if (!roundMap[r]) roundMap[r] = []
    roundMap[r].push(m)
  })

  const roundNums = Object.keys(roundMap).map(Number).sort((a, b) => a - b)
  const rounds = roundNums.map(r => [...roundMap[r]].sort(byMatchNumber))
  const allMatches = rounds.flat()

  // A column is as wide as its widest box — a round holding a single Fatal
  // Four match is 220 wide even when the rest of it is 1v1.
  const roundBoxW = rounds.map(round =>
    round.reduce((acc, m) => Math.max(acc, getBoxDimensions(m.matchType).w), BOX_W_1V1)
  )

  const xOffsets: number[] = []
  let xCursor = 0
  rounds.forEach((_, ri) => {
    xOffsets.push(xCursor)
    xCursor += roundBoxW[ri] + hGap
  })

  const inTrack = new Map<string, M>()
  const roundIndexOf = new Map<string, number>()
  rounds.forEach((round, ri) => round.forEach(m => {
    inTrack.set(m.matchId, m)
    roundIndexOf.set(m.matchId, ri)
  }))

  // ── SOURCE TREE ───────────────────────────────────
  // A match's children are the matches feeding it. Both directions of the link
  // are read and unioned: sourceMatchAId..D on the parent (what the
  // partitioned generator writes) and nextMatchId on the child (all a legacy
  // bracket carries). Everything is filtered to this track, which is what
  // stops a losers-bracket match from adopting the winners-bracket match that
  // drops into it — that edge belongs to the other track and is never drawn.
  const children = new Map<string, string[]>()
  const hasParent = new Set<string>()

  const link = (parentId: string, childId: string) => {
    if (parentId === childId) return
    let kids = children.get(parentId)
    if (!kids) {
      kids = []
      children.set(parentId, kids)
    }
    if (!kids.includes(childId)) kids.push(childId)
    hasParent.add(childId)
  }

  allMatches.forEach(m => {
    const sources = [m.sourceMatchAId, m.sourceMatchBId, m.sourceMatchCId, m.sourceMatchDId]
    sources.forEach(sourceId => {
      if (sourceId && inTrack.has(sourceId)) link(m.matchId, sourceId)
    })
    if (m.nextMatchId && inTrack.has(m.nextMatchId)) link(m.nextMatchId, m.matchId)
  })

  // Children are visited in matchNumber order — the backend hands each match a
  // contiguous ascending run of the previous round, so this is the order that
  // keeps the tree planar.
  children.forEach(kids => kids.sort((a, b) => {
    const ma = inTrack.get(a)
    const mb = inTrack.get(b)
    return (ma?.matchNumber ?? 0) - (mb?.matchNumber ?? 0)
  }))

  // A sink is a match nothing in this track advances into: the final of a
  // single-elimination bracket, or the winners/losers final of a double one
  // (whose nextMatchId points at the grand final, outside the track).
  const sinks = allMatches.filter(m => !hasParent.has(m.matchId)).sort(byMatchNumber)

  // ── PLACEMENT ─────────────────────────────────────
  const positions: Record<string, BoxPosition> = {}
  let yCursor = yOffset
  const visiting = new Set<string>()

  const place = (id: string): BoxPosition | undefined => {
    const done = positions[id]
    if (done) return done
    if (visiting.has(id)) return undefined      // malformed data: cycle
    const match = inTrack.get(id)
    if (!match) return undefined

    visiting.add(id)

    const { w, h } = getBoxDimensions(match.matchType)
    const x = xOffsets[roundIndexOf.get(id) ?? 0] ?? 0

    const childCentres: number[] = []
    for (const kid of children.get(id) ?? []) {
      const kidPos = place(kid)
      if (kidPos) childCentres.push(kidPos.y + kidPos.h / 2)
    }

    let y: number
    if (childCentres.length) {
      const centre = childCentres.reduce((acc, c) => acc + c, 0) / childCentres.length
      y = centre - h / 2
    } else {
      y = yCursor
      yCursor += h + vGap
    }

    visiting.delete(id)

    const pos = { x, y, w, h }
    positions[id] = pos
    return pos
  }

  // Depth-first from each sink, so leaves are stacked in bracket order; then a
  // sweep over everything else, so a detached or cyclic row still gets drawn.
  sinks.forEach(m => place(m.matchId))
  allMatches.forEach(m => place(m.matchId))

  // ── MEASUREMENT ───────────────────────────────────
  // Measured off the boxes actually produced. Deriving the height from a
  // round's box height was wrong twice over: round 1 is no longer always the
  // tallest column, and a single column can mix box heights.
  let bottom = yOffset
  allMatches.forEach(m => {
    const p = positions[m.matchId]
    if (p) bottom = Math.max(bottom, p.y + p.h)
  })

  const svgW = Math.max(0, xCursor - hGap)
  const svgH = Math.max(0, bottom - yOffset)

  const roundLabels = rounds.map((_, ri) =>
    labelPrefix ? `${labelPrefix} ${roundLabel(ri, rounds.length)}` : roundLabel(ri, rounds.length)
  )

  return { rounds, positions, svgW, svgH, roundLabels }
}

// =====================================================
// WHOLE BRACKET
// Excludes leaderboardPosition === 3 (3rd place match) from the main grid —
// each renderer draws that one separately in HTML.
//
// Double elimination lays out the winners and losers brackets as two
// independent, vertically-stacked round-column tracks (bracketSide
// WINNERS / LOSERS have their own round-number sequences, which can overlap or
// exceed each other — merging them into one column grid by raw roundNumber
// would collide/interleave the two brackets), with the grand final (and
// bracket-reset rematch, if present) appended as a trailing column positioned
// after whichever track is wider.
// =====================================================

export function getBracketLayout<M extends BracketMatch>(
  matches: M[],
  options: BracketLayoutOptions,
): BracketLayout<M> {

  if (!matches.length) return {
    rounds: [] as M[][],
    positions: {} as Record<string, BoxPosition>,
    svgW: 0,
    svgH: 0,
    roundLabels: [] as string[],
  }

  const isDoubleElim = matches.some(m => m.bracketSide === "LOSERS")

  if (!isDoubleElim) {
    const t = layoutTrack(matches, 0, "", options)
    return { rounds: t.rounds, positions: t.positions, svgW: t.svgW + 40, svgH: t.svgH + 20, roundLabels: t.roundLabels }
  }

  const winners = matches.filter(m => m.bracketSide === "WINNERS")
  const losers = matches.filter(m => m.bracketSide === "LOSERS")
  const grandFinals = [...matches.filter(m => m.bracketSide === "GRAND_FINAL")]
    .sort((a, b) => (a.isBracketReset ? 1 : 0) - (b.isBracketReset ? 1 : 0))

  const w = layoutTrack(winners, 0, "Winners", options)
  const gapY = 70
  const l = layoutTrack(losers, w.svgH + gapY, "Losers", options)

  const positions = { ...w.positions, ...l.positions }
  const rounds = [...w.rounds, ...l.rounds]
  const roundLabels = [...w.roundLabels, ...l.roundLabels]

  const gfX = Math.max(w.svgW, l.svgW) + options.hGap
  const gfY = (w.svgH + gapY + l.svgH) / 2 - BOX_H_1V1 / 2
  grandFinals.forEach((m, i) => {
    const { w: bw, h: bh } = getBoxDimensions(m.matchType)
    positions[m.matchId] = { x: gfX + i * (bw + options.hGap), y: gfY, w: bw, h: bh }
  })
  if (grandFinals.length) {
    rounds.push(grandFinals)
    roundLabels.push(
      grandFinals.length > 1 || grandFinals[0]?.isBracketReset ? "Grand Final · Bracket Reset" : "Grand Final"
    )
  }

  const svgW = gfX + grandFinals.length * (BOX_W_1V1 + options.hGap) + 40
  const svgH = w.svgH + gapY + l.svgH + 20

  return { rounds, positions, svgW, svgH, roundLabels }
}

// =====================================================
// SETUP PREVIEW — what the backend will ACTUALLY build
//
// The two bracket setup screens (OrganizerBracketPage, Creatematch) used to
// preview every format as a next-power-of-2 bracket with byes:
//
//     let b = 1; while (b < teams) b *= 2      ->  Size / Rounds / Byes
//
// That is only true for ONE_VS_ONE. TRIPLE_THREAT and FATAL_FOUR now go
// through MultiWayBracketPlanner + SingleEliminationBracketGenerator
// .generatePartitioned, which PARTITIONS each round into matches of
// 2..S competitors and issues no byes at all for a field of 2 or more. The
// old preview told an organiser with 10 teams "Size 16 · Rounds 4 · Byes 6"
// and then generated 4 matches, 3 rounds and 0 byes.
//
// Everything below mirrors the backend planner exactly — `partitionRound` is
// MultiWayBracketPlanner.partition and `planPartitionedRounds` is its
// planRounds — so the preview and the generated bracket cannot disagree.
// =====================================================

export const SLOTS_PER_MATCH_TYPE: Record<BracketMatchType, number> = {
  ONE_VS_ONE: 2,
  TRIPLE_THREAT: 3,
  FATAL_FOUR: 4,
}

/** Competitors a match of this type seats: 2 / 3 / 4. Unknown types count as 1v1. */
export function slotCount(matchType?: BracketMatchType): number {
  return (matchType && SLOTS_PER_MATCH_TYPE[matchType]) || 2
}

/** The match type that seats this many competitors. */
export function matchTypeForSlots(slots: number): BracketMatchType {
  if (slots >= 4) return "FATAL_FOUR"
  if (slots === 3) return "TRIPLE_THREAT"
  return "ONE_VS_ONE"
}

/** Human label for a match type. */
export function matchTypeName(matchType?: BracketMatchType): string {
  if (matchType === "TRIPLE_THREAT") return "Triple Threat"
  if (matchType === "FATAL_FOUR") return "Fatal Four"
  return "1v1"
}

/**
 * The WIDEST match type present in a bracket.
 *
 * A partitioned bracket tags every row with the type matching its OWN
 * participant count, so no single row identifies the tournament: round 1
 * match 1 is deliberately the SMALLEST match of the round. This mirrors
 * LeaderboardService.bracketMatchType's fallback — correct for every bracket
 * whose chosen format actually occurs somewhere in it.
 */
export function largestMatchType(
  matches: { matchType?: BracketMatchType }[],
): BracketMatchType | undefined {
  let widest: BracketMatchType | undefined
  matches.forEach(m => {
    if (!m.matchType) return
    if (!widest || slotCount(m.matchType) > slotCount(widest)) widest = m.matchType
  })
  return widest
}

/**
 * One round's shape: how many competitors each match holds, ASCENDING.
 *
 * k = ceil(c / S) is the fewest matches that can seat everyone; the field is
 * then spread as evenly as possible over those k matches. Returns [] for a
 * field below 2, which is not a round.
 */
export function partitionRound(competitors: number, maxSlotsPerMatch: number): number[] {
  if (competitors < 2 || maxSlotsPerMatch < 2) return []
  const k = Math.ceil(competitors / maxSlotsPerMatch)
  const base = Math.floor(competitors / k)
  const rem = competitors % k
  return [
    ...new Array<number>(k - rem).fill(base),
    ...new Array<number>(rem).fill(base + 1),
  ]
}

/**
 * Every round's shape, round 1 first; the last entry is always the single
 * final. Each match yields one winner, so the next round's field size is this
 * round's match count.
 *
 * Returns [] for maxSlotsPerMatch < 3: at 2 the balanced partition would have
 * to emit single-competitor matches, which is exactly why 1v1 brackets keep
 * the power-of-2 generator and its byes.
 */
export function planPartitionedRounds(competitors: number, maxSlotsPerMatch: number): number[][] {
  if (maxSlotsPerMatch < 3) return []
  const rounds: number[][] = []
  let remaining = competitors
  while (remaining > 1) {
    const sizes = partitionRound(remaining, maxSlotsPerMatch)
    if (!sizes.length) break
    rounds.push(sizes)
    remaining = sizes.length
  }
  return rounds
}

/** What a given field size and format will really produce. */
export interface BracketPreview {
  matchType: BracketMatchType
  teams: number
  /** true for the classic next-power-of-2 1v1 bracket, false for a partitioned one. */
  powerOfTwo: boolean
  /** Padded bracket size. 0 for a partitioned bracket, which has no bracket size. */
  bracketSize: number
  totalRounds: number
  totalMatches: number
  byes: number
  /** Match sizes per round, round 1 first. Empty for a 1v1 bracket. */
  roundSizes: number[][]
  /** Round-1 shape, e.g. "2 + 2 + 3 + 3". "" for a 1v1 bracket. */
  firstRoundShape: string
  /** Biggest match anywhere in the bracket, in competitors. */
  largestMatchSize: number
  /** false when the chosen format never produces a match of its own headline size. */
  producesHeadlineMatch: boolean
  /** Smallest field larger than `teams` that would produce one; null if none found nearby. */
  smallestFieldWithHeadlineMatch: number | null
}

function producesHeadline(teams: number, slots: number): boolean {
  return planPartitionedRounds(teams, slots).some(round => round.some(size => size === slots))
}

export function previewBracket(teams: number, matchType: BracketMatchType): BracketPreview {

  const slots = slotCount(matchType)

  // -- 1v1: unchanged power-of-2 bracket with byes --
  if (slots < 3) {
    let bracketSize = 1
    while (bracketSize < teams) bracketSize *= 2
    return {
      matchType,
      teams,
      powerOfTwo: true,
      bracketSize,
      totalRounds: Math.log2(bracketSize),
      totalMatches: Math.max(0, bracketSize - 1),
      byes: bracketSize - teams,
      roundSizes: [],
      firstRoundShape: "",
      largestMatchSize: teams >= 2 ? 2 : 0,
      producesHeadlineMatch: teams >= 2,
      smallestFieldWithHeadlineMatch: null,
    }
  }

  // -- Triple Threat / Fatal Four: the real partition --
  const roundSizes = planPartitionedRounds(teams, slots)
  const allSizes = roundSizes.flat()
  const largestMatchSize = allSizes.reduce((max, size) => Math.max(max, size), 0)
  const producesHeadlineMatch = largestMatchSize >= slots

  // Bounded upward scan for the nearest workable field, so the warning can say
  // what would fix it without any number being hardcoded.
  let smallestFieldWithHeadlineMatch: number | null = null
  if (!producesHeadlineMatch && teams >= 2) {
    for (let n = teams + 1; n <= teams + 16; n++) {
      if (producesHeadline(n, slots)) { smallestFieldWithHeadlineMatch = n; break }
    }
  }

  return {
    matchType,
    teams,
    powerOfTwo: false,
    bracketSize: 0,
    totalRounds: roundSizes.length,
    totalMatches: roundSizes.reduce((sum, round) => sum + round.length, 0),
    byes: 0,
    roundSizes,
    firstRoundShape: roundSizes[0]?.join(" + ") ?? "",
    largestMatchSize,
    producesHeadlineMatch,
    smallestFieldWithHeadlineMatch,
  }
}

/**
 * The setup-screen warning for a format that will never actually occur.
 *
 * Not a block: the bracket generates fine and every match is a real contest —
 * it just is not the format the organiser picked. Verified cases are Triple
 * Threat at 4 teams (all 1v1) and Fatal Four at 5, 6 or 9 (no 4-way), but
 * nothing here is hardcoded; it falls straight out of the simulated partition.
 */
export function headlineMatchWarning(preview: BracketPreview): string | null {

  if (preview.powerOfTwo || preview.teams < 2 || preview.producesHeadlineMatch) return null

  const chosen = matchTypeName(preview.matchType)
  const biggest = matchTypeName(matchTypeForSlots(preview.largestMatchSize))

  const fix = preview.smallestFieldWithHeadlineMatch
    ? ` ${preview.smallestFieldWithHeadlineMatch} teams is the smallest field that produces a real ${slotCount(preview.matchType)}-team match.`
    : ""

  return `With ${preview.teams} teams, ${chosen} never actually happens.`
    + ` Rounds are packed as tightly as possible, so the biggest match in this bracket is`
    + ` a ${preview.largestMatchSize}-team ${biggest}`
    + (preview.firstRoundShape ? ` — round 1 is ${preview.firstRoundShape}.` : ".")
    + fix
}
