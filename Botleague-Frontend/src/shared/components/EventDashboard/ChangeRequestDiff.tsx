import type { SportChangeRequest } from "../../../feature/Organizer/api/organizer.api"
import { ageGroupLabel } from "../../utils/ageGroup"

// Minimal shape of "the sport as it stands today" needed to diff against a
// change request's proposedChanges — deliberately loose (not the full
// SportDetail/OrganizerSport type) so this can be reused anywhere a sport
// summary is already in hand, without an extra fetch.
export interface ChangeDiffSportLike {
  sport?: string | null
  ageGroup?: string | null
  competitionType?: string | null
  sportsDescription?: string | null
  weightClass?: string | null
  weightLimitKg?: number | null
  maxLengthCm?: number | null
  maxWidthCm?: number | null
  maxHeightCm?: number | null
  controlType?: string | null
  maxBotsPerTeam?: number | null
  minTeamSize?: number | null
  maxTeamSize?: number | null
  maxTeams?: number | null
  entryFee?: number | null
  prizeMoney?: number | null
  formatType?: string | null
  registrationStartDate?: string | null
  registrationEndDate?: string | null
}

const LABELS: Record<string, string> = {
  sport: "Sport", ageGroup: "Age Group", competitionType: "Competition Type",
  sportData: "Description", weightClass: "Weight Class", weightLimitKg: "Weight Limit (kg)",
  maxLengthCm: "Max Length (cm)", maxWidthCm: "Max Width (cm)", maxHeightCm: "Max Height (cm)",
  controlType: "Control Type", maxBotsPerTeam: "Max Bots/Team", minTeamSize: "Min Team Size",
  maxTeamSize: "Max Team Size", maxTeams: "Max Teams", entryFee: "Entry Fee", prizeMoney: "Prize Money",
  formatType: "Format", registrationStartDate: "Registration Start", registrationEndDate: "Registration End",
}

const CURRENT_KEY: Record<string, keyof ChangeDiffSportLike> = {
  sport: "sport", ageGroup: "ageGroup", competitionType: "competitionType", sportData: "sportsDescription",
  weightClass: "weightClass", weightLimitKg: "weightLimitKg", maxLengthCm: "maxLengthCm",
  maxWidthCm: "maxWidthCm", maxHeightCm: "maxHeightCm", controlType: "controlType",
  maxBotsPerTeam: "maxBotsPerTeam", minTeamSize: "minTeamSize", maxTeamSize: "maxTeamSize",
  maxTeams: "maxTeams", entryFee: "entryFee", prizeMoney: "prizeMoney", formatType: "formatType",
  registrationStartDate: "registrationStartDate", registrationEndDate: "registrationEndDate",
}

export function ChangeFieldDiff({ request, sport }: { request: SportChangeRequest; sport: ChangeDiffSportLike }) {
  const changes = Object.entries(request.proposedChanges || {})
    .filter(([key, value]) => key in LABELS && value !== null && value !== undefined && value !== "")

  if (changes.length === 0) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
      {changes.map(([key, value]) => {
        const currentVal = sport[CURRENT_KEY[key]]
        // Age group is stored as its raw catalog code (JUNIOR_INNOVATORS,
        // ROBO_MINDS, ...) — show the league name a reviewer actually
        // recognizes (Ignite, Apex, ...) instead of the internal key.
        const displayOld = key === "ageGroup" ? ageGroupLabel(currentVal as string | null) : String(currentVal ?? "—")
        const displayNew = key === "ageGroup" ? ageGroupLabel(value as string) : String(value)
        return (
          <div key={key} className="ed-uc-diff-row">
            <span className="ed-uc-diff-label">{LABELS[key]}:</span>
            <span className="ed-uc-diff-old">{displayOld}</span>
            <span style={{ color: "var(--ed-ink-mute)" }}>→</span>
            <span className="ed-uc-diff-new">{displayNew}</span>
          </div>
        )
      })}
    </div>
  )
}
