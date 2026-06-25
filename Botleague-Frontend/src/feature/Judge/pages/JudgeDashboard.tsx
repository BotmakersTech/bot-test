import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../../shared/api/Base"

interface AssignedMatch {
  matchId: string
  roundNumber?: number
  matchNumber?: number
  status: string
  teamARobotName?: string
  teamAName?: string
  teamBRobotName?: string
  teamBName?: string
  scheduledAt?: string
  eventSportId: string
}

function statusColor(s: string) {
  if (s === "LIVE")      return "text-green-400"
  if (s === "COMPLETED") return "text-neutral-400"
  if (s === "SCHEDULED") return "text-blue-400"
  return "text-neutral-500"
}

export default function JudgeDashboard() {
  const [matches, setMatches] = useState<AssignedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/v1/matches/my")
      .then(r => setMatches(r.data ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [])

  const live      = matches.filter(m => m.status === "LIVE")
  const scheduled = matches.filter(m => m.status === "SCHEDULED")
  const done      = matches.filter(m => m.status === "COMPLETED")

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Judge Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your assigned matches and scoring queue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Live Now",    value: live.length,      color: "text-green-400" },
          { label: "Scheduled",   value: scheduled.length, color: "text-blue-400"  },
          { label: "Completed",   value: done.length,      color: "text-neutral-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Score Entry",       href: "/judge/scores",   icon: "⚡" },
          { label: "Assigned Matches",  href: "/judge/matches",  icon: "🥊" },
          { label: "My Schedule",       href: "/judge/schedule", icon: "📅" },
          { label: "Notifications",     href: "/notifications",  icon: "🔔" },
        ].map(l => (
          <Link key={l.label} to={l.href}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 hover:border-[#fa4715]/30 hover:bg-white/[0.02] transition-colors">
            <span className="text-xl">{l.icon}</span>
            <span className="text-sm text-neutral-300">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Live matches */}
      {live.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">Live — Ready to Score</h2>
          <div className="space-y-2">
            {live.map(m => (
              <Link key={m.matchId} to={`/judge/scores?matchId=${m.matchId}`}
                className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 hover:bg-green-500/10 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">
                    Round {m.roundNumber} — Match {m.matchNumber}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {m.teamARobotName || m.teamAName || "TBD"} vs {m.teamBRobotName || m.teamBName || "TBD"}
                  </p>
                </div>
                <span className="text-xs font-bold text-green-400">LIVE</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {scheduled.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wide">Upcoming</h2>
          <div className="space-y-2">
            {scheduled.slice(0, 5).map(m => (
              <div key={m.matchId}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Round {m.roundNumber} — Match {m.matchNumber}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {m.teamARobotName || m.teamAName || "TBD"} vs {m.teamBRobotName || m.teamBName || "TBD"}
                  </p>
                </div>
                <span className={`text-xs font-semibold ${statusColor(m.status)}`}>{m.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No matches assigned yet.</p>
        </div>
      )}
    </div>
  )
}
