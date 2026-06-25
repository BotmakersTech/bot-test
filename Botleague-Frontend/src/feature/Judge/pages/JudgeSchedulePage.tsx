import { useEffect, useState } from "react"
import api from "../../../shared/api/Base"

interface ScheduledMatch {
  matchId: string
  roundNumber?: number
  matchNumber?: number
  status: string
  teamARobotName?: string
  teamAName?: string
  teamBRobotName?: string
  teamBName?: string
  scheduledAt?: string
}

function fmt(d?: string) {
  if (!d) return "Not scheduled"
  return new Date(d).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true
  })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    LIVE:      "bg-green-500/10 text-green-400",
    SCHEDULED: "bg-blue-500/10 text-blue-400",
    COMPLETED: "bg-neutral-500/10 text-neutral-400",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] ?? "bg-white/5 text-neutral-400"}`}>
      {status}
    </span>
  )
}

export default function JudgeSchedulePage() {
  const [matches, setMatches] = useState<ScheduledMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/v1/matches/my")
      .then(r => setMatches((r.data ?? []).sort((a: ScheduledMatch, b: ScheduledMatch) => {
        if (!a.scheduledAt) return 1
        if (!b.scheduledAt) return -1
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      })))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [])

  const upcoming  = matches.filter(m => m.status === "SCHEDULED")
  const live      = matches.filter(m => m.status === "LIVE")
  const completed = matches.filter(m => m.status === "COMPLETED")

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">My Schedule</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your upcoming and past judging assignments</p>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No matches in your schedule yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Live Now</h2>
              <div className="space-y-2">
                {live.map(m => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map(m => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Completed</h2>
              <div className="space-y-2">
                {completed.slice(0, 10).map(m => <MatchCard key={m.matchId} match={m} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: ScheduledMatch }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">
          Round {match.roundNumber} — Match {match.matchNumber}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {match.teamARobotName || match.teamAName || "TBD"} vs {match.teamBRobotName || match.teamBName || "TBD"}
        </p>
        <p className="text-xs text-neutral-600 mt-0.5">{fmt(match.scheduledAt)}</p>
      </div>
      <StatusBadge status={match.status} />
    </div>
  )
}
