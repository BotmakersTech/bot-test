import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../../../app/store"
import {
  getMyChatRooms,
  getChatMessages,
  sendMessage,
  markRoomRead as apiMarkRoomRead,
  type ChatMessage,
  type ChatRoomList,
} from "../api/chat.api"

// ─── State ───────────────────────────────────────────────────────────────────

interface ChatState {
  rooms: ChatRoomList | null
  activeRoomId: string | null
  messages: Record<string, ChatMessage[]>
  loading: boolean
  sendingMessage: boolean
  error: string | null
}

const initialState: ChatState = {
  rooms: null,
  activeRoomId: null,
  messages: {},
  loading: false,
  sendingMessage: false,
  error: null,
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchChatRooms = createAsyncThunk(
  "chat/fetchRooms",
  async (_, { rejectWithValue }) => {
    try {
      return await getMyChatRooms()
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch chat rooms")
    }
  }
)

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (roomId: string, { rejectWithValue }) => {
    try {
      const messages = await getChatMessages(roomId)
      return { roomId, messages }
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to fetch messages")
    }
  }
)

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ roomId, content }: { roomId: string; content: string }, { rejectWithValue }) => {
    try {
      const message = await sendMessage(roomId, content)
      return { roomId, message }
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : "Failed to send message")
    }
  }
)

export const markChatRoomRead = createAsyncThunk(
  "chat/markRead",
  async (roomId: string, { rejectWithValue }) => {
    try {
      await apiMarkRoomRead(roomId)
      return roomId
    } catch {
      return rejectWithValue(roomId)
    }
  }
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function updateRoomsLastMessage(rooms: ChatRoomList, roomId: string, msg: ChatMessage): ChatRoomList {
  const update = (list: ChatRoomList["teamChats"]) =>
    list.map((r) => (r.id === roomId ? { ...r, lastMessage: msg } : r))
  return {
    ...rooms,
    teamChats: update(rooms.teamChats),
    directChats: update(rooms.directChats),
    registrationChats: update(rooms.registrationChats),
    announcementChats: update(rooms.announcementChats),
  }
}

function incrementUnread(rooms: ChatRoomList, roomId: string): ChatRoomList {
  const inc = (list: ChatRoomList["teamChats"]) =>
    list.map((r) => (r.id === roomId ? { ...r, unreadCount: r.unreadCount + 1 } : r))
  return {
    ...rooms,
    teamChats: inc(rooms.teamChats),
    directChats: inc(rooms.directChats),
    registrationChats: inc(rooms.registrationChats),
    announcementChats: inc(rooms.announcementChats),
  }
}

function clearUnread(rooms: ChatRoomList, roomId: string): ChatRoomList {
  const zero = (list: ChatRoomList["teamChats"]) =>
    list.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
  return {
    ...rooms,
    teamChats: zero(rooms.teamChats),
    directChats: zero(rooms.directChats),
    registrationChats: zero(rooms.registrationChats),
    announcementChats: zero(rooms.announcementChats),
  }
}

// ─── Slice ───────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveRoom(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload
      // Clear unread badge immediately when room is selected
      if (action.payload && state.rooms) {
        state.rooms = clearUnread(state.rooms, action.payload)
      }
    },
    addIncomingMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload
      const roomId = msg.chatRoomId
      if (!state.messages[roomId]) {
        state.messages[roomId] = []
      }
      const existingIdx = state.messages[roomId].findIndex((m) => m.id === msg.id)
      if (existingIdx === -1) {
        state.messages[roomId].push(msg)
      } else {
        // Message already stored (e.g. via REST response) — patch mine in case
        // the WebSocket payload arrived first with the wrong value
        state.messages[roomId][existingIdx].mine = msg.mine
      }
      if (state.rooms) {
        state.rooms = updateRoomsLastMessage(state.rooms, roomId, msg)
        // Increment unread only if this room is NOT currently open
        if (state.activeRoomId !== roomId && !msg.system) {
          state.rooms = incrementUnread(state.rooms, roomId)
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = action.payload
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false
        const { roomId, messages } = action.payload
        state.messages[roomId] = messages
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.sendingMessage = true
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendingMessage = false
        const { roomId, message } = action.payload
        if (!state.messages[roomId]) {
          state.messages[roomId] = []
        }
        const exists = state.messages[roomId].some((m) => m.id === message.id)
        if (!exists) {
          state.messages[roomId].push(message)
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendingMessage = false
        state.error = action.payload as string
      })

    builder.addCase(markChatRoomRead.fulfilled, (state, action) => {
      if (state.rooms) {
        state.rooms = clearUnread(state.rooms, action.payload)
      }
    })
  },
})

export const { setActiveRoom, addIncomingMessage } = chatSlice.actions

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectChatRooms = (state: RootState) => state.chat.rooms
export const selectActiveRoom = (state: RootState) => state.chat.activeRoomId
export const selectMessages = (roomId: string) => (state: RootState) =>
  state.chat.messages[roomId] ?? []
export const selectChatLoading = (state: RootState) => state.chat.loading
export const selectSendingMessage = (state: RootState) => state.chat.sendingMessage

export default chatSlice.reducer
