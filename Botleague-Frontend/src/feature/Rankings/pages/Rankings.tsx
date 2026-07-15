import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  getGlobalRanking, getAvailablePools, getWeightClasses,
  type GlobalRankingPage,
} from "../api/rankings.api"

// ── Constants ────────────────────────────────────────────────────────────────

const AGE_GROUPS = [
  { label: "Junior Innovators (8–11 yrs)", value: "JUNIOR_INNOVATORS" },
  { label: "Young Engineers (12–17 yrs)",  value: "YOUNG_ENGINEERS" },
  { label: "Robo Minds (18+ yrs)",          value: "ROBO_MINDS" },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const base = "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
  if (rank === 1) return <div className={`${base} text-white`} style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 0 16px rgba(245,158,11,0.4)" }}>🥇</div>
  if (rank === 2) return <div className={`${base} text-white`} style={{ background: "linear-gradient(135deg,#9ca3af,#6b7280)" }}>🥈</div>
  if (rank === 3) return <div className={`${base} text-white`} style={{ background: "linear-gradient(135deg,#b45309,#92400e)" }}>🥉</div>
  return <div className={`${base} text-neutral-400 bg-white/5 border border-white/10`}>#{rank}</div>
}

function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return <span className="text-xs text-neutral-500">—</span>
  if (delta > 0) return <span className="text-xs font-bold text-green-400">▲ {delta}</span>
  return <span className="text-xs font-bold text-red-400">▼ {Math.abs(delta)}</span>
}

