import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectNotifLoading,
  selectNotifTotalPages,
} from "../store/notificationSlice"
import type { NotificationResponse } from "../api/notification.api"

// ── Helpers ────────────────────────────────────────────────────────────────────

type TabKey = "all" | "unread" | "event" | "match" | "ranking"

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "event", label: "Event Updates" },
  { key: "match", label: "Match Updates" },
  { key: "ranking", label: "Rankings" },
]

function filterNotifications(notifications: NotificationResponse[], tab: TabKey): NotificationResponse[] {
  switch (tab) {
    case "all":
      return notifications
    case "unread":
      return notifications.filter((n) => !n.read)
    case "event":
      return notifications.filter(
        (n) => n.type.includes("EVENT") || n.type.includes("REGISTRATION")
      )
    case "match":
      return notifications.filter(
        (n) => n.type.includes("MATCH") || n.type.includes("RESULT")
      )
    case "ranking":
      return notifications.filter((n) => n.type.includes("RANKING"))
    default:
      return notifications
  }
}

function priorityDotColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "bg-red-500"
    case "MEDIUM":
      return "bg-yellow-400"
    default:
      return "bg-neutral-500"
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const notifications = useAppSelector(selectNotifications)
  const loading = useAppSelector(selectNotifLoading)
  const totalPages = useAppSelector(selectNotifTotalPages)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState<TabKey>("all")

  useEffect(() => {
    dispatch(fetchMyNotifications(0))
    dispatch(fetchUnreadCount())
  }, [dispatch])

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    dispatch(fetchMyNotifications(nextPage))
  }

  const handleNotificationClick = (notification: NotificationResponse) => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification.id))
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead())
  }

  const filtered = filterNotifications(notifications, activeTab)

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm text-[#fa7545] hover:text-orange-400 transition-colors font-medium"
          >
            Mark all as read
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/[0.08] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-[#fa7545] text-[#fa7545]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-[#fa7545] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl text-neutral-600">
              <svg viewBox="0 0 24 24" className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-neutral-400 font-medium">No notifications yet</p>
            <p className="text-neutral-600 text-sm max-w-xs">
              {activeTab === "unread"
                ? "You're all caught up! No unread notifications."
                : "Notifications will appear here when there's activity."}
            </p>
          </div>
        )}

        {/* Notification List */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-2">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  relative flex items-start gap-3 p-4 rounded-lg cursor-pointer
                  border transition-all
                  ${
                    notification.read
                      ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
                      : "bg-[#fa7545]/[0.06] border-[#fa7545]/20 hover:bg-[#fa7545]/[0.1]"
                  }
                `}
              >
                {/* Unread indicator bar */}
                {!notification.read && (
                  <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-[#fa7545]" />
                )}

                {/* Priority dot */}
                <div className="flex-shrink-0 mt-1">
                  <span
                    className={`block h-2 w-2 rounded-full ${priorityDotColor(notification.priority)}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-snug truncate ${
                        notification.read ? "text-neutral-300 font-normal" : "text-white font-semibold"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-neutral-500">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-600 bg-white/[0.05] px-1.5 py-0.5 rounded">
                      {notification.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More / Pagination */}
        {filtered.length > 0 && currentPage < totalPages - 1 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
