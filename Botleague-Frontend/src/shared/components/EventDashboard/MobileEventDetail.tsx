import { useState } from "react"
import {
  ArrowLeft, Plus, Trophy, Users, MapPin, UserCog,
  Calendar, ArrowRight, Check, Ban, CheckCircle2, Trash2, AlertTriangle,
} from "lucide-react"
import type { EventDashboardEvent, EventDashboardSport, StatusTransition } from "./EventDashboard"
import { formatWeightClass } from "../../../feature/Robots/constants/weightClasses"
import { ageGroupLabel } from "../../utils/ageGroup"

// Mobile view of the single-event management page (mockup: "Eventmanagementdashboard.jsx").
// Rendered inside EventDashboard.tsx via .ed-mobile-only/.ed-desktop-only at
// <=950px — the exact same component (and therefore this mobile view) is
// shared by Admin's /admin/event/:id AND EventHead/SportHead's
// /organizer/events/:id, so implementing it once here covers every role.
// No page-level header (logo/bell/menu) is drawn — the app's own
// Navbar/MobileBottomNav already provides that chrome around this page.

function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
}

// sport.status is the real source of truth (see EventDashboard.tsx's
// identical fix) — the date window is informational only, closing
// registration is a deliberate action, not something that flips on its
// own when the stored end date passes.
function isRegistrationOpen(sport: EventDashboardSport): boolean {
  return sport.status?.toUpperCase() === "REGISTRATION_OPEN"
}

function teamCount(sport: EventDashboardSport): number {
  return sport.registrations?.length ?? sport.registeredTeamsCount ?? 0
}

function playerCount(sport: EventDashboardSport): number {
  return sport.registrations?.reduce((n, t) => n + ((t.lineup as unknown[])?.length ?? 0), 0) ?? 0
}

interface MobileEventDetailProps {
  event: EventDashboardEvent
  sports: EventDashboardSport[]
  canEdit: boolean
  canAddSport: boolean
  canManageEvent: boolean
  statusTransitions: StatusTransition[]
  actionLoading: boolean
  onEditEvent: () => void
  onAddSport: () => void
  onStatusChange: (value: string) => void
  onManageSport: (sportId: string) => void
  onSubmitApproval?: (sportId: string) => void
  submitApprovalId?: string | null
  onApproveSport?: (sportId: string) => void
  onRejectSport?: (sportId: string, reason: string) => void
  approveRejectBusyId?: string | null
  onOpenUserControl: () => void
  pendingApprovalCount: number
  onBack: () => void
  errorBanner?: string | null
  eventSponsors?: React.ReactNode
  extraSponsorSections?: React.ReactNode
  canDelete?: boolean
  onDelete?: () => void
}

