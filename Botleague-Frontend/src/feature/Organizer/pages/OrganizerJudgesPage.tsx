import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getMyEvents, getJudges, createJudge, updateJudge, deleteJudge,
  getMySports,
  type OrganizerEvent, type OrganizerSport, type Judge, type JudgeRequest,
} from "../api/organizer.api"

const EMPTY: JudgeRequest = { name: "", email: "", phone: "", credentials: "", assignedArena: "", scoringRights: true, notes: "" }

export default function OrganizerJudgesPage() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get("eventId") ?? "")
  const [judges, setJudges] = useState<Judge[]>([])
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Judge | null>(null)
  const [form, setForm] = useState<JudgeRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getMyEvents(), getMySports()]).then(([ev, sp]) => {
      setEvents(ev)
      setSports(sp)
      if (!selectedEventId && ev.length) setSelectedEventId(ev[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getJudges(selectedEventId).then(setJudges).catch(() => setError("Failed to load judges")).finally(() => setLoading(false))
  }, [selectedEventId])

  const refresh = () => { if (selectedEventId) getJudges(selectedEventId).then(setJudges).catch(() => {}) }
  const eventSports = sports.filter(s => s.eventId === selectedEventId)

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (j: Judge) => {
    setEditing(j)
    setForm({ name: j.name, email: j.email ?? "", phone: j.phone ?? "",
      credentials: j.credentials ?? "", assignedSportId: j.assignedSportId ?? undefined,
      assignedArena: j.assignedArena ?? "", scoringRights: j.scoringRights, notes: j.notes ?? "" })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!selectedEventId || !form.name.trim()) return
    setSaving(true)
    try {
      if (editing) await updateJudge(selectedEventId, editing.id, form)
      else await createJudge(selectedEventId, form)
      setShowForm(false); refresh()
    } catch { setError("Save failed") } finally { setSaving(false) }
  }

  const handleDelete = (j: Judge) => {
    if (!confirm(`Remove judge ${j.name}?`)) return
    deleteJudge(selectedEventId, j.id).then(refresh)
  }

  const visible = filter
    ? judges.filter(j => j.name.toLowerCase().includes(filter.toLowerCase())
        || (j.assignedArena ?? "").toLowerCase().includes(filter.toLowerCase()))
    : judges

  const sportName = (id?: string | null) => sports.find(s => s.id === id)?.sport?.replace(/_/g, " ") ?? "—"

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Judge Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Assign judges to sports and arenas</p>
        </div>
        <button onClick={openAdd}
          className="rounded-xl bg-[#fa4715] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e03d0f] transition-colors">
          + Add Judge
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Judges", value: judges.length, color: "text-white" },
          { label: "With Scoring Rights", value: judges.filter(j => j.scoringRights).length, color: "text-green-400" },
          { label: "Assigned to Sport", value: judges.filter(j => j.assignedSportId).length, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
        <input type="text" placeholder="Search judge or arena…" value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none flex-1 min-w-48" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No judges added yet.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#fa4715] hover:underline">Add your first judge →</button>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-left text-[11px] text-neutral-500 uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Assigned Sport</th>
                <th className="px-4 py-3">Arena</th>
                <th className="px-4 py-3">Scoring Rights</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(j => (
                <tr key={j.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{j.name}</div>
                    {j.credentials && <div className="text-xs text-neutral-500 mt-0.5">{j.credentials}</div>}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">
                    {j.email && <div>{j.email}</div>}
                    {j.phone && <div>{j.phone}</div>}
                    {!j.email && !j.phone && "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{sportName(j.assignedSportId)}</td>
                  <td className="px-4 py-3 text-neutral-300">{j.assignedArena || "—"}</td>
                  <td className="px-4 py-3">
                    {j.scoringRights
                      ? <span className="text-xs font-semibold text-green-400">YES</span>
                      : <span className="text-xs text-neutral-500">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(j)}
                        className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-neutral-300 hover:bg-white/10 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(j)}
                        className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors">
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">{editing ? "Edit Judge" : "Add Judge"}</h3>
            {[
              { label: "Name *", key: "name", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Credentials", key: "credentials", type: "text" },
              { label: "Assigned Arena", key: "assignedArena", type: "text" },
              { label: "Notes", key: "notes", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-neutral-400 mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Assigned Sport</label>
              <select value={form.assignedSportId ?? ""}
                onChange={e => setForm(p => ({ ...p, assignedSportId: e.target.value || undefined }))}
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
                <option value="">— None —</option>
                {eventSports.map(s => <option key={s.id} value={s.id}>{s.sport.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="scoring" checked={form.scoringRights !== false}
                onChange={e => setForm(p => ({ ...p, scoringRights: e.target.checked }))}
                className="accent-[#fa4715]" />
              <label htmlFor="scoring" className="text-sm text-neutral-300">Scoring Rights</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-neutral-400 hover:bg-white/5">
                Cancel
              </button>
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
