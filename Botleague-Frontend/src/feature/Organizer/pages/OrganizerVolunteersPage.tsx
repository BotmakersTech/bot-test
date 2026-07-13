import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getMyEvents, getVolunteers, createVolunteer, updateVolunteer,
  checkInVolunteer, checkOutVolunteer, deleteVolunteer,
  type OrganizerEvent, type Volunteer, type VolunteerRequest,
} from "../api/organizer.api"

const SHIFTS = ["FULL_DAY", "MORNING", "AFTERNOON", "EVENING"]

function fmt(d?: string | null) {
  if (!d) return null
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function ShiftBadge({ shift }: { shift?: string | null }) {
  const colors: Record<string, string> = {
    MORNING: "bg-[#eab308]/10 text-[#a16207]",
    AFTERNOON: "bg-[#f59e0b]/10 text-[#b45309]",
    EVENING: "bg-[#4c8ee7]/10 text-[#3567cf]",
    FULL_DAY: "bg-[#1fa952]/10 text-[#1fa952]",
  }
  if (!shift) return <span className="text-[#9a9a9a]">—</span>
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors[shift] ?? "bg-[#4b86e8]/8 text-[#5d5d5d]"}`}>
      {shift.replace("_", " ")}
    </span>
  )
}

const EMPTY: VolunteerRequest = { name: "", email: "", phone: "", dutyStation: "", shift: "FULL_DAY", notes: "" }

export default function OrganizerVolunteersPage() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get("eventId") ?? "")
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Volunteer | null>(null)
  const [form, setForm] = useState<VolunteerRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyEvents().then(e => {
      setEvents(e)
      if (!selectedEventId && e.length) setSelectedEventId(e[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getVolunteers(selectedEventId)
      .then(setVolunteers)
      .catch(() => setError("Failed to load volunteers"))
      .finally(() => setLoading(false))
  }, [selectedEventId])

  const refresh = () => {
    if (!selectedEventId) return
    getVolunteers(selectedEventId).then(setVolunteers).catch(() => {})
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (v: Volunteer) => {
    setEditing(v)
    setForm({ name: v.name, email: v.email ?? "", phone: v.phone ?? "",
      dutyStation: v.dutyStation ?? "", shift: v.shift ?? "FULL_DAY", notes: v.notes ?? "" })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!selectedEventId || !form.name.trim()) return
    setSaving(true)
    try {
      if (editing) await updateVolunteer(selectedEventId, editing.id, form)
      else await createVolunteer(selectedEventId, form)
      setShowForm(false); refresh()
    } catch { setError("Save failed") } finally { setSaving(false) }
  }

  const handleCheckIn  = (v: Volunteer) => checkInVolunteer(selectedEventId, v.id).then(refresh)
  const handleCheckOut = (v: Volunteer) => checkOutVolunteer(selectedEventId, v.id).then(refresh)
  const handleDelete   = (v: Volunteer) => {
    if (!confirm(`Remove ${v.name}?`)) return
    deleteVolunteer(selectedEventId, v.id).then(refresh)
  }

  const visible = filter
    ? volunteers.filter(v => v.name.toLowerCase().includes(filter.toLowerCase())
        || (v.dutyStation ?? "").toLowerCase().includes(filter.toLowerCase()))
    : volunteers

  const checkedIn = volunteers.filter(v => v.checkedInAt && !v.checkedOutAt).length

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Volunteer Management</h1>
          <p className="text-sm text-[#5d5d5d] mt-0.5">Manage shifts, duty stations, and attendance</p>
        </div>
        <button onClick={openAdd}
          className="rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          + Add Volunteer
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: volunteers.length, color: "text-[#111111]" },
          { label: "Checked In", value: checkedIn, color: "text-[#1fa952]" },
          { label: "Checked Out", value: volunteers.filter(v => v.checkedOutAt).length, color: "text-[#5d5d5d]" },
          { label: "Pending", value: volunteers.filter(v => !v.checkedInAt).length, color: "text-[#b45309]" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#5d5d5d] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
        <input type="text" placeholder="Search name or duty…" value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] placeholder-[#9a9a9a] ring-1 ring-[#4b86e8]/30 focus:outline-none flex-1 min-w-48" />
      </div>

      {error && <p className="text-[#e04b4b] text-sm">{error}</p>}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-[#4b86e8]/8" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#5d5d5d] text-sm">{selectedEventId ? "No volunteers added yet." : "Select an event."}</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#4c8ee7] hover:underline">Add your first volunteer →</button>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-[#4b86e8]/25">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#4b86e8]/20 text-left text-[11px] text-[#5d5d5d] uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Duty Station</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(v => (
                <tr key={v.id} className="border-b border-[#4b86e8]/10 bg-white/60 hover:bg-white transition-colors">
                  <td className="px-4 py-3 font-medium text-[#111111]">{v.name}</td>
                  <td className="px-4 py-3 text-[#5d5d5d] text-xs">
                    {v.email && <div>{v.email}</div>}
                    {v.phone && <div>{v.phone}</div>}
                    {!v.email && !v.phone && "—"}
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{v.dutyStation || "—"}</td>
                  <td className="px-4 py-3"><ShiftBadge shift={v.shift} /></td>
                  <td className="px-4 py-3">
                    {v.checkedOutAt ? (
                      <span className="text-xs text-[#5d5d5d]">Out {fmt(v.checkedOutAt)}</span>
                    ) : v.checkedInAt ? (
                      <span className="text-xs text-[#1fa952]">In {fmt(v.checkedInAt)}</span>
                    ) : (
                      <span className="text-xs text-[#9a9a9a]">Not checked in</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!v.checkedInAt && (
                        <button onClick={() => handleCheckIn(v)}
                          className="rounded-lg bg-[#1fa952]/10 px-2.5 py-1 text-xs font-semibold text-[#1fa952] hover:bg-[#1fa952]/20 transition-colors">
                          Check In
                        </button>
                      )}
                      {v.checkedInAt && !v.checkedOutAt && (
                        <button onClick={() => handleCheckOut(v)}
                          className="rounded-lg bg-[#4c8ee7]/10 px-2.5 py-1 text-xs font-semibold text-[#3567cf] hover:bg-[#4c8ee7]/20 transition-colors">
                          Check Out
                        </button>
                      )}
                      <button onClick={() => openEdit(v)}
                        className="rounded-lg bg-[#4b86e8]/10 px-2.5 py-1 text-xs text-[#3567cf] hover:bg-[#4b86e8]/20 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(v)}
                        className="rounded-lg bg-[#e04b4b]/10 px-2.5 py-1 text-xs text-[#e04b4b] hover:bg-[#e04b4b]/20 transition-colors">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#4b86e8]/30 bg-white p-6 space-y-4">
            <h3 className="text-base font-bold text-[#111111]">{editing ? "Edit Volunteer" : "Add Volunteer"}</h3>
            {[
              { label: "Name *", key: "name", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Duty Station", key: "dutyStation", type: "text" },
              { label: "Notes", key: "notes", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]" />
              </div>
            ))}
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Shift</label>
              <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
                {SHIFTS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-[#4b86e8]/30 py-2 text-sm text-[#5d5d5d] hover:bg-[#4b86e8]/5">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-1 rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
