import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  broadcastAnnouncement,
  ensureEventChatRoom,
  type OrganizerEvent,
} from "../api/organizer.api";

interface Toast { message: string; type: "success" | "error" }

export default function OrganizerCommunicationPage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents]           = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");
  const [eventsLoading, setEventsLoading] = useState(true);

  const [title, setTitle]           = useState("");
  const [message, setMessage]       = useState("");
  const [chatMsg, setChatMsg]       = useState("");
  const [sending, setSending]       = useState(false);
  const [toast, setToast]           = useState<Toast | null>(null);

  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    getMyEvents()
      .then(e => {
        setEvents(e);
        if (!preselectedEventId && e.length > 0) setSelectedEventId(e[0].id);
      })
      .finally(() => setEventsLoading(false));
  }, [preselectedEventId]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId) return;
    setSending(true);
    try {
      await broadcastAnnouncement(selectedEventId, {
        title,
        message,
        chatMessage: chatMsg || undefined,
      });
      showToast("Announcement sent to all registered teams.", "success");
      setTitle(""); setMessage(""); setChatMsg("");
    } catch {
      showToast("Failed to send announcement.", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleOpenChat() {
    if (!selectedEventId) return;
    setChatLoading(true);
    try {
      const roomId = await ensureEventChatRoom(selectedEventId);
      setChatRoomId(roomId);
    } catch {
      showToast("Failed to create chat room.", "error");
    } finally {
      setChatLoading(false);
    }
  }

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-[#5d5d5d]">Loading…</div>;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen p-6 text-[#111111]">
      <h1 className="mb-2 text-2xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Communication</h1>
      <p className="mb-6 text-sm text-[#5d5d5d]">Broadcast announcements and manage your event chat room.</p>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${toast.type === "success" ? "bg-[#1fa952]/10 text-[#1fa952]" : "bg-[#e04b4b]/10 text-[#e04b4b]"}`}>
          {toast.message}
        </div>
      )}

      {/* Event selector */}
      <div className="mb-6">
        <label className="mb-1 block text-xs text-[#5d5d5d] font-semibold">Event</label>
        <select
          value={selectedEventId}
          onChange={e => { setSelectedEventId(e.target.value); setChatRoomId(null); }}
          className="w-full max-w-sm rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast form */}
        <div className="rounded-xl bg-white/90 p-5 ring-1 ring-[#4b86e8]/25 border border-[#4b86e8]/25">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Broadcast Announcement</h2>
          <p className="mb-4 text-xs text-[#5d5d5d]">
            Sends a push notification to all teams registered in{" "}
            <span className="text-[#3567cf] font-medium">{selectedEvent?.eventName ?? "the selected event"}</span>.
          </p>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-[#5d5d5d] font-semibold">Title *</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update"
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] placeholder-[#9a9a9a] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#5d5d5d] font-semibold">Notification message *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Short notification text that teams will receive…"
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] placeholder-[#9a9a9a] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff] resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#5d5d5d] font-semibold">Chat room message (optional)</label>
              <textarea
                rows={2}
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder="Also post this in the event announcement room…"
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] placeholder-[#9a9a9a] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !selectedEventId}
              className="w-full rounded-lg bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Announcement"}
            </button>
          </form>
        </div>

        {/* Chat room panel */}
        <div className="rounded-xl bg-white/90 p-5 ring-1 ring-[#4b86e8]/25 border border-[#4b86e8]/25">
          <h2 className="mb-4 text-lg font-semibold text-[#111111]">Event Announcement Room</h2>
          <p className="mb-4 text-xs text-[#5d5d5d]">
            Creates a shared chat room for this event where you can post updates directly to team members.
          </p>
          {chatRoomId ? (
            <div className="rounded-lg bg-[#1fa952]/10 p-4 text-sm text-[#1fa952]">
              Chat room active — Room ID: <span className="font-mono text-xs">{chatRoomId}</span>
              <p className="mt-2 text-xs text-[#1fa952]/80">
                Open your Messages inbox to start chatting with registered teams.
              </p>
            </div>
          ) : (
            <button
              onClick={handleOpenChat}
              disabled={chatLoading || !selectedEventId}
              className="w-full rounded-lg bg-[#4b86e8]/10 py-2 text-sm font-medium text-[#3567cf] hover:bg-[#4b86e8]/15 transition-colors disabled:opacity-50"
            >
              {chatLoading ? "Creating…" : "Open / Create Chat Room"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
