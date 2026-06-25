import { useEffect, useState } from "react"
import api from "../../../shared/api/Base"

interface JudgeMatch {
  matchId: string
  roundNumber?: number
  matchNumber?: number
  status: string
  teamARobotName?: string
  teamAName?: string
  teamBRobotName?: string
  teamBName?: string
  teamAScore?: number
  teamBScore?: number
  scheduledAt?: string
  winnerRegistrationId?: string
  winMethod?: string
}

const STATUS_COLORS: Record<string, string> = {
  LIVE:      "bg-green-500/10 text-green-400",
  SCHEDULED: "bg-blue-500/10 text-blue-400",
  COMPLETED: "bg-neutral-500/10 text-neutral-400",
  CANCELLED: "bg-red-500/10 text-red-400",
}

function fmt(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function JudgeMatchesPage() {
  const [matches, setMatches] = useState<JudgeMatch[]>([])
  const [filter, setFilter]   = useState("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/v1/matches/my")
      .then(r => setMatches(r.data ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [])

  const STATUS_TABS = ["ALL", "LIVE", "SCHEDULED", "COMPLETED"]
  const visible = filter === "ALL" ? matches : matches.filter(m => m.status === filter)

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Assigned Matches</h1>
        <p className="text-sm text-neutral-500 mt-0.5">All matches you have been assigned to judge</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === t
                ? "bg-[#fa4715] text-white"
                : "bg-white/[0.06] text-neutral-400 hover:bg-white/10"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No {filter === "ALL" ? "" : filter.toLowerCase() + " "}matches.</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-[11px] text-neutral-500 uppercase">
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Teams</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(m => (
                <tr key={m.matchId} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">
                    R{m.roundNumber} · M{m.matchNumber}
                  </td>
                  <td className="px-4 py-3 text-neutral-300 text-xs">
                    <div>{m.teamARobotName || m.teamAName || "TBD"}</div>
                    <div className="text-neutral-500">vs</div>
                    <div>{m.teamBRobotName || m.teamBName || "TBD"}</div>
                  </td>
                  <td className="px-4 py-3 text-white font-mono">
                    {m.status !== "SCHEDULED"
                      ? `${m.teamAScore ?? 0} – ${m.teamBScore ?? 0}`
                      : <span className="text-neutral-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{fmt(m.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[m.status] ?? "bg-white/5 text-neutral-400"}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
