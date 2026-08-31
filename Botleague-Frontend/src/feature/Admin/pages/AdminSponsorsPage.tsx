import { useEffect, useState, useCallback } from "react"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import {
  getEventSponsors,
  addEventSponsor,
  updateEventSponsor,
  deleteEventSponsor,
  type EventSponsor,
  type AddSponsorRequest,
} from "../api/sponsor.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import "../../../styles/organizerTheme.css"

const SPONSOR_TYPES = ["TITLE", "GOLD", "SILVER", "BRONZE", "MEDIA", "TECHNOLOGY", "COMMUNITY", "OTHER"]

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    TITLE:      "bg-yellow-50 text-yellow-700 border-yellow-200",
    GOLD:       "bg-amber-50 text-amber-700 border-amber-200",
    SILVER:     "bg-gray-100 text-gray-600 border-gray-200",
    BRONZE:     "bg-orange-50 text-orange-700 border-orange-200",
    MEDIA:      "bg-blue-50 text-blue-600 border-blue-200",
    TECHNOLOGY: "bg-purple-50 text-purple-600 border-purple-200",
    COMMUNITY:  "bg-green-50 text-green-600 border-green-200",
  }
  const t = (type ?? "OTHER").toUpperCase()
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${map[t] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {toLabel(type)}
    </span>
  )
}

const EMPTY_FORM: AddSponsorRequest = { sponsorName: "", sponsorType: "GOLD", website: "", logoUrl: "", displayOrder: undefined }

const inputClass = "w-full rounded-xl bg-white border px-4 py-2.5 text-sm text-[#374151] outline-none"
const inputStyle = { borderColor: "rgba(75,134,232,0.3)" }

export default function AdminSponsorsPage() {
  const [events, setEvents] = useState<AdminEventResponse[]>([])
  const [sponsors, setSponsors] = useState<EventSponsor[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddSponsorRequest>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    getAllEvents()
      .then((evts) => {
        setEvents(evts)
        if (evts.length > 0) setSelectedEventId(evts[0].id)
      })
      .catch(() => setError("Failed to load techfects"))
      .finally(() => setLoading(false))
  }, [])

  const loadSponsors = useCallback(async (eventId: string) => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getEventSponsors(eventId)
      setSponsors(data)
    } catch {
      setError("Failed to load sponsors")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedEventId) loadSponsors(selectedEventId)
  }, [selectedEventId, loadSponsors])

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleSave = async () => {
    if (!form.sponsorName.trim() || !selectedEventId) return
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateEventSponsor(editingId, form)
        setSponsors((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
        flash("Sponsor updated.")
      } else {
        const created = await addEventSponsor(selectedEventId, form)
        setSponsors((prev) => [...prev, created])
        flash("Sponsor added.")
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
    } catch {
      setError("Failed to save sponsor.")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (s: EventSponsor) => {
    setForm({
      sponsorName:  s.sponsorName,
      sponsorType:  s.sponsorType ?? "GOLD",
      website:      s.website ?? "",
      logoUrl:      s.logoUrl ?? "",
      displayOrder: s.displayOrder,
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      await deleteEventSponsor(id)
      setSponsors((prev) => prev.filter((s) => s.id !== id))
      setConfirmDeleteId(null)
      flash("Sponsor removed.")
    } catch {
      setError("Failed to delete sponsor.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="org-page-bg p-8">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">Sponsors & Partners</h1>
          <p className="text-gray-400 text-sm mt-1">Manage techfect sponsors and display order</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
          style={{ background: ORG.gradientCta }}
        >
          + Add Sponsor
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-600">{successMsg}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}

      {/* Event selector */}
      <div className="mb-5">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className={inputClass}
          style={inputStyle}
        >
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
        </select>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white border p-5" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          <h3 className="font-semibold text-[#374151] mb-4">{editingId ? "Edit Sponsor" : "Add Sponsor"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Sponsor Name *</label>
              <input
                value={form.sponsorName}
                onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                placeholder="e.g. TechCorp"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Sponsor Type</label>
              <select
                value={form.sponsorType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, sponsorType: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              >
                {SPONSOR_TYPES.map((t) => <option key={t} value={t}>{toLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Website</label>
              <input
                value={form.website ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Logo URL</label>
              <input
                value={form.logoUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://…/logo.png"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Display Order</label>
              <input
                type="number"
                value={form.displayOrder ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="1"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.sponsorName.trim()}
              className="rounded-xl disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
              style={{ background: ORG.gradientCta }}
            >
              {saving ? "Saving…" : editingId ? "Update" : "Add Sponsor"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
              className="rounded-xl bg-[#f8f9ff] hover:bg-[#eef2ff] border px-5 py-2.5 text-sm text-gray-600 transition"
              style={{ borderColor: "rgba(75,134,232,0.2)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sponsors list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading sponsors…</div>
      ) : sponsors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-gray-400">No sponsors added yet for this event.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-orange-600 hover:text-orange-700 transition"
          >
            + Add the first sponsor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors
            .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
            .map((s) => (
            <div key={s.id} className="rounded-xl bg-white border p-4 flex items-center gap-4" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
              {s.logoUrl ? (
                <img src={s.logoUrl} alt={s.sponsorName} className="h-12 w-12 rounded-lg object-contain border bg-[#f8f9ff] shrink-0" style={{ borderColor: "rgba(75,134,232,0.2)" }} />
              ) : (
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: ORG.gradientCta }}
                >
                  {s.sponsorName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[#374151]">{s.sponsorName}</p>
                  <TypeBadge type={s.sponsorType} />
                </div>
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-0.5 block"
                  >
                    {s.website}
                  </a>
                )}
              </div>
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => startEdit(s)}
                  className="rounded-lg bg-[#f8f9ff] hover:bg-[#eef2ff] border px-3 py-1.5 text-xs text-[#374151] transition"
                  style={{ borderColor: "rgba(75,134,232,0.2)" }}
                >
                  Edit
                </button>
                {confirmDeleteId === s.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg bg-[#f8f9ff] border px-2 py-1.5 text-xs text-gray-500 transition"
                      style={{ borderColor: "rgba(75,134,232,0.2)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={saving}
                      className="rounded-lg bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 disabled:opacity-50 px-2 py-1.5 text-xs transition"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(s.id)}
                    className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-3 py-1.5 text-xs transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
