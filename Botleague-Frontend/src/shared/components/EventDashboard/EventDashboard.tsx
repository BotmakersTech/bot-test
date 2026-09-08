import { useMemo, useState } from "react"
import { ArrowLeft, Edit2, Plus, Calendar, Trophy, Users, CheckCircle2, Check, Ban, UserCog, Trash2, AlertTriangle, Building2, Award } from "lucide-react"
import MobileEventDetail from "./MobileEventDetail"
import "./EventDashboard.css"
import { formatWeightClass } from "../../../feature/Robots/constants/weightClasses"
import { ageGroupLabel } from "../../utils/ageGroup"

export interface EventDashboardSport {
  id: string
  sport: string
  ageGroup?: string | null
  weightClass?: string | null
  formatType?: string | null
  status?: string | null
  entryFee?: number | null
  prizeMoney?: number | null
  registrationStartDate?: string | null
  registrationEndDate?: string | null
  registeredTeamsCount?: number
  registrations?: { id: string; lineup?: unknown[] }[]
}

export interface EventDashboardEvent {
  id: string
  eventName: string
  eventDescription?: string | null
  organizationName?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  venueName?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: string
}

export interface StatusTransition {
  value: string
  label: string
  color: string
  primary?: boolean
}

interface EventDashboardProps {
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
  backLabel: string
  errorBanner?: string | null
  eventSponsors?: React.ReactNode
  extraSponsorSections?: React.ReactNode
  canDelete?: boolean
  onDelete?: () => void
}

function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#a16207",
  PUBLISHED: "#0162d1",
  LIVE: "#1fa952",
  COMPLETED: "#6b7280",
  ARCHIVED: "#64748b",
}

// Youngest league first, the order used everywhere else on the site.
const LEAGUE_ORDER = ["JUNIOR_INNOVATORS", "YOUNG_ENGINEERS", "ROBO_MINDS"]
const ALL_LEAGUES = "ALL"

function formatDate(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
}

// The registration window dates are informational only — closing
// registration is a deliberate action (see the sport-detail page's
// Open/Close Registration buttons), not something that flips on its own
// when a date passes. Deriving "open" from today falling inside the window
// showed "Registration Open" on sports the organiser had already closed
// (or that were never opened at all), whenever the stored end date simply
// hadn't arrived yet. sport.status is the actual source of truth — the
// same field every registration check in the app already gates on.
function isRegistrationOpen(sport: EventDashboardSport): boolean {
  return sport.status?.toUpperCase() === "REGISTRATION_OPEN"
}

function teamCount(sport: EventDashboardSport): number {
  return sport.registrations?.length ?? sport.registeredTeamsCount ?? 0
}

function playerCount(sport: EventDashboardSport): number {
  return sport.registrations?.reduce((n, t) => n + ((t.lineup as unknown[])?.length ?? 0), 0) ?? 0
}

// Plain read-only display — was a readOnly <input>, which still renders
// with the same box/border/background as a real editable field, inviting
// a click that does nothing. This is presentation only, nothing ever reads
// its value, so a div carries the same information without looking like a
// form control someone should type into.
function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="ed-field-label">{label}</label>
      <div className="ed-detail-value">{value || "—"}</div>
    </div>
  )
}

