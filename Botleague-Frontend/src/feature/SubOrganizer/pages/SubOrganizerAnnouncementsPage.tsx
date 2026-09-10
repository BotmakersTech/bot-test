import { useEffect, useState } from "react"
import { getMySports, getMyEvents, broadcastAnnouncement, ensureEventChatRoom, type OrganizerSport } from "../../Organizer/api/organizer.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import "../../../styles/organizerTheme.css"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const inputClass = "w-full rounded-xl bg-white border px-4 py-2.5 text-sm text-[#374151] placeholder-gray-400 outline-none"
const inputStyle = { borderColor: "rgba(75,134,232,0.3)" }

export default function SubOrganizerAnnouncementsPage() {
  const [sports, setSports] = useState<OrganizerSport[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [chatMsg, setChatMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [chatRoomId, setChatRoomId] = useState<string | null>(null)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMySports(), getMyEvents()])
      .then(([sportsData, eventsData]) => {
        setSports(sportsData)
        // Only offer events the sports list actually references, but label
        // them with their real event name (not a truncated UUID).
        const assignedEventIds = new Set(sportsData.map((sp) => sp.eventId).filter(Boolean))
        const evList = eventsData
          .filter((ev) => assignedEventIds.has(ev.id))
          .map((ev) => ({ id: ev.id, name: ev.eventName }))
        setEvents(evList)
        if (evList.length > 0) setSelectedEventId(evList[0].id)
      })
      .catch(() => setError("Failed to load your assigned sports"))
      .finally(() => setLoading(false))
  }, [])

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 4000)
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !title.trim() || !message.trim()) return
    setSending(true)
    setError(null)
    try {
      await broadcastAnnouncement(selectedEventId, {
        title: title.trim(),
        message: message.trim(),
        chatMessage: chatMsg.trim() || undefined,
      })
      flash("Announcement broadcast to all registered teams.")
      setTitle("")
      setMessage("")
      setChatMsg("")
    } catch {
      setError("Failed to send announcement.")
    } finally {
      setSending(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!selectedEventId) return
    setCreatingRoom(true)
    setError(null)
    try {
      const id = await ensureEventChatRoom(selectedEventId)
      setChatRoomId(id)
      flash("Techfest chat room created (or already exists).")
    } catch {
      setError("Failed to create chat room.")
    } finally {
      setCreatingRoom(false)
    }
  }

  const sportsForEvent = sports.filter((sp) => sp.eventId === selectedEventId)

  return (
    <div className="org-page-bg p-8">
      <div className="mb-6">
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">Announcements</h1>
        <p className="text-gray-400 text-sm mt-1">Broadcast messages to teams in your assigned techfests</p>
      </div>

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-600">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : sports.length === 0 ? (
        <div className="rounded-xl bg-white border p-8 text-center text-gray-400" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          No sports are assigned to you yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Broadcast form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border p-6" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
              <h2 className="font-semibold text-[#374151] mb-4">Broadcast Announcement</h2>

              {/* Event selector */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1.5">Target Techfest</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
                {sportsForEvent.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Your sports: {sportsForEvent.map((sp) => toLabel(sp.sport)).join(", ")}
                  </p>
                )}
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Announcement Title *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule Change — Round 2"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Notification Message *</label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="All teams: please report to Arena B by 2:00 PM…"
                    className={`${inputClass} resize-none`}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Chat Message <span className="text-gray-400">(optional)</span></label>
                  <input
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    placeholder="Also posted to the techfest chat room…"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={sending || !title.trim() || !message.trim()}
                    className="rounded-xl disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
                    style={{ background: ORG.gradientCta }}
                  >
                    {sending ? "Sending…" : "Broadcast to All Teams"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Chat room */}
          <div>
            <div className="rounded-2xl bg-white border p-6" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
              <h2 className="font-semibold text-[#374151] mb-2">Techfest Chat Room</h2>
              <p className="text-xs text-gray-400 mb-4">
                Create a shared chat room for real-time communication with all event participants.
              </p>
              {chatRoomId ? (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                  Chat room active
                  <p className="font-mono text-xs text-green-700 mt-0.5">{chatRoomId}</p>
                </div>
              ) : (
                <button
                  onClick={handleCreateRoom}
                  disabled={creatingRoom || !selectedEventId}
                  className="w-full rounded-xl bg-[#f8f9ff] hover:bg-[#eef2ff] border disabled:opacity-40 px-4 py-3 text-sm font-semibold text-[#374151] transition"
                  style={{ borderColor: "rgba(75,134,232,0.2)" }}
                >
                  {creatingRoom ? "Creating…" : "Create / Open Chat Room"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
