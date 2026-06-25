import { useEffect, useState } from "react"
import { getMyEvents, getMySports, getMatchesForSport, getVolunteers, getJudges, getCertificates,
  type OrganizerEvent, type OrganizerSport, type OrganizerMatch } from "../api/organizer.api"

interface SportStat {
  sport: OrganizerSport
  totalMatches: number
  completedMatches: number
  liveMatches: number
  completionRate: number
}

function BarChart({ data, label, color = "#fa4715" }: { data: { label: string; value: number }[]; label: string; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{label}</p>
      {data.map(d => (
        <div key={d.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 truncate max-w-[150px]">{d.label.replace(/_/g, " ")}</span>
            <span className="text-neutral-400 ml-2 shrink-0">{d.value}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutRing({ pct, color = "#fa4715", size = 80 }: { pct: number; color?: string; size?: number }) {
  const r = size / 2 - 8
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} strokeLinecap="round" />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">{pct}%</text>
    </svg>
  )
}

export default function OrganizerAnalyticsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [sportStats, setSportStats] = useState<SportStat[]>([])
  const [volunteerCount, setVolunteerCount] = useState(0)
  const [judgeCount, setJudgeCount] = useState(0)
  const [certCount, setCertCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([getMyEvents(), getMySports()]).then(([ev, sp]) => {
      setEvents(ev); setSports(sp)
      if (ev.length) setSelectedEventId(ev[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    const eventSports = sports.filter(s => s.eventId === selectedEventId)

    Promise.all([
      ...eventSports.map(s => getMatchesForSport(s.id).catch(() => [] as OrganizerMatch[])),
      getVolunteers(selectedEventId).catch(() => []),
      getJudges(selectedEventId).catch(() => []),
      getCertificates(selectedEventId).catch(() => []),
    ]).then(results => {
      const matchResults = results.slice(0, eventSports.length) as OrganizerMatch[][]
      const volunteers = results[eventSports.length] as any[]
      const judges     = results[eventSports.length + 1] as any[]
      const certs      = results[eventSports.length + 2] as any[]

      setVolunteerCount(volunteers.length)
      setJudgeCount(judges.length)
      setCertCount(certs.length)

      const stats: SportStat[] = eventSports.map((sp, i) => {
        const matches = matchResults[i] ?? []
        const total   = matches.length
        const done    = matches.filter(m => m.status === "COMPLETED").length
        const live    = matches.filter(m => m.status === "LIVE").length
        return { sport: sp, totalMatches: total, completedMatches: done, liveMatches: live,
          completionRate: total > 0 ? Math.round((done / total) * 100) : 0 }
      })
      setSportStats(stats)
    }).finally(() => setLoading(false))
  }, [selectedEventId, sports])

  const totalMatches   = sportStats.reduce((a, s) => a + s.totalMatches, 0)
  const doneMatches    = sportStats.reduce((a, s) => a + s.completedMatches, 0)
  const overallPct     = totalMatches > 0 ? Math.round((doneMatches / totalMatches) * 100) : 0

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Event performance and participation insights</p>
        </div>
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
      ) : (
        <>
          {/* ── Key Stats ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Matches", value: totalMatches, color: "text-white" },
              { label: "Completed", value: doneMatches, color: "text-green-400" },
              { label: "Volunteers", value: volunteerCount, color: "text-blue-400" },
              { label: "Certificates Issued", value: certCount, color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ── Overall Completion Donut ── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-neutral-200 self-start">Match Completion</p>
              <DonutRing pct={overallPct} size={120} />
              <p className="text-xs text-neutral-500">{doneMatches} of {totalMatches} matches done</p>
            </div>

            {/* ── Matches by Sport ── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5">
              <BarChart
                label="Matches by Sport"
                data={sportStats.map(s => ({ label: s.sport.sport, value: s.totalMatches }))}
              />
            </div>

            {/* ── Completion Rate by Sport ── */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5">
              <BarChart
                label="Completion Rate by Sport"
                color="#4ade80"
                data={sportStats.map(s => ({ label: s.sport.sport, value: s.completionRate }))}
              />
            </div>
          </div>

          {/* ── People Summary ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Volunteers", value: volunteerCount, icon: "👥", color: "text-blue-400" },
              { label: "Judges", value: judgeCount, icon: "⚖️", color: "text-purple-400" },
              { label: "Certificates Issued", value: certCount, icon: "🎖️", color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 flex items-center gap-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-neutral-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Per-Sport Breakdown Table ── */}
          {sportStats.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-neutral-200">Sport Breakdown</h2>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-[11px] text-neutral-500 uppercase">
                      <th className="px-5 py-3">Sport</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Done</th>
                      <th className="px-5 py-3">Live</th>
                      <th className="px-5 py-3">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sportStats.map(s => (
                      <tr key={s.sport.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium text-white">{s.sport.sport.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3 text-neutral-300">{s.totalMatches}</td>
                        <td className="px-5 py-3 text-green-400">{s.completedMatches}</td>
                        <td className="px-5 py-3 text-orange-400">{s.liveMatches}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-white/[0.07]">
                              <div className="h-full rounded-full bg-[#fa4715] transition-all"
                                style={{ width: `${s.completionRate}%` }} />
                            </div>
                            <span className="text-xs text-neutral-400">{s.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