export default function EventDashboard({
  event, sports, canEdit, canAddSport, canManageEvent, statusTransitions, actionLoading,
  onEditEvent, onAddSport, onStatusChange, onManageSport,
  onSubmitApproval, submitApprovalId, onApproveSport, onRejectSport, approveRejectBusyId,
  onOpenUserControl, pendingApprovalCount, onBack, backLabel, errorBanner,
  eventSponsors, extraSponsorSections, canDelete, onDelete,
}: EventDashboardProps) {
  const totalRegistrations = sports.reduce((t, s) => t + teamCount(s), 0)
  const statusColor = STATUS_COLORS[event.status?.toUpperCase() ?? "DRAFT"] || STATUS_COLORS.DRAFT

  // Tabs come from the leagues THIS event actually runs, not a fixed list —
  // an event with only Apex sports shouldn't offer an Ignite tab that leads
  // to an empty grid. Mirrors the same filter on the public event page
  // (SportsSection.tsx).
  const [league, setLeague] = useState<string>(ALL_LEAGUES)
  const leagueTabs = useMemo(() => {
    const counts = new Map<string, number>()
    sports.forEach(s => {
      const code = s.ageGroup
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1)
    })
    return [...counts.entries()]
      .sort(([a], [b]) => {
        const ia = LEAGUE_ORDER.indexOf(a)
        const ib = LEAGUE_ORDER.indexOf(b)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      })
      .map(([code, count]) => ({ code, count, label: ageGroupLabel(code) }))
  }, [sports])
  const visibleSports = league === ALL_LEAGUES ? sports : sports.filter(s => s.ageGroup === league)
  const showLeagueTabs = leagueTabs.length > 1

  return (
    <div className="ed-root">
      <main className="ed-main ed-desktop-only">
        <button type="button" className="ed-back-btn" onClick={onBack}>
          <ArrowLeft size={14} /> {backLabel}
        </button>

        {errorBanner && <div className="ed-error-banner" style={{ display: "flex", alignItems: "center", gap: "8px" }}><AlertTriangle size={15} /> {errorBanner}</div>}

        {canManageEvent && pendingApprovalCount > 0 && (
          <div className="ed-banner">
            <span className="ed-banner-text">
              {pendingApprovalCount} item{pendingApprovalCount > 1 ? "s" : ""} need{pendingApprovalCount > 1 ? "" : "s"} your approval
            </span>
            <button type="button" className="ed-btn-accept" onClick={onOpenUserControl}>Review</button>
          </div>
        )}

        <div className="ed-header-row">
          <h1 className="ed-title">{event.eventName}</h1>
          <div className="ed-header-actions">
            {canEdit && (
              <button type="button" className="ed-btn-outline" onClick={onEditEvent}>
                <Edit2 size={14} /> Edit
              </button>
            )}
            {canAddSport && (
              <button type="button" className="ed-btn-outline" onClick={onAddSport}>
                <Plus size={14} /> Add Sport
              </button>
            )}
            {statusTransitions.map(t => (
              <button
                key={t.value}
                type="button"
                className={t.primary ? "ed-btn-primary" : "ed-btn-outline"}
                style={t.primary ? undefined : { borderColor: t.color, color: t.color }}
                onClick={() => onStatusChange(t.value)}
                disabled={actionLoading}
              >
                {actionLoading ? "…" : t.label}
              </button>
            ))}
            {canDelete && onDelete && (
              <button type="button" className="ed-btn-outline" style={{ borderColor: "var(--ed-danger)", color: "var(--ed-danger)" }} onClick={onDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="ed-header-meta">
          <span className="ed-status-pill" style={{ borderColor: statusColor, color: statusColor }}>
            {toLabel(event.status)}
          </span>
          {event.organizationName && <span className="ed-org-chip" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Building2 size={12} /> {event.organizationName}</span>}
        </div>

        <p className="ed-desc">{event.eventDescription}</p>

        <div className="ed-stats-row">
          <div className="ed-stat-card">
            <div className="ed-stat-icon"><Trophy size={18} /></div>
            <div>
              <div className="ed-stat-value">{sports.length}</div>
              <div className="ed-stat-label">TECHSPORTS</div>
            </div>
          </div>
          <div className="ed-stat-card">
            <div className="ed-stat-icon"><Users size={18} /></div>
            <div>
              <div className="ed-stat-value">{totalRegistrations}</div>
              <div className="ed-stat-label">REGISTRATIONS</div>
            </div>
          </div>
          <div className="ed-stat-card">
            <div className="ed-stat-icon"><Calendar size={18} /></div>
            <div>
              <div className="ed-stat-value">{event.venueName || "—"}</div>
              <div className="ed-stat-label">VENUE</div>
            </div>
          </div>
          {canManageEvent && (
            <button type="button" className="ed-stat-card" onClick={onOpenUserControl}>
              <div className="ed-stat-icon"><UserCog size={18} /></div>
              <div>
                <div className="ed-stat-value" style={{ fontSize: "0.95rem" }}>USER CONTROL</div>
              </div>
            </button>
          )}
        </div>

        <h2 className="ed-section-title">TECHFECT DETAILS</h2>
        <div className="ed-details-card">
          <DetailField label="Organization" value={event.organizationName} />
          <DetailField label="City" value={event.city} />
          <DetailField label="State" value={event.state} />
          <DetailField label="Venue" value={event.venueName} />
          <DetailField label="Country" value={event.country} />
          <DetailField label="Start Date" value={event.startDate ? formatDate(event.startDate) : undefined} />
          <DetailField label="End Date" value={event.endDate ? formatDate(event.endDate) : undefined} />
        </div>

        <h2 className="ed-section-title">
          SPORTS <span className="ed-section-count">{sports.length}</span>
        </h2>
        <div className="ed-sports-card">
          <div className="ed-sports-card-head">
            {canAddSport && (
              <button type="button" className="ed-btn-primary-sm" style={{ marginLeft: "auto" }} onClick={onAddSport}>
                <Plus size={13} /> Add sport
              </button>
            )}
          </div>

          {showLeagueTabs && (
            <div className="ed-league-filter" role="tablist" aria-label="Filter techsports by league">
              <button
                type="button"
                role="tab"
                aria-selected={league === ALL_LEAGUES}
                className={league === ALL_LEAGUES ? "ed-league-tab active" : "ed-league-tab"}
                onClick={() => setLeague(ALL_LEAGUES)}
              >
                All <span className="ed-league-tab-count">{sports.length}</span>
              </button>
              {leagueTabs.map(t => (
                <button
                  key={t.code}
                  type="button"
                  role="tab"
                  aria-selected={league === t.code}
                  className={league === t.code ? "ed-league-tab active" : "ed-league-tab"}
                  onClick={() => setLeague(t.code)}
                >
                  {t.label} <span className="ed-league-tab-count">{t.count}</span>
                </button>
              ))}
            </div>
          )}

          {sports.length === 0 ? (
            <div className="ed-empty-state">
              <Award size={36} style={{ opacity: 0.6 }} />
              <div style={{ fontWeight: 600 }}>No sports added yet</div>
            </div>
          ) : visibleSports.length === 0 ? (
            <div className="ed-empty-state">
              <Award size={36} style={{ opacity: 0.6 }} />
              <div style={{ fontWeight: 600 }}>No sports in this league</div>
            </div>
          ) : (
            <div className="ed-sports-grid">
              {visibleSports.map(sport => {
                const canSubmit = onSubmitApproval && sport.status?.toUpperCase() === "DRAFT"
                const canApproveReject = (onApproveSport || onRejectSport) && sport.status?.toUpperCase() === "PENDING_APPROVAL"
                const busy = submitApprovalId === sport.id || approveRejectBusyId === sport.id
                const open = isRegistrationOpen(sport)

                return (
                  <div key={sport.id} className="ed-sport-item" onClick={() => onManageSport(sport.id)}>
                    <div className="ed-sport-item-head">
                      <div>
                        <div className="ed-sport-name-row">
                          <div className="ed-sport-name">{toLabel(sport.sport)}</div>
                          <span className={open ? "ed-tag-open" : "ed-tag-closed"}>
                            {open ? "Registration Open" : toLabel(sport.status)}
                          </span>
                        </div>
                        <div className="ed-sport-tags">
                          {sport.ageGroup && <span className="ed-sport-tag">{ageGroupLabel(sport.ageGroup)}</span>}
                          {sport.weightClass && <span className="ed-sport-tag">{formatWeightClass(sport.weightClass)}</span>}
                          {sport.formatType && <span className="ed-sport-tag">{toLabel(sport.formatType)}</span>}
                        </div>
                      </div>
                      <button type="button" className="ed-btn-manage" onClick={e => { e.stopPropagation(); onManageSport(sport.id) }}>
                        Manage sport
                      </button>
                    </div>

                    <div className="ed-sport-mini-row">
                      <div className="ed-mini-stat">
                        <Trophy size={13} />
                        <div>
                          <div className="ed-mini-label">TEAMS</div>
                          <div className="ed-mini-value">{teamCount(sport)}</div>
                        </div>
                      </div>
                      <div className="ed-mini-stat">
                        <Users size={13} />
                        <div>
                          <div className="ed-mini-label">PLAYERS</div>
                          <div className="ed-mini-value">{playerCount(sport)}</div>
                        </div>
                      </div>
                      <div className="ed-mini-stat ed-mini-stat-plain">
                        <div className="ed-mini-label">ENTRY FEE</div>
                        <div className="ed-mini-value">{sport.entryFee != null ? `₹${sport.entryFee.toLocaleString("en-IN")}` : "—"}</div>
                      </div>
                      <div className="ed-mini-stat ed-mini-stat-plain">
                        <div className="ed-mini-label">PRIZE POOL</div>
                        <div className="ed-mini-value">{sport.prizeMoney != null ? `₹${sport.prizeMoney.toLocaleString("en-IN")}` : "—"}</div>
                      </div>
                    </div>

                    <div className="ed-sport-footer">
                      <div className="ed-sport-dates">
                        <Calendar size={12} />
                        {formatDate(sport.registrationStartDate)} → {formatDate(sport.registrationEndDate)}
                      </div>
                    </div>

                    {canSubmit && (
                      <div className="ed-sport-actions" onClick={e => e.stopPropagation()}>
                        <button type="button" className="ed-btn-submit" onClick={() => onSubmitApproval!(sport.id)} disabled={busy}>
                          <CheckCircle2 size={13} /> {busy ? "Submitting…" : "Submit for Approval"}
                        </button>
                      </div>
                    )}

                    {canApproveReject && (
                      <div className="ed-sport-actions" onClick={e => e.stopPropagation()}>
                        {onApproveSport && (
                          <button type="button" className="ed-btn-approve" onClick={() => onApproveSport(sport.id)} disabled={busy}>
                            <Check size={13} /> Approve
                          </button>
                        )}
                        {onRejectSport && (
                          <button type="button" className="ed-btn-reject" onClick={() => {
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
            </div>
          )}
        </div>

        {eventSponsors && (
          <>
            <h2 className="ed-section-title">TECHFECT SPONSORS</h2>
            {eventSponsors}
          </>
        )}

        {extraSponsorSections}
      </main>

      <div className="ed-mobile-only">
        <MobileEventDetail
          event={event} sports={sports} canEdit={canEdit} canAddSport={canAddSport} canManageEvent={canManageEvent}
          statusTransitions={statusTransitions} actionLoading={actionLoading}
          onEditEvent={onEditEvent} onAddSport={onAddSport} onStatusChange={onStatusChange} onManageSport={onManageSport}
          onSubmitApproval={onSubmitApproval} submitApprovalId={submitApprovalId}
          onApproveSport={onApproveSport} onRejectSport={onRejectSport} approveRejectBusyId={approveRejectBusyId}
          onOpenUserControl={onOpenUserControl} pendingApprovalCount={pendingApprovalCount}
          onBack={onBack} errorBanner={errorBanner}
          eventSponsors={eventSponsors} extraSponsorSections={extraSponsorSections}
          canDelete={canDelete} onDelete={onDelete}
        />
      </div>
    </div>
  )
}
