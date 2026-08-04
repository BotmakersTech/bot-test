import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Users, Trophy, Calendar, CalendarRange, Tag, Swords, DollarSign, Award, Bot,
  Edit2, X, FileEdit, PlayCircle, RefreshCw, CheckCircle2, XCircle, Lock, Unlock, Globe, MessageCircle,
} from "lucide-react"
import { useAdminEvents } from "../hooks/UseAdminEvent"
import { type CreateEventSportRequest } from "../api/admin.api"
import { ensureTeamChatRoom, updateRegistrationStatus } from "../../Organizer/api/organizer.api"
import SportMediaField from "../../Organizer/components/SportMediaField"
import { pushToGlobalRankings } from "../../Rankings/api/rankings.api"
import TeamLogo from "../../../shared/components/TeamLogo"
import { ORG } from "../../Organizer/theme/organizerTheme"
import PageWrapper from "../../Organizer/components/PageWrapper"
import { useAppDispatch } from "../../../app/hooks"
import { fetchChatRooms, setActiveRoom } from "../../Chat/store/chatSlice"
import "../../Organizer/styles/sportDetail.css"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — same light theme as the Organizer Sport Detail
// page (organizerTheme.ts), which itself matches the User
// Dashboard / Team Dashboard / Robot Profile reference pages.
// ─────────────────────────────────────────────────────────────

