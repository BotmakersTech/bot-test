import { useEffect, useState } from "react"
import { getMyAchievements, type AchievementDTO } from "../api/achievement.api"

const ACHIEVEMENT_META: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  FIRST_REGISTRATION:  { label: "First Registration",  desc: "Registered for your first event",       icon: "🏁", color: "text-blue-400" },
  FIRST_WIN:           { label: "First Victory",        desc: "Won your very first match",             icon: "🏆", color: "text-yellow-400" },
  PODIUM_FINISH:       { label: "Podium Finish",        desc: "Placed top 3 in an event",             icon: "🥉", color: "text-orange-400" },
  CHAMPION:            { label: "Champion",             desc: "Won first place in an event",           icon: "👑", color: "text-yellow-500" },
  UNDEFEATED:          { label: "Undefeated",           desc: "Completed an event without losing",    icon: "⚡", color: "text-purple-400" },
  TEAM_PLAYER:         { label: "Team Player",          desc: "Competed as part of a team",           icon: "🤝", color: "text-green-400" },
  ROBOT_BUILDER:       { label: "Robot Builder",        desc: "Registered a robot for competition",   icon: "🤖", color: "text-cyan-400" },
  MULTI_SPORT:         { label: "Multi-Sport",          desc: "Competed in multiple sport categories", icon: "🎯", color: "text-pink-400" },
  VETERAN:             { label: "Veteran",              desc: "Participated in 5+ events",            icon: "🎖️", color: "text-amber-400" },
}

function fallbackMeta(type: string) {
  return {
    label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    desc: "Achievement unlocked",
    icon: "⭐",
    color: "text-gray-400",
  }
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyAchievements()
      .then(setAchievements)
      .catch(() => setError("Failed to load achievements"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Achievements</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${achievements.length} achievement${achievements.length !== 1 ? "s" : ""} unlocked`}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading achievements…</div>
      ) : achievements.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <div className="text-5xl mb-4">🏅</div>
          <h2 className="text-lg font-semibold text-white mb-2">No achievements yet</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Register for events, compete in matches, and win to earn achievements.
          </p>
        </div>
      ) : (
        <>
          {/* Grid of unlocked achievements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {achievements.map((a) => {
              const meta = ACHIEVEMENT_META[a.type] ?? fallbackMeta(a.type)
              return (
                <div
                  key={a.id}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-start gap-4 hover:bg-white/8 transition-colors"
                >
                  <div className="text-3xl shrink-0">{meta.icon}</div>
                  <div className="min-w-0">
                    <p className={`font-semibold ${meta.color}`}>{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {new Date(a.unlockedAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Locked achievements preview */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Locked Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ACHIEVEMENT_META)
              .filter(([type]) => !achievements.find((a) => a.type === type))
              .map(([type, meta]) => (
                <div
                  key={type}
                  className="rounded-xl bg-white/3 border border-white/5 p-4 flex items-start gap-3 opacity-50"
                >
                  <div className="text-2xl grayscale shrink-0">{meta.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">{meta.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{meta.desc}</p>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
