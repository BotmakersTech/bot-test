import { useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import RankingMatchesPanel from "../components/RankingMatchesPanel"
import RaceRoundManager from "../../RaceRounds/components/RaceRoundManager"
import { useAdminEvents } from "../hooks/UseAdminEvent"
import { formatFor } from "../../Event/utils/matchFormatPolicy"
import "../../../styles/organizerTheme.css"

const MUTED = "#6b7280"

// The sport-detail page's "Update Score" button used to point at a route
// that didn't exist. Reuses RankingMatchesPanel (built for the Ranking
// page) for bracket sports — same per-match Edit Score / Change Result
// actions, just without a leaderboard above it since there's nothing to
// refresh here. Round-trial sports (Robo Race, RC Racing Car, Line
// Follower) have no Match rows for that panel to find, so it always came
// up empty for them — they get RaceRoundManager in scoresOnly mode instead,
// the same reduced "edit what's already recorded" scope, reusing its
// already-correct current-round-only editability rather than a new copy.
// Shared by both /admin/.../update-score and /organizer/.../update-score —
// back-nav derives from the current path instead of hardcoding /admin/, and
// the sport fetch below (the same endpoint the create-match dispatchers use)
// is role-gated for SPORT_HEAD_AND_UP, so it works for organiser callers too.
export default function AdminUpdateScorePage() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = location.pathname.replace(/\/update-score$/, "")

  const { event, loading, fetchEventSportById } = useAdminEvents(eventId, sportId)
  useEffect(() => {
    if (eventId && sportId) fetchEventSportById(eventId, sportId).catch(() => {})
  }, [eventId, sportId, fetchEventSportById])

  const sport = event?.sports?.find((s: any) => s.id === sportId)
  const isRoundTrial = !!sport && formatFor(sport.sport) === "ROUND_TIME_TRIAL"

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

      {loading && !sport ? (
        <div style={{ padding: "24px", color: MUTED, fontSize: "0.85rem" }}>Loading…</div>
      ) : sportId && (
        isRoundTrial
          ? <RaceRoundManager sportId={sportId} isRegistrationClosed={sport!.status?.toUpperCase() !== "REGISTRATION_OPEN"} scoresOnly />
          : <RankingMatchesPanel sportId={sportId} onChanged={() => {}} />
      )}
    </div>
  )
}
