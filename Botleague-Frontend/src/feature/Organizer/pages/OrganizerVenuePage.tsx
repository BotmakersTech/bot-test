import { useEffect, useState } from "react"
import { getMyEvents, getVenueDetail, upsertVenueDetail, getArenas, createArena, deleteArena,
  type OrganizerEvent, type VenueDetail, type Arena } from "../api/organizer.api"

interface ChecklistItem { item: string; done: boolean }

function parseChecklist(json?: string | null): ChecklistItem[] {
  try { return json ? JSON.parse(json) : defaultChecklist() } catch { return defaultChecklist() }
}
function defaultChecklist(): ChecklistItem[] {
  return [
    "Setup registration desks",
    "Confirm arena boundaries",
    "Test power supply",
    "Check internet connectivity",
    "Brief medical team",
    "Place emergency signage",
    "Confirm parking marshals",
    "Test PA system",
  ].map(item => ({ item, done: false }))
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-linear-to-br from-[#4c8ee7] to-[#8c6cff]" : "bg-[#4b86e8]/15"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  )
}

export default function OrganizerVenuePage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [venue, setVenue] = useState<VenueDetail | null>(null)
  const [arenas, setArenas] = useState<Arena[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newArenaName, setNewArenaName] = useState("")
  const [addingArena, setAddingArena] = useState(false)

  useEffect(() => {
    getMyEvents().then(e => { setEvents(e); if (e.length) setSelectedEventId(e[0].id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    Promise.all([getVenueDetail(selectedEventId), getArenas(selectedEventId)])
      .then(([v, a]) => {
        setVenue(v)
        setArenas(a)
        setChecklist(parseChecklist(v.checklistJson))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedEventId])

  const setFlag = (key: keyof VenueDetail, val: boolean) => {
    setVenue(prev => prev ? { ...prev, [key]: val } : prev)
  }

  const handleSave = async () => {
    if (!selectedEventId || !venue) return
    setSaving(true)
    try {
      const updated = await upsertVenueDetail(selectedEventId, {
        ...venue,
        checklistJson: JSON.stringify(checklist),
      })
      setVenue(updated)
      setChecklist(parseChecklist(updated.checklistJson))
    } catch {} finally { setSaving(false) }
  }

  const toggleCheckItem = (i: number) => {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c))
  }

  const handleAddArena = async () => {
    if (!selectedEventId || !newArenaName.trim()) return
    setAddingArena(true)
    try {
      const a = await createArena(selectedEventId, { arenaName: newArenaName.trim() })
      setArenas(prev => [...prev, a])
      setNewArenaName("")
    } catch {} finally { setAddingArena(false) }
  }

  const handleDeleteArena = async (arenaId: string) => {
    if (!confirm("Remove this arena?")) return
    await deleteArena(selectedEventId, arenaId)
    setArenas(prev => prev.filter(a => a.id !== arenaId))
  }

  const doneCount = checklist.filter(c => c.done).length
  const pct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0

  if (loading) return (
    <div className="p-6 space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-[#4b86e8]/8" />)}
    </div>
  )

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Venue &amp; Logistics</h1>
          <p className="text-sm text-[#5d5d5d] mt-0.5">Facilities, arenas, and readiness checklist</p>
        </div>
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none">
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Facility Flags ── */}
        <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#111111]">Facility Status</h2>
          {[
            { key: "hasPower",           label: "Power Supply" },
            { key: "hasInternet",         label: "Internet Connectivity" },
            { key: "hasMedicalFacility",  label: "Medical Facility" },
            { key: "safetyCompliant",     label: "Safety Compliant" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-[#374151]">{label}</span>
              <Toggle
                checked={!!(venue as any)?.[key]}
                onChange={v => setFlag(key as keyof VenueDetail, v)}
              />
            </div>
          ))}
          <div className="pt-2 space-y-3">
            {[
              { label: "Arena Count", key: "arenaCount", type: "number" },
              { label: "Seating Capacity", key: "seatingCapacity", type: "number" },
              { label: "Parking Capacity", key: "parkingCapacity", type: "number" },
              { label: "Emergency Contact Name", key: "emergencyContactName", type: "text" },
              { label: "Emergency Contact Phone", key: "emergencyContactPhone", type: "tel" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">{f.label}</label>
                <input type={f.type}
                  value={(venue as any)?.[f.key] ?? ""}
                  onChange={e => setVenue(prev => prev ? { ...prev, [f.key]: f.type === "number" ? Number(e.target.value) || null : e.target.value } : prev)}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none" />
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] py-2 text-sm font-semibold text-white disabled:opacity-50 mt-2">
            {saving ? "Saving…" : "Save Venue Details"}
          </button>
        </div>

        {/* ── Readiness Checklist ── */}
        <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111111]">Readiness Checklist</h2>
            <span className="text-xs font-semibold text-[#4c8ee7]">{pct}% complete</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-[#4b86e8]/10 overflow-hidden">
            <div className="h-full rounded-full bg-linear-to-r from-[#4c8ee7] to-[#8c6cff] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {checklist.map((c, i) => (
              <button key={i} onClick={() => toggleCheckItem(i)}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#4b86e8]/5 transition-colors">
                <span className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${c.done ? "border-[#4c8ee7] bg-linear-to-br from-[#4c8ee7] to-[#8c6cff]" : "border-[#4b86e8]/30"}`}>
                  {c.done && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 10">
                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>}
                </span>
                <span className={`text-sm ${c.done ? "text-[#9a9a9a] line-through" : "text-[#374151]"}`}>{c.item}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#9a9a9a]">{doneCount} of {checklist.length} items completed</p>
        </div>
      </div>

      {/* ── Arenas ── */}
      <div className="rounded-2xl border border-[#4b86e8]/25 bg-white/90 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#111111]">Arenas</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="Arena name…" value={newArenaName}
            onChange={e => setNewArenaName(e.target.value)}
            className="flex-1 rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none" />
          <button onClick={handleAddArena} disabled={addingArena || !newArenaName.trim()}
            className="rounded-lg bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Add Arena
          </button>
        </div>
        {arenas.length === 0 ? (
          <p className="text-sm text-[#5d5d5d]">No arenas added yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {arenas.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-[#4b86e8]/25 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111111]">{a.arenaName}</p>
                  {a.capacity && <p className="text-xs text-[#5d5d5d]">Capacity: {a.capacity}</p>}
                  {a.sportType && <p className="text-xs text-[#5d5d5d]">{a.sportType}</p>}
                </div>
                <button onClick={() => handleDeleteArena(a.id)}
                  className="rounded-lg bg-[#e04b4b]/10 px-2 py-1 text-xs text-[#e04b4b] hover:bg-[#e04b4b]/20 ml-3">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
