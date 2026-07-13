import { useEffect, useState } from "react"
import { getMyEvents, updateEventInfo, type OrganizerEvent, type UpdateEventInfoRequest } from "../api/organizer.api"

function Field({ label, value, onChange, type = "text", readOnly = false }:
  { label: string; value: string; onChange?: (v: string) => void; type?: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">{label}</label>
      {readOnly ? (
        <div className="w-full rounded-lg bg-[#f8f9ff] border border-[#4b86e8]/20 px-3 py-2 text-sm text-[#5d5d5d]">{value || "—"}</div>
      ) : (
        <input type={type} value={value}
          onChange={e => onChange?.(e.target.value)}
          className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff] transition-colors" />
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
        <h1 className="text-xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Event Settings</h1>
        <p className="text-sm text-[#5d5d5d] mt-0.5">
          Update event information. Sport specifications are managed by administrators.
        </p>
      </div>

      {/* Event selector */}
      <div>
        <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Event</label>
        <select value={selectedEventId} onChange={e => handleSelectEvent(e.target.value)}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none w-full sm:w-64">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      {event && (
        <>
          {/* Read-only fields (admin-controlled) */}
          <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-[#111111]">Read-Only Fields</span>
              <span className="rounded-full bg-[#4b86e8]/10 px-2 py-0.5 text-[10px] text-[#3567cf] font-semibold">Administrator Only</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event Code"  value={event.eventCode} readOnly />
              <Field label="Status"      value={event.status}    readOnly />
            </div>
          </div>

          {/* Editable info fields */}
          <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#111111]">Event Information</h2>
            <Field label="Event Name *" value={form.eventName ?? ""} onChange={set("eventName")} />
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Description</label>
              <textarea value={form.eventDescription ?? ""}
                onChange={e => setForm(p => ({ ...p, eventDescription: e.target.value }))}
                rows={3}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff] resize-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation Name" value={form.organizationName ?? ""} onChange={set("organizationName")} />
              <Field label="Organisation URL"  value={form.organizationUrl  ?? ""} onChange={set("organizationUrl")} type="url" />
            </div>
          </div>

          {/* Venue */}
          <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#111111]">Venue</h2>
            <Field label="Venue Name"    value={form.venueName    ?? ""} onChange={set("venueName")} />
            <Field label="Venue Address" value={form.venueAddress ?? ""} onChange={set("venueAddress")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City"    value={form.city    ?? ""} onChange={set("city")} />
              <Field label="State"   value={form.state   ?? ""} onChange={set("state")} />
              <Field label="Country" value={form.country ?? ""} onChange={set("country")} />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#111111]">Timeline</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date" value={form.startDate ?? ""} onChange={set("startDate")} type="date" />
              <Field label="End Date"   value={form.endDate   ?? ""} onChange={set("endDate")}   type="date" />
            </div>
          </div>

          {error && <p className="text-[#e04b4b] text-sm">{error}</p>}

          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving}
              className="rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && <span className="text-sm text-[#1fa952] font-medium">Changes saved!</span>}
          </div>
        </>
      )}
    </div>
  )
}
