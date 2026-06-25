import { useEffect, useState } from "react"
import { getMyAchievements, type AchievementDTO } from "../api/achievement.api"

const CERTIFICATE_TYPES = ["CHAMPION", "PODIUM_FINISH", "FIRST_WIN", "VETERAN", "UNDEFEATED"]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const TYPE_LABEL: Record<string, string> = {
  CHAMPION:       "Champion",
  PODIUM_FINISH:  "Podium Finish",
  FIRST_WIN:      "First Victory",
  VETERAN:        "Veteran Competitor",
  UNDEFEATED:     "Undefeated",
}

export default function CertificatesPage() {
  const [achievements, setAchievements] = useState<AchievementDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyAchievements()
      .then((all) => setAchievements(all.filter((a) => CERTIFICATE_TYPES.includes(a.type))))
      .catch(() => setError("Failed to load certificates"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Certificates</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${achievements.length} certificate${achievements.length !== 1 ? "s" : ""} earned`}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading certificates…</div>
      ) : achievements.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <div className="text-5xl mb-4">📜</div>
          <h2 className="text-lg font-semibold text-white mb-2">No certificates yet</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Win events, achieve podium finishes, or complete special challenges to earn certificates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="relative rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 p-6 overflow-hidden"
            >
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-yellow-500/5" />
              <div className="absolute top-3 right-3 text-3xl opacity-30">🏆</div>

              <div className="relative">
                <p className="text-xs text-yellow-500/70 uppercase tracking-widest font-semibold mb-3">
                  Certificate of Achievement
                </p>
                <h2 className="text-xl font-bold text-white mb-1">
                  {TYPE_LABEL[a.type] ?? a.type.replace(/_/g, " ")}
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Awarded for outstanding performance in competition
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Issued</p>
                    <p className="text-sm text-gray-300">{formatDate(a.unlockedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">ID</p>
                    <p className="font-mono text-xs text-gray-500">{a.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-yellow-500/15">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent" />
                    <span className="text-xs text-yellow-500/50">BotLeague</span>
                    <div className="h-0.5 flex-1 bg-gradient-to-l from-yellow-500/50 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
