import api from "../../../shared/api/Base"

export interface NotificationResponse {
  id: string
  title: string
  message: string
  type: string
  priority: string
  targetType: string
  targetId?: string
  actionUrl?: string
  custom: boolean
  createdBy?: string
  createdAt: string
  recipientId?: string
  read: boolean
  readAt?: string
}

export interface CreateNotificationRequest {
  title: string
  message: string
  type: string
  priority: string
  targetType: string
  targetId?: string
  actionUrl?: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// User endpoints
export const getMyNotifications = async (page = 0, size = 20): Promise<PagedResponse<NotificationResponse>> => {
  const res = await api.get("/notifications", { params: { page, size } })
  return res.data
}

export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get("/notifications/unread-count")
  return typeof res.data === "number" ? res.data : res.data?.count ?? 0
}

export const markAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`)
}

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all")
}

// Admin endpoints
export const createNotification = async (req: CreateNotificationRequest): Promise<NotificationResponse> => {
  const res = await api.post("/admin/notifications", req)
  return res.data
}

export const listAllNotifications = async (page = 0, size = 20): Promise<PagedResponse<NotificationResponse>> => {
  const res = await api.get("/admin/notifications", { params: { page, size } })
  return res.data
}

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/admin/notifications/${id}`)
}
