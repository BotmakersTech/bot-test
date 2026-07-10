import api from "../../../shared/api/Base"

export interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string | null
  senderName: string
  senderPhotoUrl?: string | null
  content: string
  sentAt: string
  isDeleted: boolean
  mine: boolean
  system: boolean
}

export interface ChatRoom {
  id: string
  type: "TEAM" | "DIRECT" | "REGISTRATION" | "EVENT_ANNOUNCEMENT" | "SPORT_ANNOUNCEMENT"
  name: string
  referenceId?: string
  unreadCount: number
  lastMessage?: ChatMessage
  canSend: boolean
}

export interface ChatRoomList {
  teamChats: ChatRoom[]
  directChats: ChatRoom[]
  registrationChats: ChatRoom[]
  announcementChats: ChatRoom[]
}

export const getMyChatRooms = async (): Promise<ChatRoomList> => {
  const res = await api.get("/chat/rooms")
  return res.data
}

export const getChatMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const res = await api.get(`/chat/rooms/${roomId}/messages`)
  return res.data
}

export const sendMessage = async (roomId: string, content: string): Promise<ChatMessage> => {
  const res = await api.post(`/chat/rooms/${roomId}/send`, { content })
  return res.data
}

export const getOrCreateDirect = async (otherUserId: string): Promise<ChatRoom> => {
  const res = await api.post(`/chat/direct/${otherUserId}`)
  return res.data
}

export const markRoomRead = async (roomId: string): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/read`)
}
