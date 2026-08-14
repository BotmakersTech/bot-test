import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  ArrowLeft, Users, Trophy, Calendar, CalendarRange, Tag, Swords, DollarSign, Award, Bot,
  Edit2, X, Megaphone, FileEdit, PlayCircle, RefreshCw, CheckCircle2, XCircle, Lock, Unlock, Globe,
  AlertTriangle, MessageCircle, Check, Ban, Clock,
} from "lucide-react"
import { useOrganizerSportDetail } from "../hooks/useOrganizerSportDetail"
import {
  type CreateEventSportRequest, ensureTeamChatRoom,
  type SportChangeRequest, type SportUpdateResult,
  getSportChangeRequests, approveSportChangeRequest, rejectSportChangeRequest,
  updateRegistrationStatus,
} from "../api/organizer.api"
import { getPublicLeagueSports, toWeightClasses, type LeagueSport } from "../../../shared/api/catalog.api"
import { useLeagues, formatAgeRange, type PresentedLeague } from "../../../temp/pages/leagues/useLeagues"
import SportMediaField from "../components/SportMediaField"
import SportAnnouncementForm from "../components/SportAnnouncementForm"
import SupportContactManager from "../components/SupportContactManager"
import { pushToGlobalRankings } from "../../Rankings/api/rankings.api"
import type { RootState } from "../../../app/store"
import { useAppDispatch } from "../../../app/hooks"
import TeamLogo from "../../../shared/components/TeamLogo"
import { hasRole, AppRole, EVENT_HEAD_AND_UP } from "../../../shared/constants/roles"
import { fetchChatRooms, setActiveRoom } from "../../Chat/store/chatSlice"
import { ORG } from "../theme/organizerTheme"
import PageWrapper from "../components/PageWrapper"
import { ChangeFieldDiff } from "../../../shared/components/EventDashboard/ChangeRequestDiff"
import "../styles/sportDetail.css"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — Organizer light theme (organizerTheme.ts), matching the
// User Dashboard / Team Dashboard / Robot Profile reference pages.
// ─────────────────────────────────────────────────────────────

