import { useEffect, useRef, useState, type KeyboardEvent, type ChangeEvent } from "react"
import { useSelector } from "react-redux"
import { useAppDispatch } from "../../../app/hooks"
import type { RootState } from "../../../app/store"
import {
  fetchChatRooms,
  fetchMessages,
  sendChatMessage,
  markChatRoomRead,
  setActiveRoom,
  selectChatRooms,
  selectActiveRoom,
  selectMessages,
  selectChatLoading,
  selectSendingMessage,
} from "../store/chatSlice"
import { useChatWebSocket } from "../hooks/useChatWebSocket"
import type { ChatMessage, ChatRoom } from "../api/chat.api"
import api from "../../../shared/api/Base"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  const header = api.defaults.headers.common["Authorization"]
  if (typeof header === "string" && header.startsWith("Bearer ")) return header.substring(7)
  return null
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const s = Math.floor(diffMs / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (s < 60) return "just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function formatDateDivider(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dateMs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diff = todayMs - dateMs
  if (diff === 0) return "Today"
  if (diff === 86_400_000) return "Yesterday"
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
}

function isSameDay(a: string, b: string | null): boolean {
  if (!b) return false
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const SENDER_COLORS = [
  { bg: "bg-blue-600",    text: "text-blue-400"    },
  { bg: "bg-purple-600",  text: "text-purple-400"  },
  { bg: "bg-emerald-600", text: "text-emerald-400" },
  { bg: "bg-amber-600",   text: "text-amber-400"   },
  { bg: "bg-pink-600",    text: "text-pink-400"    },
  { bg: "bg-cyan-600",    text: "text-cyan-400"    },
  { bg: "bg-indigo-600",  text: "text-indigo-400"  },
]

function getSenderColor(name: string): { bg: string; text: string } {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff
  return SENDER_COLORS[h % SENDER_COLORS.length]
}

function getRoomTypeLabel(type: ChatRoom["type"]): string {
  const map: Record<ChatRoom["type"], string> = {
    TEAM: "Team", DIRECT: "Direct", REGISTRATION: "Registration",
    EVENT_ANNOUNCEMENT: "Event", SPORT_ANNOUNCEMENT: "Sport",
  }
  return map[type] ?? type
}

function getRoomTypeBadgeColor(type: ChatRoom["type"]): string {
  switch (type) {
    case "TEAM":   return "bg-blue-500/20 text-blue-300"
    case "DIRECT": return "bg-green-500/20 text-green-300"
    case "REGISTRATION": return "bg-purple-500/20 text-purple-300"
    default:       return "bg-orange-500/20 text-orange-300"
  }
}

// ─── Message grouping ─────────────────────────────────────────────────────────

interface MessageGroup {
  key: string
  isSystem: boolean
  isMine: boolean
  senderId: string | null
  senderName: string
  messages: ChatMessage[]
}

function buildGroups(messages: ChatMessage[], currentUserId: string | undefined): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of messages) {
    if (msg.system) {
      groups.push({ key: msg.id, isSystem: true, isMine: false, senderId: null, senderName: "", messages: [msg] })
      continue
    }
    const isMine = msg.mine || (!!currentUserId && msg.senderId === currentUserId)
    const prev = groups[groups.length - 1]
    if (prev && !prev.isSystem && prev.senderId === msg.senderId) {
      prev.messages.push(msg)
    } else {
      groups.push({ key: msg.id, isSystem: false, isMine, senderId: msg.senderId, senderName: msg.senderName, messages: [msg] })
    }
  }
  return groups
}

// ─── Render items (groups + date dividers) ────────────────────────────────────

type RenderItem =
  | { kind: "date";   key: string; label: string }
  | { kind: "system"; key: string; content: string }
  | { kind: "group";  key: string; group: MessageGroup }

function buildRenderItems(groups: MessageGroup[]): RenderItem[] {
  const items: RenderItem[] = []
  let lastDate: string | null = null
  for (const g of groups) {
    const firstMsg = g.messages[0]
    if (!isSameDay(firstMsg.sentAt, lastDate)) {
      lastDate = firstMsg.sentAt
      items.push({ kind: "date", key: `date-${firstMsg.sentAt}`, label: formatDateDivider(firstMsg.sentAt) })
    }
    if (g.isSystem) {
      items.push({ kind: "system", key: g.key, content: firstMsg.content })
    } else {
      items.push({ kind: "group", key: g.key, group: g })
    }
  }
  return items
}

// ─── Sidebar room item ────────────────────────────────────────────────────────

