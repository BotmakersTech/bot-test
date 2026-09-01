import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import useLeaderboard from "../../Leaderboard/hook/useLeaderboard"
import RankingsTab from "../../Leaderboard/components/Ranking"
import "../../../styles/organizerTheme.css"

const TEXT = "#111111"
const MUTED = "#6b7280"

export default function AdminSportRankingPage() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const navigate = useNavigate()

  const { leaderboard, loading, error, refetch } = useLeaderboard(eventId ?? "", sportId ?? "")

  return (
    <div className="org-page-bg p-8" style={{ minHeight: "100vh", color: TEXT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <button
        onClick={() => navigate(`/admin/events/${eventId}/sports/${sportId}`)}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: MUTED }}
      >
        <ArrowLeft size={15} /> Back to Sport
      </button>

      <h1 className="font-display mb-6 text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">
        Live Rankings
      </h1>

      <RankingsTab sportId={sportId ?? ""} leaderboard={leaderboard} loading={loading} error={error} onRefresh={refetch} />
    </div>
  )
}
