import React, { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { X, Trash2, Edit2, AlertTriangle } from "lucide-react"
import { useSelector } from "react-redux"
import { useAdminEvents } from "../hooks/UseAdminEvent"
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime"
import {
  approveSport, rejectSport,
  type CreateEventSportRequest, type UpdateEventRequest,
} from "../api/admin.api"
import { getEventChangeRequests } from "../../Organizer/api/organizer.api"
import type { RootState } from "../../../app/store"
import { hasRole, AppRole, EVENT_HEAD_AND_UP } from "../../../shared/constants/roles"
import LocationSelects from "../../../shared/components/LocationSelects"
import SponsorManager from "../components/SponsorManager"
import SupportContactManager from "../../Organizer/components/SupportContactManager"
import EventMediaField from "../../Organizer/components/EventMediaField"
import EventDashboard from "../../../shared/components/EventDashboard/EventDashboard"
import UserControlPanel from "../../../shared/components/EventDashboard/UserControlPanel"
import AddSportModal from "../../../shared/components/AddSportModal/AddSportModal"
import { ORG } from "../../Organizer/theme/organizerTheme"
import "../../../styles/organizerTheme.css"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const BORDER  = "rgba(75,134,232,0.2)"
const ACCENT  = ORG.blue
const TEXT    = "#111111"
const MUTED   = "#6b7280"
const SUCCESS = "#16a34a"
const DANGER  = "#dc2626"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type EventStatus = "DRAFT" | "PUBLISHED" | "LIVE" | "COMPLETED" | "ARCHIVED"

// Actual shape returned by the server (sport field, not sportName)
interface EventSportItem {
  id: string
  sport: string            // e.g. "LINE_FOLLOWER"
  sportsInfo?: string | null
  status?: string
  formatType?: string
  ageGroup?: string
  weightClass?: string
  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number
  entryFee?: number
  prizeMoney?: number
  registrationStartDate?: string
  registrationEndDate?: string
  registeredTeamsCount?: number
  registrations?: { id: string; teamName: string; teamLogoUrl?: string; lineup?: unknown[] }[]
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Convert any enum-style string to a readable label: LINE_FOLLOWER → Line Follower */
function toLabel(raw?: string | null): string {
  if (!raw) return "—"
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: `2px solid rgba(75,134,232,0.18)`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

// ─────────────────────────────────────────────────────────────
// STATUS TRANSITION CONFIG
// ─────────────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, { value: string; label: string; color: string; primary?: boolean }[]> = {
  DRAFT:     [{ value: "PUBLISHED", label: "Publish",        color: ACCENT,  primary: true }],
  PUBLISHED: [{ value: "LIVE",      label: "Start Techfect",    color: SUCCESS, primary: true },
              { value: "ARCHIVED",  label: "Archive",         color: MUTED   }],
  LIVE:      [{ value: "COMPLETED", label: "Complete Techfect", color: SUCCESS, primary: true }],
  COMPLETED: [{ value: "ARCHIVED",  label: "Archive",         color: MUTED   }],
}

// ─────────────────────────────────────────────────────────────
// EDIT EVENT MODAL
// ─────────────────────────────────────────────────────────────

interface EditEventModalProps {
  event: { id: string; eventName: string; eventDescription?: string; organizationName?: string; organizationUrl?: string; venueName?: string; mapUrl?: string; city?: string; state?: string; country?: string; startDate?: string; endDate?: string; eventThumbnailUrl?: string; teaserVideo1Url?: string; teaserVideo2Url?: string; volunteersNeeded?: boolean }
  onSave: (req: UpdateEventRequest) => Promise<unknown>
  saving: boolean
  onClose: () => void
  onMediaChange: () => void
  /** When true (PUBLISHED + organizer), only name/description/logo/org are editable */
  limitedEdit?: boolean
}

function EditEventModal({ event, onSave, saving, onClose, onMediaChange, limitedEdit = false }: EditEventModalProps) {
  const fmt = (d?: string) => d ? d.slice(0, 10) : ""
  const [form, setForm] = useState<UpdateEventRequest>({
    eventName:       event.eventName       ?? "",
    eventDescription:event.eventDescription ?? "",
    organizationName:event.organizationName ?? "",
    organizationUrl: event.organizationUrl  ?? "",
    venueName:       event.venueName        ?? "",
    mapUrl:          event.mapUrl           ?? "",
    city:            event.city             ?? "",
    state:           event.state            ?? "",
    country:         event.country          ?? "",
    startDate:       fmt(event.startDate),
    endDate:         fmt(event.endDate),
    volunteersNeeded: event.volunteersNeeded ?? false,
  })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof UpdateEventRequest, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.eventName?.trim()) { setError("Techfect name is required."); return }
    setError(null)
    try { await onSave(form); onClose() }
    catch (err: any) { setError(err?.message || "Save failed.") }
  }

  // Same light chrome as AdminSport.tsx's EditSportModal — the two "Update"
  // popups are meant to look identical, not just individually themed.
  const evBorder = "rgba(75,134,232,0.3)"
  const evInputStyle: React.CSSProperties = {
    width: "100%", background: "#f8f9ff", border: `1px solid ${evBorder}`,
    borderRadius: "8px", color: ORG.text, padding: "9px 12px", fontSize: "0.83rem",
    outline: "none", boxSizing: "border-box",
  }
  const evSelectStyle: React.CSSProperties = { ...evInputStyle, appearance: "none", WebkitAppearance: "none", cursor: "pointer", paddingRight: "32px" }
  const evDateInputStyle: React.CSSProperties = { ...evInputStyle, cursor: "pointer" }
  const evLabelStyle: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    color: ORG.muted, marginBottom: "6px", display: "block",
  }
  const evGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "column" }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,8,8,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#ffffff", border: `1.5px solid ${ORG.blue}`, borderRadius: "16px", width: "100%", maxWidth: "620px", overflow: "hidden", flexShrink: 0 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(75,134,232,0.15)", background: "rgba(75,134,232,0.06)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Edit2 size={16} style={{ color: ORG.violet }} />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: ORG.fontHeading, letterSpacing: "0.06em", color: ORG.blueHeading }}>EDIT TECHFECT</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: ORG.muted, marginTop: "2px", marginLeft: "26px" }}>
              {limitedEdit ? "Basic info only — techfect is published" : "Update techfect details"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: ORG.muted, cursor: "pointer", padding: "4px" }}><X size={18} /></button>
        </div>
        {/* body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {limitedEdit && (
            <div style={{ background: "rgba(161,98,7,0.08)", border: "1px solid rgba(161,98,7,0.25)", borderRadius: "8px", padding: "9px 13px", color: "#a16207", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Edit2 size={13} /> Published events — only name, description, logo and organisation name can be changed.
            </div>
          )}
          <div style={evGroupStyle}>
            <label style={evLabelStyle}>Techfect Name <span style={{ color: ORG.violet }}>*</span></label>
            <input style={evInputStyle} value={form.eventName} onChange={e => set("eventName", e.target.value)} />
          </div>
          <div style={evGroupStyle}>
            <label style={evLabelStyle}>Description</label>
            <textarea style={{ ...evInputStyle, resize: "vertical", minHeight: "80px", fontFamily: "inherit" }} value={form.eventDescription} onChange={e => set("eventDescription", e.target.value)} />
          </div>
          <div style={evGroupStyle}>
            <label style={evLabelStyle}>Logo URL</label>
            <input style={evInputStyle} placeholder="https://…" value={form.eventLogoUrl ?? ""} onChange={e => set("eventLogoUrl", e.target.value)} />
          </div>

          <div style={{ background: "#f8f9ff", border: `1px solid ${evBorder}`, borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <EventMediaField eventId={event.id} slot="THUMBNAIL" kind="image" label="Thumbnail Image" currentUrl={event.eventThumbnailUrl} onMediaChange={onMediaChange} colors={{ border: evBorder, muted: ORG.muted, accent: ORG.violet, danger: ORG.danger, uploadBg: "#f8f9ff" }} />
            <EventMediaField eventId={event.id} slot="TEASER_1" kind="video" label="Teaser Video 1" currentUrl={event.teaserVideo1Url} onMediaChange={onMediaChange} colors={{ border: evBorder, muted: ORG.muted, accent: ORG.violet, danger: ORG.danger, uploadBg: "#f8f9ff" }} />
            <EventMediaField eventId={event.id} slot="TEASER_2" kind="video" label="Teaser Video 2" currentUrl={event.teaserVideo2Url} onMediaChange={onMediaChange} colors={{ border: evBorder, muted: ORG.muted, accent: ORG.violet, danger: ORG.danger, uploadBg: "#f8f9ff" }} />
          </div>

          <div style={evGroupStyle}>
            <label style={evLabelStyle}>Organization Name</label>
            <input style={evInputStyle} value={form.organizationName} onChange={e => set("organizationName", e.target.value)} />
          </div>

          {/* Extended fields — DRAFT or admin only */}
          {!limitedEdit && (
            <>
              <div style={evGroupStyle}>
                <label style={evLabelStyle}>Organization URL</label>
                <input style={evInputStyle} value={form.organizationUrl} onChange={e => set("organizationUrl", e.target.value)} />
              </div>
              <div style={evGroupStyle}>
                <label style={evLabelStyle}>Venue Name</label>
                <input style={evInputStyle} value={form.venueName} onChange={e => set("venueName", e.target.value)} />
              </div>
              <div style={evGroupStyle}>
                <label style={evLabelStyle}>Location / Google Maps link</label>
                <input style={evInputStyle} placeholder="https://maps.app.goo.gl/…" value={form.mapUrl ?? ""} onChange={e => set("mapUrl", e.target.value)} />
              </div>
              <LocationSelects
                country={form.country ?? ""}
                state={form.state ?? ""}
                city={form.city ?? ""}
                onCountry={v => set("country", v)}
                onState={v => set("state", v)}
                onCity={v => set("city", v)}
                selectStyle={evSelectStyle}
                inputStyle={evInputStyle}
                labelStyle={evLabelStyle}
                gridStyle={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={evGroupStyle}>
                  <label style={evLabelStyle}>Start Date</label>
                  <input type="date" style={evDateInputStyle} value={form.startDate} onChange={e => set("startDate", e.target.value)} />
                </div>
                <div style={evGroupStyle}>
                  <label style={evLabelStyle}>End Date</label>
                  <input type="date" style={evDateInputStyle} value={form.endDate} min={form.startDate || undefined} onChange={e => set("endDate", e.target.value)} />
                </div>
              </div>
            </>
          )}

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#f8f9ff", border: `1px solid ${evBorder}`, borderRadius: "10px", padding: "10px 14px" }}>
            <span>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: ORG.text }}>Volunteers needed</span>
              <span style={{ display: "block", fontSize: "0.72rem", color: ORG.muted, marginTop: "2px" }}>Shows an "Apply for Volunteer" button on the public techfect page</span>
            </span>
            <input type="checkbox" checked={form.volunteersNeeded ?? false}
              onChange={e => setForm(f => ({ ...f, volunteersNeeded: e.target.checked }))}
              style={{ width: "18px", height: "18px", accentColor: ORG.violet, flexShrink: 0 }} />
          </label>

          {error && <div style={{ background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.25)", borderRadius: "8px", padding: "10px 14px", color: ORG.danger, fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {error}</div>}
        </div>
        {/* footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 24px 20px", borderTop: "1px solid rgba(75,134,232,0.15)" }}>
          <button onClick={onClose} disabled={saving} style={{ background: "#f1f3f9", border: "none", color: ORG.muted, borderRadius: "8px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "rgba(76,142,231,0.5)" : ORG.gradientCta, border: "none", color: "#fff", borderRadius: "8px", padding: "10px 24px", fontSize: "0.85rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {saving ? <><Spinner size={14} color="#fff" />Saving…</> : <>Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE WRAPPER
// ─────────────────────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="org-page-bg p-8" style={{ minHeight: "100vh", color: TEXT, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #fff; color: #111; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()

  const { user } = useSelector((state: RootState) => state.auth)
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])

  const isAdmin           = hasRole(userRoles, [AppRole.ADMIN, AppRole.SUPER_ADMIN])
  const canDelete         = hasRole(userRoles, [AppRole.ADMIN])
  const canManageSponsors = isAdmin

  const {
    event, loading, error, refetch,
    createEventSport, sportLoading,
    publishLoading,
    updateEvent, changeEventStatus, deleteEvent,
  } = useAdminEvents(eventId)

  const [showAddSport,   setShowAddSport]   = useState(false)
  const [showEditEvent,  setShowEditEvent]  = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError,    setActionError]    = useState<string | null>(null)
  const [actionLoading,  setActionLoading]  = useState(false)
  const [busySportId,    setBusySportId]    = useState<string | null>(null)

  const handleApproveSport = async (sportId: string) => {
    setActionError(null)
    setBusySportId(sportId)
    try {
      await approveSport(sportId)
      await refetch()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to approve sport.")
    } finally {
      setBusySportId(null)
    }
  }

  const handleRejectSport = async (sportId: string, reason: string) => {
    setActionError(null)
    setBusySportId(sportId)
    try {
      await rejectSport(sportId, reason || undefined)
      await refetch()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to reject sport.")
    } finally {
      setBusySportId(null)
    }
  }

  // Real-time: when event/sport changes come in over WebSocket, re-fetch so
  // the admin view shows the latest data without a manual page refresh.
  useEventRealtime(eventId, {
    onEventUpdated:       () => refetch(),
    onEventStatusChanged: () => refetch(),
    onSportUpdated:       () => refetch(),
    onRegistrationNew:    () => refetch(),
  })

  const eventStatus  = event?.status as EventStatus | undefined
  const isDraft      = eventStatus === "DRAFT"
  const isPublished  = eventStatus === "PUBLISHED"
  const isArchived   = eventStatus === "ARCHIVED"

  // ADMINISTRATOR/SUPER_ADMIN can edit at any stage except ARCHIVED
  // ORGANIZER can edit in DRAFT (full) or PUBLISHED (basic fields only)
  const canEditFull  = !isArchived && (isAdmin || isDraft)
  const canEditBasic = !isArchived && (isAdmin || isPublished)
  const canEdit      = canEditFull || canEditBasic
  // Pass to modal: limitedEdit when organizer in PUBLISHED state
  const limitedEdit  = canEditBasic && !canEditFull

  const sports   = (event?.sports ?? []) as unknown as EventSportItem[]

  const canReviewSportHeadTier = hasRole(userRoles, EVENT_HEAD_AND_UP)
  const [showUserControl, setShowUserControl] = useState(false)
  const [pendingChangeCount, setPendingChangeCount] = useState(0)

  const loadPendingCount = useCallback(() => {
    if (!eventId) return
    getEventChangeRequests(eventId, "PENDING")
      .then(r => setPendingChangeCount(r.length))
      .catch(() => {})
  }, [eventId])

  useEffect(() => { loadPendingCount() }, [loadPendingCount])

  const handleStatusChange = async (status: string) => {
    if (!eventId) return
    setActionError(null)
    setActionLoading(true)
    try {
      await changeEventStatus(eventId, status)
    } catch (err: any) {
      setActionError(err?.message || "Failed to change status.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveEdit = async (req: UpdateEventRequest) => {
    if (!eventId) return
    await updateEvent(eventId, req)
  }

  const handleDeleteEvent = async () => {
    if (!eventId) return
    setActionError(null)
    setActionLoading(true)
    try {
      await deleteEvent(eventId)
      navigate("/admin/user")
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete event.")
      setActionLoading(false)
    }
  }

  const handleAddSport = async (request: CreateEventSportRequest) => {
    if (!eventId) return
    await createEventSport(eventId, request)
    await refetch()
  }

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: MUTED }}>
          <Spinner size={40} /><div style={{ fontSize: "0.9rem" }}>Loading event...</div>
        </div>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper>
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: "10px", padding: "16px 20px", color: DANGER, fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>
      </PageWrapper>
    )
  }

  if (!event) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Techfect not found</div>
      </PageWrapper>
    )
  }

  const statusTransitions = canEdit ? (STATUS_TRANSITIONS[event.status as string] ?? []) : []

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #fff; color: #111; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>

      {showAddSport && eventId && (
        <AddSportModal onAddSport={handleAddSport} submitting={sportLoading} onClose={() => setShowAddSport(false)} />
      )}

      {showEditEvent && event && (
        <EditEventModal event={event} onSave={handleSaveEdit} saving={publishLoading} onClose={() => setShowEditEvent(false)} onMediaChange={refetch} limitedEdit={limitedEdit} />
      )}

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
             onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false) }}>
          <div style={{ background: "#ffffff", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "16px", padding: "28px 28px 24px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 60px rgba(15,23,42,0.25)" }}>
            <Trash2 size={26} color={DANGER} style={{ marginBottom: "12px" }} />
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Sarpanch', sans-serif", fontSize: "1rem", fontWeight: 700, color: DANGER }}>Delete Techfect?</h2>
            <p style={{ margin: "0 0 20px", color: MUTED, fontSize: "0.82rem", lineHeight: 1.6 }}>
              <strong style={{ color: TEXT }}>{event.eventName}</strong> will be permanently removed. This cannot be undone.
            </p>
            {actionError && <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.22)", borderRadius: "8px", padding: "8px 12px", color: DANGER, fontSize: "0.78rem", fontWeight: 600, marginBottom: "14px", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} /> {actionError}</div>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading} style={{ background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDeleteEvent} disabled={actionLoading} style={{ background: actionLoading ? "rgba(220,38,38,0.3)" : DANGER, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                {actionLoading ? <><Spinner size={14} color="#fff" />Deleting…</> : <><Trash2 size={14} />Confirm Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserControl && eventId && (
        <UserControlPanel
          eventId={eventId}
          isAdmin={isAdmin}
          sports={sports}
          currentUserId={user?.id}
          canReviewSportHeadTier={canReviewSportHeadTier}
          canReviewManagerTier={isAdmin}
          onClose={() => setShowUserControl(false)}
          onResolved={loadPendingCount}
        />
      )}

      {eventId && (
        <EventDashboard
          event={event}
          sports={sports}
          canEdit={canEdit}
          canAddSport={isDraft && canEditFull}
          canManageEvent={canEdit}
          statusTransitions={statusTransitions}
          actionLoading={actionLoading}
          onEditEvent={() => setShowEditEvent(true)}
          onAddSport={() => setShowAddSport(true)}
          onStatusChange={handleStatusChange}
          onManageSport={sportId => navigate(`/admin/events/${eventId}/sports/${sportId}`)}
          onApproveSport={handleApproveSport}
          onRejectSport={handleRejectSport}
          approveRejectBusyId={busySportId}
          onOpenUserControl={() => setShowUserControl(true)}
          pendingApprovalCount={pendingChangeCount}
          onBack={() => navigate(-1)}
          backLabel="Back to Techfects"
          errorBanner={actionError}
          canDelete={canDelete}
          onDelete={() => setShowDeleteConfirm(true)}
          eventSponsors={canManageSponsors ? <SponsorManager mode="event" entityId={eventId} title="Event Sponsors" /> : undefined}
          extraSponsorSections={(canEdit || canManageSponsors) ? (
            <>
              {canEdit && (
                <SupportContactManager mode="event" eventId={eventId} title="Event Support & Emergency Contacts" />
              )}
              {canManageSponsors && sports.map(sport => (
                <SponsorManager key={sport.id} mode="sport" entityId={sport.id} title={`Sponsors — ${toLabel(sport.sport)}`} />
              ))}
            </>
          ) : undefined}
        />
      )}
    </>
  )
}