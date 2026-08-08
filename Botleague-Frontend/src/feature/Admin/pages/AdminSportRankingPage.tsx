import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import useLeaderboard from "../../Leaderboard/hook/useLeaderboard"
import RankingsTab from "../../Leaderboard/components/Ranking"

const BG = "#0a0c10"
const TEXT = "#ffffff"
const MUTED = "#9ca3af"

export default function AdminSportRankingPage() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const navigate = useNavigate()

  const { leaderboard, loading, error, refetch } = useLeaderboard(eventId ?? "", sportId ?? "")

  return (
    <div className="p-8" style={{ minHeight: "100vh", background: BG, color: TEXT }}>
      <button
        onClick={() => navigate(`/admin/events/${eventId}/sports/${sportId}`)}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: MUTED }}
      >
        <ArrowLeft size={15} /> Back to Sport
      </button>

      <h1 className="font-display mb-6 text-[38px] font-medium text-[#0162d1] tracking-wide">
        Live Rankings
      </h1>

      <RankingsTab leaderboard={leaderboard} loading={loading} error={error} onRefresh={refetch} />
    </div>
  )
}
