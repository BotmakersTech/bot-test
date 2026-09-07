import { useParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import RankingMatchesPanel from "../components/RankingMatchesPanel"
import "../../../styles/organizerTheme.css"

const MUTED = "#6b7280"

// The sport-detail page's "Update Score" button used to point at a route
// that didn't exist. Reuses RankingMatchesPanel (built for the Ranking
// page) rather than a third copy of score/result-editing UI — same
// per-match Edit Score / Change Result actions, just without a leaderboard
// above it since there's nothing to refresh here.
// Shared by both /admin/.../update-score and /organizer/.../update-score —
// back-nav derives from the current path instead of hardcoding /admin/.
export default function AdminUpdateScorePage() {
  const { sportId } = useParams<{ eventId: string; sportId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = location.pathname.replace(/\/update-score$/, "")

  return (
    <div className="org-page-bg p-8" style={{ minHeight: "100vh", color: "#111111" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <button
        onClick={() => navigate(backPath)}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: MUTED }}
      >
        <ArrowLeft size={15} /> Back to Sport
      </button>

      <h1 className="font-display mb-6 text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">
        Update Score
      </h1>

      {sportId && <RankingMatchesPanel sportId={sportId} onChanged={() => {}} />}
    </div>
  )
}