const BORDER  = "rgba(75,134,232,0.28)"
const ACCENT  = ORG.violet
const TEXT    = ORG.text
const MUTED   = ORG.muted
const LABEL   = "#374151"
const WARNING = "#a16207"
const DANGER  = ORG.danger

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
  teamId?: string
  teamName: string
  teamLogoUrl?: string
  robotName?: string
  status?: string
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
      border: `2px solid rgba(75,134,232,0.15)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "admin-sport-spin 0.7s linear infinite",
      flexShrink: 0
    }} />
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { cls: string; icon: React.ReactNode }> = {
    PUBLISHED:           { cls: "is-published", icon: <Globe size={11} /> },
    DRAFT:               { cls: "is-draft",     icon: <FileEdit size={11} /> },
    LIVE:                { cls: "is-live",      icon: <PlayCircle size={11} /> },
    ONGOING:             { cls: "is-live",      icon: <RefreshCw size={11} /> },
    COMPLETED:           { cls: "is-draft",     icon: <CheckCircle2 size={11} /> },
    CANCELLED:           { cls: "is-cancelled", icon: <XCircle size={11} /> },
    REGISTRATION_OPEN:   { cls: "is-open",      icon: <Unlock size={11} /> },
    REGISTRATION_CLOSED: { cls: "is-closed",    icon: <Lock size={11} /> },
  }
  const key = status?.toUpperCase() || "DRAFT"
  const s   = MAP[key] || MAP["DRAFT"]
  return (
    <span className={`sdt-badge-status ${s.cls}`}>
      {s.icon} {key.replace(/_/g, " ")}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// FIELD  (sport-details grid cell — hidden entirely when there's no value)
// ─────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null
  return (
    <div>
      <div className="sdt-field-label">{label}</div>
      <div className="sdt-field-value">{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEAM CARD
// ─────────────────────────────────────────────────────────────

function TeamCard({
  team, index, eventId, onStatusChange,
}: {
  team: TeamReg
  index: number
  eventId?: string
  onStatusChange?: (registrationId: string, status: string) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [messaging, setMessaging] = React.useState(false)
  const [statusBusy, setStatusBusy] = React.useState(false)
  const playerCount = team.lineup?.length ?? 0
  const status = team.status?.toUpperCase()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!eventId || !team.teamId) return
    setMessaging(true)
    try {
      const roomId = await ensureTeamChatRoom(eventId, team.teamId)
      await dispatch(fetchChatRooms())
      dispatch(setActiveRoom(roomId))
      navigate("/messages")
    } catch {
      // no console noise in production — the button simply stays available to retry
    } finally {
      setMessaging(false)
    }
  }

  const handleStatusChange = async (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation()
    if (!onStatusChange) return
    setStatusBusy(true)
    try {
      await onStatusChange(team.id, newStatus)
    } finally {
      setStatusBusy(false)
    }
  }

  return (
    <div className="sdt-team-card">
      {/* HEADER */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
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
            border: "1px solid rgba(140,108,255,0.28)",
            flexShrink: 0,
            overflow: "hidden"
          }}>
            <TeamLogo src={team.teamLogoUrl} alt={team.teamName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>
                <span style={{ color: MUTED, fontSize: "0.7rem", marginRight: "6px" }}>#{index + 1}</span>
                {team.teamName}
              </span>
              {status && <span className={`sdt-status-pill st-${status.toLowerCase()}`}>{status.replace(/_/g, " ")}</span>}
            </div>
            {team.robotName && (
              <div style={{ fontSize: "0.72rem", color: ORG.blueHeading, fontWeight: 600, marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Bot size={11} />
                {team.robotName}
              </div>
            )}
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

        <div className="sdt-reg-actions">
          {status === "REGISTERED" && onStatusChange && (
            <>
              <button className="sdt-reg-action-btn sdt-reg-waitlist" disabled={statusBusy} onClick={(e) => handleStatusChange(e, "WAITLISTED")}>
                Waitlist
              </button>
              <button className="sdt-reg-action-btn sdt-reg-reject" disabled={statusBusy} onClick={(e) => handleStatusChange(e, "REJECTED")}>
                Reject
              </button>
            </>
          )}
          {status === "WAITLISTED" && onStatusChange && (
            <button className="sdt-reg-action-btn sdt-reg-accept" disabled={statusBusy} onClick={(e) => handleStatusChange(e, "REGISTERED")}>
              Accept
            </button>
          )}
          {eventId && team.teamId && (
            <button className="sdt-reg-action-btn sdt-reg-message" onClick={handleMessage} disabled={messaging} title="Message this team">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <MessageCircle size={11} /> Message
              </span>
            </button>
          )}
          {playerCount > 0 && (
            <span style={{
              color: MUTED,
              fontSize: "0.7rem",
              background: "rgba(75,134,232,0.06)",
              border: `1px solid ${BORDER}`,
              borderRadius: "5px",
              padding: "2px 8px",
              fontWeight: 600
            }}>
              {open ? "▲ hide" : "▼ lineup"}
            </span>
          )}
        </div>
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
                background: "rgba(75,134,232,0.04)",
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
                  background: "rgba(140,108,255,0.1)",
                  border: "1px solid rgba(140,108,255,0.25)",
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
    background: "#f8f9ff",
    border: `1px solid rgba(75,134,232,0.3)`,
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
        background: "rgba(8,8,8,0.6)",
        zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "32px 16px",
        overflowY: "auto",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "#ffffff",
        border: `1.5px solid ${ORG.blue}`,
        borderRadius: "16px",
        width: "100%",
        maxWidth: "680px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid rgba(75,134,232,0.15)",
          background: "rgba(75,134,232,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Edit2 size={16} style={{ color: ACCENT }} />
            <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: ORG.fontHeading, letterSpacing: "0.06em" }}>
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
            background: "#f8f9ff", border: "1px solid rgba(75,134,232,0.3)", borderRadius: "10px",
            padding: "14px 16px", display: "flex", flexDirection: "column", gap: "16px",
          }}>
            <SportMediaField eventId={eventId} sportId={sportId} slot="THUMBNAIL" kind="image" label="Sport Thumbnail" currentUrl={sport.sportThumbnailUrl} onMediaChange={onMediaChange} colors={{ border: "rgba(75,134,232,0.3)", muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />
            <SportMediaField eventId={eventId} sportId={sportId} slot="TEASER" kind="video" label="Teaser Video" currentUrl={sport.sportTeaserVideoUrl} onMediaChange={onMediaChange} colors={{ border: "rgba(75,134,232,0.3)", muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />
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
                background: "rgba(75,134,232,0.06)", border: "1px solid rgba(75,134,232,0.25)",
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
                    flexShrink: 0, background: ORG.gradientCta, border: "none", color: "#fff",
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
                background: "rgba(140,108,255,0.12)",
                border: "1px solid rgba(140,108,255,0.3)",
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
              background: "#f8f9ff",
              border: `1px solid rgba(75,134,232,0.3)`,
              color: MUTED,
              borderRadius: "8px",
              padding: "9px 20px",
              fontSize: "0.83rem",
              fontWeight: 600,
              cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              background: saving ? "rgba(140,108,255,0.5)" : ORG.gradientCta,
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
  const [regActionError,      setRegActionError]      = React.useState<string | null>(null)

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

  // sport.registrations now includes every status (WAITLISTED/REJECTED/etc.),
  // not just REGISTERED — the top stat cards should only count teams that are
  // actually competing, while the list below shows everyone so the admin can
  // accept/reject/waitlist.
  const registrations: TeamReg[] = sport?.registrations ?? []
  const activeRegistrations = registrations.filter(t => {
    const s = t.status?.toUpperCase()
    return !s || s === "REGISTERED" || s === "CHECKED_IN"
  })
  const totalTeams   = activeRegistrations.length
  const totalPlayers = activeRegistrations.reduce((n, t) => n + (t.lineup?.length ?? 0), 0)

  // ── accept / reject / waitlist a registration ──
  const handleRegistrationStatusChange = async (registrationId: string, status: string) => {
    if (!eventId) return
    setRegActionError(null)
    try {
      await updateRegistrationStatus(eventId, registrationId, status)
      await refetch()
    } catch (err: unknown) {
      const isResponseError = typeof err === "object" && err !== null && "response" in err
      const responseData = isResponseError
        ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
        : undefined
      setRegActionError(responseData?.message || responseData?.error || "Couldn't update the registration — try again")
    }
  }

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

      <style>{`@keyframes admin-sport-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── BACK ── */}
      <button onClick={() => navigate(-1)} className="sdt-back-btn" style={{ marginBottom: "24px" }}>
        <ArrowLeft size={18} />
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
          <h1 className="sdt-title">{toLabel(sport.sport)}</h1>

          <StatusPill status={sport.status} />

          {/* EDIT SPORT BUTTON */}
          <button onClick={() => setShowEditSport(true)} className="sdt-btn sdt-btn-edit">
            <Edit2 size={13} /> Edit Sport
          </button>

          {/* TOGGLE REGISTRATION BUTTON */}
          <button
            onClick={handleToggleRegistration}
            disabled={registrationLoading}
            className={`sdt-btn ${isOpen ? "sdt-btn-close" : "sdt-btn-open"}`}
          >
            {registrationLoading
              ? <><Spinner size={12} color="currentColor" />Updating…</>
              : isOpen ? <><Lock size={13} />Close Registration</> : <><Unlock size={13} />Open Registration</>
            }
          </button>

          {/* PUBLISH TO GLOBAL RANKINGS — shown for admins after all matches complete */}
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            title="Recalculate and publish results to the Global Rankings page"
            className="sdt-btn sdt-btn-publish"
          >
            {finalizing ? <><Spinner size={12} color={ACCENT} />Publishing…</> : <><Globe size={13} />Publish to Global Rankings</>}
          </button>
        </div>

        {/* finalize feedback */}
        {finalizeMsg && (
          <div className={`sdt-banner ${finalizeMsg.startsWith("✓") ? "ok" : "error"}`}>
            {finalizeMsg}
          </div>
        )}

        {/* event breadcrumb */}
        <div className="sdt-breadcrumb">
          Event: <span style={{ color: LABEL, fontWeight: 600 }}>{event?.eventName}</span>
        </div>

        {/* description */}
        {(sport.sportsDescription) && (
          <p className="sdt-description">
            {sport.sportsDescription}
          </p>
        )}
      </div>

      {/* ── STAT BOXES ── */}
      <div className="sdt-stat-row">
        <div className="sdt-stat-card">
          <span className="sdt-stat-icon"><Trophy size={20} /></span>
          <div><div className="sdt-stat-value">{totalTeams}</div><div className="sdt-stat-label">Teams</div></div>
        </div>
        <div className="sdt-stat-card">
          <span className="sdt-stat-icon"><Users size={20} /></span>
          <div><div className="sdt-stat-value">{totalPlayers}</div><div className="sdt-stat-label">Players</div></div>
        </div>
        {sport.maxTeams != null && (
          <div className="sdt-stat-card">
            <span className="sdt-stat-icon"><Tag size={20} /></span>
            <div><div className="sdt-stat-value">{sport.maxTeams}</div><div className="sdt-stat-label">Max Teams</div></div>
          </div>
        )}
        {sport.entryFee != null && (
          <div className="sdt-stat-card">
            <span className="sdt-stat-icon"><DollarSign size={20} /></span>
            <div><div className="sdt-stat-value">{formatCurrency(sport.entryFee)}</div><div className="sdt-stat-label">Entry Fee</div></div>
          </div>
        )}
        {sport.prizeMoney != null && (
          <div className="sdt-stat-card">
            <span className="sdt-stat-icon"><Award size={20} /></span>
            <div><div className="sdt-stat-value">{formatCurrency(sport.prizeMoney)}</div><div className="sdt-stat-label">Prize Pool</div></div>
          </div>
        )}
      </div>

      {/* ── SPORT DETAILS ── */}
      <div className="sdt-panel">
        <div className="sdt-panel-header">
          <span className="sdt-panel-title"><Swords size={14} /> SPORT DETAILS</span>
        </div>

        <div className="sdt-panel-body">

          {/* meta fields — real sport specs, styled in the fields-box treatment */}
          <div className="sdt-fields-box">
            <Field label="Age Group" value={sport.ageGroup ? toLabel(sport.ageGroup) : null} />
            <Field label="Competition Type" value={sport.competitionType ? toLabel(sport.competitionType) : null} />
            <Field label="Format" value={sport.formatType ? toLabel(sport.formatType) : null} />
            <Field label="Control Type" value={sport.controlType ? toLabel(sport.controlType) : null} />
            <Field label="Weight Class" value={sport.weightClass ? toLabel(sport.weightClass) : null} />
            <Field label="Weight Limit" value={sport.weightLimitKg != null ? `${sport.weightLimitKg} kg` : null} />
            <Field label="Max Bots/Team" value={sport.maxBotsPerTeam ?? null} />
            <Field
              label="Dimensions (L×W×H)"
              value={
                sport.maxLengthCm != null && sport.maxWidthCm != null && sport.maxHeightCm != null
                  ? `${sport.maxLengthCm}×${sport.maxWidthCm}×${sport.maxHeightCm} cm`
                  : null
              }
            />
            <Field
              label="Team Size"
              value={
                sport.minTeamSize != null && sport.maxTeamSize != null
                  ? `${sport.minTeamSize} – ${sport.maxTeamSize} players`
                  : null
              }
            />
            <Field label="Max Teams" value={sport.maxTeams ?? null} />
            <Field label="Entry Fee" value={sport.entryFee != null ? formatCurrency(sport.entryFee) : null} />
            <Field label="Prize Pool" value={sport.prizeMoney != null ? formatCurrency(sport.prizeMoney) : null} />
          </div>

          {/* extra rules */}
          {sport.extraRules && Object.keys(sport.extraRules).length > 0 && (
            <div style={{
              background: "rgba(1,98,209,0.05)",
              border: "1px solid rgba(75,134,232,0.28)",
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
            <div className="sdt-reg-window">
              <Calendar size={16} style={{ color: ACCENT, flexShrink: 0 }} />
              <div>
                <div className="label"><CalendarRange size={12} /> Registration Window</div>
                <div className="dates">
                  <span>{formatDate(sport.registrationStartDate)}</span>
                  <span>→</span>
                  <span>{formatDate(sport.registrationEndDate)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BRACKET / SCORING / RANKING / CERTIFICATES ── */}
      <div className="sdt-action-row">
        {!isOpen && (
          <>
            <button onClick={() => navigate(`${location.pathname}/create-match`)} className="sdt-action-btn sdt-action-create">
              <Swords size={14} /> Create Match
            </button>
            <button onClick={() => navigate(`${location.pathname}/update-score`)} className="sdt-action-btn sdt-action-update">
              <RefreshCw size={14} /> Update Score
            </button>
            <button onClick={() => navigate(`${location.pathname}/ranking`)} className="sdt-action-btn sdt-action-rank">
              <Trophy size={14} /> Ranking
            </button>
          </>
        )}
        <button onClick={() => navigate(`/admin/certificates?eventSportId=${sportId}`)} className="sdt-action-btn sdt-action-update">
          <Award size={14} /> Certificates
        </button>
      </div>

      {/* ── REGISTERED TEAMS ── */}
      <div className="sdt-panel" style={{ marginBottom: 0 }}>
        {/* section header */}
        <div className="sdt-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="sdt-panel-title">REGISTERED TEAMS</span>
            <span className="sdt-panel-count">{registrations.length}</span>
          </div>
          <span style={{ fontSize: "0.72rem", color: MUTED, fontFamily: "Inter, sans-serif" }}>
            {totalPlayers} confirmed player{totalPlayers !== 1 ? "s" : ""}
          </span>
        </div>

        {regActionError && <div className="sdt-banner error" style={{ margin: "0 20px" }}>{regActionError}</div>}

        <div className="sdt-panel-body">
          {registrations.length === 0 ? (
            <div className="sdt-empty-state">
              <Bot size={40} style={{ color: "rgba(140,108,255,0.4)" }} />
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
            <div className="sdt-team-list">
              {registrations.map((team, i) => (
                <TeamCard key={team.id} team={team} index={i} eventId={eventId} onStatusChange={handleRegistrationStatusChange} />
              ))}
            </div>
          )}
        </div>
      </div>

    </PageWrapper>
  )
}
