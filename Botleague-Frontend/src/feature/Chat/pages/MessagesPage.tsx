import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ChevronDown, Paperclip, Plus, Send, Trash2, UserPlus, X } from "lucide-react";
import { useSelector } from "react-redux";

import { useAppDispatch } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import api from "../../../shared/api/Base";
import "../../../styles/chat.css";
import { addChatMember, getAddableMembers, type AddableMember, type ChatMessage, type ChatRoom } from "../api/chat.api";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import { resolveAvatarSrc } from "../../Profile/constants/avatars";
import {
  deleteChatMessage,
  fetchChatRooms,
  fetchMessages,
  markChatRoomRead,
  selectActiveRoom,
  selectChatLoading,
  selectChatRooms,
  selectMessages,
  selectSendingMessage,
  sendChatMessage,
  setActiveRoom,
} from "../store/chatSlice";

function getAccessToken(): string | null {
  const header = api.defaults.headers.common["Authorization"];
  if (typeof header === "string" && header.startsWith("Bearer ")) return header.substring(7);
  return null;
}

function toUTC(dateString: string): Date {
  if (!dateString) return new Date();
  const s = dateString.trim();
  if (s.endsWith("Z") || s.includes("+") || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  return new Date(`${s}Z`);
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - toUTC(dateString).getTime();
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60) return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

function formatMessageTime(dateString: string): string {
  const d = toUTC(dateString);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return time;
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${date}, ${time}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "BL";
}

function roomTag(room: ChatRoom): string {
  if (room.type === "TEAM") return "Help wanted";
  if (room.type === "DIRECT") return "Question";
  if (room.type === "REGISTRATION" || room.type === "EVENT_TEAM") return "Bug";
  if (room.type.includes("ANNOUNCEMENT")) return "Announcement";
  return "Update";
}

function roomTagClass(room: ChatRoom): string {
  if (room.type === "TEAM") return "chat-tag chat-tag-green";
  if (room.type === "REGISTRATION" || room.type === "EVENT_TEAM") return "chat-tag chat-tag-orange";
  if (room.type.includes("ANNOUNCEMENT")) return "chat-tag chat-tag-blue";
  return "chat-tag chat-tag-warm";
}

function avatarTone(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  return `chat-avatar chat-avatar-${(h % 5) + 1}`;
}

function allRoomsFromList(rooms: ReturnType<typeof selectChatRooms>): ChatRoom[] {
  if (!rooms) return [];
  return [
    ...rooms.directChats,
    ...rooms.teamChats,
    ...rooms.registrationChats,
    ...rooms.announcementChats,
  ];
}

interface MessageGroup {
  key: string;
  isSystem: boolean;
  isMine: boolean;
  senderId: string | null;
  senderName: string;
  senderPhotoUrl: string | null;
  messages: ChatMessage[];
}

function buildGroups(messages: ChatMessage[], currentUserId: string | undefined): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    if (msg.system) {
      groups.push({
        key: msg.id,
        isSystem: true,
        isMine: false,
        senderId: null,
        senderName: "",
        senderPhotoUrl: null,
        messages: [msg],
      });
      continue;
    }

    const isMine = msg.mine || (!!currentUserId && msg.senderId === currentUserId);
    const prev = groups[groups.length - 1];

    if (prev && !prev.isSystem && prev.senderId === msg.senderId) {
      prev.messages.push(msg);
    } else {
      groups.push({
        key: msg.id,
        isSystem: false,
        isMine,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderPhotoUrl: msg.senderPhotoUrl ?? null,
        messages: [msg],
      });
    }
  }
  return groups;
}

function RoomItem({
  room,
  active,
  onClick,
}: {
  room: ChatRoom;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "chat-room chat-room-active" : "chat-room"} onClick={onClick}>
      <span className={avatarTone(room.name)}>{getInitials(room.name)}</span>
      <span className="chat-room-copy">
        <span className="chat-room-top">
          <strong>{room.name}</strong>
          {room.lastMessage && <time>{formatRelativeTime(room.lastMessage.sentAt)}</time>}
        </span>
        <span className="chat-room-message">
          {room.lastMessage ? `${room.lastMessage.mine ? "You: " : ""}${room.lastMessage.content}` : "No messages yet"}
        </span>
        <span className="chat-room-tags">
          <span className={roomTagClass(room)}>{roomTag(room)}</span>
          {room.unreadCount > 0 && <span className="chat-unread">{room.unreadCount > 99 ? "99+" : room.unreadCount}</span>}
        </span>
      </span>
    </button>
  );
}

