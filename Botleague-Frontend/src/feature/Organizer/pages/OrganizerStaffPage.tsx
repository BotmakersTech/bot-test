import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getMyEvents, getStaff, createStaff, updateStaff,
  checkInStaff, checkOutStaff, deleteStaff,
  type OrganizerEvent, type Staff, type StaffRequest,
} from "../api/organizer.api"

const STAFF_TYPES = ["OPERATIONS", "TECHNICAL", "SECURITY", "MEDICAL"]
const SHIFTS = ["FULL_DAY", "MORNING", "AFTERNOON", "EVENING"]

const TYPE_COLORS: Record<string, string> = {
  OPERATIONS: "bg-blue-500/10 text-blue-400",
  TECHNICAL:  "bg-purple-500/10 text-purple-400",
  SECURITY:   "bg-red-500/10 text-red-400",
  MEDICAL:    "bg-green-500/10 text-green-400",
}

const EMPTY: StaffRequest = { name: "", email: "", phone: "", staffType: "OPERATIONS", dutyDescription: "", shift: "FULL_DAY" }

export default function OrganizerStaffPage() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get("eventId") ?? "")
  const [staff, setStaff] = useState<Staff[]>([])
  const [filter, setFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState<StaffRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyEvents().then(e => { setEvents(e); if (!selectedEventId && e.length) setSelectedEventId(e[0].id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getStaff(selectedEventId).then(setStaff).catch(() => setError("Failed to load staff")).finally(() => setLoading(false))
  }, [selectedEventId])

  const refresh = () => { if (selectedEventId) getStaff(selectedEventId).then(setStaff).catch(() => {}) }

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (s: Staff) => {
    setEditing(s)
    setForm({ name: s.name, email: s.email ?? "", phone: s.phone ?? "",
      staffType: s.staffType, dutyDescription: s.dutyDescription ?? "", shift: s.shift ?? "FULL_DAY" })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!selectedEventId || !form.name.trim()) return
    setSaving(true)
    try {
      if (editing) await updateStaff(selectedEventId, editing.id, form)
      else await createStaff(selectedEventId, form)
      setShowForm(false); refresh()
    } catch { setError("Save failed") } finally { setSaving(false) }
  }

  const handleDelete = (s: Staff) => {
    if (!confirm(`Remove ${s.name}?`)) return
    deleteStaff(selectedEventId, s.id).then(refresh)
  }

  const visible = staff.filter(s => {
    const matchType   = typeFilter === "ALL" || s.staffType === typeFilter
    const matchFilter = !filter || s.name.toLowerCase().includes(filter.toLowerCase())
        || (s.dutyDescription ?? "").toLowerCase().includes(filter.toLowerCase())
    return matchType && matchFilter
  })

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : null

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Staff Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Operations, technical, security and medical teams</p>
        </div>
        <button onClick={openAdd}
          className="rounded-xl bg-[#fa4715] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e03d0f] transition-colors">
          + Add Staff
        </button>
      </div>

      {/* Stats by type */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAFF_TYPES.map(t => (
          <div key={t} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4">
            <div className="text-2xl font-bold text-white">{staff.filter(s => s.staffType === t).length}</div>
            <div className="text-xs text-neutral-500 mt-1">{t.charAt(0) + t.slice(1).toLowerCase()}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
          <option value="ALL">All Types</option>
          {STAFF_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
        </select>
        <input type="text" placeholder="Search name or duty…" value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none flex-1 min-w-48" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No staff found.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#fa4715] hover:underline">Add staff member →</button>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-[11px] text-neutral-500 uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duty</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{s.name}</div>
                    {(s.email || s.phone) && (
                      <div className="text-xs text-neutral-500">{s.email || s.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[s.staffType] ?? "bg-white/5 text-neutral-400"}`}>
                      {s.staffType.charAt(0) + s.staffType.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300 text-xs max-w-[200px] truncate">{s.dutyDescription || "—"}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{s.shift?.replace("_", " ") || "—"}</td>
                  <td className="px-4 py-3">
                    {s.checkedOutAt ? <span className="text-xs text-neutral-400">Out {fmt(s.checkedOutAt)}</span>
                     : s.checkedInAt ? <span className="text-xs text-green-400">In {fmt(s.checkedInAt)}</span>
                     : <span className="text-xs text-neutral-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!s.checkedInAt && (
                        <button onClick={() => checkInStaff(selectedEventId, s.id).then(refresh)}
                          className="rounded-lg bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400 hover:bg-green-500/20">Check In</button>
                      )}
                      {s.checkedInAt && !s.checkedOutAt && (
                        <button onClick={() => checkOutStaff(selectedEventId, s.id).then(refresh)}
                          className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20">Check Out</button>
                      )}
                      <button onClick={() => openEdit(s)}
                        className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-neutral-300 hover:bg-white/10">Edit</button>
                      <button onClick={() => handleDelete(s)}
                        className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">{editing ? "Edit Staff" : "Add Staff"}</h3>
            {[
              { label: "Name *", key: "name", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Duty Description", key: "dutyDescription", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-neutral-400 mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Staff Type *</label>
              <select value={form.staffType} onChange={e => setForm(p => ({ ...p, staffType: e.target.value }))}
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
                {STAFF_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Shift</label>
              <select value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
                {SHIFTS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-neutral-400 hover:bg-white/5">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex-1 rounded-xl bg-[#fa4715] py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