function StatChip({ children, color = "text-neutral-300" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold bg-white/[0.05] border border-white/10 ${color}`}>
      {children}
    </span>
  )
}

function PointSystemInfo() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4 mb-6">
      <p className="text-[10px] font-bold text-[#fa4715] uppercase tracking-widest mb-3">Point System</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
        {[
          { round: "Round 1",       win: 4, loss: 1, color: "text-blue-400" },
          { round: "Quarter Final", win: 4, loss: 1, color: "text-blue-400" },
          { round: "Semi Final",    win: 6, loss: 3, color: "text-purple-400" },
          { round: "Final",         win: 8, loss: 4, color: "text-yellow-400" },
        ].map(r => (
          <div key={r.round} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5">
            <p className={`text-[10px] font-bold mb-1.5 ${r.color}`}>{r.round}</p>
            <div className="flex justify-center gap-2 text-[11px]">
              <span className="text-green-400 font-bold">W +{r.win}</span>
              <span className="text-neutral-500">|</span>
              <span className="text-red-400 font-bold">L +{r.loss}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-neutral-500 mt-3 text-center">
        Same points apply for both event leaderboard and global ranking. Points accumulate across all events.
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

// All sports that can possibly exist (superset — user can always browse any combination)
const ALL_SPORTS = [
  "ROBO_WAR", "ROBO_WAR_OPEN", "ROBO_SOCCER", "ROBO_SOCCER_OPEN",
  "LINE_FOLLOWER", "LINE_FOLLOWER_AUTO", "ROBO_SUMO",
  "DRONE_RACING_SOCCER", "DRONE_RACING_FPV", "RC_ROBO_RACING", "RC_RACING_NITRO",
  "MANUAL_TASK", "THEME_BASED_TASKING", "THEME_BASED_TASKING_OPEN",
  "PLUG_N_PLAY_RACE_SOCCER", "PROJECT_BASED", "AEROMODELLING",
]

export default function GlobalRankingsPage() {
  const navigate = useNavigate()

  // Filter state
  const [sport,       setSport]       = useState("")
  const [ageGroup,    setAgeGroup]    = useState("")
  const [weightClass, setWeightClass] = useState("")
  const [search,      setSearch]      = useState("")

  // Data state
  const [pools,         setPools]         = useState<{ sport: string; ageGroup: string }[]>([])
  const [weightClasses, setWeightClasses] = useState<string[]>([])
  const [page,          setPage]          = useState<GlobalRankingPage | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Derived: age groups with data for the selected sport (for highlighting)
  const poolAgeGroupsForSport = pools
    .filter(p => p.sport === sport)
    .map(p => p.ageGroup)

  // On mount: load pools, then auto-select the first pool with data
  useEffect(() => {
    getAvailablePools()
      .then(p => {
        setPools(p)
        if (p.length > 0) {
          setSport(p[0].sport)
          setAgeGroup(p[0].ageGroup)
        } else {
          // No data yet — fall back to sensible defaults so dropdowns are usable
          setSport("ROBO_WAR")
          setAgeGroup("JUNIOR_INNOVATORS")
        }
      })
      .catch(() => {
        setSport("ROBO_WAR")
        setAgeGroup("JUNIOR_INNOVATORS")
      })
  }, [])

  // When sport changes, load weight classes and jump to first pool age group if available
  useEffect(() => {
    if (!sport) return
    setWeightClass("")
    getWeightClasses(sport)
      .then(wc => setWeightClasses(wc))
      .catch(() => setWeightClasses([]))
  }, [sport])

  // Auto-load rankings whenever filters change
  const loadRankings = useCallback(async () => {
    if (!sport || !ageGroup) return
    setLoading(true)
    setError(null)
    try {
      const data = await getGlobalRanking({
        sport,
        ageGroup,
        weightClass: weightClass || undefined,
        size: 100,
      })
      setPage(data)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load rankings")
      setPage(null)
    } finally {
      setLoading(false)
    }
  }, [sport, ageGroup, weightClass])

  useEffect(() => { loadRankings() }, [loadRankings])

  const entries = page?.entries ?? []
  const visible = search
    ? entries.filter(e => (e.robotName || e.teamName).toLowerCase().includes(search.toLowerCase()))
    : entries

  return (
    <div className="min-h-full p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Global Rankings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Cumulative points across all completed events · separated by sport, program and weight class
        </p>
      </div>

      {/* Point system explainer */}
      <PointSystemInfo />

      {/* Filters */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4 space-y-4">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Filters</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Sport */}
          <div>
            <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide mb-1 block">Sport</label>
            <select value={sport} onChange={e => setSport(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#fa4715]">
              <option value="">— Select Sport —</option>
              {ALL_SPORTS.map(s => {
                const hasData = pools.some(p => p.sport === s)
                return (
                  <option key={s} value={s}>
                    {hasData ? "● " : ""}{s.replace(/_/g, " ")}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Program / Age Group */}
          <div>
            <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide mb-1 block">Program</label>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#fa4715]">
              <option value="">— Select Program —</option>
              {AGE_GROUPS.map(a => {
                const hasData = poolAgeGroupsForSport.includes(a.value)
                return (
                  <option key={a.value} value={a.value}>
                    {hasData ? "● " : ""}{a.label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Weight Class */}
          <div>
            <label className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide mb-1 block">Weight Class</label>
            <select value={weightClass} onChange={e => setWeightClass(e.target.value)}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#fa4715]"
              disabled={weightClasses.length === 0}>
              <option value="">— All Weight Classes —</option>
              {weightClasses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* Search within results */}
        <input type="text" placeholder="Search robot name…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-[#fa4715]" />
      </div>

      {/* Pool info bar */}
      {sport && ageGroup && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-neutral-500">Showing:</span>
          <span className="rounded-full bg-[#fa4715]/10 border border-[#fa4715]/25 text-[#fa4715] px-2.5 py-0.5 font-semibold">
            {sport.replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 px-2.5 py-0.5 font-semibold">
            {AGE_GROUPS.find(a => a.value === ageGroup)?.label ?? ageGroup}
          </span>
          {weightClass && (
            <span className="rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 px-2.5 py-0.5 font-semibold">
              {weightClass}
            </span>
          )}
          {page && <span className="text-neutral-500 ml-auto">{page.total} entries</span>}
        </div>
      )}

      {/* States */}
      {(!sport || !ageGroup) && !loading && (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center space-y-2">
          <div className="text-4xl">🏆</div>
          <p className="text-neutral-300 font-semibold">Select Sport + Program to view rankings</p>
          <p className="text-neutral-500 text-sm">Rankings are separated by sport, program and weight class</p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && sport && ageGroup && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No ranking data yet for this pool.</p>
          <p className="text-neutral-600 text-xs mt-1">Rankings update after each completed match.</p>
        </div>
      )}

      {/* Rankings table */}
      {!loading && visible.length > 0 && (
        <div className="overflow-auto rounded-2xl border border-white/[0.06]">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-[10px] text-neutral-500 uppercase tracking-widest">
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Robot</th>
                <th className="px-4 py-3 text-center">Points</th>
                <th className="px-4 py-3 text-center">W / L</th>
                <th className="px-4 py-3 text-center">Win %</th>
                <th className="px-4 py-3 text-center">Events</th>
                <th className="px-4 py-3 text-center">Medals</th>
                <th className="px-4 py-3 text-center w-16">Δ</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.robotId ?? entry.teamId}
                  onClick={() => navigate(entry.robotId ? `/robot/${entry.robotId}` : `/team/${entry.teamId}`)}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">

                  {/* Rank badge */}
                  <td className="px-4 py-3">
                    <RankBadge rank={entry.rank} />
                  </td>

                  {/* Robot info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#fa4715]/15 border border-[#fa4715]/30 flex items-center justify-center text-[#fa4715] text-xs font-bold shrink-0">
                          {(entry.robotName || entry.teamName).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {entry.robotName ? `🤖 ${entry.robotName}` : entry.teamName}
                        </p>
                        {entry.robotName && (
                          <p className="text-[11px] text-neutral-500 truncate">{entry.teamName}</p>
                        )}
                        {(entry.city || entry.state) && (
                          <p className="text-[11px] text-neutral-500 truncate">
                            📍 {[entry.city, entry.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Points */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-lg font-black text-white">{entry.totalPoints}</span>
                    <span className="text-xs text-neutral-500 ml-1">pts</span>
                  </td>

                  {/* W/L */}
                  <td className="px-4 py-3 text-center">
                    <span className="text-green-400 font-bold">{entry.wins}</span>
                    <span className="text-neutral-600 mx-1">/</span>
                    <span className="text-red-400 font-bold">{entry.losses}</span>
                  </td>

                  {/* Win % */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-white">
                        {entry.winPercentage.toFixed(0)}%
                      </span>
                      <div className="w-16 h-1 rounded-full bg-white/[0.07]">
                        <div className="h-full rounded-full bg-[#fa4715]"
                          style={{ width: `${Math.min(entry.winPercentage, 100)}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Events played */}
                  <td className="px-4 py-3 text-center text-neutral-300 font-medium">
                    {entry.eventsPlayed}
                  </td>

                  {/* Medals */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {entry.goldMedals   > 0 && <StatChip color="text-yellow-400">🥇{entry.goldMedals}</StatChip>}
                      {entry.silverMedals > 0 && <StatChip color="text-neutral-300">🥈{entry.silverMedals}</StatChip>}
                      {entry.bronzeMedals > 0 && <StatChip color="text-orange-400">🥉{entry.bronzeMedals}</StatChip>}
                      {entry.goldMedals === 0 && entry.silverMedals === 0 && entry.bronzeMedals === 0 && (
                        <span className="text-neutral-600 text-xs">—</span>
                      )}
                    </div>
                  </td>

                  {/* Rank delta */}
                  <td className="px-4 py-3 text-center">
                    <RankDelta delta={entry.rankDelta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer note */}
      {!loading && visible.length > 0 && (
        <p className="text-[11px] text-neutral-600 text-center">
          Rankings update automatically after each completed match.
          Points system: Round 1 / QF = Win 4 / Loss 1 · Semi Final = Win 6 / Loss 3 · Final = Win 8 / Loss 4
        </p>
      )}
    </div>
  )
}
