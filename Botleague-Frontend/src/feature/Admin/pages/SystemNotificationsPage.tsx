import React, { useEffect, useState } from "react"
import {
  createNotification,
  deleteNotification,
  listAllNotifications,
} from "../../Notifications/api/notification.api"
import type { NotificationResponse, CreateNotificationRequest } from "../../Notifications/api/notification.api"

// ── Constants ─────────────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  "CUSTOM_ANNOUNCEMENT",
  "CUSTOM_ALERT",
  "EVENT_CREATED",
  "REGISTRATION_OPENED",
  "REGISTRATION_CLOSED",
  "MATCH_SCHEDULED",
  "RANKING_UPDATED",
  "CUSTOM_UPDATE",
]

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"]

const TARGET_TYPES = ["ALL_USERS", "ALL_TEAMS", "EVENT", "SPORT", "TEAM", "USER"]

const TARGET_TYPES_NO_ID: string[] = ["ALL_USERS", "ALL_TEAMS"]

// ── Helpers ────────────────────────────────────────────────────────────────────

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "bg-red-500/20 text-red-400 border border-red-500/30"
    case "MEDIUM":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
    default:
      return "bg-neutral-500/20 text-neutral-400 border border-neutral-500/30"
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

// ── Create Notification Modal ─────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onCreated: (notification: NotificationResponse) => void
}

function CreateNotificationModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState<CreateNotificationRequest>({
    title: "",
    message: "",
    type: "CUSTOM_ANNOUNCEMENT",
    priority: "MEDIUM",
    targetType: "ALL_USERS",
    targetId: undefined,
    actionUrl: undefined,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showTargetId = !TARGET_TYPES_NO_ID.includes(form.targetType)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value || undefined,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.")
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateNotificationRequest = {
        ...form,
        targetId: showTargetId && form.targetId ? form.targetId : undefined,
      }
      const created = await createNotification(payload)
      onCreated(created)
      onClose()
    } catch (err) {
      setError("Failed to send notification. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#13151c] border border-white/[0.08] rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-semibold text-white">Create Notification</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Notification title"
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#fa7545]/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Notification message"
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#fa7545]/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fa7545]/50"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#13151c]">
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fa7545]/50"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-[#13151c]">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Target Type</label>
            <select
              name="targetType"
              value={form.targetType}
              onChange={handleChange}
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fa7545]/50"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#13151c]">
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {showTargetId && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Target ID <span className="text-neutral-600 normal-case">(UUID of the {form.targetType.toLowerCase()})</span>
              </label>
              <input
                type="text"
                name="targetId"
                value={form.targetId ?? ""}
                onChange={handleChange}
                placeholder={`Enter ${form.targetType.toLowerCase()} UUID`}
                className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#fa7545]/50"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Action URL <span className="text-neutral-600 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              name="actionUrl"
              value={form.actionUrl ?? ""}
              onChange={handleChange}
              placeholder="/events/some-event-id"
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#fa7545]/50"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-neutral-400 hover:text-white border border-white/[0.1] hover:border-white/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-sm font-medium text-white bg-[#fa7545] hover:bg-orange-500 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SystemNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadNotifications = async (p: number = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAllNotifications(p, 20)
      if (p === 0) {
        setNotifications(data.content)
      } else {
        setNotifications((prev) => [...prev, ...data.content])
      }
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch {
      setError("Failed to load notifications.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(0)
  }, [])

  const handleCreated = (notification: NotificationResponse) => {
    setNotifications((prev) => [notification, ...prev])
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      alert("Failed to delete notification.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">System Notifications</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage and send notifications to users</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#fa7545] hover:bg-orange-500 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Notification
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-[#fa7545] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <p className="text-neutral-400 font-medium">No notifications sent yet</p>
            <p className="text-neutral-600 text-sm">Create your first notification to get started.</p>
          </div>
        )}

        {/* Table */}
        {notifications.length > 0 && (
          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.08]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n, idx) => (
                  <tr
                    key={n.id}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${
                      idx === notifications.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white truncate max-w-[200px]">{n.title}</p>
                        <p className="text-neutral-500 text-xs truncate max-w-[200px] mt-0.5">{n.message}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-400 bg-white/[0.06] px-2 py-1 rounded">
                        {n.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${priorityBadgeClass(n.priority)}`}>
                        {n.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-neutral-300 text-xs">{n.targetType.replace(/_/g, " ")}</p>
                        {n.targetId && (
                          <p className="text-neutral-600 text-[10px] font-mono mt-0.5 truncate max-w-[120px]">
                            {n.targetId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                      {formatDate(n.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        disabled={deletingId === n.id}
                        className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 text-xs font-medium"
                      >
                        {deletingId === n.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More */}
        {notifications.length > 0 && page < totalPages - 1 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => loadNotifications(page + 1)}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <CreateNotificationModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
