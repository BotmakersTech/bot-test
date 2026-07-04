import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Save, Edit3, X, ExternalLink,
  CalendarDays, Trophy, Users, CheckCircle2,
} from "lucide-react"
import {
  getMyEventById, updateEventInfo, changeEventStatus, submitSportForApproval, toggleSportRegistration,
  type OrganizerEvent, type OrganizerSport, type UpdateEventInfoRequest,
} from "../api/organizer.api"

// ── theme ─────────────────────────────────────────────────────────────────────
const P      = "#8C6CFF"
const BLUE   = "#0162D1"
const BG     = "#F4F3FF"
const SURF   = "#FFFFFF"
const BORDER = "#E0D9FF"
const TEXT   = "#111111"
const MUTED  = "#6B7280"
const SUCCESS = "#10b981"
const WARNING = "#f59e0b"
const DANGER  = "#ef4444"

const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "LIVE", "COMPLETED", "ARCHIVED"]

const SPORT_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING_APPROVAL: { label: "Pending Approval", color: WARNING, bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.28)" },
  APPROVED:         { label: "Approved",          color: SUCCESS, bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.28)" },
  ACTIVE:           { label: "Active",            color: SUCCESS, bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  },
  REGISTRATION_OPEN:{ label: "Reg. Open",         color: P,       bg: "rgba(140,108,255,0.1)",  border: "rgba(140,108,255,0.28)" },
  REGISTRATION_CLOSED:{ label: "Reg. Closed",     color: MUTED,   bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.25)" },
  REJECTED:         { label: "Rejected",          color: DANGER,  bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.28)"  },
  DRAFT:            { label: "Draft",             color: MUTED,   bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
  COMPLETED:        { label: "Completed",         color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)" },
}

