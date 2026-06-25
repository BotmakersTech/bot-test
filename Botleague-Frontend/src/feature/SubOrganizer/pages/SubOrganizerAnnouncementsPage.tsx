import { useEffect, useState } from "react"
import { getMySports, broadcastAnnouncement, ensureEventChatRoom, type OrganizerSport } from "../../Organizer/api/organizer.api"

function toLabel(raw?: string | null) {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

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
    getMySports()
      .then((data) => {
        setSports(data)
        // Derive unique events from sports list
        const evMap = new Map<string, string>()
        data.forEach((sp) => {
          if (sp.eventId && !evMap.has(sp.eventId)) {
            evMap.set(sp.eventId, sp.sport)
          }
        })
        const evList = Array.from(evMap.entries()).map(([id, name]) => ({ id, name }))
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
      flash("Event chat room created (or already exists).")
    } catch {
      setError("Failed to create chat room.")
    } finally {
      setCreatingRoom(false)
    }
  }

  const sportsForEvent = sports.filter((sp) => sp.eventId === selectedEventId)

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-gray-400 text-sm mt-1">Broadcast messages to teams in your assigned events</p>
      </div>

      {success && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : sports.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-gray-500">
          No sports are assigned to you yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Broadcast form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-4">Broadcast Announcement</h2>

              {/* Event selector */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1.5">Target Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>Event: {ev.id.slice(0, 8)}</option>
                  ))}
                </select>
                {sportsForEvent.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Your sports: {sportsForEvent.map((sp) => toLabel(sp.sport)).join(", ")}
                  </p>
                )}
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Announcement Title *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule Change — Round 2"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Notification Message *</label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="All teams: please report to Arena B by 2:00 PM…"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Chat Message <span className="text-gray-600">(optional)</span></label>
                  <input
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    placeholder="Also posted to the event chat room…"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={sending || !title.trim() || !message.trim()}
                    className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
                  >
                    {sending ? "Sending…" : "Broadcast to All Teams"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Chat room */}
          <div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-2">Event Chat Room</h2>
              <p className="text-xs text-gray-500 mb-4">
                Create a shared chat room for real-time communication with all event participants.
              </p>
              {chatRoomId ? (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                  Chat room active
                  <p className="font-mono text-xs text-green-600 mt-0.5">{chatRoomId}</p>
                </div>
              ) : (
                <button
                  onClick={handleCreateRoom}
                  disabled={creatingRoom || !selectedEventId}
                  className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 px-4 py-3 text-sm font-semibold text-white transition"
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