function RoomItem({ room, isActive, onClick }: { room: ChatRoom; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 ${
        isActive ? "bg-[#fa4715]/20 border border-[#fa4715]/40" : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-white truncate flex-1">{room.name}</span>
        {room.unreadCount > 0 && (
          <span className="flex-shrink-0 bg-[#fa4715] text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
            {room.unreadCount > 99 ? "99+" : room.unreadCount}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {room.lastMessage ? (
          <span className="text-xs text-neutral-400 truncate flex-1">
            {room.lastMessage.mine ? "You: " : ""}{room.lastMessage.content}
          </span>
        ) : (
          <span className="text-xs text-neutral-600 italic">No messages yet</span>
        )}
        {room.lastMessage && (
          <span className="text-xs text-neutral-600 flex-shrink-0">{formatRelativeTime(room.lastMessage.sentAt)}</span>
        )}
      </div>
    </button>
  )
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function Bubble({ msg, isMine, isFirst, isLast, total }: {
  msg: ChatMessage; isMine: boolean; isFirst: boolean; isLast: boolean; total: number
}) {
  let r = "rounded-2xl"
  if (isMine) {
    if (total === 1)      r = "rounded-2xl rounded-br-[4px]"
    else if (isFirst)     r = "rounded-2xl rounded-br-lg"
    else if (isLast)      r = "rounded-2xl rounded-tr-lg rounded-br-[4px]"
    else                  r = "rounded-2xl rounded-r-lg"
  } else {
    if (total === 1)      r = "rounded-2xl rounded-bl-[4px]"
    else if (isFirst)     r = "rounded-2xl rounded-bl-lg"
    else if (isLast)      r = "rounded-2xl rounded-tl-lg rounded-bl-[4px]"
    else                  r = "rounded-2xl rounded-l-lg"
  }

  return (
    <div
      className={`relative px-3 pt-2 pb-1.5 text-sm leading-relaxed break-words max-w-full ${r} ${
        isMine ? "bg-[#fa4715] text-white" : "bg-[#262830] text-neutral-100"
      }`}
    >
      <span className="whitespace-pre-wrap">{msg.content}</span>
      {/* Timestamp floated to bottom-right inside bubble */}
      <span
        className={`block text-right text-[10px] leading-none mt-1 select-none ${
          isMine ? "text-white/50" : "text-neutral-500"
        }`}
      >
        {formatTime(msg.sentAt)}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const dispatch = useAppDispatch()
  const rooms = useSelector(selectChatRooms)
  const activeRoomId = useSelector(selectActiveRoom)
  const loading = useSelector(selectChatLoading)
  const sendingMessage = useSelector(selectSendingMessage)
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)

  const activeRoomMessages = useSelector(selectMessages(activeRoomId ?? ""))

  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const allRoomIds: string[] = rooms
    ? [
        ...rooms.teamChats.map((r) => r.id),
        ...rooms.directChats.map((r) => r.id),
        ...rooms.registrationChats.map((r) => r.id),
        ...rooms.announcementChats.map((r) => r.id),
      ]
    : []

  useChatWebSocket(allRoomIds, getAccessToken())

  useEffect(() => { dispatch(fetchChatRooms()) }, [dispatch])

  useEffect(() => {
    if (activeRoomId) {
      dispatch(fetchMessages(activeRoomId)).then(() => dispatch(markChatRoomRead(activeRoomId)))
    }
  }, [activeRoomId, dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeRoomMessages])

  const activeRoom = rooms
    ? [...rooms.teamChats, ...rooms.directChats, ...rooms.registrationChats, ...rooms.announcementChats].find(
        (r) => r.id === activeRoomId
      )
    : undefined

  function handleRoomSelect(roomId: string) {
    dispatch(setActiveRoom(roomId))
    dispatch(markChatRoomRead(roomId))
  }

  function handleTextareaChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setMessageText(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px"
  }

  async function handleSendMessage() {
    if (!activeRoomId || !messageText.trim()) return
    const content = messageText.trim()
    setMessageText("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    dispatch(sendChatMessage({ roomId: activeRoomId, content }))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const groups = buildGroups(activeRoomMessages, currentUserId)
  const renderItems = buildRenderItems(groups)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0a0c10] overflow-hidden">

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 bg-[#0f1115] border-r border-white/[0.07] flex flex-col">
        <div className="px-4 py-4 border-b border-white/[0.07]">
          <h1 className="text-base font-bold text-white">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {loading && !rooms && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#fa4715] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {rooms && (
            <>
              {rooms.teamChats.length > 0 && (
                <section>
                  <p className="px-3 py-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Team Chats</p>
                  {rooms.teamChats.map((r) => (
                    <RoomItem key={r.id} room={r} isActive={r.id === activeRoomId} onClick={() => handleRoomSelect(r.id)} />
                  ))}
                </section>
              )}

              {rooms.directChats.length > 0 && (
                <section className="mt-1">
                  <p className="px-3 py-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Direct Messages</p>
                  {rooms.directChats.map((r) => (
                    <RoomItem key={r.id} room={r} isActive={r.id === activeRoomId} onClick={() => handleRoomSelect(r.id)} />
                  ))}
                </section>
              )}

              {rooms.registrationChats.length > 0 && (
                <section className="mt-1">
                  <p className="px-3 py-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Registration</p>
                  {rooms.registrationChats.map((r) => (
                    <RoomItem key={r.id} room={r} isActive={r.id === activeRoomId} onClick={() => handleRoomSelect(r.id)} />
                  ))}
                </section>
              )}

              {rooms.announcementChats.length > 0 && (
                <section className="mt-1">
                  <p className="px-3 py-2 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Announcements</p>
                  {rooms.announcementChats.map((r) => (
                    <RoomItem key={r.id} room={r} isActive={r.id === activeRoomId} onClick={() => handleRoomSelect(r.id)} />
                  ))}
                </section>
              )}

              {allRoomIds.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="text-3xl mb-3">💬</div>
                  <p className="text-neutral-400 text-xs">No conversations yet.</p>
                  <p className="text-neutral-600 text-xs mt-1">Chats are created when you join a team or register for an event.</p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Chat Panel ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoomId && activeRoom ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/[0.07] bg-[#0f1115] flex items-center gap-3 min-h-[56px]">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white truncate">{activeRoom.name}</h2>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getRoomTypeBadgeColor(activeRoom.type)}`}>
                {getRoomTypeLabel(activeRoom.type)}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-[2px]">
              {loading && activeRoomMessages.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#fa4715] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && activeRoomMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-neutral-400 text-sm">No messages yet. Be the first to say something!</p>
                </div>
              )}

              {renderItems.map((item) => {
                // ── Date divider ────────────────────────────────────────────
                if (item.kind === "date") {
                  return (
                    <div key={item.key} className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-white/[0.07]" />
                      <span className="text-[11px] text-neutral-500 font-medium bg-[#0f1115] px-3 py-0.5 rounded-full border border-white/[0.07]">
                        {item.label}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.07]" />
                    </div>
                  )
                }

                // ── System message ──────────────────────────────────────────
                if (item.kind === "system") {
                  return (
                    <div key={item.key} className="flex justify-center py-1.5">
                      <span className="text-xs text-neutral-500 italic bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
                        {item.content}
                      </span>
                    </div>
                  )
                }

                // ── Message group ───────────────────────────────────────────
                const { group } = item
                const color = getSenderColor(group.senderName)
                const total = group.messages.length

                return (
                  <div
                    key={item.key}
                    className={`flex gap-2 pt-1 ${group.isMine ? "flex-row-reverse" : "flex-row"} items-end`}
                  >
                    {/* Avatar for other users */}
                    {!group.isMine ? (
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white self-end mb-0.5 ${color.bg}`}>
                        {getInitials(group.senderName)}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}

                    {/* Bubble stack */}
                    <div className={`flex flex-col gap-0.5 max-w-[65%] ${group.isMine ? "items-end" : "items-start"}`}>
                      {/* Sender name (only for others, once per group) */}
                      {!group.isMine && (
                        <span className={`text-xs font-semibold px-1 mb-0.5 ${color.text}`}>
                          {group.senderName}
                        </span>
                      )}

                      {group.messages.map((msg, idx) => (
                        <Bubble
                          key={msg.id}
                          msg={msg}
                          isMine={group.isMine}
                          isFirst={idx === 0}
                          isLast={idx === total - 1}
                          total={total}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            {activeRoom.canSend ? (
              <div className="px-4 py-3 border-t border-white/[0.07] bg-[#0f1115]">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 bg-[#1a1d24] text-white text-sm placeholder-neutral-600 rounded-2xl px-4 py-2.5 resize-none outline-none border border-white/[0.08] focus:border-[#fa4715]/40 transition-colors overflow-y-auto"
                    style={{ lineHeight: "1.5", minHeight: "40px", maxHeight: "128px" }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className="flex-shrink-0 w-10 h-10 bg-[#fa4715] hover:bg-[#e03d10] disabled:bg-neutral-800 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center shadow-md"
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] translate-x-px">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-white/[0.07] bg-[#0f1115]">
                <p className="text-center text-xs text-neutral-600 py-1">
                  You can view but cannot reply in this channel.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-lg font-semibold text-white mb-2">Your Messages</h2>
            <p className="text-neutral-500 text-sm max-w-xs">Select a conversation from the sidebar to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  )
}
