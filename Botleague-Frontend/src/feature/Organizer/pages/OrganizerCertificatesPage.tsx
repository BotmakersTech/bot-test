import { useEffect, useState } from "react"
import {
  getMyEvents, getCertificates, issueCertificate, deleteCertificate, getMySports,
  type OrganizerEvent, type OrganizerSport, type Certificate, type CertificateRequest,
} from "../api/organizer.api"

const CERT_TYPES = ["PARTICIPATION", "WINNER", "FINALIST", "JUDGE", "VOLUNTEER"]
const POSITIONS: Record<number, string> = { 1: "🥇 Gold", 2: "🥈 Silver", 3: "🥉 Bronze" }

const TYPE_COLORS: Record<string, string> = {
  WINNER:        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  FINALIST:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PARTICIPATION: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  JUDGE:         "bg-purple-500/10 text-purple-400 border-purple-500/20",
  VOLUNTEER:     "bg-green-500/10 text-green-400 border-green-500/20",
}

const EMPTY: CertificateRequest = { recipientName: "", certificateType: "PARTICIPATION", teamName: "", sportName: "" }

export default function OrganizerCertificatesPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [certs, setCerts] = useState<Certificate[]>([])
  const [filter, setFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CertificateRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getMyEvents(), getMySports()]).then(([ev, sp]) => {
      setEvents(ev); setSports(sp)
      if (ev.length) setSelectedEventId(ev[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    getCertificates(selectedEventId).then(setCerts).catch(() => setError("Failed to load")).finally(() => setLoading(false))
  }, [selectedEventId])

  const refresh = () => { if (selectedEventId) getCertificates(selectedEventId).then(setCerts).catch(() => {}) }

  const handleIssue = async () => {
    if (!selectedEventId || !form.recipientName.trim()) return
    setSaving(true)
    try {
      await issueCertificate(selectedEventId, form)
      setShowForm(false); setForm(EMPTY); refresh()
    } catch { setError("Failed to issue certificate") } finally { setSaving(false) }
  }

  const handleDelete = (c: Certificate) => {
    if (!confirm(`Revoke certificate for ${c.recipientName}?`)) return
    deleteCertificate(selectedEventId, c.id).then(refresh)
  }

  const eventSports = sports.filter(s => s.eventId === selectedEventId)

  const visible = certs.filter(c => {
    const matchType   = typeFilter === "ALL" || c.certificateType === typeFilter
    const matchFilter = !filter || c.recipientName.toLowerCase().includes(filter.toLowerCase())
        || (c.teamName ?? "").toLowerCase().includes(filter.toLowerCase())
    return matchType && matchFilter
  })

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"

  return (
    <div className="min-h-full p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Certificates</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Issue and manage participation and achievement certificates</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          className="rounded-xl bg-[#fa4715] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e03d0f] transition-colors">
          + Issue Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {["WINNER","FINALIST","PARTICIPATION","JUDGE","VOLUNTEER"].map(t => (
          <div key={t} className={`rounded-2xl border p-4 ${TYPE_COLORS[t]}`}>
            <div className="text-2xl font-bold">{certs.filter(c => c.certificateType === t).length}</div>
            <div className="text-[10px] font-semibold mt-1 opacity-70">{t.charAt(0) + t.slice(1).toLowerCase()}</div>
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
          {CERT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
        </select>
        <input type="text" placeholder="Search recipient or team…" value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none flex-1 min-w-48" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No certificates issued yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(c => (
            <div key={c.id} className={`rounded-2xl border p-4 space-y-2 ${TYPE_COLORS[c.certificateType] ?? "border-white/10 bg-[#0e0e10]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{c.recipientName}</div>
                  {c.teamName && <div className="text-xs opacity-70">{c.teamName}</div>}
                </div>
                <span className="text-[10px] font-bold uppercase opacity-80 shrink-0">
                  {c.certificateType.replace(/_/g, " ")}
                </span>
              </div>
              {c.position && (
                <div className="text-xs font-semibold">{POSITIONS[c.position] ?? `#${c.position}`}</div>
              )}
              {c.sportName && <div className="text-xs opacity-60">{c.sportName}</div>}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs opacity-50">Issued {fmt(c.issuedAt)}</span>
                <div className="flex gap-2">
                  {c.pdfUrl && (
                    <a href={c.pdfUrl} target="_blank" rel="noreferrer"
                      className="rounded-lg bg-black/20 px-2.5 py-1 text-xs hover:bg-black/30">
                      Download
                    </a>
                  )}
                  <button onClick={() => handleDelete(c)}
                    className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/30">
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Issue Certificate</h3>
            {[
              { label: "Recipient Name *", key: "recipientName", type: "text" },
              { label: "Team Name", key: "teamName", type: "text" },
              { label: "Sport Name", key: "sportName", type: "text" },
              { label: "PDF URL", key: "pdfUrl", type: "url" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-neutral-400 mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Certificate Type *</label>
              <select value={form.certificateType}
                onChange={e => setForm(p => ({ ...p, certificateType: e.target.value }))}
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
                {CERT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            {(form.certificateType === "WINNER" || form.certificateType === "FINALIST") && (
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Position</label>
                <select value={form.position ?? ""}
                  onChange={e => setForm(p => ({ ...p, position: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
                  <option value="">— None —</option>
                  <option value="1">Gold (1st)</option>
                  <option value="2">Silver (2nd)</option>
                  <option value="3">Bronze (3rd)</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Sport</label>
              <select value={form.sportId ?? ""}
                onChange={e => setForm(p => ({ ...p, sportId: e.target.value || undefined }))}
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none">
                <option value="">— None —</option>
                {eventSports.map(s => <option key={s.id} value={s.id}>{s.sport.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-neutral-400 hover:bg-white/5">Cancel</button>
              <button onClick={handleIssue} disabled={saving || !form.recipientName.trim()}
                className="flex-1 rounded-xl bg-[#fa4715] py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Issuing…" : "Issue Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
