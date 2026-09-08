import { useParams } from "react-router-dom"

import { useOrganizerSportDetail } from "../hooks/useOrganizerSportDetail"
import { formatFor } from "../../Event/utils/matchFormatPolicy"
import OrganizerBracketPage from "./OrganizerBracketPage"
import RaceRoundManager from "../../RaceRounds/components/RaceRoundManager"

/**
 * Organizer-side twin of Admin's CreateMatchDispatch — routes
 * /organizer/events/:eventId/sports/:sportId/create-match to the existing
 * elimination bracket (OrganizerBracketPage, untouched) or the round-wise
 * time trial (RaceRoundManager) based on MatchFormatPolicy.
 */
export default function OrganizerBracketDispatch() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const { selectedSport, loading } = useOrganizerSportDetail(eventId, sportId)

  if (loading && !selectedSport) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>Loading…</div>
    )
  }

  if (selectedSport && formatFor(selectedSport.sport) === "ROUND_TIME_TRIAL") {
    // "Not open" rather than strictly REGISTRATION_CLOSED — the same condition
    // brackets use to allow match creation. Requiring the exact closed status
    // left every timed techsport that was approved but never opened sitting
    // behind a dead "Generate Round 1" button with nothing explaining why.
    return <RaceRoundManager sportId={sportId!} isRegistrationClosed={selectedSport.status?.toUpperCase() !== "REGISTRATION_OPEN"} />
  }

  return <OrganizerBracketPage />
}