export default function MobileEventDetail({
  event, sports, canEdit, canAddSport, canManageEvent, statusTransitions, actionLoading,
  onEditEvent, onAddSport, onStatusChange, onManageSport,
  onSubmitApproval, submitApprovalId, onApproveSport, onRejectSport, approveRejectBusyId,
  onOpenUserControl, pendingApprovalCount, onBack, errorBanner,
  eventSponsors, extraSponsorSections, canDelete, onDelete,
}: MobileEventDetailProps) {
  const [showAllSports, setShowAllSports] = useState(false)
  const totalRegistrations = sports.reduce((t, s) => t + teamCount(s), 0)
  const primaryTransition = statusTransitions.find(t => t.primary)
  const secondaryTransitions = statusTransitions.filter(t => !t.primary)

  return (
    <div className="ed-m-root">
      {/* Back + primary status action */}
      <div className="ed-m-top-row">
        <button type="button" className="ed-m-back-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        {primaryTransition && (
          <button type="button" className="ed-m-btn-start" onClick={() => onStatusChange(primaryTransition.value)} disabled={actionLoading}>
            <Plus size={14} /> {actionLoading ? "…" : primaryTransition.label}
          </button>
        )}
      </div>

      {errorBanner && <div className="ed-m-error-banner" style={{ display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={13} /> {errorBanner}</div>}

      {/* Pending-approval banner — real Review action, not a blind accept/decline */}
      {canManageEvent && pendingApprovalCount > 0 && (
        <div className="ed-m-banner">
          <span className="ed-m-banner-text">
            {pendingApprovalCount} item{pendingApprovalCount > 1 ? "s" : ""} need{pendingApprovalCount > 1 ? "" : "s"} your approval
          </span>
          <button type="button" className="ed-m-btn-accept" onClick={onOpenUserControl}>Review</button>
        </div>
      )}

      {/* Event title */}
      <div className="ed-m-event-title-row">
        <div className="ed-m-event-title">
          <h2>{event.eventName}</h2>
          <span className="ed-m-badge-status">{toLabel(event.status)}</span>
        </div>
        <div className="ed-m-title-actions">
          {canEdit && <button type="button" className="ed-m-btn-outline-gradient" onClick={onEditEvent}>Edit</button>}
          {secondaryTransitions.map(t => (
            <button key={t.value} type="button" className="ed-m-btn-outline-gradient" onClick={() => onStatusChange(t.value)} disabled={actionLoading}>
              {actionLoading ? "…" : t.label}
            </button>
          ))}
          {canDelete && onDelete && (
            <button type="button" className="ed-m-btn-outline-gradient ed-m-btn-danger" onClick={onDelete}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {event.eventDescription && <p className="ed-m-desc">{event.eventDescription}</p>}

      {/* Stat cards */}
      <div className="ed-m-stats-grid">
        <div className="ed-m-stat-card">
          <div className="ed-m-stat-icon"><Trophy size={17} /></div>
          <div className="ed-m-stat-text"><div className="ed-m-stat-value">{sports.length}</div><div className="ed-m-stat-label">Techsports</div></div>
        </div>
        <div className="ed-m-stat-card">
          <div className="ed-m-stat-icon"><Users size={17} /></div>
          <div className="ed-m-stat-text"><div className="ed-m-stat-value">{totalRegistrations}</div><div className="ed-m-stat-label">Registrations</div></div>
        </div>
        <div className="ed-m-stat-card">
          <div className="ed-m-stat-icon"><MapPin size={17} /></div>
          <div className="ed-m-stat-text"><div className="ed-m-stat-value">{(event.venueName || event.city || "—").toString().toUpperCase()}</div><div className="ed-m-stat-label">Venue</div></div>
        </div>
        {canManageEvent && (
          <button type="button" className="ed-m-stat-card" onClick={onOpenUserControl}>
            <div className="ed-m-stat-icon"><UserCog size={17} /></div>
            <div className="ed-m-stat-text"><div className="ed-m-stat-value" style={{ fontSize: "0.8rem" }}>User Control</div></div>
          </button>
        )}
      </div>

      {/* Event Details */}
      <div className="ed-m-section-title">Techfest Details</div>
      <div className="ed-m-details-box">
        <div className="ed-m-field"><div className="ed-m-field-label">Organization</div><div className="ed-m-field-value">{event.organizationName || "—"}</div></div>
        <div className="ed-m-field-row">
          <div className="ed-m-field"><div className="ed-m-field-label">City</div><div className="ed-m-field-value">{event.city || "—"}</div></div>
          <div className="ed-m-field"><div className="ed-m-field-label">State</div><div className="ed-m-field-value">{event.state || "—"}</div></div>
        </div>
        <div className="ed-m-field-row">
          <div className="ed-m-field"><div className="ed-m-field-label">Venue</div><div className="ed-m-field-value">{event.venueName || "—"}</div></div>
          <div className="ed-m-field"><div className="ed-m-field-label">Country</div><div className="ed-m-field-value">{event.country || "—"}</div></div>
        </div>
        <div className="ed-m-field-row">
          <div className="ed-m-field"><div className="ed-m-field-label">Start Date</div><div className="ed-m-field-value">{formatDate(event.startDate)}</div></div>
          <div className="ed-m-field"><div className="ed-m-field-label">End Date</div><div className="ed-m-field-value">{formatDate(event.endDate)}</div></div>
        </div>
      </div>

      {/* Sports */}
      <div className="ed-m-section-title-row">
        <div className="ed-m-section-title">Techsports</div>
        {canAddSport && (
          <button type="button" className="ed-m-btn-gradient-pill" onClick={onAddSport}>
            <Plus size={12} /> Add Sports
          </button>
        )}
      </div>

      {sports.length === 0 ? (
        <div className="ed-m-empty-state">No sports added yet</div>
      ) : (
        <div className="ed-m-sports-wrap">
          {(showAllSports ? sports : sports.slice(0, 3)).map(sport => {
            const canSubmit = onSubmitApproval && sport.status?.toUpperCase() === "DRAFT"
            const canApproveReject = (onApproveSport || onRejectSport) && sport.status?.toUpperCase() === "PENDING_APPROVAL"
            const busy = submitApprovalId === sport.id || approveRejectBusyId === sport.id
            const open = isRegistrationOpen(sport)

            return (
              <div className="ed-m-sport-card" key={sport.id} onClick={() => onManageSport(sport.id)}>
                <div className="ed-m-sport-top">
                  <span className="ed-m-sport-name">{toLabel(sport.sport)}</span>
                  <span className={open ? "ed-m-badge-open" : "ed-m-badge-closed"}>{open ? "Registration Open" : toLabel(sport.status)}</span>
                </div>
                <div className="ed-m-sport-meta">
                  {sport.ageGroup && <span>{ageGroupLabel(sport.ageGroup)}</span>}
                  {sport.weightClass && <><span className="sep">|</span><span>{formatWeightClass(sport.weightClass)}</span></>}
                  {sport.formatType && <><span className="sep">|</span><span>{toLabel(sport.formatType)}</span></>}
                </div>

                <div className="ed-m-sport-stats">
                  <div className="ed-m-mini-stat"><Trophy size={16} /><div><div className="label">Teams</div><div className="value">{teamCount(sport)}</div></div></div>
                  <div className="ed-m-mini-stat"><Users size={16} /><div><div className="label">Players</div><div className="value">{playerCount(sport)}</div></div></div>
                  <div className="ed-m-mini-stat"><div><div className="label">Entry Fee</div><div className="value">{sport.entryFee != null ? `₹${sport.entryFee}` : "—"}</div></div></div>
                  <div className="ed-m-mini-stat"><div><div className="label">Prize Pool</div><div className="value">{sport.prizeMoney != null ? `₹${sport.prizeMoney}` : "—"}</div></div></div>
                </div>

                <div className="ed-m-sport-bottom">
                  <div className="ed-m-sport-dates">
                    <Calendar size={13} className="cal-icon" />
                    <span>{formatDate(sport.registrationStartDate)}</span>
                    <ArrowRight size={12} className="arrow-icon" />
                    <span>{formatDate(sport.registrationEndDate)}</span>
                  </div>
                  <button type="button" className="ed-m-btn-manage" onClick={e => { e.stopPropagation(); onManageSport(sport.id) }}>
                    Manage Sport
                  </button>
                </div>

                {canSubmit && (
                  <div className="ed-m-sport-actions" onClick={e => e.stopPropagation()}>
                    <button type="button" className="ed-m-btn-submit" onClick={() => onSubmitApproval!(sport.id)} disabled={busy}>
                      <CheckCircle2 size={13} /> {busy ? "Submitting…" : "Submit for Approval"}
                    </button>
                  </div>
                )}
                {canApproveReject && (
                  <div className="ed-m-sport-actions" onClick={e => e.stopPropagation()}>
                    {onApproveSport && (
                      <button type="button" className="ed-m-btn-approve" onClick={() => onApproveSport(sport.id)} disabled={busy}>
                        <Check size={13} /> Approve
                      </button>
                    )}
                    {onRejectSport && (
                      <button type="button" className="ed-m-btn-reject" onClick={() => {
                        const reason = window.prompt("Reason for rejecting this sport (optional):") || ""
                        onRejectSport(sport.id, reason)
                      }} disabled={busy}>
                        <Ban size={13} /> Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {sports.length > 3 && (
            <button type="button" className="ed-m-show-more" onClick={() => setShowAllSports(v => !v)}>
              {showAllSports ? "Show less" : `Show all ${sports.length} sports`}
            </button>
          )}
        </div>
      )}

      {eventSponsors && (
        <>
          <div className="ed-m-section-title">Techfest Sponsors</div>
          {eventSponsors}
        </>
      )}

      {extraSponsorSections}
    </div>
  )
}
