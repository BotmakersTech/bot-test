import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { CalendarClock, Gavel, Layers, Swords, Trophy } from "lucide-react"
import api from "../../../shared/api/Base"
import type { RootState } from "../../../app/store"
import RoleHeroDashboard, { type RoleHeroEvent } from "../../../shared/components/RoleHeroDashboard"

interface AssignedMatch {
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
  eventSportId: string
}

function statusColor(s: string) {
  if (s === "LIVE")      return "text-green-400"
  if (s === "COMPLETED") return "text-neutral-400"
  if (s === "SCHEDULED") return "text-blue-400"
  return "text-neutral-500"
}

function fmt(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default function JudgeDashboard() {
  const [matches, setMatches] = useState<AssignedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    api.get("/v1/matches/my")
      .then(r => setMatches(r.data ?? []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [])

  const live      = matches.filter(m => m.status === "LIVE")
  const scheduled = matches.filter(m => m.status === "SCHEDULED")
  const completed = matches.filter(m => m.status === "COMPLETED")
  const distinctSports = new Set(matches.map(m => m.eventSportId)).size

  const previousEvents: RoleHeroEvent[] = [...completed]
    .sort((a, b) => {
      const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return bt - at
    })
    .slice(0, 3)
    .map(m => ({
      id: m.matchId,
      title: `${m.teamARobotName || m.teamAName || "TBD"} vs ${m.teamBRobotName || m.teamBName || "TBD"}`,
      tag: "Completed",
      imageUrl: null,
      meta: [
        { icon: <Layers size={14} />, label: "Round", value: `${m.roundNumber ?? "—"} · Match ${m.matchNumber ?? "—"}` },
        ...(m.scheduledAt ? [{ icon: <CalendarClock size={14} />, label: "Judged on", value: fmt(m.scheduledAt) }] : []),
        ...(m.teamAScore != null && m.teamBScore != null
          ? [{ icon: <Trophy size={14} />, label: "Score", value: `${m.teamAScore} – ${m.teamBScore}` }]
          : []),
      ],
      onView: () => { window.location.href = `/judge/matches` },
      viewLabel: "View Matches",
    }))

  const achievements = [
    { label: "5+ Matches Judged", status: completed.length >= 5 ? "Unlocked" : `${completed.length}/5`, unlocked: completed.length >= 5, icon: <Gavel size={18} /> },
    { label: "20+ Matches Judged", status: completed.length >= 20 ? "Unlocked" : `${completed.length}/20`, unlocked: completed.length >= 20, icon: <Trophy size={18} /> },
  ]

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "Judge"

  return (
    <div className="min-h-full p-6 space-y-8">
      <RoleHeroDashboard
        welcomeLabel={`Welcome back, ${user?.firstName || "Judge"}!`}
        name={fullName}
        photoUrl={user?.profilePhotoUrl}
        idLabel="Judge ID"
        idValue={user?.botleagueId || "—"}
        roleLabel="Match Judge"
        roleIcon={<Swords size={16} />}
        active
        stats={[
          { value: completed.length, label: "Matches Judged", icon: <Gavel size={17} /> },
          { value: scheduled.length, label: "Upcoming Matches", icon: <CalendarClock size={17} /> },
          { value: distinctSports, label: "Sports Experience", icon: <Layers size={17} /> },
        ]}
        previousEvents={previousEvents}
        emptyEventsLabel="No completed matches yet — they'll show up here once you've judged your first one."
        achievements={achievements}
      />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Score Entry",       href: "/judge/scores",   icon: "⚡" },
          { label: "Assigned Matches",  href: "/judge/matches",  icon: "🥊" },
          { label: "My Schedule",       href: "/judge/schedule", icon: "📅" },
          { label: "Notifications",     href: "/notifications",  icon: "🔔" },
        ].map(l => (
          <Link key={l.label} to={l.href}
            className="flex items-center gap-3 rounded-xl border border-[#4b86e8]/20 bg-white px-4 py-3 hover:border-[#0162D1]/40 hover:bg-[#0162D1]/3 transition-colors">
            <span className="text-xl">{l.icon}</span>
            <span className="text-sm text-[#374151] font-medium">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Live matches */}
      {live.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-green-600 mb-3 uppercase tracking-wide">Live — Ready to Score</h2>
          <div className="space-y-2">
            {live.map(m => (
              <Link key={m.matchId} to={`/judge/scores?matchId=${m.matchId}`}
                className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 hover:bg-green-500/10 transition-colors">
                <div>
                  <p className="text-sm font-medium text-[#111]">
                    Round {m.roundNumber} — Match {m.matchNumber}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    {m.teamARobotName || m.teamAName || "TBD"} vs {m.teamBRobotName || m.teamBName || "TBD"}
                  </p>
                </div>
                <span className="text-xs font-bold text-green-600">LIVE</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {scheduled.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wide">Upcoming</h2>
          <div className="space-y-2">
            {scheduled.slice(0, 5).map(m => (
              <div key={m.matchId}
                className="flex items-center justify-between rounded-xl border border-[#4b86e8]/20 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111]">
                    Round {m.roundNumber} — Match {m.matchNumber}
                  </p>
                  <p className="text-xs text-[#6b7280]">
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
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#6b7280] text-sm">No matches assigned yet.</p>
        </div>
      )}
    </div>
  )
}
