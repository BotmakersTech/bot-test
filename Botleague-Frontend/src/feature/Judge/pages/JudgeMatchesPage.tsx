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
  LIVE:      "bg-green-500/10 text-green-600",
  SCHEDULED: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-neutral-500/10 text-neutral-600",
  CANCELLED: "bg-red-500/10 text-red-600",
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
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#111]">Assigned Matches</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">All matches you have been assigned to judge</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === t
                ? "bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] text-white"
                : "bg-[#4b86e8]/10 text-[#6b7280] hover:bg-[#4b86e8]/20"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-[#4b86e8]/8" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#6b7280] text-sm">No {filter === "ALL" ? "" : filter.toLowerCase() + " "}matches.</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-[#4b86e8]/25">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#4b86e8]/20 text-left text-[11px] text-[#5d5d5d] uppercase">
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Teams</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(m => (
                <tr key={m.matchId} className="border-b border-[#4b86e8]/10 bg-white hover:bg-[#4b86e8]/5 transition-colors">
                  <td className="px-4 py-3 text-[#111] font-medium">
                    R{m.roundNumber} · M{m.matchNumber}
                  </td>
                  <td className="px-4 py-3 text-[#374151] text-xs">
                    <div>{m.teamARobotName || m.teamAName || "TBD"}</div>
                    <div className="text-[#9a9a9a]">vs</div>
                    <div>{m.teamBRobotName || m.teamBName || "TBD"}</div>
                  </td>
                  <td className="px-4 py-3 text-[#111] font-mono">
                    {m.status !== "SCHEDULED"
                      ? `${m.teamAScore ?? 0} – ${m.teamBScore ?? 0}`
                      : <span className="text-[#9a9a9a]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6b7280] text-xs">{fmt(m.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[m.status] ?? "bg-[#4b86e8]/8 text-[#5d5d5d]"}`}>
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
