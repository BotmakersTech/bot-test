import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  broadcastAnnouncement,
  ensureEventChatRoom,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  type OrganizerEvent,
  type Announcement,
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

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    getMyEvents()
      .then(e => {
        setEvents(e);
        if (!preselectedEventId && e.length > 0) setSelectedEventId(e[0].id);
      })
      .finally(() => setEventsLoading(false));
  }, [preselectedEventId]);

  const refreshAnnouncements = () => {
    if (!selectedEventId) return;
    setAnnouncementsLoading(true);
    getAnnouncements(selectedEventId)
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setAnnouncementsLoading(false));
  };

  useEffect(() => {
    refreshAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

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
      refreshAnnouncements();
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

  async function handleTogglePin(a: Announcement) {
    try {
      await updateAnnouncement(selectedEventId, a.id, { title: a.title, body: a.body, isPinned: !a.isPinned });
      refreshAnnouncements();
    } catch {
      showToast("Failed to update announcement.", "error");
    }
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setEditTitle(a.title);
    setEditBody(a.body);
  }

  async function handleSaveEdit() {
    if (!editing || !editTitle.trim() || !editBody.trim()) return;
    setSavingEdit(true);
    try {
      await updateAnnouncement(selectedEventId, editing.id, { title: editTitle, body: editBody, isPinned: editing.isPinned });
      setEditing(null);
      refreshAnnouncements();
    } catch {
      showToast("Failed to save changes.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  function handleDeleteAnnouncement(a: Announcement) {
    if (!confirm(`Delete announcement "${a.title}"?`)) return;
    deleteAnnouncement(selectedEventId, a.id).then(refreshAnnouncements).catch(() => showToast("Failed to delete announcement.", "error"));
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

      {/* Announcement history */}
      <div className="mt-6 rounded-xl bg-white/90 p-5 ring-1 ring-[#4b86e8]/25 border border-[#4b86e8]/25">
        <h2 className="mb-4 text-lg font-semibold text-[#111111]">Recent Announcements</h2>
        {announcementsLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-[#4b86e8]/8" />)}</div>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-[#5d5d5d]">No announcements sent yet.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="rounded-xl border border-[#4b86e8]/20 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.isPinned && <span className="text-xs">📌</span>}
                      <span className="font-medium text-sm text-[#111111]">{a.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#5d5d5d]">{a.body}</p>
                    <p className="mt-1 text-[10px] text-[#9a9a9a]">
                      {a.sentAt ? new Date(a.sentAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => handleTogglePin(a)}
                      className="rounded-lg bg-[#4b86e8]/10 px-2.5 py-1 text-xs text-[#3567cf] hover:bg-[#4b86e8]/20">
                      {a.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={() => openEdit(a)}
                      className="rounded-lg bg-[#4b86e8]/10 px-2.5 py-1 text-xs text-[#3567cf] hover:bg-[#4b86e8]/20">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteAnnouncement(a)}
                      className="rounded-lg bg-[#e04b4b]/10 px-2.5 py-1 text-xs text-[#e04b4b] hover:bg-[#e04b4b]/20">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#4b86e8]/30 bg-white p-6 space-y-4">
            <h3 className="text-base font-bold text-[#111111]">Edit Announcement</h3>
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#5d5d5d] mb-1 block font-semibold">Message</label>
              <textarea rows={3} value={editBody} onChange={e => setEditBody(e.target.value)}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 rounded-xl border border-[#4b86e8]/30 py-2 text-sm text-[#5d5d5d] hover:bg-[#4b86e8]/5">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit || !editTitle.trim() || !editBody.trim()}
                className="flex-1 rounded-xl bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] py-2 text-sm font-semibold text-white disabled:opacity-50">
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
