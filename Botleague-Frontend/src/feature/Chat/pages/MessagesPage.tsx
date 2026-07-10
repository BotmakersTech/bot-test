import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { ChevronDown, Download, FileText, Image, Paperclip, Plus, Send } from "lucide-react";
import { useSelector } from "react-redux";

import { useAppDispatch } from "../../../app/hooks";
import type { RootState } from "../../../app/store";
import api from "../../../shared/api/Base";
import "../../../styles/chat.css";
import type { ChatMessage, ChatRoom } from "../api/chat.api";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import { resolveAvatarSrc } from "../../Profile/constants/avatars";
import {
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

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "BL";
}

function isTeamRoom(room: ChatRoom): boolean {
  return room.type === "TEAM" || room.type === "REGISTRATION" || room.type.includes("ANNOUNCEMENT");
}

function roomTag(room: ChatRoom): string {
  if (room.type === "TEAM") return "Help wanted";
  if (room.type === "DIRECT") return "Question";
  if (room.type === "REGISTRATION") return "Bug";
  return "Update";
}

function roomTagClass(room: ChatRoom): string {
  if (room.type === "TEAM") return "chat-tag chat-tag-green";
  if (room.type === "REGISTRATION") return "chat-tag chat-tag-orange";
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

function BubbleGroup({ group }: { group: MessageGroup }) {
  if (group.isSystem) {
    return <div className="chat-system-message">{group.messages[0].content}</div>;
  }

  const photoSrc = resolveAvatarSrc(group.senderPhotoUrl);

  return (
    <div className={group.isMine ? "chat-bubble-group chat-bubble-group-mine" : "chat-bubble-group"}>
      {!group.isMine && <BubbleAvatar name={group.senderName} photoSrc={photoSrc} />}

      <div className="chat-bubble-stack">
        {group.messages.map((msg) => (
          <div key={msg.id} className={group.isMine ? "chat-bubble chat-bubble-mine" : "chat-bubble"}>
            {msg.content}
          </div>
        ))}
      </div>

      {group.isMine && <BubbleAvatar name={group.senderName || "Me"} photoSrc={photoSrc} />}
    </div>
  );
}

const importantFiles = [
  { name: "ISO9.pdf", meta: "PDF  9mb", tone: "red", icon: FileText },
  { name: "Screenshot-3817.png", meta: "PNG  4mb", tone: "green", icon: Image },
  { name: "Sharefile.docx", meta: "DOC  555kb", tone: "blue", icon: FileText },
];

export default function MessagesPage() {
  const dispatch = useAppDispatch();
  const rooms = useSelector(selectChatRooms);
  const activeRoomId = useSelector(selectActiveRoom);
  const loading = useSelector(selectChatLoading);
  const sendingMessage = useSelector(selectSendingMessage);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const activeRoomMessages = useSelector(selectMessages(activeRoomId ?? ""));

  const [messageText, setMessageText] = useState("");
  const [tab, setTab] = useState<"chats" | "teams">("chats");
  const [query, setQuery] = useState("");
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
  const visibleRooms = allRooms.filter((room) => {
    const matchesTab = tab === "teams" ? isTeamRoom(room) : !isTeamRoom(room);
    const matchesQuery = room.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesTab && matchesQuery;
  });
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

        <div className="chat-tabs">
          <button type="button" className={tab === "chats" ? "active" : ""} onClick={() => setTab("chats")}>Chats</button>
          <button type="button" className={tab === "teams" ? "active" : ""} onClick={() => setTab("teams")}>Teams</button>
        </div>

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

        <section className="chat-files">
          <h2>Important Files</h2>
          {importantFiles.map((file) => {
            const Icon = file.icon;
            return (
              <div className="chat-file-row" key={file.name}>
                <span className={`chat-file-icon chat-file-${file.tone}`}>
                  <Icon size={22} />
                </span>
                <span className="chat-file-copy">
                  <strong>{file.name}</strong>
                  <em>{file.meta}</em>
                </span>
                <button type="button" aria-label={`Download ${file.name}`}>
                  <Download size={19} />
                </button>
              </div>
            );
          })}
        </section>
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
            </header>

            <section className="chat-messages">
              {loading && activeRoomMessages.length === 0 ? (
                <div className="chat-loading">Loading messages...</div>
              ) : activeRoomMessages.length === 0 ? (
                <div className="chat-empty-thread">No messages yet. Start the conversation.</div>
              ) : (
                groups.map((group) => <BubbleGroup key={group.key} group={group} />)
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