function BubbleAvatar({ name, photoSrc }: { name: string; photoSrc: string | null }) {
  if (photoSrc) {
    return <img src={photoSrc} alt={name} className="chat-avatar chat-avatar-img" />;
  }
  return <span className={avatarTone(name)}>{getInitials(name)}</span>;
}

function BubbleGroup({ group, onDeleteMessage }: { group: MessageGroup; onDeleteMessage: (messageId: string) => void }) {
  if (group.isSystem) {
    return <div className="chat-system-message">{group.messages[0].content}</div>;
  }

  const photoSrc = resolveAvatarSrc(group.senderPhotoUrl);

  return (
    <div className={group.isMine ? "chat-bubble-group chat-bubble-group-mine" : "chat-bubble-group"}>
      {!group.isMine && <BubbleAvatar name={group.senderName} photoSrc={photoSrc} />}

      <div className="chat-bubble-stack">
        {group.messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: group.isMine ? "flex-end" : "flex-start" }}>
            <div className={group.isMine ? "chat-bubble chat-bubble-mine" : "chat-bubble"} style={{ position: "relative" }}>
              {msg.content}
              {group.isMine && (
                <button
                  type="button"
                  title="Delete message"
                  aria-label="Delete message"
                  onClick={() => {
                    if (confirm("Delete this message for everyone? This cannot be undone.")) {
                      onDeleteMessage(msg.id);
                    }
                  }}
                  style={{
                    position: "absolute", top: "-8px", left: "-8px",
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", opacity: 0, transition: "opacity 0.12s",
                  }}
                  className="chat-bubble-delete"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <span style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "3px", padding: "0 4px" }}>
              {formatMessageTime(msg.sentAt)}
            </span>
          </div>
        ))}
      </div>

      {group.isMine && <BubbleAvatar name={group.senderName || "Me"} photoSrc={photoSrc} />}
    </div>
  );
}

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const rooms = useSelector(selectChatRooms);
  const activeRoomId = useSelector(selectActiveRoom);
  const loading = useSelector(selectChatLoading);
  const sendingMessage = useSelector(selectSendingMessage);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const activeRoomMessages = useSelector(selectMessages(activeRoomId ?? ""));

  const [messageText, setMessageText] = useState("");
  const [query, setQuery] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [addableMembers, setAddableMembers] = useState<AddableMember[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allRooms = useMemo(() => allRoomsFromList(rooms), [rooms]);
  const allRoomIds = allRooms.map((room) => room.id);
  const unreadTotal = allRooms.reduce((sum, room) => sum + room.unreadCount, 0);

  useChatWebSocket(allRoomIds, getAccessToken());

  useEffect(() => {
    dispatch(fetchChatRooms());
  }, [dispatch]);

  useEffect(() => {
    if (!activeRoomId && allRooms.length > 0) {
      dispatch(setActiveRoom(allRooms[0].id));
    }
  }, [activeRoomId, allRooms, dispatch]);

  useEffect(() => {
    if (activeRoomId) {
      dispatch(fetchMessages(activeRoomId)).then(() => dispatch(markChatRoomRead(activeRoomId)));
    }
  }, [activeRoomId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoomMessages]);

  const activeRoom = allRooms.find((room) => room.id === activeRoomId);
  const visibleRooms = allRooms.filter((room) =>
    room.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const groups = buildGroups(activeRoomMessages, currentUserId);

  function handleRoomSelect(roomId: string) {
    dispatch(setActiveRoom(roomId));
    dispatch(markChatRoomRead(roomId));
  }

  function handleTextareaChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setMessageText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  function handleSendMessage() {
    if (!activeRoomId || !messageText.trim()) return;
    const content = messageText.trim();
    setMessageText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    dispatch(sendChatMessage({ roomId: activeRoomId, content }));
  }

  function handleDeleteMessage(messageId: string) {
    if (!activeRoomId) return;
    dispatch(deleteChatMessage({ roomId: activeRoomId, messageId }));
  }

  async function handleOpenAddMember() {
    if (!activeRoomId) return;
    setShowAddMember(true);
    setAddMemberError(null);
    setAddMemberLoading(true);
    try {
      setAddableMembers(await getAddableMembers(activeRoomId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAddMemberError(e?.response?.data?.message ?? "Only the team captain can add members here.");
    } finally {
      setAddMemberLoading(false);
    }
  }

  async function handleAddMember(userId: string) {
    if (!activeRoomId) return;
    try {
      await addChatMember(activeRoomId, userId);
      setAddableMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAddMemberError(e?.response?.data?.message ?? "Failed to add member.");
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="chat-page">
      <aside className="chat-sidebar-panel">
        <div className="chat-panel-header">
          <div className="chat-title-wrap">
            <h1>Chats</h1>
            <ChevronDown size={16} strokeWidth={2.3} />
            <span>{unreadTotal || allRooms.length}</span>
          </div>
          <button type="button" className="chat-add-button" aria-label="Start new chat">
            <Plus size={26} strokeWidth={2.8} />
          </button>
        </div>

        <input
          className="chat-search"
          type="search"
          placeholder="Search messages"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="chat-room-list">
          {loading && !rooms ? (
            <div className="chat-loading">Loading chats...</div>
          ) : visibleRooms.length > 0 ? (
            visibleRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                active={room.id === activeRoomId}
                onClick={() => handleRoomSelect(room.id)}
              />
            ))
          ) : (
            <div className="chat-empty-list">No conversations here yet.</div>
          )}
        </div>
      </aside>

      <main className="chat-thread">
        {activeRoom ? (
          <>
            <header className="chat-thread-header">
              <span className={avatarTone(activeRoom.name)}>{getInitials(activeRoom.name)}</span>
              <div>
                <h2>{activeRoom.name}</h2>
                <p><span /> Online</p>
              </div>
              {activeRoom.type === "EVENT_TEAM" && (
                <button
                  type="button"
                  onClick={handleOpenAddMember}
                  title="Add a team member to this chat"
                  style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px",
                    background: "rgba(140,108,255,0.1)", border: "1px solid rgba(140,108,255,0.3)",
                    color: "#8C6CFF", borderRadius: "8px", padding: "6px 12px",
                    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <UserPlus size={15} /> Add Member
                </button>
              )}
            </header>

            {showAddMember && (
              <div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowAddMember(false); }}
              >
                <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "360px", padding: "18px", maxHeight: "70vh", overflowY: "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <strong style={{ fontSize: "0.95rem" }}>Add team member</strong>
                    <button type="button" onClick={() => setShowAddMember(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}>
                      <X size={18} />
                    </button>
                  </div>
                  {addMemberError && (
                    <div style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", marginBottom: "10px" }}>
                      {addMemberError}
                    </div>
                  )}
                  {addMemberLoading ? (
                    <div style={{ color: "#6B7280", fontSize: "0.85rem" }}>Loading…</div>
                  ) : addableMembers.length === 0 ? (
                    <div style={{ color: "#6B7280", fontSize: "0.85rem" }}>Everyone on the team is already in this chat.</div>
                  ) : (
                    addableMembers.map((m) => (
                      <div key={m.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #E0D9FF" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{m.displayName ?? m.userId}</span>
                        <button
                          type="button"
                          onClick={() => handleAddMember(m.userId)}
                          style={{ background: "#8C6CFF", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <section className="chat-messages">
              {loading && activeRoomMessages.length === 0 ? (
                <div className="chat-loading">Loading messages...</div>
              ) : activeRoomMessages.length === 0 ? (
                <div className="chat-empty-thread">No messages yet. Start the conversation.</div>
              ) : (
                groups.map((group) => (
                  <BubbleGroup key={group.key} group={group} onDeleteMessage={handleDeleteMessage} />
                ))
              )}
              <div ref={messagesEndRef} />
            </section>

            {activeRoom.canSend ? (
              <footer className="chat-composer">
                <button type="button" className="chat-attach" aria-label="Attach file">
                  <Paperclip size={24} />
                </button>
                <div className="chat-input-wrap">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a message"
                  />
                  <button
                    type="button"
                    className="chat-send"
                    disabled={!messageText.trim() || sendingMessage}
                    onClick={handleSendMessage}
                    aria-label="Send message"
                  >
                    <Send size={25} fill="currentColor" />
                  </button>
                </div>
              </footer>
            ) : (
              <footer className="chat-readonly">You can view but cannot reply in this channel.</footer>
            )}
          </>
        ) : (
          <div className="chat-no-room">
            <h2>Your Messages</h2>
            <p>Select a conversation from the left panel to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
}
