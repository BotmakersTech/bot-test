import { useEffect, useState } from "react"
import { getMyEvents, updateEventInfo, type OrganizerEvent, type UpdateEventInfoRequest } from "../api/organizer.api"

function Field({ label, value, onChange, type = "text", readOnly = false }:
  { label: string; value: string; onChange?: (v: string) => void; type?: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-xs text-neutral-400 mb-1 block">{label}</label>
      {readOnly ? (
        <div className="w-full rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-sm text-neutral-400">{value || "—"}</div>
      ) : (
        <input type={type} value={value}
          onChange={e => onChange?.(e.target.value)}
          className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#fa4715] transition-colors" />
      )}
    </div>
  )
}

export default function OrganizerSettingsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [form, setForm] = useState<UpdateEventInfoRequest>({})
  const [event, setEvent] = useState<OrganizerEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyEvents().then(e => {
      setEvents(e)
      if (e.length) { setSelectedEventId(e[0].id); loadEvent(e[0]) }
    }).catch(() => {})
  }, [])

  const loadEvent = (e: OrganizerEvent) => {
    setEvent(e)
    setForm({
      eventName: e.eventName,
      eventDescription: e.eventDescription ?? "",
      organizationName: e.organizationName ?? "",
      organizationUrl: e.organizationUrl ?? "",
      venueName: e.venueName ?? "",
      venueAddress: e.venueAddress ?? "",
      city: e.city ?? "",
      state: e.state ?? "",
      country: e.country ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
    })
  }

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id)
    const e = events.find(ev => ev.id === id)
    if (e) loadEvent(e)
  }

  const handleSave = async () => {
    if (!selectedEventId) return
    setSaving(true); setError(null)
    try {
      await updateEventInfo(selectedEventId, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save changes")
    } finally { setSaving(false) }
  }

  const set = (key: keyof UpdateEventInfoRequest) => (val: string) =>
    setForm(p => ({ ...p, [key]: val }))

  return (
    <div className="min-h-full p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">Event Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Update event information. Tier and sport specifications are managed by administrators.
        </p>
      </div>

      {/* Event selector */}
      <div>
        <label className="text-xs text-neutral-400 mb-1 block">Event</label>
        <select value={selectedEventId} onChange={e => handleSelectEvent(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none w-full sm:w-64">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      {event && (
        <>
          {/* Read-only fields (admin-controlled) */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-neutral-200">Read-Only Fields</span>
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-neutral-400 font-semibold">Administrator Only</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event Code"  value={event.eventCode} readOnly />
              <Field label="Status"      value={event.status}    readOnly />
              <Field label="Tier"        value={event.tier ?? "—"} readOnly />
            </div>
          </div>

          {/* Editable info fields */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200">Event Information</h2>
            <Field label="Event Name *" value={form.eventName ?? ""} onChange={set("eventName")} />
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Description</label>
              <textarea value={form.eventDescription ?? ""}
                onChange={e => setForm(p => ({ ...p, eventDescription: e.target.value }))}
                rows={3}
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-[#fa4715] resize-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation Name" value={form.organizationName ?? ""} onChange={set("organizationName")} />
              <Field label="Organisation URL"  value={form.organizationUrl  ?? ""} onChange={set("organizationUrl")} type="url" />
            </div>
          </div>

          {/* Venue */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200">Venue</h2>
            <Field label="Venue Name"    value={form.venueName    ?? ""} onChange={set("venueName")} />
            <Field label="Venue Address" value={form.venueAddress ?? ""} onChange={set("venueAddress")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City"    value={form.city    ?? ""} onChange={set("city")} />
              <Field label="State"   value={form.state   ?? ""} onChange={set("state")} />
              <Field label="Country" value={form.country ?? ""} onChange={set("country")} />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200">Timeline</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date" value={form.startDate ?? ""} onChange={set("startDate")} type="date" />
              <Field label="End Date"   value={form.endDate   ?? ""} onChange={set("endDate")}   type="date" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving}
              className="rounded-xl bg-[#fa4715] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#e03d0f] transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && <span className="text-sm text-green-400 font-medium">Changes saved!</span>}
          </div>
        </>
      )}
    </div>
  )
}