const EVENT_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; dot?: boolean }> = {
  LIVE:      { label: "Live",      color: SUCCESS, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", dot: true },
  PUBLISHED: { label: "Published", color: P,       bg: "rgba(140,108,255,0.1)", border: "rgba(140,108,255,0.28)" },
  DRAFT:     { label: "Draft",     color: WARNING, bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.28)" },
  COMPLETED: { label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)" },
  ARCHIVED:  { label: "Archived",  color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.25)" },
}

const toLabel = (raw?: string | null) => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

const fmt = (d?: string | null) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

// ── shared input style ────────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: "100%", background: SURF, border: `1.5px solid ${BORDER}`, borderRadius: "8px",
  color: TEXT, fontSize: "0.85rem", padding: "9px 12px", outline: "none", boxSizing: "border-box",
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status, map = EVENT_STATUS_MAP }: { status: string; map?: typeof EVENT_STATUS_MAP }) {
  const s = map[status?.toUpperCase()] ?? { label: status, color: MUTED, bg: "rgba(0,0,0,0.06)", border: "rgba(0,0,0,0.1)" }
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      {(s as any).dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />}
      {s.label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      <p style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
      <p style={{ color: TEXT, fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>{value || "—"}</p>
    </div>
  )
}

function SportRow({ sport, eventId, onRefresh }: { sport: OrganizerSport; eventId: string; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false)

  const doSubmit = async () => {
    setBusy(true)
    try { await submitSportForApproval(eventId, sport.id); onRefresh() } catch { alert("Failed to submit") } finally { setBusy(false) }
  }

  const doToggleReg = async () => {
    setBusy(true)
    try { await toggleSportRegistration(eventId, sport.id); onRefresh() } catch { alert("Failed to toggle registration") } finally { setBusy(false) }
  }

  const canSubmit    = sport.status?.toUpperCase() === "DRAFT"
  const canToggleReg = ["APPROVED","ACTIVE","REGISTRATION_OPEN","REGISTRATION_CLOSED"].includes(sport.status?.toUpperCase())

  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: "180px" }}>
        <p style={{ color: TEXT, fontWeight: 600, margin: "0 0 3px", fontSize: "0.875rem" }}>{toLabel(sport.sport)}</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "0.75rem", color: MUTED }}>
          {sport.ageGroup && <span>{toLabel(sport.ageGroup)}</span>}
          {sport.weightClass && <span>· {toLabel(sport.weightClass)}</span>}
          {sport.formatType && <span>· {toLabel(sport.formatType)}</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.78rem", color: MUTED }}>
          <strong style={{ color: TEXT }}>{sport.registeredTeamsCount ?? 0}</strong>
          {sport.maxTeams ? `/${sport.maxTeams}` : ""} teams
        </span>
        <StatusBadge status={sport.status} map={SPORT_STATUS_MAP} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {canSubmit && (
          <button onClick={doSubmit} disabled={busy}
            style={{ background: `linear-gradient(135deg,${P},${BLUE})`, color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            Submit for Approval
          </button>
        )}
        {canToggleReg && (
          <button onClick={doToggleReg} disabled={busy}
            style={{ background: "rgba(140,108,255,0.1)", color: P, border: `1px solid rgba(140,108,255,0.3)`, borderRadius: "8px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {sport.status?.toUpperCase() === "REGISTRATION_OPEN" ? "Close Reg." : "Open Reg."}
          </button>
        )}
        <button
          onClick={() => window.location.href = `/admin/events/${eventId}/sports/${sport.id}`}
          style={{ background: "rgba(0,0,0,0.05)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 10px", fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
          <ExternalLink size={12} /> Manage
        </button>
      </div>
    </div>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "sports" | "status"

export default function OrganizerEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event,   setEvent]   = useState<OrganizerEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>("overview")
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState<UpdateEventInfoRequest>({})
  const [newStatus, setNewStatus] = useState("")
  const [statusBusy, setStatusBusy] = useState(false)

  const load = useCallback(() => {
    if (!eventId) return
    setLoading(true)
    getMyEventById(eventId)
      .then(ev => { setEvent(ev); setForm({ eventName: ev.eventName, eventDescription: ev.eventDescription ?? "", venueName: ev.venueName ?? "", venueAddress: ev.venueAddress ?? "", city: ev.city ?? "", state: ev.state ?? "", country: ev.country ?? "", organizationName: ev.organizationName ?? "", organizationUrl: ev.organizationUrl ?? "" }); setNewStatus(ev.status ?? "") })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!eventId) return
    setSaving(true)
    try { const updated = await updateEventInfo(eventId, form); setEvent(updated); setEditing(false) } catch { alert("Failed to save") } finally { setSaving(false) }
  }

  const handleStatusChange = async () => {
    if (!eventId || !newStatus) return
    setStatusBusy(true)
    try { const updated = await changeEventStatus(eventId, newStatus); setEvent(updated) } catch { alert("Failed to change status") } finally { setStatusBusy(false) }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontFamily: "'Inter',sans-serif" }}>Loading event…</div>
  )

  if (!event) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", fontFamily: "'Inter',sans-serif" }}>
      <p style={{ color: DANGER }}>Event not found</p>
      <button onClick={() => navigate("/organizer/events")} style={{ color: P, background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}>← Back to events</button>
    </div>
  )

  const totalTeams = event.sports?.reduce((a, s) => a + (s.registeredTeamsCount ?? 0), 0) ?? 0

  const TAB_ITEMS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "sports",   label: `Sports (${event.sports?.length ?? 0})` },
    { id: "status",   label: "Status" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter',sans-serif" }}>
      {/* Header bar */}
      <div style={{ background: SURF, borderBottom: `1px solid ${BORDER}`, padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => navigate("/organizer/events")} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Events
        </button>
        <span style={{ color: BORDER, fontSize: "1.2rem" }}>/</span>
        <h1 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1.15rem", fontWeight: 700, margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.eventName}</h1>
        <StatusBadge status={event.status} />
      </div>

      {/* Stats strip */}
      <div style={{ background: SURF, borderBottom: `1px solid ${BORDER}`, padding: "12px 32px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
        {[
          { icon: <Trophy size={14} style={{ color: P }} />, label: "Sports",  value: event.sports?.length ?? 0 },
          { icon: <Users  size={14} style={{ color: P }} />, label: "Teams",   value: totalTeams },
          { icon: <CalendarDays size={14} style={{ color: P }} />, label: "Start", value: fmt(event.startDate) },
          { icon: <CalendarDays size={14} style={{ color: P }} />, label: "End",   value: fmt(event.endDate) },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            {icon}
            <span style={{ color: MUTED }}>{label}:</span>
            <strong style={{ color: TEXT }}>{value}</strong>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 32px", display: "flex", gap: "0", background: SURF }}>
        {TAB_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{ background: "none", border: "none", borderBottom: tab === id ? `2px solid ${P}` : "2px solid transparent", color: tab === id ? P : MUTED, fontWeight: tab === id ? 700 : 500, fontSize: "0.875rem", padding: "12px 18px", cursor: "pointer", transition: "color 0.12s" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "28px 32px", maxWidth: "900px" }}>

        {/* ── Overview tab ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1rem", fontWeight: 700, margin: 0 }}>Event Information</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{ background: "rgba(140,108,255,0.1)", color: P, border: `1px solid rgba(140,108,255,0.3)`, borderRadius: "8px", padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Edit3 size={13} /> Edit
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setEditing(false)} style={{ background: "rgba(0,0,0,0.05)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <X size={13} /> Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ background: `linear-gradient(135deg,${P},${BLUE})`, color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: saving ? 0.7 : 1 }}>
                      <Save size={13} /> {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {([
                    ["eventName", "Event Name *"],
                    ["organizationName", "Organization Name"],
                    ["organizationUrl", "Organization URL"],
                    ["venueName", "Venue Name"],
                    ["venueAddress", "Venue Address"],
                    ["city", "City"],
                    ["state", "State"],
                    ["country", "Country"],
                  ] as [keyof UpdateEventInfoRequest, string][]).map(([key, label]) => (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                      <input value={(form[key] as string) ?? ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputSt} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
                    <textarea value={form.eventDescription ?? ""} onChange={e => setForm(f => ({ ...f, eventDescription: e.target.value }))} rows={3}
                      style={{ ...inputSt, resize: "vertical", fontFamily: "inherit" }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <InfoRow label="Organization"  value={event.organizationName} />
                  <InfoRow label="Organization URL" value={event.organizationUrl} />
                  <InfoRow label="Venue"         value={event.venueName} />
                  <InfoRow label="Address"       value={event.venueAddress} />
                  <InfoRow label="City"          value={event.city} />
                  <InfoRow label="State"         value={event.state} />
                  <InfoRow label="Country"       value={event.country} />
                  <InfoRow label="Tier"          value={event.tier} />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <InfoRow label="Description" value={event.eventDescription} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Sports tab ───────────────────────────────────────────────────── */}
        {tab === "sports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <h2 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                Sports in this Event
              </h2>
              <span style={{ color: MUTED, fontSize: "0.8rem" }}>{event.sports?.length ?? 0} sport{(event.sports?.length ?? 0) !== 1 ? "s" : ""}</span>
            </div>
            {!event.sports?.length ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>
                <Trophy size={36} style={{ opacity: 0.2, margin: "0 auto 8px" }} />
                <p style={{ margin: 0 }}>No sports have been added to this event yet.</p>
              </div>
            ) : (
              event.sports.map(sp => (
                <SportRow key={sp.id} sport={sp} eventId={event.id} onRefresh={load} />
              ))
            )}
          </div>
        )}

        {/* ── Status tab ───────────────────────────────────────────────────── */}
        {tab === "status" && (
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <h2 style={{ color: TEXT, fontFamily: "'Sarpanch',sans-serif", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px" }}>Change Event Status</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Status</label>
                <StatusBadge status={event.status} />
              </div>
              <span style={{ color: BORDER, fontSize: "1.5rem" }}>→</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>New Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  style={{ ...inputSt, width: "180px", appearance: "none", cursor: "pointer", paddingRight: "28px" }}>
                  {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={handleStatusChange}
                disabled={statusBusy || newStatus === event.status}
                style={{ marginTop: "18px", background: `linear-gradient(135deg,${P},${BLUE})`, color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", opacity: (statusBusy || newStatus === event.status) ? 0.5 : 1, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <CheckCircle2 size={15} /> {statusBusy ? "Updating…" : "Apply"}
              </button>
            </div>
            <p style={{ color: MUTED, fontSize: "0.78rem", marginTop: "16px" }}>
              Changing the event status affects visibility and participant access. Proceed carefully.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
