import { useState } from "react"
import {
  ArrowLeft, Trophy, Users, Tag, DollarSign, Award, Calendar, ArrowRight,
  Edit2, Lock, Unlock, Globe, MessageCircle, Check, Ban, Bot,
} from "lucide-react"
import "./MobileSportDetail.css"

// Mobile view of the single-sport management page (mockup: "Sportmanagementdashboard.jsx").
// Shared by AdminSport.tsx (/admin/events/:eventId/sports/:sportId) and
// OrganizerSportDetailPage.tsx (/organizer/events/:eventId/sports/:sportId) —
// same .ssd-desktop-only/.ssd-mobile-only toggle every dual-render page in
// this codebase uses. Each page normalizes its own sport/team shape into the
// props below and passes real, already-fetched data down. The mockup itself
// only drew back/title/badge chrome, so the Edit Sport / Toggle Registration
// (and organizer-only extras) pills were added on top of its visual language
// to keep the page fully functional on mobile — same approach used for the
// title-actions row in MobileEventDetail.tsx.

export interface MobileSportTeamItem {
  id: string
  teamId?: string | null
  teamName: string
  teamLogoUrl?: string | null
  robotName?: string | null
  status?: string | null
  lineup?: { id: string; fullName: string; role?: string }[]
}

export interface MobileSportMatchAction {
  label: string
  onClick: () => void
  variant: "solid" | "outline"
}

interface MobileSportDetailProps {
  eventName?: string
  sportName: string
  statusLabel: string
  isOpen: boolean
  onBack: () => void

  onEditSport: () => void
  onToggleRegistration: () => void
  registrationLoading: boolean
  extraTitleActions?: React.ReactNode

  errorBanner?: string | null
  publishMsg?: string | null
  publishOk?: boolean
  topExtra?: React.ReactNode

  totalTeams: number
  totalPlayers: number
  maxTeams?: number | null
  entryFee?: number | null
  prizeMoney?: number | null

  ageGroup?: string | null
  competitionType?: string | null
  formatType?: string | null
  controlType?: string | null
  weightClass?: string | null
  weightLimitKg?: number | null
  maxBotsPerTeam?: number | null
  teamSizeLabel?: string | null

  registrationStartDate?: string | null
  registrationEndDate?: string | null

  matchActions: MobileSportMatchAction[]
  onCertificates: () => void
  showPublish?: boolean
  onPublish?: () => void
  publishing?: boolean

