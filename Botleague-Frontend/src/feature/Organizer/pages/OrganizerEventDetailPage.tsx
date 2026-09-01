import React, { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { X, AlertTriangle } from "lucide-react"
import {
  getMyEventById, updateEventInfo, changeEventStatus, createEventSport, submitSportForApproval,
  getEventChangeRequests,
  type OrganizerEvent, type UpdateEventInfoRequest, type CreateEventSportRequest,
} from "../api/organizer.api"
import EventMediaField from "../components/EventMediaField"
import LocationSelects from "../../../shared/components/LocationSelects"
import SponsorManager from "../../Admin/components/SponsorManager"
import SupportContactManager from "../components/SupportContactManager"
import EventDashboard from "../../../shared/components/EventDashboard/EventDashboard"
import UserControlPanel from "../../../shared/components/EventDashboard/UserControlPanel"
import AddSportModal from "../../../shared/components/AddSportModal/AddSportModal"
import { ORG } from "../theme/organizerTheme"
import type { RootState } from "../../../app/store"
import { hasRole, AppRole, EVENT_HEAD_AND_UP, ADMIN_AND_UP } from "../../../shared/constants/roles"

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const BG      = ORG.pageBg
const BORDER  = "rgba(75,134,232,0.3)"
const ACCENT  = "#8c6cff"
const TEXT    = "#111111"
const MUTED   = "#5d5d5d"
const SUCCESS = "#1fa952"
const DANGER  = "#e04b4b"

type EventStatus = "DRAFT" | "PUBLISHED" | "LIVE" | "COMPLETED" | "ARCHIVED"

// ─────────────────────────────────────────────────────────────
// SMALL SHARED PIECES
// ─────────────────────────────────────────────────────────────

function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: `2px solid rgba(75,134,232,0.12)`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
        {label}{required && <span style={{ color: ACCENT, marginLeft: "3px" }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: "#f8f9ff",
  border: `1px solid rgba(75,134,232,0.12)`,
  borderRadius: "8px",
  color: TEXT,
  fontSize: "0.85rem",
  padding: "9px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
}
const dateInputStyle: React.CSSProperties = { ...inputStyle, colorScheme: "dark", cursor: "pointer" }

// ─────────────────────────────────────────────────────────────
// STATUS TRANSITIONS
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

function EditEventModal({ event, onSave, saving, onClose, onMediaChange }: {
  event: OrganizerEvent
  onSave: (req: UpdateEventInfoRequest) => Promise<unknown>
  saving: boolean
  onClose: () => void
  onMediaChange: () => void
}) {
  const fmt = (d?: string | null) => d ? d.slice(0, 10) : ""
  const [form, setForm] = useState<UpdateEventInfoRequest>({
    eventName:        event.eventName        ?? "",
    eventDescription: event.eventDescription ?? "",
    eventLogoUrl:     event.eventLogoUrl      ?? "",
    organizationName: event.organizationName  ?? "",
    organizationUrl:  event.organizationUrl   ?? "",
    venueName:        event.venueName         ?? "",
    venueAddress:     event.venueAddress      ?? "",
    mapUrl:           event.mapUrl            ?? "",
    city:             event.city              ?? "",
    state:            event.state             ?? "",
    country:          event.country           ?? "",
    startDate:        fmt(event.startDate),
    endDate:          fmt(event.endDate),
    volunteersNeeded: event.volunteersNeeded ?? false,
  })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof UpdateEventInfoRequest, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.eventName?.trim()) { setError("Techfect name is required."); return }
    setError(null)
    try { await onSave(form); onClose() }
    catch (err: any) { setError(err?.response?.data?.message || err?.message || "Save failed.") }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#ffffff", border: `1px solid rgba(140,108,255,0.22)`, borderRadius: "18px", width: "100%", maxWidth: "620px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, background: "rgba(140,108,255,0.04)", borderRadius: "18px 18px 0 0" }}>
          <div>
            <div style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.06em" }}>EDIT TECHFECT</div>
            <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "2px" }}>Fill in as many details as you have — the rest can be added later</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", color: MUTED, cursor: "pointer", padding: "6px", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Techfect Name" required>
            <input style={inputStyle} value={form.eventName} onChange={e => set("eventName", e.target.value)} />
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px", fontFamily: "inherit" }} value={form.eventDescription} onChange={e => set("eventDescription", e.target.value)} />
          </FormField>
          <FormField label="Logo URL">
            <input style={inputStyle} placeholder="https://…" value={form.eventLogoUrl ?? ""} onChange={e => set("eventLogoUrl", e.target.value)} />
          </FormField>

          <EventMediaField eventId={event.id} slot="THUMBNAIL" kind="image" label="Thumbnail Image" currentUrl={event.eventThumbnailUrl} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />
          <EventMediaField eventId={event.id} slot="TEASER_1" kind="video" label="Teaser Video 1" currentUrl={event.teaserVideo1Url} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />
          <EventMediaField eventId={event.id} slot="TEASER_2" kind="video" label="Teaser Video 2" currentUrl={event.teaserVideo2Url} onMediaChange={onMediaChange} colors={{ border: BORDER, muted: MUTED, accent: ACCENT, danger: DANGER, uploadBg: "#f8f9ff" }} />

          <FormField label="Organization Name">
            <input style={inputStyle} value={form.organizationName} onChange={e => set("organizationName", e.target.value)} />
          </FormField>
          <FormField label="Organization URL">
            <input style={inputStyle} value={form.organizationUrl} onChange={e => set("organizationUrl", e.target.value)} />
          </FormField>
          <FormField label="Venue Name">
            <input style={inputStyle} value={form.venueName} onChange={e => set("venueName", e.target.value)} />
          </FormField>
          <FormField label="Venue Address">
            <input style={inputStyle} value={form.venueAddress} onChange={e => set("venueAddress", e.target.value)} />
          </FormField>
          <FormField label="Location / Google Maps link">
            <input style={inputStyle} placeholder="https://maps.app.goo.gl/…" value={form.mapUrl ?? ""} onChange={e => set("mapUrl", e.target.value)} />
          </FormField>
          <LocationSelects
            state={form.state ?? ""}
            city={form.city ?? ""}
            onCountry={v => set("country", v)}
            onState={v => set("state", v)}
            onCity={v => set("city", v)}
            gridStyle={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
            selectStyle={inputStyle}
            inputStyle={inputStyle}
            labelStyle={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, display: "block", marginBottom: "6px" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FormField label="Start Date"><input type="date" style={dateInputStyle} value={form.startDate} onChange={e => set("startDate", e.target.value)} /></FormField>
            <FormField label="End Date"><input type="date" style={dateInputStyle} value={form.endDate} min={form.startDate || undefined} onChange={e => set("endDate", e.target.value)} /></FormField>
          </div>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "rgba(75,134,232,0.04)", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 14px" }}>
            <span>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}>Volunteers needed</span>
              <span style={{ display: "block", fontSize: "0.72rem", color: MUTED, marginTop: "2px" }}>Shows an "Apply for Volunteer" button on the public techfect page</span>
            </span>
            <input type="checkbox" checked={form.volunteersNeeded ?? false}
              onChange={e => setForm(f => ({ ...f, volunteersNeeded: e.target.checked }))}
              style={{ width: "18px", height: "18px", accentColor: ACCENT, flexShrink: 0 }} />
          </label>

          {error && <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 14px", color: DANGER, fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {error}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ background: "rgba(75,134,232,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ background: saving ? "rgba(140,108,255,0.3)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
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
    <div className="p-8" style={{ minHeight: "100vh", background: BG, color: TEXT, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #ffffff; color: #111111; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
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

export default function OrganizerEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate     = useNavigate()

  const [event,   setEvent]   = useState<OrganizerEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [showAddSport,  setShowAddSport]  = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [sportSubmitting, setSportSubmitting] = useState(false)
  const [approvalSubmittingId, setApprovalSubmittingId] = useState<string | null>(null)
  const [actionError,   setActionError]   = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [savingEdit,    setSavingEdit]    = useState(false)

  const load = useCallback(() => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    getMyEventById(eventId)
      .then(setEvent)
      .catch((err: any) => setError(err?.response?.data?.message || "Failed to load techfect"))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => { load() }, [load])

  // SPORT_HEAD can view the event their sport belongs to, but only
  // EVENT_HEAD-and-up can actually manage it — event section is read-only
  // for them; their own sport (via OrganizerSportDetailPage) is not.
  const user = useSelector((state: RootState) => state.auth.user)
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])
  const canManageEvent = hasRole(userRoles, [AppRole.SUPER_ADMIN, AppRole.ADMIN, AppRole.ORGANISER, AppRole.EVENT_HEAD])
  const isAdmin = hasRole(userRoles, ADMIN_AND_UP)
  const canReviewSportHeadTier = hasRole(userRoles, EVENT_HEAD_AND_UP)

  const [showUserControl, setShowUserControl] = useState(false)
  const [pendingChangeCount, setPendingChangeCount] = useState(0)

  const loadPendingCount = useCallback(() => {
    if (!eventId || !canManageEvent) return
    getEventChangeRequests(eventId, "PENDING")
      .then(r => setPendingChangeCount(r.length))
      .catch(() => {})
  }, [eventId, canManageEvent])

  useEffect(() => { loadPendingCount() }, [loadPendingCount])

  const eventStatus = event?.status as EventStatus | undefined
  const isDraft      = eventStatus === "DRAFT"
  const isArchived   = eventStatus === "ARCHIVED"
  const isLive       = eventStatus === "LIVE"
  const isCompleted  = eventStatus === "COMPLETED"
  const canEdit      = canManageEvent && !isArchived && !isLive && !isCompleted
  const canAddSport  = canManageEvent && isDraft
  // Deliberately includes isLive — status transitions (e.g. "Complete Techfect"
  // on a LIVE event) must stay reachable even though info edits don't.
  const canChangeStatus = canManageEvent && !isArchived && !isCompleted

  const handleSaveEdit = async (req: UpdateEventInfoRequest) => {
    if (!eventId) return
    setSavingEdit(true)
    try {
      const updated = await updateEventInfo(eventId, req)
      setEvent(updated)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!eventId) return
    setActionError(null)
    setActionLoading(true)
    try {
      const updated = await changeEventStatus(eventId, status)
      setEvent(updated)
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to change status.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddSport = async (request: CreateEventSportRequest) => {
    if (!eventId) return
    setSportSubmitting(true)
    try {
      await createEventSport(eventId, request)
      load()
    } finally {
      setSportSubmitting(false)
    }
  }

  const handleSubmitApproval = async (sportId: string) => {
    if (!eventId) return
    setApprovalSubmittingId(sportId)
    try {
      await submitSportForApproval(eventId, sportId)
      load()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to submit sport for approval.")
    } finally {
      setApprovalSubmittingId(null)
    }
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
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "10px", padding: "16px 20px", color: DANGER, fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>
      </PageWrapper>
    )
  }

  if (!event || !eventId) {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>Techfect not found</div>
      </PageWrapper>
    )
  }

  const sports = event.sports ?? []
  const statusTransitions = canChangeStatus ? (STATUS_TRANSITIONS[event.status as string] ?? []) : []

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #ffffff; color: #111111; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>

      {showAddSport && (
        <AddSportModal onAddSport={handleAddSport} submitting={sportSubmitting} onClose={() => setShowAddSport(false)} />
      )}

      {showEditEvent && (
        <EditEventModal event={event} onSave={handleSaveEdit} saving={savingEdit} onClose={() => setShowEditEvent(false)} onMediaChange={load} />
      )}

      {showUserControl && (
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

      <EventDashboard
        event={event}
        sports={sports}
        canEdit={canEdit}
        canAddSport={canAddSport}
        canManageEvent={canManageEvent}
        statusTransitions={statusTransitions}
        actionLoading={actionLoading}
        onEditEvent={() => setShowEditEvent(true)}
        onAddSport={() => setShowAddSport(true)}
        onStatusChange={handleStatusChange}
        onManageSport={sportId => navigate(`/organizer/events/${eventId}/sports/${sportId}`)}
        onSubmitApproval={handleSubmitApproval}
        submitApprovalId={approvalSubmittingId}
        onOpenUserControl={() => setShowUserControl(true)}
        pendingApprovalCount={pendingChangeCount}
        onBack={() => navigate("/organizer/events")}
        backLabel="Back to My Techfects"
        errorBanner={actionError}
        eventSponsors={canManageEvent ? <SponsorManager mode="event" entityId={eventId} title="Event Sponsors" /> : undefined}
        extraSponsorSections={canManageEvent ? <SupportContactManager mode="event" eventId={eventId} title="Event Support & Emergency Contacts" /> : undefined}
      />
    </>
  )
}
