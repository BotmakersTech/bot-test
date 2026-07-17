import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Users, Trophy, Calendar, Tag, Swords, Weight, Zap, DollarSign, Award, Cpu, Ruler, Bot, Edit2, X } from "lucide-react"
import { useAdminEvents } from "../hooks/UseAdminEvent"
import { type CreateEventSportRequest } from "../api/admin.api"
import SportMediaField from "../../Organizer/components/SportMediaField"
import { pushToGlobalRankings } from "../../Rankings/api/rankings.api"
import TeamLogo from "../../../shared/components/TeamLogo"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const BG      = "#3a3a3a"
const CARD    = "rgba(0,0,0,0.25)"
const CARD2   = "rgba(0,0,0,0.35)"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#fa4715"
const TEXT    = "#ffffff"
const MUTED   = "#9ca3af"
const LABEL   = "#e5e7eb"
const SUCCESS = "#4ade80"
const WARNING = "#fbbf24"
const DANGER  = "#f87171"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface TeamPlayer {
  id: string
  fullName: string
  role?: string
}

interface TeamReg {
  id: string
  teamName: string
  teamLogoUrl?: string
  lineup?: TeamPlayer[]
}

// Full sport shape returned by the server
interface SportDetail {
  id: string
  sport: string
  sportsDescription?: string | null
  sportThumbnailUrl?: string | null
  sportTeaserVideoUrl?: string | null
  status?: string
  competitionType?: string | null
  ageGroup?: string
  formatType?: string

  weightClass?: string | null
  weightLimitKg?: number | null
  maxLengthCm?: number | null
  maxWidthCm?: number | null
  maxHeightCm?: number | null
  controlType?: string | null
  maxBotsPerTeam?: number | null
  extraRules?: Record<string, string> | null

  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number
  registeredTeamsCount?: number

  entryFee?: number
  prizeMoney?: number

  registrationStartDate?: string
  registrationEndDate?: string

