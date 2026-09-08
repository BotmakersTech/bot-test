import { useParams } from "react-router-dom"

import { useAdminEvents } from "../hooks/UseAdminEvent"
import { formatFor } from "../../Event/utils/matchFormatPolicy"
import CreateMatch from "./Creatematch"
import RaceRoundManager from "../../RaceRounds/components/RaceRoundManager"

/**
 * Routes /admin/events/:eventId/sports/:sportId/create-match to the right
 * match-generation UI for this sport — the existing elimination bracket
 * (Creatematch/TournamentBracket, untouched) or the newer round-wise time
 * trial (RaceRoundManager) — based on MatchFormatPolicy. See matchFormatPolicy.ts.
 */
export default function CreateMatchDispatch() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const { event, loading } = useAdminEvents(eventId, sportId)

  const sport = event?.sports?.find((s: any) => s.id === sportId)

  if (loading && !sport) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>Loading…</div>
    )
  }

  if (sport && formatFor(sport.sport) === "ROUND_TIME_TRIAL") {
    // "Not open" rather than strictly REGISTRATION_CLOSED — matches the condition
    // brackets use, so an approved-but-never-opened techsport isn't stuck.
    return <RaceRoundManager sportId={sportId!} isRegistrationClosed={sport.status?.toUpperCase() !== "REGISTRATION_OPEN"} />
  }

  return <CreateMatch />
}
