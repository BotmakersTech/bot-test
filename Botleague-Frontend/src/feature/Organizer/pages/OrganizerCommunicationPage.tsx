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

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-2 text-2xl font-bold text-red-500">Communication</h1>
      <p className="mb-6 text-sm text-neutral-400">Broadcast announcements and manage your event chat room.</p>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${toast.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {toast.message}
        </div>
      )}

      {/* Event selector */}
      <div className="mb-6">
        <label className="mb-1 block text-xs text-neutral-500">Event</label>
        <select
          value={selectedEventId}
          onChange={e => { setSelectedEventId(e.target.value); setChatRoomId(null); }}
          className="w-full max-w-sm rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast form */}
        <div className="rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
          <h2 className="mb-4 text-lg font-semibold text-white">Broadcast Announcement</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Sends a push notification to all teams registered in{" "}
            <span className="text-neutral-300">{selectedEvent?.eventName ?? "the selected event"}</span>.
          </p>
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Title *</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update"
                className="w-full rounded-lg bg-white/6 px-3 py-2 text-sm text-white placeholder-neutral-600 ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Notification message *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Short notification text that teams will receive…"
                className="w-full rounded-lg bg-white/6 px-3 py-2 text-sm text-white placeholder-neutral-600 ring-1 ring-white/10 focus:outline-none focus:ring-red-500 resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Chat room message (optional)</label>
              <textarea
                rows={2}
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder="Also post this in the event announcement room…"
                className="w-full rounded-lg bg-white/6 px-3 py-2 text-sm text-white placeholder-neutral-600 ring-1 ring-white/10 focus:outline-none focus:ring-red-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !selectedEventId}
              className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Announcement"}
            </button>
          </form>
        </div>

        {/* Chat room panel */}
        <div className="rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
          <h2 className="mb-4 text-lg font-semibold text-white">Event Announcement Room</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Creates a shared chat room for this event where you can post updates directly to team members.
          </p>
          {chatRoomId ? (
            <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-400">
              Chat room active — Room ID: <span className="font-mono text-xs">{chatRoomId}</span>
              <p className="mt-2 text-xs text-green-500/70">
                Open your Messages inbox to start chatting with registered teams.
              </p>
            </div>
          ) : (
            <button
              onClick={handleOpenChat}
              disabled={chatLoading || !selectedEventId}
              className="w-full rounded-lg bg-white/8 py-2 text-sm font-medium text-white hover:bg-white/12 transition-colors disabled:opacity-50"
            >
              {chatLoading ? "Creating…" : "Open / Create Chat Room"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