  teams: MobileSportTeamItem[]
  regActionError?: string | null
  onTeamStatusChange?: (registrationId: string, status: string) => void
  onMessageTeam?: (teamId: string) => void
}

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
  return new Date(val).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function TeamCard({
  team, index, onStatusChange, onMessage,
}: {
  team: MobileSportTeamItem
  index: number
  onStatusChange?: (registrationId: string, status: string) => void
  onMessage?: (teamId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const status = team.status?.toUpperCase()
  const playerCount = team.lineup?.length ?? 0

  return (
    <div className={`ssd-m-team-card${open ? " is-open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="ssd-m-team-top">
        {team.teamLogoUrl ? (
          <div className="ssd-m-team-avatar" style={{ backgroundImage: `url(${team.teamLogoUrl})` }} />
        ) : (
          <div className="ssd-m-team-avatar ssd-m-team-avatar-fallback">{(team.teamName?.[0] ?? "T").toUpperCase()}</div>
        )}
        {status && <span className={`ssd-m-team-status st-${status.toLowerCase()}`}>{toLabel(status)}</span>}
      </div>
      <div className="ssd-m-team-name">
        <span className="idx">#{index + 1}</span> {team.teamName}
      </div>
      {team.robotName && <div className="ssd-m-team-robot"><Bot size={10} /> {team.robotName}</div>}
      <div className="ssd-m-team-players"><Users size={10} /> {playerCount} player{playerCount !== 1 ? "s" : ""}</div>

      {open && (
        <div className="ssd-m-team-expand" onClick={e => e.stopPropagation()}>
          {team.lineup && team.lineup.length > 0 && (
            <div className="ssd-m-team-lineup">
              {team.lineup.map((p, pi) => (
                <div className="ssd-m-lineup-row" key={p.id}>
                  <span>#{pi + 1} {p.fullName}</span>
                  {p.role && <span className="role">{p.role}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="ssd-m-team-actions">
            {status === "REGISTERED" && onStatusChange && (
              <>
                <button type="button" className="ssd-m-team-action-btn wait" onClick={() => onStatusChange(team.id, "WAITLISTED")}>Waitlist</button>
                <button type="button" className="ssd-m-team-action-btn reject" onClick={() => onStatusChange(team.id, "REJECTED")}><Ban size={11} /> Reject</button>
              </>
            )}
            {status === "WAITLISTED" && onStatusChange && (
              <button type="button" className="ssd-m-team-action-btn accept" onClick={() => onStatusChange(team.id, "REGISTERED")}><Check size={11} /> Accept</button>
            )}
            {team.teamId && onMessage && (
              <button type="button" className="ssd-m-team-action-btn message" onClick={() => onMessage(team.teamId as string)}><MessageCircle size={11} /> Message</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MobileSportDetail({
  eventName, sportName, statusLabel, isOpen, onBack,
  onEditSport, onToggleRegistration, registrationLoading, extraTitleActions,
  errorBanner, publishMsg, publishOk, topExtra,
  totalTeams, totalPlayers, maxTeams, entryFee, prizeMoney,
  ageGroup, competitionType, formatType, controlType, weightClass, weightLimitKg, maxBotsPerTeam, teamSizeLabel,
  registrationStartDate, registrationEndDate,
  matchActions, onCertificates, showPublish, onPublish, publishing,
  teams, regActionError, onTeamStatusChange, onMessageTeam,
}: MobileSportDetailProps) {
  const hasRegWindow = !!registrationStartDate && !!registrationEndDate

  return (
    <div className="ssd-m-root">
      <div className="ssd-m-top-row">
        <button type="button" className="ssd-m-back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="ssd-m-title-actions">
          <button type="button" className="ssd-m-btn-outline-gradient" onClick={onEditSport}>
            <Edit2 size={12} /> Edit
          </button>
          <button type="button" className="ssd-m-btn-outline-gradient" onClick={onToggleRegistration} disabled={registrationLoading}>
            {isOpen ? <Lock size={12} /> : <Unlock size={12} />} {registrationLoading ? "…" : isOpen ? "Close Reg" : "Open Reg"}
          </button>
          {extraTitleActions}
        </div>
      </div>

      <div className="ssd-m-title-row">
        <h1 className="ssd-m-title">{sportName}</h1>
        <span className={`ssd-m-badge ${isOpen ? "is-open" : "is-closed"}`}>{statusLabel}</span>
      </div>
      {eventName && <p className="ssd-m-subtitle">Event- {eventName}</p>}

      {errorBanner && <div className="ssd-m-banner error">⚠️ {errorBanner}</div>}
      {publishMsg && <div className={`ssd-m-banner ${publishOk ? "ok" : "error"}`}>{publishMsg}</div>}
      {topExtra}

      {/* Stat cards */}
      <div className="ssd-m-stats-scroll">
        <div className="ssd-m-stat-card">
          <div className="ssd-m-stat-icon"><Trophy size={16} /></div>
          <div><div className="ssd-m-stat-value">{totalTeams}</div><div className="ssd-m-stat-label">Teams</div></div>
        </div>
        <div className="ssd-m-stat-card">
          <div className="ssd-m-stat-icon"><Users size={16} /></div>
          <div><div className="ssd-m-stat-value">{totalPlayers}</div><div className="ssd-m-stat-label">Players</div></div>
        </div>
        {maxTeams != null && (
          <div className="ssd-m-stat-card">
            <div className="ssd-m-stat-icon"><Tag size={16} /></div>
            <div><div className="ssd-m-stat-value">{maxTeams}</div><div className="ssd-m-stat-label">Max Team</div></div>
          </div>
        )}
        {entryFee != null && (
          <div className="ssd-m-stat-card">
            <div className="ssd-m-stat-icon"><DollarSign size={16} /></div>
            <div><div className="ssd-m-stat-value">{formatCurrency(entryFee)}</div><div className="ssd-m-stat-label">Entry Fee</div></div>
          </div>
        )}
        {prizeMoney != null && (
          <div className="ssd-m-stat-card">
            <div className="ssd-m-stat-icon"><Award size={16} /></div>
            <div><div className="ssd-m-stat-value">{formatCurrency(prizeMoney)}</div><div className="ssd-m-stat-label">Prize Pool</div></div>
          </div>
        )}
      </div>

      {/* Sports Details */}
      <div className="ssd-m-section-title">Sports Details</div>
      <hr className="ssd-m-section-line" />
      <div className="ssd-m-details-box">
        <div className="ssd-m-details-grid">
          <div className="ssd-m-detail-cell"><div className="label">Age Group</div><div className="value">{toLabel(ageGroup)}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Competition Type</div><div className="value">{toLabel(competitionType)}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Format</div><div className="value">{toLabel(formatType)}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Control Type</div><div className="value">{toLabel(controlType)}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Weight Class</div><div className="value">{toLabel(weightClass)}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Weight Limit</div><div className="value">{weightLimitKg != null ? `${weightLimitKg} kg` : "—"}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Max Bots/Team</div><div className="value">{maxBotsPerTeam ?? "—"}</div></div>
          <div className="ssd-m-detail-cell"><div className="label">Team Size</div><div className="value">{teamSizeLabel || "—"}</div></div>
        </div>

        {hasRegWindow && (
          <div className="ssd-m-reg-window">
            <Calendar size={18} className="cal-icon" />
            <div className="ssd-m-reg-text">
              <span className="ssd-m-reg-label">Registration Window</span>
              <div className="ssd-m-reg-dates">
                <span className="ssd-m-reg-date">{formatDate(registrationStartDate)}</span>
                <ArrowRight size={13} />
                <span className="ssd-m-reg-date">{formatDate(registrationEndDate)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="ssd-m-actions-row">
        {!isOpen && matchActions.map((a, i) => (
          <button key={i} type="button" className={`ssd-m-btn ${a.variant === "solid" ? "ssd-m-btn-solid" : "ssd-m-btn-outline"}`} onClick={a.onClick}>
            {a.label}
          </button>
        ))}
        <button type="button" className="ssd-m-btn ssd-m-btn-outline" onClick={onCertificates}>
          <Award size={13} /> Certificates
        </button>
      </div>
      {showPublish && onPublish && (
        <button type="button" className="ssd-m-btn-publish" onClick={onPublish} disabled={publishing}>
          <Globe size={13} /> {publishing ? "Publishing…" : "Publish to Global Rankings"}
        </button>
      )}

      {/* Registered Teams */}
      <div className="ssd-m-registered-box">
        <div className="ssd-m-section-title">Registered Teams</div>
        <hr className="ssd-m-section-line" />
        {regActionError && <div className="ssd-m-banner error">{regActionError}</div>}
        {teams.length === 0 ? (
          <div className="ssd-m-empty">No teams registered yet</div>
        ) : (
          <div className="ssd-m-teams-scroll">
            {teams.map((team, i) => (
              <TeamCard key={team.id} team={team} index={i} onStatusChange={onTeamStatusChange} onMessage={onMessageTeam} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
