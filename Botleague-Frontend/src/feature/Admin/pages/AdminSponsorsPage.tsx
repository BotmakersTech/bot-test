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

const SPONSOR_TYPES = ["TITLE", "GOLD", "SILVER", "BRONZE", "MEDIA", "TECHNOLOGY", "COMMUNITY", "OTHER"]

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    TITLE:      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    GOLD:       "bg-yellow-600/15 text-yellow-500 border-yellow-600/30",
    SILVER:     "bg-gray-400/15 text-gray-300 border-gray-400/30",
    BRONZE:     "bg-orange-700/15 text-orange-500 border-orange-700/30",
    MEDIA:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
    TECHNOLOGY: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    COMMUNITY:  "bg-green-500/15 text-green-400 border-green-500/30",
  }
  const t = (type ?? "OTHER").toUpperCase()
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${map[t] ?? "bg-white/10 text-gray-400 border-white/10"}`}>
      {toLabel(type)}
    </span>
  )
}

const EMPTY_FORM: AddSponsorRequest = { sponsorName: "", sponsorType: "GOLD", website: "", logoUrl: "", displayOrder: undefined }

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
      .catch(() => setError("Failed to load events"))
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
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsors & Partners</h1>
          <p className="text-gray-400 text-sm mt-1">Manage event sponsors and display order</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }}
          className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition"
        >
          + Add Sponsor
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400">{successMsg}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
      )}

      {/* Event selector */}
      <div className="mb-5">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
        >
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
        </select>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-5">
          <h3 className="font-semibold text-white mb-4">{editingId ? "Edit Sponsor" : "Add Sponsor"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Sponsor Name *</label>
              <input
                value={form.sponsorName}
                onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                placeholder="e.g. TechCorp"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Sponsor Type</label>
              <select
                value={form.sponsorType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, sponsorType: e.target.value }))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              >
                {SPONSOR_TYPES.map((t) => <option key={t} value={t}>{toLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Website</label>
              <input
                value={form.website ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Logo URL</label>
              <input
                value={form.logoUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://…/logo.png"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Display Order</label>
              <input
                type="number"
                value={form.displayOrder ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="1"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.sponsorName.trim()}
              className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Add Sponsor"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
              className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 text-sm text-gray-300 transition"
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
          <p className="text-gray-500">No sponsors added yet for this event.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-orange-400 hover:text-orange-300 transition"
          >
            + Add the first sponsor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors
            .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
            .map((s) => (
            <div key={s.id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
              {s.logoUrl ? (
                <img src={s.logoUrl} alt={s.sponsorName} className="h-12 w-12 rounded-lg object-contain border border-white/10 bg-white/5 shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {s.sponsorName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{s.sponsorName}</p>
                  <TypeBadge type={s.sponsorType} />
                </div>
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-0.5 block"
                  >
                    {s.website}
                  </a>
                )}
              </div>
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => startEdit(s)}
                  className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-white transition"
                >
                  Edit
                </button>
                {confirmDeleteId === s.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={saving}
                      className="rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 disabled:opacity-50 px-2 py-1.5 text-xs transition"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(s.id)}
                    className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 text-xs transition"
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
