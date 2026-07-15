import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getMyEvents, getIncidents, createIncident, updateIncident, deleteIncident,
  type OrganizerEvent, type Incident, type IncidentRequest,
} from "../api/organizer.api"

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]

const SEVERITY_COLORS: Record<string, string> = {
  LOW:      "bg-[#4c8ee7]/10 text-[#3567cf]",
  MEDIUM:   "bg-[#eab308]/10 text-[#a16207]",
  HIGH:     "bg-[#e04b4b]/10 text-[#e04b4b]",
  CRITICAL: "bg-[#e04b4b]/20 text-[#e04b4b]",
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:        "bg-[#e04b4b]/10 text-[#e04b4b]",
  IN_PROGRESS: "bg-[#eab308]/10 text-[#a16207]",
  RESOLVED:    "bg-[#1fa952]/10 text-[#1fa952]",
  CLOSED:      "bg-[#4b86e8]/8 text-[#5d5d5d]",
}

const EMPTY: IncidentRequest = { title: "", description: "", severity: "MEDIUM", arenaName: "" }

export default function OrganizerIncidentsPage() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get("eventId") ?? "")
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<IncidentRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyEvents().then(e => { setEvents(e); if (!selectedEventId && e.length) setSelectedEventId(e[0].id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getIncidents(selectedEventId).then(setIncidents).catch(() => setError("Failed to load incidents")).finally(() => setLoading(false))
  }, [selectedEventId])

  const refresh = () => { if (selectedEventId) getIncidents(selectedEventId).then(setIncidents).catch(() => {}) }

  const openAdd = () => { setForm(EMPTY); setShowForm(true) }

  const handleSave = async () => {
    if (!selectedEventId || !form.title.trim()) return
    setSaving(true)
    try {
      await createIncident(selectedEventId, form)
      setShowForm(false); refresh()
    } catch { setError("Failed to report incident") } finally { setSaving(false) }
  }

  const handleStatusChange = async (inc: Incident, status: string) => {
    let resolutionNotes: string | undefined
    if (status === "RESOLVED") {
      resolutionNotes = window.prompt("Resolution notes (optional):") ?? undefined
    }
    try {
      await updateIncident(selectedEventId, inc.id, { status, resolutionNotes })
      refresh()
    } catch { setError("Failed to update incident status") }
  }

  const handleDelete = (inc: Incident) => {
    if (!confirm(`Delete incident "${inc.title}"?`)) return
    deleteIncident(selectedEventId, inc.id).then(refresh).catch(() => setError("Failed to delete incident"))
  }

  const visible = incidents.filter(i => statusFilter === "ALL" || i.status === statusFilter)
  const openCount = incidents.filter(i => i.status === "OPEN" || i.status === "IN_PROGRESS").length

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Incident Reporting</h1>
          <p className="text-sm text-[#5d5d5d] mt-0.5">Safety and operational incidents for this event</p>
        </div>
        <button onClick={openAdd}
          className="rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          + Report Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-4">
          <div className="text-2xl font-bold text-[#e04b4b]">{openCount}</div>
          <div className="text-xs text-[#5d5d5d] mt-1">Open / In Progress</div>
        </div>
        {STATUSES.map(s => (
          <div key={s} className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-4">
            <div className="text-2xl font-bold text-[#111111]">{incidents.filter(i => i.status === s).length}</div>
            <div className="text-xs text-[#5d5d5d] mt-1">{s.replace("_", " ")}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
          <option value="ALL">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {error && <p className="text-[#e04b4b] text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-[#4b86e8]/8" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#5d5d5d] text-sm">No incidents reported.</p>
          <button onClick={openAdd} className="mt-3 text-xs text-[#4c8ee7] hover:underline">Report an incident →</button>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-[#4b86e8]/25">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#4b86e8]/20 text-left text-[11px] text-[#5d5d5d] uppercase tracking-wide">
                <th className="px-4 py-3">Incident</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Arena</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(inc => (
                <tr key={inc.id} className="border-b border-[#4b86e8]/10 bg-white/60 hover:bg-white transition-colors align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#111111]">{inc.title}</div>
                    {inc.description && <div className="text-xs text-[#5d5d5d] max-w-[260px]">{inc.description}</div>}
                    {inc.resolutionNotes && <div className="text-xs text-[#1fa952] mt-1">Resolution: {inc.resolutionNotes}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SEVERITY_COLORS[inc.severity] ?? "bg-[#4b86e8]/8 text-[#5d5d5d]"}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5d5d5d] text-xs">{inc.arenaName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[inc.status] ?? "bg-[#4b86e8]/8 text-[#5d5d5d]"}`}>
                      {inc.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5d5d5d] text-xs">{fmt(inc.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {inc.status === "OPEN" && (
                        <button onClick={() => handleStatusChange(inc, "IN_PROGRESS")}
                          className="rounded-lg bg-[#eab308]/10 px-2.5 py-1 text-xs font-semibold text-[#a16207] hover:bg-[#eab308]/20">Start Work</button>
                      )}
                      {(inc.status === "OPEN" || inc.status === "IN_PROGRESS") && (
                        <button onClick={() => handleStatusChange(inc, "RESOLVED")}
                          className="rounded-lg bg-[#1fa952]/10 px-2.5 py-1 text-xs font-semibold text-[#1fa952] hover:bg-[#1fa952]/20">Resolve</button>
                      )}
                      {inc.status === "RESOLVED" && (
                        <button onClick={() => handleStatusChange(inc, "CLOSED")}
                          className="rounded-lg bg-[#4b86e8]/10 px-2.5 py-1 text-xs font-semibold text-[#3567cf] hover:bg-[#4b86e8]/20">Close</button>
                      )}
                      <button onClick={() => handleDelete(inc)}
                        className="rounded-lg bg-[#e04b4b]/10 px-2.5 py-1 text-xs text-[#e04b4b] hover:bg-[#e04b4b]/20">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#4b86e8]/30 bg-white p-6 space-y-4">
            <h3 className="text-base font-bold text-[#111111]">Report Incident</h3>
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Title *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Arena B power outage"
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Description</label>
              <textarea rows={3} value={form.description ?? ""}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Arena</label>
              <input type="text" value={form.arenaName ?? ""}
                onChange={e => setForm(p => ({ ...p, arenaName: e.target.value }))}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Severity *</label>
              <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-[#4b86e8]/30 py-2 text-sm text-[#5d5d5d] hover:bg-[#4b86e8]/5">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                className="flex-1 rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : "Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