const BORDER  = "rgba(75,134,232,0.28)"
const ACCENT  = ORG.violet
const TEXT    = ORG.text
const MUTED   = ORG.muted
const LABEL   = "#374151"
const SUCCESS = ORG.success
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
  robotId?: string
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
      animation: "org-spin 0.7s linear infinite",
      flexShrink: 0
    }} />
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { cls: string; icon: React.ReactNode }> = {
    PUBLISHED:           { cls: "is-published", icon: <Megaphone size={11} /> },
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>
                <span style={{ color: MUTED, fontSize: "0.7rem", marginRight: "6px" }}>#{index + 1}</span>
                {team.teamName}
              </span>
              {status && <span className={`sdt-status-pill st-${status.toLowerCase()}`}>{status.replace(/_/g, " ")}</span>}
            </div>
            {team.robotName && (
              <div style={{
                fontSize: "0.72rem",
                color: ORG.blueHeading,
                fontWeight: 600,
                marginTop: "2px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
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

        <div className="sdt-reg-actions" style={{ flexShrink: 0 }}>
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
            <button
              className="sdt-reg-action-btn sdt-reg-message"
              onClick={handleMessage}
              disabled={messaging}
              title="Message this team"
            >
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

// ── Age groups + sports now come from the backend League/Sport catalog
// (useLeagues() + getPublicLeagueSports()) instead of this hardcoded list —
// see getPresetSpec below. Only FORMAT_TYPE_OPTIONS/CONTROL_TYPES stay local
// (unrelated to the catalog: format is a bracket-generation concept, control
// type mirrors the backend's own fixed ControlMode enum).

const FORMAT_TYPE_OPTIONS = [
  { value: "KNOCKOUT",           label: "Knockout"           },
  { value: "ROUND_ROBIN",        label: "Round Robin"        },
  { value: "SWISS",              label: "Swiss"              },
  { value: "DOUBLE_ELIMINATION", label: "Double Elimination" },
]

// Matches backend ControlMode enum exactly (team/enums/ControlMode.java).
const CONTROL_TYPES = [
  { value: "WIRED",    label: "Wired"    },
  { value: "WIRELESS", label: "Wireless" },
  { value: "ANY",      label: "Any (Wired or Wireless)" },
]

// ── Official spec preview — now sourced live from the League/Sport catalog
// (LeagueSport rows, one per league+sport pairing) instead of a hardcoded
// rulebook table. A sport with several weight classes (e.g. Apex's Robo War,
// 1.5kg + 60kg) has no single weightLimitKg — the caller passes the chosen
// class's kg value explicitly once the organiser picks one.
interface SportSpecPreset {
  weightLimitKg?: number
  maxLengthCm?: number
  maxWidthCm?: number
  maxHeightCm?: number
  controlType?: string   // WIRED | WIRELESS | ANY
  maxBotsPerTeam?: number
  note?: string
  extraSpecs?: Record<string, string>
}

function getPresetSpec(ls: LeagueSport, chosenWeightKg?: number): SportSpecPreset {
  return {
    weightLimitKg: ls.weightClasses.length > 0 ? chosenWeightKg : ls.weightLimitKg ?? undefined,
    maxLengthCm: ls.maxLengthCm ?? undefined,
    maxWidthCm: ls.maxWidthCm ?? undefined,
    maxHeightCm: ls.maxHeightCm ?? undefined,
    controlType: ls.controlType ?? undefined,
    maxBotsPerTeam: ls.maxBotsPerTeam ?? undefined,
    note: ls.entryNote ?? undefined,
    extraSpecs: ls.extraSpecs,
  }
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
  onSave: (eid: string, sid: string, req: CreateEventSportRequest) => Promise<SportUpdateResult>
  saving: boolean
  onClose: () => void
  onDone: (result: SportUpdateResult) => void
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
  const { leagues } = useLeagues()
  const [leagueSports, setLeagueSports] = React.useState<LeagueSport[]>([])
  const selectedLeague = leagues.find(l => l.ageGroupValue === form.ageGroup) ?? null

  React.useEffect(() => {
    if (!selectedLeague) { setLeagueSports([]); return }
    getPublicLeagueSports(selectedLeague.slug).then(setLeagueSports).catch(() => setLeagueSports([]))
  }, [selectedLeague])

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

      const result = await onSave(eventId, sportId, payload)
      onDone(result)
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
              {leagues.map((l: PresentedLeague) => (
                <option key={l.ageGroupValue} value={l.ageGroupValue}>{l.shortName} — {formatAgeRange(l.minAge, l.maxAge)} yrs</option>
              ))}
            </select>
          </div>

          {/* Row 2: Sport */}
          {(() => {
            const currentInList = leagueSports.some(s => s.sportName === form.sport)
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
                  {leagueSports.map(s => <option key={s.id} value={s.sportName}>{s.sportName}</option>)}
                </select>
                {!selectedLeague && form.ageGroup && (
                  <span style={{ fontSize: "0.68rem", color: WARNING, marginTop: "4px" }}>
                    Select an age group to filter sports
                  </span>
                )}
              </div>
            )
          })()}

          {/* Official spec preview + one-click apply ────────────────────── */}
          {(() => {
            const matched = leagueSports.find(s => s.sportName === form.sport)
            if (!matched) return null

            const formatParts = (p: SportSpecPreset) => {
              const parts: string[] = []
              if (p.weightLimitKg != null) parts.push(`${p.weightLimitKg}kg`)
              if (p.maxLengthCm != null && p.maxWidthCm != null && p.maxHeightCm != null) {
                parts.push(`${p.maxLengthCm}×${p.maxWidthCm}×${p.maxHeightCm}cm`)
              }
              if (p.controlType) parts.push(p.controlType === "ANY" ? "Wired or Wireless" : p.controlType)
              if (p.maxBotsPerTeam != null) parts.push(`max ${p.maxBotsPerTeam} bot/team`)
              Object.entries(p.extraSpecs ?? {}).forEach(([k, v]) => parts.push(`${k}: ${v}`))
              return parts
            }

            const applyPreset = (p: SportSpecPreset, weightClassLabel?: string) => {
              setForm(prev => ({
                ...prev,
                weightLimitKg: p.weightLimitKg,
                maxLengthCm:   p.maxLengthCm,
                maxWidthCm:    p.maxWidthCm,
                maxHeightCm:   p.maxHeightCm,
                controlType:   p.controlType ?? prev.controlType,
                maxBotsPerTeam: p.maxBotsPerTeam ?? prev.maxBotsPerTeam,
                weightClass:   weightClassLabel ?? prev.weightClass,
                extraRulesList: p.extraSpecs && Object.keys(p.extraSpecs).length > 0
                  ? Object.entries(p.extraSpecs).map(([key, value]) => ({ key, value }))
                  : prev.extraRulesList,
              }))
            }

            // Multiple weight classes (e.g. Apex's Robo War: 1.5kg + 60kg) —
            // no single spec to apply, offer one button per class instead.
            if (matched.weightClasses.length > 0) {
              return (
                <div style={{
                  display: "flex", flexDirection: "column", gap: "8px",
                  background: "rgba(75,134,232,0.06)", border: "1px solid rgba(75,134,232,0.25)",
                  borderRadius: "8px", padding: "10px 14px",
                }}>
                  <div style={{ fontSize: "0.74rem", color: TEXT }}>
                    <strong style={{ color: ACCENT }}>Official spec:</strong> multiple weight classes — pick one to apply
                    {matched.entryNote && <span style={{ color: MUTED }}> — {matched.entryNote}</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {matched.weightClasses.map(wc => (
                      <button
                        key={wc.label}
                        type="button"
                        onClick={() => applyPreset(getPresetSpec(matched, wc.weightKg), wc.label)}
                        style={{
                          background: ORG.gradientCta, border: "none", color: "#fff",
                          borderRadius: "6px", padding: "6px 12px", fontSize: "0.72rem", fontWeight: 700,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        Apply {wc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }

            const preset = getPresetSpec(matched)
            const parts = formatParts(preset)
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
                  onClick={() => applyPreset(preset)}
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
                const wcs = Array.from(
                  new Map(leagueSports.flatMap(s => toWeightClasses(s)).map(w => [w.value, w])).values()
                )
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
// PENDING CHANGE REQUEST PANEL
// Held edits to an already-APPROVED sport's specs. A SPORT_HEAD's edit
// needs EVENT_HEAD/ORGANISER approval; an EVENT_HEAD/ORGANISER's edit needs
// ADMIN approval. The panel below shows the requester's own submission as a
// read-only "awaiting approval" banner, or — for whoever the request routes
// to — inline Approve/Reject actions (mirrors AdminEventDetail's SportCard
// isPending review pattern).
// ─────────────────────────────────────────────────────────────

function PendingChangeRequestPanel({
  eventId,
  sportId,
  sport,
  currentUserId,
  canReviewSportHeadTier,
  canReviewManagerTier,
  onResolved,
}: {
  eventId: string
  sportId: string
  sport: SportDetail
  currentUserId?: string
  canReviewSportHeadTier: boolean
  canReviewManagerTier: boolean
  onResolved: () => void
}) {
  const [requests, setRequests] = React.useState<SportChangeRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [rejectingId, setRejectingId] = React.useState<string | null>(null)
  const [reason, setReason] = React.useState("")
  const [actionError, setActionError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSportChangeRequests(eventId, sportId, "PENDING")
      setRequests(data)
    } catch {
      // silently skip — pending-changes panel is a convenience surface, not critical path
    } finally {
      setLoading(false)
    }
  }, [eventId, sportId])

  React.useEffect(() => { load() }, [load])

  if (loading || requests.length === 0) return null

  const handleApprove = async (id: string) => {
    setBusyId(id); setActionError(null)
    try {
      await approveSportChangeRequest(eventId, id)
      await load()
      onResolved()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.response?.data?.error || "Failed to approve change request")
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    setBusyId(id); setActionError(null)
    try {
      await rejectSportChangeRequest(eventId, id, reason || undefined)
      setRejectingId(null); setReason("")
      await load()
      onResolved()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.response?.data?.error || "Failed to reject change request")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
      {requests.map(req => {
        const isOwn = currentUserId != null && req.requestedBy === currentUserId
        const canReview = !isOwn && (
          (req.requesterTier === "SPORT_HEAD" && canReviewSportHeadTier) ||
          (req.requesterTier === "EVENT_HEAD_OR_ORGANISER" && canReviewManagerTier)
        )
        const busy = busyId === req.id

        return (
          <div key={req.id} style={{
            background: "rgba(161,98,7,0.06)",
            border: "1px solid rgba(161,98,7,0.3)",
            borderRadius: "12px",
            padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", fontWeight: 700, color: WARNING }}>
              <Clock size={14} />
              {isOwn
                ? "Your edit is awaiting approval"
                : `${req.requestedByName || "Someone"} proposed a change awaiting your approval`}
            </div>

            <ChangeFieldDiff request={req} sport={sport} />

            {actionError && (
              <div style={{ color: DANGER, fontSize: "0.78rem", marginTop: "8px" }}>{actionError}</div>
            )}

            {canReview && (
              <div style={{ marginTop: "12px" }}>
                {rejectingId !== req.id ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      disabled={busy}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(31,169,82,0.12)", border: "1px solid rgba(31,169,82,0.35)", color: SUCCESS, borderRadius: "8px", padding: "7px 14px", fontSize: "0.76rem", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer" }}
                    >
                      {busy ? <Spinner size={12} color={SUCCESS} /> : <Check size={13} />} Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(req.id)}
                      disabled={busy}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.25)", color: DANGER, borderRadius: "8px", padding: "7px 14px", fontSize: "0.76rem", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer" }}
                    >
                      <Ban size={13} /> Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input
                      autoFocus
                      placeholder="Reason for rejection (optional)…"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "7px 10px", color: TEXT, fontSize: "0.78rem", outline: "none" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="button" onClick={() => { setRejectingId(null); setReason("") }} disabled={busy}
                        style={{ background: "rgba(0,0,0,0.04)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "7px", padding: "7px 12px", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={() => handleReject(req.id)} disabled={busy}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: busy ? "rgba(224,75,75,0.2)" : DANGER, border: "none", color: "#fff", borderRadius: "7px", padding: "7px 12px", fontSize: "0.76rem", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer" }}>
                        {busy ? <Spinner size={12} color="#fff" /> : <Ban size={13} />} Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function OrganizerSportDetailPage() {

  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>()
  const navigate = useNavigate()

  const user = useSelector((state: RootState) => state.auth.user)
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])
  const isAdmin = hasRole(userRoles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])
  // Who can review a pending sport-edit change request at each tier — an
  // approximation for showing/hiding the Approve/Reject UI; the backend
  // (assertCanManageEvent / assertIsPlatformAdmin) is the real gate.
  const canReviewSportHeadTier = hasRole(userRoles, EVENT_HEAD_AND_UP)
  const canReviewManagerTier   = isAdmin

  const [registrationLoading, setRegistrationLoading] = React.useState(false)
  const [showEditSport,       setShowEditSport]       = React.useState(false)
  const [finalizing,          setFinalizing]          = React.useState(false)
  const [finalizeMsg,         setFinalizeMsg]         = React.useState<string | null>(null)
  const [finalizeOk,          setFinalizeOk]          = React.useState(false)
  const [saveResultMsg,       setSaveResultMsg]       = React.useState<{ text: string; pending: boolean } | null>(null)
  const [pendingPanelKey,     setPendingPanelKey]     = React.useState(0)
  const [showAnnounceForm,    setShowAnnounceForm]    = React.useState(false)
  const [regActionError,      setRegActionError]      = React.useState<string | null>(null)

  const {
    event,
    loading,
    error,
    refetch,
    sportLoading,
    changeSportRegistrationStatus,
    updateEventSport,
  } = useOrganizerSportDetail(eventId, sportId)

  // ── derive the specific sport from event.sports ──
  const sport = event?.sports?.find((s: any) => s.id === sportId) as SportDetail | undefined

  // sport.registrations now includes every status (WAITLISTED/REJECTED/etc.),
  // not just REGISTERED — the top stat cards should only count teams that are
  // actually competing, while the list below shows everyone so the sport
  // head can accept/reject/waitlist.
  const registrations: TeamReg[] = sport?.registrations ?? []
  const activeRegistrations = registrations.filter(t => {
    const s = t.status?.toUpperCase()
    return !s || s === "REGISTERED" || s === "CHECKED_IN"
  })
  const totalTeams   = activeRegistrations.length
  const totalPlayers = activeRegistrations.reduce((n, t) => n + (t.lineup?.length ?? 0), 0)

  const isOpen = sport?.status?.toUpperCase() === "REGISTRATION_OPEN"

  // ── push-to-global-rankings handler — ADMIN/SUPER_ADMIN only, no exceptions ──
  const handleFinalize = async () => {
    if (!sportId) return
    setFinalizing(true)
    setFinalizeMsg(null)
    try {
      await pushToGlobalRankings(sportId)
      setFinalizeOk(true)
      setFinalizeMsg("Global rankings updated successfully!")
    } catch (e: any) {
      setFinalizeOk(false)
      setFinalizeMsg(e?.response?.data?.message ?? "Finalization failed")
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.22)", borderRadius: "10px", padding: "16px 20px", color: DANGER, fontSize: "0.85rem", fontWeight: 600 }}>
          <AlertTriangle size={16} /> {error}
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
          onDone={(result) => {
            setShowEditSport(false)
            setSaveResultMsg({ text: result.message, pending: result.status === "PENDING_APPROVAL" })
            setPendingPanelKey(k => k + 1)
          }}
          onMediaChange={refetch}
        />
      )}

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

          {/* SEND ANNOUNCEMENT BUTTON */}
          <button onClick={() => setShowAnnounceForm(v => !v)} className="sdt-btn sdt-btn-ghost">
            <Megaphone size={13} /> Send Announcement
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

          {/* PUBLISH TO GLOBAL RANKINGS — ADMIN/SUPER_ADMIN only, no exceptions */}
          {isAdmin && (
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              title="Push finalized results to the Global Rankings pool"
              className="sdt-btn sdt-btn-publish"
            >
              {finalizing ? <><Spinner size={12} color={ACCENT} />Publishing…</> : <><Globe size={13} />Publish to Global Rankings</>}
            </button>
          )}
        </div>

        {/* finalize feedback */}
        {finalizeMsg && (
          <div className={`sdt-banner ${finalizeOk ? "ok" : "error"}`}>
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

      {/* SEND ANNOUNCEMENT — inline, one-way organiser -> sport participants */}
      {showAnnounceForm && eventId && sportId && (
        <SportAnnouncementForm
          eventId={eventId}
          sportId={sportId}
          teams={registrations
            .filter(t => t.teamId)
            .map(t => ({ teamId: t.teamId as string, teamName: t.teamName, robotName: t.robotName }))}
          onClose={() => setShowAnnounceForm(false)}
          onSent={() => {}}
        />
      )}

      {/* save-result feedback (applied vs held for approval) */}
      {saveResultMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "10px 16px",
          background: saveResultMsg.pending ? "rgba(161,98,7,0.08)" : "rgba(31,169,82,0.08)",
          border: `1px solid ${saveResultMsg.pending ? "rgba(161,98,7,0.28)" : "rgba(31,169,82,0.25)"}`,
          borderRadius: "10px",
          fontSize: "0.84rem",
          fontWeight: 600,
          color: saveResultMsg.pending ? WARNING : SUCCESS,
          marginBottom: "20px",
        }}>
          {saveResultMsg.pending ? <Clock size={15} /> : <CheckCircle2 size={15} />}
          {saveResultMsg.text}
        </div>
      )}

      {/* pending sport-edit change requests awaiting review */}
      {eventId && sportId && (
        <PendingChangeRequestPanel
          key={pendingPanelKey}
          eventId={eventId}
          sportId={sportId}
          sport={sport}
          currentUserId={user?.id}
          canReviewSportHeadTier={canReviewSportHeadTier}
          canReviewManagerTier={canReviewManagerTier}
          onResolved={refetch}
        />
      )}

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

      {/* ── SPORT SUPPORT CONTACTS ── */}
      {eventId && sportId && (
        <SupportContactManager mode="sport" eventId={eventId} sportId={sportId} />
      )}

      {/* ── BRACKET / MATCHES / RANKING / CERTIFICATES ── */}
      <div className="sdt-action-row">
        {!isOpen && (
          <button onClick={() => navigate(`${location.pathname}/create-match`)} className="sdt-action-btn sdt-action-create">
            <Swords size={14} /> Create Match / Manage Bracket
          </button>
        )}
        <button onClick={() => navigate(`/organizer/certificates?eventSportId=${sportId}`)} className="sdt-action-btn sdt-action-update">
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
