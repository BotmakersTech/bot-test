import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../../../app/store"
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../api/notification.api"
import type { NotificationResponse } from "../api/notification.api"

// ── State ─────────────────────────────────────────────────────────────────────

interface NotificationState {
  notifications: NotificationResponse[]
  unreadCount: number
  loading: boolean
  totalPages: number
  page: number
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  totalPages: 0,
  page: 0,
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchMyNotifications = createAsyncThunk(
  "notifications/fetchMy",
  async (page: number = 0) => {
    return await getMyNotifications(page, 20)
  }
)

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async () => {
    return await getUnreadCount()
  }
)

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    await markAsRead(id)
    return id
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    await markAllAsRead()
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Called by useNotificationRealtime when a push arrives over WebSocket
    pushNotification: (state, action: PayloadAction<NotificationResponse>) => {
      // Prepend to list (dedup by id to guard against double-delivery)
      if (!state.notifications.some((n) => n.id === action.payload.id)) {
        state.notifications.unshift(action.payload)
      }
      state.unreadCount += 1
    },
  },
  extraReducers: (builder) => {
    // fetchMyNotifications
    builder.addCase(fetchMyNotifications.pending, (state) => {
      state.loading = true
    })
    builder.addCase(fetchMyNotifications.fulfilled, (state, action) => {
      state.loading = false
      const { content, page, totalPages } = action.payload
      if (page === 0) {
        state.notifications = content
      } else {
        // Append for load-more pagination
        const existingIds = new Set(state.notifications.map((n) => n.id))
        const newItems = content.filter((n) => !existingIds.has(n.id))
        state.notifications = [...state.notifications, ...newItems]
      }
      state.page = page
      state.totalPages = totalPages
    })
    builder.addCase(fetchMyNotifications.rejected, (state) => {
      state.loading = false
    })

    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload
    })

    // markNotificationRead
    builder.addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification) {
        notification.read = true
        notification.readAt = new Date().toISOString()
      }
      if (state.unreadCount > 0) {
        state.unreadCount -= 1
      }
    })

    // markAllNotificationsRead
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => {
        n.read = true
        if (!n.readAt) {
          n.readAt = new Date().toISOString()
        }
      })
      state.unreadCount = 0
    })
  },
})

export const { pushNotification } = notificationSlice.actions
export default notificationSlice.reducer

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectNotifications = (state: RootState): NotificationResponse[] =>
  state.notifications.notifications

export const selectUnreadCount = (state: RootState): number =>
  state.notifications.unreadCount

export const selectNotifLoading = (state: RootState): boolean =>
  state.notifications.loading

export const selectNotifTotalPages = (state: RootState): number =>
  state.notifications.totalPages