  registrations?: TeamReg[]
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function formatCurrency(val?: number | null): string {
  if (val == null) return "—"
  return `₹${val.toLocaleString("en-IN")}`
}

function formatDate(val?: string | null): string {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

// ─────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────

function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      border: `2px solid rgba(255,255,255,0.12)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0
    }} />
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    PUBLISHED:           { bg: "rgba(250,71,21,0.11)",  border: "rgba(250,71,21,0.28)",   color: ACCENT,  icon: "📣" },
    DRAFT:               { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING, icon: "📝" },
    LIVE:                { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🟢" },
    ONGOING:             { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🔄" },
    COMPLETED:           { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", color: MUTED,   icon: "✅" },
    CANCELLED:           { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", color: DANGER,  icon: "🚫" },
    REGISTRATION_OPEN:   { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🔓" },
    REGISTRATION_CLOSED: { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING, icon: "🔒" }
  }
  const key = status?.toUpperCase() || "DRAFT"
  const s   = MAP[key] || MAP["DRAFT"]
  return (
    <span style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      borderRadius: "999px",
      fontSize: "0.67rem",
      padding: "3px 10px",
      fontWeight: 700,
      whiteSpace: "nowrap"
    }}>
      {s.icon} {key.replace(/_/g, " ")}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// STAT BOX
// ─────────────────────────────────────────────────────────────

function StatBox({
  icon,
  label,
  value,
  color = TEXT
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: "12px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      flex: 1,
      minWidth: "130px"
    }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{
          fontSize: "0.65rem",
          color: MUTED,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color,
          fontFamily: "'Orbitron', sans-serif"
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// META CHIP  (detail grid cell)
// ─────────────────────────────────────────────────────────────

function MetaChip({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value?: string | number | null
}) {
  if (value == null || value === "") return null
  return (
    <div style={{
      background: "rgba(0,0,0,0.25)",
      border: `1px solid ${BORDER}`,
      borderRadius: "9px",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: "10px"
    }}>
      <span style={{ color: ACCENT, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{
          fontSize: "0.6rem",
          color: MUTED,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "2px"
        }}>
          {label}
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: TEXT }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEAM CARD
// ─────────────────────────────────────────────────────────────

function TeamCard({ team, index }: { team: TeamReg; index: number }) {
  const [open, setOpen] = React.useState(false)
  const playerCount = team.lineup?.length ?? 0

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.28)",
        border: `1px solid rgba(255,255,255,0.09)`,
        borderRadius: "12px",
        overflow: "hidden",
        transition: "border-color 0.15s"
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(250,71,21,0.3)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.09)"}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: playerCount > 0 ? "pointer" : "default"
        }}
        onClick={() => playerCount > 0 && setOpen(o => !o)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* logo / fallback */}
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid rgba(250,71,21,0.25)",
            flexShrink: 0,
            overflow: "hidden"
          }}>
            <TeamLogo src={team.teamLogoUrl} alt={team.teamName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT }}>
              <span style={{ color: MUTED, fontSize: "0.7rem", marginRight: "6px" }}>#{index + 1}</span>
              {team.teamName}
            </div>
            <div style={{
              fontSize: "0.68rem",
              color: MUTED,
              marginTop: "2px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Users size={10} />
              {playerCount} player{playerCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {playerCount > 0 && (
          <span style={{
            color: MUTED,
            fontSize: "0.7rem",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${BORDER}`,
            borderRadius: "5px",
            padding: "2px 8px",
            fontWeight: 600
          }}>
            {open ? "▲ hide" : "▼ lineup"}
          </span>
        )}
      </div>

      {/* LINEUP */}
      {open && team.lineup && team.lineup.length > 0 && (
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}>
          {team.lineup.map((p, pi) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "7px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.65rem", color: MUTED, fontWeight: 700, width: "18px" }}>
                  #{pi + 1}
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: TEXT }}>
                  {p.fullName}
                </span>
              </div>
              {p.role && (
                <span style={{
                  background: "rgba(250,71,21,0.1)",
                  border: "1px solid rgba(250,71,21,0.2)",
                  color: ACCENT,
                  borderRadius: "5px",
                  fontSize: "0.6rem",
                  padding: "2px 7px",
                  fontWeight: 700
                }}>
                  {p.role}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────
// PAGE WRAPPER
// ─────────────────────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      color: TEXT,
      padding: "40px 48px",
      position: "relative"
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EDIT SPORT MODAL
// ─────────────────────────────────────────────────────────────

// ── Exact enums matching the backend + create-sport form ──────

const AGE_GROUP_CATALOGUE = [
  {
    value: "JUNIOR_INNOVATORS", label: "Junior Innovators", subLabel: "8–12 yrs",
    sports: [
      { value: "PROJECT_BASED",           label: "Project Based Competition"  },
      { value: "PLUG_N_PLAY_RACE_SOCCER", label: "Plug N Play — Race / Soccer" },
      { value: "LINE_FOLLOWER",           label: "Line Follower"               },
      { value: "MANUAL_TASK",             label: "Manual Task"                 },
      { value: "ROBO_SUMO",              label: "Robo Sumo"                   },
    ],
    weightClasses: [{ value: "1KG", label: "1 kg" }],
  },
  {
    value: "YOUNG_ENGINEERS", label: "Young Engineers", subLabel: "12–18 yrs",
    sports: [
      { value: "ROBO_SOCCER",         label: "Robo Soccer"                },
      { value: "LINE_FOLLOWER_AUTO",  label: "Line Follower (Auto)"        },
      { value: "THEME_BASED_TASKING", label: "Theme-Based Tasking"         },
      { value: "ROBO_WAR",            label: "RoboWar"                     },
      { value: "DRONE_RACING_SOCCER", label: "Drone Racing / Drone Soccer" },
      { value: "RC_ROBO_RACING",      label: "RC Racing / Robo Racing"     },
    ],
    weightClasses: [
      { value: "1_5KG", label: "1.5 kg" },
      { value: "3KG",   label: "3 kg"   },
      { value: "OPEN",  label: "Open"   },
    ],
  },
  {
    value: "ROBO_MINDS", label: "Robo Minds", subLabel: "18+ yrs",
    sports: [
      { value: "ROBO_SOCCER_OPEN",         label: "Robo Soccer"                        },
      { value: "THEME_BASED_TASKING_OPEN", label: "Theme-Based Tasking"                 },
      { value: "ROBO_WAR_OPEN",            label: "RoboWar"                             },
      { value: "DRONE_RACING_FPV",         label: "Drone Racing (FPV) / Drone Soccer"   },
      { value: "RC_RACING_NITRO",          label: "RC Racing (Nitro + Electric)"         },
      { value: "AEROMODELLING",            label: "Aeromodelling"                        },
    ],
    weightClasses: [
      { value: "1_5KG", label: "1.5 kg" },
      { value: "5KG",   label: "5 kg"   },
      { value: "8KG",   label: "8 kg"   },
      { value: "15KG",  label: "15 kg"  },
      { value: "30KG",  label: "30 kg"  },
      { value: "60KG",  label: "60 kg"  },
      { value: "OPEN",  label: "Open"   },
    ],
  },
]

const FORMAT_TYPE_OPTIONS = [
  { value: "KNOCKOUT",           label: "Knockout"           },
  { value: "ROUND_ROBIN",        label: "Round Robin"        },
  { value: "SWISS",              label: "Swiss"              },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination" },
]

// Matches backend ControlMode enum exactly (team/enums/ControlMode.java).
// NOTE: previously this listed MANUAL/AUTONOMOUS/HYBRID/REMOTE/SEMI_AUTONOMOUS,
// none of which exist in ControlMode — selecting any of them would have made
// the backend reject the save with a 400 enum-deserialization error.
const CONTROL_TYPES = [
  { value: "WIRED",    label: "Wired"    },
  { value: "WIRELESS", label: "Wireless" },
  { value: "ANY",      label: "Any (Wired or Wireless)" },
]

// ── Official spec catalogue — keyed "ageGroup::sport" ──────────────────────
// Mirrors the physical-limit table organizers must follow. Values come
// straight from the published rulebook (see SportRegistrationService javadoc
// on the backend for the same table). RoboWar's weight varies by the chosen
// weight class, so it's resolved separately in getPresetSpec().
interface SportSpecPreset {
  weightLimitKg?: number
  maxLengthCm?: number
  maxWidthCm?: number
  maxHeightCm?: number
  controlType?: string   // WIRED | WIRELESS | ANY
  maxBotsPerTeam?: number
  note?: string
}

const SPORT_SPEC_PRESETS: Record<string, SportSpecPreset> = {
  // ── Junior Innovators (8–12 yrs) — Wired or Wireless ──
  "JUNIOR_INNOVATORS::PROJECT_BASED":           { controlType: "ANY", note: "No physical limits" },
  "JUNIOR_INNOVATORS::PLUG_N_PLAY_RACE_SOCCER": { weightLimitKg: 1, maxLengthCm: 20, maxWidthCm: 20, maxHeightCm: 20, controlType: "ANY", maxBotsPerTeam: 1, note: "Single bot for both Race & Soccer" },
  "JUNIOR_INNOVATORS::LINE_FOLLOWER":           { weightLimitKg: 1, maxLengthCm: 20, maxWidthCm: 20, maxHeightCm: 20, controlType: "ANY" },
  "JUNIOR_INNOVATORS::MANUAL_TASK":             { weightLimitKg: 1, maxLengthCm: 20, maxWidthCm: 20, maxHeightCm: 20, controlType: "ANY" },
  "JUNIOR_INNOVATORS::ROBO_SUMO":               { weightLimitKg: 1, maxLengthCm: 20, maxWidthCm: 20, maxHeightCm: 20, controlType: "ANY" },

  // ── Young Engineers (12–18 yrs) — Wireless only ──
  "YOUNG_ENGINEERS::ROBO_SOCCER":         { weightLimitKg: 3,   maxLengthCm: 30, maxWidthCm: 30, maxHeightCm: 30, controlType: "WIRELESS" },
  "YOUNG_ENGINEERS::LINE_FOLLOWER_AUTO":  { weightLimitKg: 1.5, controlType: "WIRELESS" },
  "YOUNG_ENGINEERS::THEME_BASED_TASKING": { weightLimitKg: 3,   controlType: "WIRELESS" },
  "YOUNG_ENGINEERS::ROBO_WAR":            { weightLimitKg: 1.5, controlType: "WIRELESS", note: "Only 1.5kg weight class" },
  "YOUNG_ENGINEERS::DRONE_RACING_SOCCER": { maxLengthCm: 30, maxWidthCm: 30, maxHeightCm: 30, controlType: "WIRELESS", note: "20cm diagonal" },
  "YOUNG_ENGINEERS::RC_ROBO_RACING":      { controlType: "WIRELESS" },

  // ── Robo Minds (18+ yrs) — Wireless only ──
  "ROBO_MINDS::ROBO_SOCCER_OPEN":         { weightLimitKg: 5, maxLengthCm: 45, maxWidthCm: 45, maxHeightCm: 45, controlType: "WIRELESS" },
  "ROBO_MINDS::THEME_BASED_TASKING_OPEN": { weightLimitKg: 5, maxLengthCm: 45, maxWidthCm: 45, maxHeightCm: 45, controlType: "WIRELESS" },
  "ROBO_MINDS::ROBO_WAR_OPEN":            { controlType: "WIRELESS", note: "Weight derives from selected weight class (1.5/8/15/30/60kg)" },
  "ROBO_MINDS::DRONE_RACING_FPV":         { controlType: "WIRELESS", note: "FPV" },
  "ROBO_MINDS::RC_RACING_NITRO":          { controlType: "WIRELESS", note: "Nitro + Electric, 1:8 / 1:12 scale" },
  "ROBO_MINDS::AEROMODELLING":            { controlType: "WIRELESS" },
}

// RoboWar's weight limit comes from the selected weight-class chip, not a fixed preset.
const WEIGHT_CLASS_TO_KG: Record<string, number> = {
  "1KG": 1, "1_5KG": 1.5, "3KG": 3, "5KG": 5, "8KG": 8, "15KG": 15, "30KG": 30, "60KG": 60,
}

function getPresetSpec(ageGroup: string, sport: string, weightClass?: string): SportSpecPreset | null {
  const base = SPORT_SPEC_PRESETS[`${ageGroup}::${sport}`]
  if (!base) return null
  if (sport === "ROBO_WAR_OPEN" && weightClass && WEIGHT_CLASS_TO_KG[weightClass] != null) {
    return { ...base, weightLimitKg: WEIGHT_CLASS_TO_KG[weightClass] }
  }
  return base
}

type EditForm = CreateEventSportRequest & { extraRulesList: { key: string; value: string }[] }

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  // Adjust for local timezone offset so the datetime-local input shows
  // the correct local wall-clock time instead of the raw UTC value.
  const offset = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

// Convert a datetime-local string back to UTC ISO for the API.
function localToIso(local?: string): string | undefined {
  if (!local) return undefined
  const d = new Date(local)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

function EditSportModal({
  sport,
  eventId,
  sportId,
  onSave,
  saving,
  onClose,
  onDone,
  onMediaChange,
}: {
  sport: SportDetail
  eventId: string
  sportId: string
  onSave: (eid: string, sid: string, req: CreateEventSportRequest) => Promise<void>
  saving: boolean
  onClose: () => void
  onDone: () => void
  onMediaChange: () => void
}) {
  const initialForm: EditForm = {
    sport:                  sport.sport ?? "",
    ageGroup:               sport.ageGroup ?? "",
    competitionType:        sport.competitionType ?? "",
    sportData:              sport.sportsDescription ?? "",
    weightClass:            sport.weightClass ?? "",
    weightLimitKg:          sport.weightLimitKg ?? undefined,
    maxLengthCm:            sport.maxLengthCm ?? undefined,
    maxWidthCm:             sport.maxWidthCm ?? undefined,
    maxHeightCm:            sport.maxHeightCm ?? undefined,
    controlType:            sport.controlType ?? "",
    maxBotsPerTeam:         sport.maxBotsPerTeam ?? undefined,
    minTeamSize:            sport.minTeamSize ?? undefined,
    maxTeamSize:            sport.maxTeamSize ?? undefined,
    maxTeams:               sport.maxTeams ?? undefined,
    entryFee:               sport.entryFee ?? undefined,
    prizeMoney:             sport.prizeMoney ?? undefined,
    formatType:             sport.formatType ?? "",
    registrationStartDate:  toDatetimeLocal(sport.registrationStartDate),
    registrationEndDate:    toDatetimeLocal(sport.registrationEndDate),
    extraRules:             sport.extraRules ?? {},
    extraRulesList: Object.entries(sport.extraRules ?? {}).map(([key, value]) => ({ key, value })),
  }

  const [form, setForm] = React.useState<EditForm>(initialForm)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const set = (field: keyof EditForm, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const setNum = (field: keyof EditForm, raw: string) =>
    set(field, raw === "" ? undefined : Number(raw))

  const addRule = () =>
    setForm(prev => ({ ...prev, extraRulesList: [...prev.extraRulesList, { key: "", value: "" }] }))

  const removeRule = (i: number) =>
    setForm(prev => ({ ...prev, extraRulesList: prev.extraRulesList.filter((_, idx) => idx !== i) }))

  const setRule = (i: number, field: "key" | "value", val: string) =>
    setForm(prev => {
      const list = [...prev.extraRulesList]
      list[i] = { ...list[i], [field]: val }
      return { ...prev, extraRulesList: list }
    })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaveError(null)
    try {
      const { extraRulesList, ...rest } = form
      const extraRules: Record<string, string> = {}
      extraRulesList.forEach(r => { if (r.key.trim()) extraRules[r.key.trim()] = r.value })

      // Build raw payload then strip every key whose value is "" — those become
      // undefined and Axios excludes them from the JSON body, so the backend's
      // partial-update logic skips them instead of crashing on empty enum strings.
      const raw: Record<string, unknown> = {
        ...rest,
        extraRules: Object.keys(extraRules).length > 0 ? extraRules : undefined,
        registrationStartDate: localToIso(form.registrationStartDate),
        registrationEndDate:   localToIso(form.registrationEndDate),
      }
      const payload = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== "" && v !== undefined && v !== null)
      ) as unknown as CreateEventSportRequest

      await onSave(eventId, sportId, payload)
      onDone()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string }
      setSaveError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to save.")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,0,0,0.3)",
    border: `1px solid rgba(255,255,255,0.12)`,
    borderRadius: "8px",
    color: TEXT,
    padding: "9px 12px",
    fontSize: "0.83rem",
    outline: "none",
    boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.62rem",
    color: MUTED,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "5px",
  }
  const groupStyle: React.CSSProperties = { display: "flex", flexDirection: "column" }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.72)",
        zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "32px 16px",
        overflowY: "auto",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "#2a2a2a",
        border: "1px solid rgba(250,71,21,0.25)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "680px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(250,71,21,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Edit2 size={16} style={{ color: ACCENT }} />
            <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.06em" }}>
              EDIT SPORT
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Sport Media */}
          <div style={{
            background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "10px",
            padding: "14px 16px", display: "flex", flexDirection: "column", gap: "16px",
          }}>
            <SportMediaField eventId={eventId} sportId={sportId} slot="THUMBNAIL" kind="image" label="Sport Thumbnail" currentUrl={sport.sportThumbnailUrl} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "rgba(255,255,255,0.06)" }} />
            <SportMediaField eventId={eventId} sportId={sportId} slot="TEASER" kind="video" label="Teaser Video" currentUrl={sport.sportTeaserVideoUrl} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Row 1: Age Group */}
          <div style={groupStyle}>
            <label style={labelStyle}>Age Group *</label>
            <select
              style={inputStyle}
              value={form.ageGroup}
              onChange={e => set("ageGroup", e.target.value)}
              required
            >
              <option value="">Select age group…</option>
              {AGE_GROUP_CATALOGUE.map(ag => (
                <option key={ag.value} value={ag.value}>{ag.label} — {ag.subLabel}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Sport */}
          {(() => {
            const ag = AGE_GROUP_CATALOGUE.find(a => a.value === form.ageGroup)
            const sportsInGroup = ag?.sports ?? []
            const currentInList = sportsInGroup.some(s => s.value === form.sport)
            return (
              <div style={groupStyle}>
                <label style={labelStyle}>Sport *</label>
                <select
                  style={inputStyle}
                  value={form.sport}
                  onChange={e => set("sport", e.target.value)}
                  required
                >
                  <option value="">Select sport…</option>
                  {/* Show current value as option even if not in catalogue (data integrity) */}
                  {!currentInList && form.sport && (
                    <option value={form.sport}>{toLabel(form.sport)}</option>
                  )}
                  {sportsInGroup.length > 0
                    ? sportsInGroup.map(s => <option key={s.value} value={s.value}>{s.label}</option>)
                    : AGE_GROUP_CATALOGUE.flatMap(a => a.sports).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))
                  }
                </select>
                {!ag && form.ageGroup && (
                  <span style={{ fontSize: "0.68rem", color: WARNING, marginTop: "4px" }}>
                    Select an age group to filter sports
                  </span>
                )}
              </div>
            )
          })()}

          {/* Official spec preview + one-click apply ────────────────────── */}
          {(() => {
            const preset = form.ageGroup && form.sport
              ? getPresetSpec(form.ageGroup, form.sport, form.weightClass)
              : null
            if (!preset) return null

            const parts: string[] = []
            if (preset.weightLimitKg != null) parts.push(`${preset.weightLimitKg}kg`)
            if (preset.maxLengthCm != null && preset.maxWidthCm != null && preset.maxHeightCm != null) {
              parts.push(`${preset.maxLengthCm}×${preset.maxWidthCm}×${preset.maxHeightCm}cm`)
            }
            if (preset.controlType) parts.push(preset.controlType === "ANY" ? "Wired or Wireless" : preset.controlType)
            if (preset.maxBotsPerTeam != null) parts.push(`max ${preset.maxBotsPerTeam} bot/team`)

            return (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                background: "rgba(250,71,21,0.06)", border: "1px solid rgba(250,71,21,0.2)",
                borderRadius: "8px", padding: "10px 14px",
              }}>
                <div style={{ fontSize: "0.74rem", color: TEXT }}>
                  <strong style={{ color: ACCENT }}>Official spec:</strong>{" "}
                  {parts.length > 0 ? parts.join(" · ") : "No physical limits"}
                  {preset.note && <span style={{ color: MUTED }}> — {preset.note}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    weightLimitKg: preset.weightLimitKg,
                    maxLengthCm:   preset.maxLengthCm,
                    maxWidthCm:    preset.maxWidthCm,
                    maxHeightCm:   preset.maxHeightCm,
                    controlType:   preset.controlType ?? prev.controlType,
                    maxBotsPerTeam: preset.maxBotsPerTeam ?? prev.maxBotsPerTeam,
                  }))}
                  style={{
                    flexShrink: 0, background: ACCENT, border: "none", color: "#fff",
                    borderRadius: "6px", padding: "6px 12px", fontSize: "0.72rem", fontWeight: 700,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Apply Spec
                </button>
              </div>
            )
          })()}

          {/* Row 3: Format + Weight Class */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Format</label>
              <select style={inputStyle} value={form.formatType ?? ""} onChange={e => set("formatType", e.target.value || undefined)}>
                <option value="">None</option>
                {FORMAT_TYPE_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Weight Class</label>
              {(() => {
                const ag = AGE_GROUP_CATALOGUE.find(a => a.value === form.ageGroup)
                const wcs = ag?.weightClasses ?? AGE_GROUP_CATALOGUE.flatMap(a => a.weightClasses)
                const currentInWc = wcs.some(w => w.value === form.weightClass)
                return (
                  <select style={inputStyle} value={form.weightClass ?? ""} onChange={e => set("weightClass", e.target.value || undefined)}>
                    <option value="">None</option>
                    {!currentInWc && form.weightClass && (
                      <option value={form.weightClass}>{form.weightClass}</option>
                    )}
                    {wcs.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                )
              })()}
            </div>
          </div>

          {/* Row 4: Control Type + Competition Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Control Type</label>
              <select style={inputStyle} value={form.controlType ?? ""} onChange={e => set("controlType", e.target.value || undefined)}>
                <option value="">None</option>
                {CONTROL_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Competition Type</label>
              <input
                style={inputStyle}
                value={form.competitionType ?? ""}
                onChange={e => set("competitionType", e.target.value || undefined)}
                placeholder="e.g. KNOCKOUT"
              />
            </div>
          </div>

          {/* Row 4: Weight Limit + Max Bots */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Weight Limit (kg)</label>
              <input type="number" min={0} style={inputStyle} value={form.weightLimitKg ?? ""} onChange={e => setNum("weightLimitKg", e.target.value)} placeholder="e.g. 15" />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Max Bots / Team</label>
              <input type="number" min={1} style={inputStyle} value={form.maxBotsPerTeam ?? ""} onChange={e => setNum("maxBotsPerTeam", e.target.value)} placeholder="e.g. 2" />
            </div>
          </div>

          {/* Row 5: Dimensions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Max Length (cm)</label>
              <input type="number" min={0} style={inputStyle} value={form.maxLengthCm ?? ""} onChange={e => setNum("maxLengthCm", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Max Width (cm)</label>
              <input type="number" min={0} style={inputStyle} value={form.maxWidthCm ?? ""} onChange={e => setNum("maxWidthCm", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Max Height (cm)</label>
              <input type="number" min={0} style={inputStyle} value={form.maxHeightCm ?? ""} onChange={e => setNum("maxHeightCm", e.target.value)} />
            </div>
          </div>

          {/* Row 6: Team Size + Max Teams */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Min Team Size</label>
              <input type="number" min={1} style={inputStyle} value={form.minTeamSize ?? ""} onChange={e => setNum("minTeamSize", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Max Team Size</label>
              <input type="number" min={1} style={inputStyle} value={form.maxTeamSize ?? ""} onChange={e => setNum("maxTeamSize", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Max Teams</label>
              <input type="number" min={1} style={inputStyle} value={form.maxTeams ?? ""} onChange={e => setNum("maxTeams", e.target.value)} />
            </div>
          </div>

          {/* Row 7: Entry Fee + Prize Money */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Entry Fee (₹)</label>
              <input type="number" min={0} style={inputStyle} value={form.entryFee ?? ""} onChange={e => setNum("entryFee", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Prize Money (₹)</label>
              <input type="number" min={0} style={inputStyle} value={form.prizeMoney ?? ""} onChange={e => setNum("prizeMoney", e.target.value)} />
            </div>
          </div>

          {/* Row 8: Registration Window */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={groupStyle}>
              <label style={labelStyle}>Registration Start</label>
              <input type="datetime-local" style={inputStyle} value={form.registrationStartDate ?? ""} onChange={e => set("registrationStartDate", e.target.value)} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Registration End</label>
              <input type="datetime-local" style={inputStyle} value={form.registrationEndDate ?? ""} onChange={e => set("registrationEndDate", e.target.value)} />
            </div>
          </div>

          {/* Row 9: Description */}
          <div style={groupStyle}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
              value={form.sportData ?? ""}
              onChange={e => set("sportData", e.target.value)}
              placeholder="Sport description…"
            />
          </div>

          {/* Row 10: Extra Rules */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Extra Rules</label>
              <button type="button" onClick={addRule} style={{
                background: "rgba(250,71,21,0.12)",
                border: "1px solid rgba(250,71,21,0.3)",
                color: ACCENT,
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
              }}>+ Add Rule</button>
            </div>
            {form.extraRulesList.map((rule, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                <input style={inputStyle} placeholder="Rule key" value={rule.key} onChange={e => setRule(i, "key", e.target.value)} />
                <input style={inputStyle} placeholder="Rule value" value={rule.value} onChange={e => setRule(i, "value", e.target.value)} />
                <button type="button" onClick={() => removeRule(i)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: DANGER, borderRadius: "6px", padding: "6px 8px", cursor: "pointer" }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {saveError && (
            <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.82rem", fontWeight: 600 }}>
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid rgba(255,255,255,0.12)`,
              color: MUTED,
              borderRadius: "8px",
              padding: "9px 20px",
              fontSize: "0.83rem",
              fontWeight: 600,
              cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              background: saving ? "rgba(250,71,21,0.4)" : ACCENT,
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "9px 24px",
              fontSize: "0.83rem",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              {saving && <Spinner size={13} color="#fff" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminSport() {

  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const navigate = useNavigate()

  const [registrationLoading, setRegistrationLoading] = React.useState(false)
  const [showEditSport,       setShowEditSport]       = React.useState(false)
  const [finalizing,          setFinalizing]          = React.useState(false)
  const [finalizeMsg,         setFinalizeMsg]         = React.useState<string | null>(null)

  const {
    event,
    loading,
    error,
    refetch,
    sportLoading,
    changeSportRegistrationStatus,
    updateEventSport,
  } = useAdminEvents(eventId, sportId)

  // ── derive the specific sport from event.sports ──
  const sport = event?.sports?.find((s: any) => s.id === sportId) as SportDetail | undefined

  const registrations: TeamReg[] = sport?.registrations ?? []
  const totalTeams   = registrations.length
  const totalPlayers = registrations.reduce((n, t) => n + (t.lineup?.length ?? 0), 0)

  const isOpen = sport?.status?.toUpperCase() === "REGISTRATION_OPEN"

  // ── publish handler — pushes the finalized event leaderboard to global rankings ──
  const handleFinalize = async () => {
    if (!sportId) return
    setFinalizing(true)
    setFinalizeMsg(null)
    try {
      await pushToGlobalRankings(sportId)
      setFinalizeMsg("✓ Global rankings updated successfully!")
    } catch (e: any) {
      setFinalizeMsg("⚠️ " + (e?.response?.data?.message ?? e?.response?.data?.error ?? "Publish failed"))
    } finally {
      setFinalizing(false)
    }
  }

  // ── toggle handler ──
  const handleToggleRegistration = async () => {
    if (!eventId || !sportId) return
    try {
      setRegistrationLoading(true)
      await changeSportRegistrationStatus(eventId, sportId)
      await refetch()
    } catch {
      // error already set in the hook — no console noise in production
    } finally {
      setRegistrationLoading(false)
    }
  }

  // ── LOADING ──
  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: MUTED }}>
          <Spinner size={40} />
          <div style={{ fontSize: "0.9rem" }}>Loading sport…</div>
        </div>
      </PageWrapper>
    )
  }

  // ── ERROR ──
  if (error) {
    return (
      <PageWrapper>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "10px", padding: "16px 20px", color: DANGER, fontSize: "0.85rem", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      </PageWrapper>
    )
  }

  // ── NOT FOUND ──
  if (!sport) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Sport not found</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>

      {/* ── EDIT SPORT MODAL ── */}
      {showEditSport && sport && eventId && sportId && (
        <EditSportModal
          sport={sport}
          eventId={eventId}
          sportId={sportId}
          onSave={updateEventSport}
          saving={sportLoading}
          onClose={() => setShowEditSport(false)}
          onDone={async () => {
            setShowEditSport(false)
            try { await refetch() } catch { /* modal is already closed; stale data is better than a crash */ }
          }}
          onMediaChange={refetch}
        />
      )}

      {/* ── BACK ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${BORDER}`,
          color: MUTED,
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "28px"
        }}
      >
        <ArrowLeft size={14} /> Back to Event
      </button>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: "28px" }}>

        {/* title row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "10px"
        }}>
          <Swords size={22} style={{ color: ACCENT, flexShrink: 0 }} />

          <h1 style={{
            margin: 0,
            fontSize: "1.8rem",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.08em"
          }}>
            {toLabel(sport.sport)}
          </h1>

          <StatusPill status={sport.status} />

          {/* EDIT SPORT BUTTON */}
          <button
            onClick={() => setShowEditSport(true)}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e5e7eb",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s",
            }}
          >
            <Edit2 size={13} /> Edit Sport
          </button>

          {/* TOGGLE REGISTRATION BUTTON */}
          <button
            onClick={handleToggleRegistration}
            disabled={registrationLoading}
            style={{
              background: isOpen ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
              border: isOpen
                ? "1px solid rgba(248,113,113,0.3)"
                : "1px solid rgba(74,222,128,0.3)",
              color: isOpen ? DANGER : SUCCESS,
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: registrationLoading ? "not-allowed" : "pointer",
              opacity: registrationLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s"
            }}
          >
            {registrationLoading
              ? <><Spinner size={12} color="currentColor" />Updating…</>
              : isOpen ? "🔒 Close Registration" : "🔓 Open Registration"
            }
          </button>

          {/* PUBLISH TO GLOBAL RANKINGS — shown for admins after all matches complete */}
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            title="Recalculate and publish results to the Global Rankings page"
            style={{
              background: "rgba(250,71,21,0.12)",
              border: "1px solid rgba(250,71,21,0.3)",
              color: ACCENT,
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: finalizing ? "not-allowed" : "pointer",
              opacity: finalizing ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s",
            }}
          >
            {finalizing ? <><Spinner size={12} color={ACCENT} />Publishing…</> : "🌐 Publish to Global Rankings"}
          </button>
        </div>

        {/* finalize feedback */}
        {finalizeMsg && (
          <div style={{
            padding: "8px 14px",
            background: finalizeMsg.startsWith("✓") ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${finalizeMsg.startsWith("✓") ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
            borderRadius: "8px",
            fontSize: "0.82rem",
            color: finalizeMsg.startsWith("✓") ? SUCCESS : DANGER,
            marginTop: "8px",
          }}>
            {finalizeMsg}
          </div>
        )}

        {/* event breadcrumb */}
        <div style={{ color: MUTED, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          Event: <span style={{ color: LABEL, fontWeight: 600 }}>{event?.eventName}</span>
        </div>

        {/* description */}
        {(sport.sportsDescription) && (
          <p style={{
            marginTop: "10px",
            color: MUTED,
            fontSize: "0.88rem",
            lineHeight: 1.6,
            maxWidth: "700px",
            background: "rgba(0,0,0,0.2)",
            border: `1px solid ${BORDER}`,
            borderRadius: "8px",
            padding: "10px 14px"
          }}>
            {sport.sportsDescription}
          </p>
        )}
      </div>

      {/* ── STAT BOXES ── */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "28px" }}>
        <StatBox icon={<Trophy size={20} />}      label="Teams"      value={totalTeams}                        color={WARNING} />
        <StatBox icon={<Users size={20} />}       label="Players"    value={totalPlayers}                     color={SUCCESS} />
        {sport.maxTeams    != null && <StatBox icon={<Tag size={20} />}        label="Max Teams"  value={sport.maxTeams}                       color={LABEL}   />}
        {sport.entryFee    != null && <StatBox icon={<DollarSign size={20} />} label="Entry Fee"  value={formatCurrency(sport.entryFee)}        color={WARNING} />}
        {sport.prizeMoney  != null && <StatBox icon={<Award size={20} />}      label="Prize Pool" value={formatCurrency(sport.prizeMoney)}      color={SUCCESS} />}
      </div>

      {/* ── SPORT DETAILS GRID ── */}
      <div style={{
        background: CARD2,
        border: "1px solid rgba(250,71,21,0.14)",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "28px"
      }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${BORDER}`,
          background: "rgba(250,71,21,0.04)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Swords size={14} style={{ color: ACCENT }} />
          SPORT DETAILS
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* meta chips grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            <MetaChip icon={<Zap size={15} />}        label="Age Group"        value={toLabel(sport.ageGroup)}          />
            <MetaChip icon={<Swords size={15} />}     label="Competition Type" value={toLabel(sport.competitionType)}   />
            <MetaChip icon={<Trophy size={15} />}     label="Format"           value={toLabel(sport.formatType)}        />
            <MetaChip icon={<Cpu size={15} />}        label="Control Type"     value={toLabel(sport.controlType)}       />
            <MetaChip icon={<Weight size={15} />}     label="Weight Class"     value={toLabel(sport.weightClass)}       />
            <MetaChip icon={<Weight size={15} />}     label="Weight Limit"     value={sport.weightLimitKg != null ? `${sport.weightLimitKg} kg` : null} />
            <MetaChip icon={<Bot size={15} />}        label="Max Bots/Team"    value={sport.maxBotsPerTeam}             />
            <MetaChip
              icon={<Ruler size={15} />}
              label="Dimensions (L×W×H)"
              value={
                sport.maxLengthCm != null && sport.maxWidthCm != null && sport.maxHeightCm != null
                  ? `${sport.maxLengthCm}×${sport.maxWidthCm}×${sport.maxHeightCm} cm`
                  : null
              }
            />
            <MetaChip
              icon={<Users size={15} />}
              label="Team Size"
              value={
                sport.minTeamSize != null && sport.maxTeamSize != null
                  ? `${sport.minTeamSize} – ${sport.maxTeamSize} players`
                  : null
              }
            />
            <MetaChip icon={<Tag size={15} />}          label="Max Teams"  value={sport.maxTeams}                      />
            <MetaChip icon={<DollarSign size={15} />}   label="Entry Fee"  value={formatCurrency(sport.entryFee)}       />
            <MetaChip icon={<Award size={15} />}        label="Prize Pool" value={formatCurrency(sport.prizeMoney)}     />
          </div>

          {/* extra rules */}
          {sport.extraRules && Object.keys(sport.extraRules).length > 0 && (
            <div style={{
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${BORDER}`,
              borderRadius: "9px",
              padding: "12px 16px"
            }}>
              <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Extra Rules
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(sport.extraRules).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", gap: "10px", fontSize: "0.82rem" }}>
                    <span style={{ color: ACCENT, fontWeight: 700, minWidth: "120px" }}>{toLabel(key)}</span>
                    <span style={{ color: LABEL }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* registration window */}
          {sport.registrationStartDate && sport.registrationEndDate && (
            <div style={{
              background: "rgba(250,71,21,0.05)",
              border: "1px solid rgba(250,71,21,0.15)",
              borderRadius: "9px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <Calendar size={16} style={{ color: ACCENT, flexShrink: 0 }} />
              <div>
                <div style={{
                  fontSize: "0.62rem",
                  color: MUTED,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "3px"
                }}>
                  Registration Window
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: TEXT }}>
                  {formatDate(sport.registrationStartDate)}
                  <span style={{ color: MUTED, margin: "0 10px" }}>→</span>
                  {formatDate(sport.registrationEndDate)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

          
      {!isOpen && (
  <div className="m-4 flex  gap-3 rounded-lg p-4 shadow-md">
    <div>
      <button
        onClick={() => navigate(`${location.pathname}/create-match`)}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        Create Match
      </button>
    </div>

    <div>
      <button
        onClick={() => navigate(`${location.pathname}/update-score`)}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
      >
        Update Score
      </button>
    </div>

    <div>
      <button
        onClick={() => navigate(`${location.pathname}/ranking`)}
        className="w-full rounded-md bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
      >
        Ranking
      </button>
    </div>
  </div>
)}

      {/* ── REGISTERED TEAMS ── */}
      <div style={{
        background: CARD2,
        border: "1px solid rgba(250,71,21,0.14)",
        borderRadius: "16px",
        overflow: "hidden"
      }}>
        {/* section header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${BORDER}`,
          background: "rgba(250,71,21,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem" }}>
              REGISTERED TEAMS
            </span>
            <span style={{
              background: "rgba(250,71,21,0.13)",
              border: "1px solid rgba(250,71,21,0.28)",
              color: ACCENT,
              borderRadius: "999px",
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "1px 9px"
            }}>
              {totalTeams}
            </span>
          </div>
          <span style={{ fontSize: "0.72rem", color: MUTED }}>
            {totalPlayers} total player{totalPlayers !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ padding: "18px 20px" }}>
          {registrations.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px"
            }}>
              <div style={{ fontSize: "2.5rem" }}>🤖</div>
              <div style={{ color: MUTED, fontSize: "0.85rem", fontWeight: 600 }}>
                No teams registered yet
              </div>
              <div style={{ color: MUTED, fontSize: "0.75rem" }}>
                {isOpen
                  ? "Registration is open — teams can register now"
                  : "Open registration to allow teams to sign up"
                }
              </div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "14px"
            }}>
              {registrations.map((team, i) => (
                <TeamCard key={team.id} team={team} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

    </PageWrapper>
  )
}