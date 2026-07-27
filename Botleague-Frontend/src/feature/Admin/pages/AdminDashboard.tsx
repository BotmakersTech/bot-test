"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  CalendarDays, Trophy, Users, Search, MapPin, Building2, Calendar,
  Radio, Plus, ShieldCheck, AlertCircle, CheckCircle2, Clock, Trash2,
  FileEdit, Zap, Activity
} from "lucide-react"
import { useAdminEvents } from "../hooks/useAdmin"
import type { AdminEventResponse } from "../api/admin.api"
import { getRecentAuditLogs, type AuditLogEntry } from "../api/auditLog.api"
import { Link } from "react-router-dom"
import "../../../styles/adminDashboard.css"

// =====================================================
// HELPERS
// =====================================================

const normalizeStatus = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "LIVE":      return "live"
    case "COMPLETED": return "completed"
    case "PUBLISHED": return "upcoming"
    case "DRAFT":     return "draft"
    case "ARCHIVED":  return "archived"
    default:          return "upcoming"
  }
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  upcoming: "Published",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
}

const FILTERS = ["all", "draft", "upcoming", "live", "completed", "archived"] as const

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  } catch {
    return dateStr
  }
}

// =====================================================
// PAGE
// =====================================================

export default function AdminEventsDashboard() {
  const { events: rawEvents, loading, error } = useAdminEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events: AdminEventResponse[] = Array.isArray(rawEvents) ? rawEvents : []

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<(typeof FILTERS)[number]>("all")

  // Activity feed
  const [activityLogs, setActivityLogs] = useState<AuditLogEntry[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    getRecentAuditLogs()
      .then(setActivityLogs)
      .catch(() => setActivityLogs([]))
      .finally(() => setActivityLoading(false))
  }, [])

  // ── Stats ──
  const totalEvents = events.length

  const totalTeams = events.reduce((acc, e) => {
    const sportTeams = e?.sports?.reduce(
      (total, sport) => total + (sport?.registeredTeamsCount || 0), 0
    ) || 0
    return acc + sportTeams
  }, 0)

  const completedCount = events.filter(e => normalizeStatus(e?.status) === "completed").length
  const upcomingCount  = events.filter(e => normalizeStatus(e?.status) === "upcoming").length
  const liveCount      = events.filter(e => normalizeStatus(e?.status) === "live").length

  // ── Filtered events ──
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e?.eventName?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === "all" || normalizeStatus(e?.status) === filterStatus
      return matchSearch && matchStatus
    })
  }, [events, search, filterStatus])

  // ── Loading ──
  if (loading) {
    return (
      <div className="adb-center-screen">
        <div className="adb-spinner" />
        <span style={{ color: "#8A8A8A", fontSize: "0.9rem" }}>Loading events…</span>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="adb-center-screen">
        <div className="adb-error-box">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  // ── UI ──
  return (
    <div className="adb-page">
      <div className="adb-content">

        {/* ── HEADING ── */}
        <div className="adb-heading">
          <div>
            <div className="adb-heading-eyebrow">Botleague Admin</div>
            <h1 className="adb-heading-title">Events Dashboard</h1>
          </div>
          <div className="adb-heading-meta">
            <span className="adb-count-pill">{filteredEvents.length} of {totalEvents} events</span>
            <Link to="/admin/events/create" className="adb-create-btn">
              <Plus size={16} strokeWidth={2.5} />
              Create Event
            </Link>
          </div>
        </div>

        {/* ── STATS ── */}
        <section className="adb-stats">
          <StatCard icon={<CalendarDays size={26} />} value={totalEvents} label="Total Events" />
          <StatCard icon={<Users size={26} />} value={totalTeams} label="Total Teams" />
          <StatCard icon={<CheckCircle2 size={26} />} value={completedCount} label="Completed" />
          <StatCard icon={<Trophy size={26} />} value={upcomingCount} label="Upcoming" />
          <StatCard icon={<Radio size={26} />} value={liveCount} label="Live Now" pulse={liveCount > 0} />
        </section>

        {/* ── SEARCH / FILTER ── */}
        <section className="adb-search-section">
          <div className="adb-search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button type="button" className="adb-search-btn">Search</button>

          <select
            className="adb-status-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as (typeof FILTERS)[number])}
          >
            {FILTERS.map(f => (
              <option key={f} value={f} style={{ color: "#111" }}>
                {f === "all" ? "All" : STATUS_LABEL[f]}
              </option>
            ))}
          </select>
        </section>

        {/* ── EVENTS + ACTIVITY FEED ── */}
        <div className="adb-two-col">

          <div className="adb-event-grid">
            {filteredEvents.length === 0 ? (
              <div className="adb-empty">
                <CalendarDays size={32} color="#c7c7c7" />
                <p style={{ marginTop: 12 }}>No events match your filters</p>
              </div>
            ) : (
              filteredEvents.map((event, idx) => (
                <EventCard key={event.id || idx} event={event} />
              ))
            )}
          </div>

          <div className="adb-feed">
            <div className="adb-feed-header">
              <div className="adb-feed-title">
                <ShieldCheck size={16} />
                Activity Feed
              </div>
              <span className="adb-feed-subtitle">Governance log</span>
            </div>

            <div className="adb-feed-body">
              {activityLoading ? (
                <div className="adb-feed-empty">Loading…</div>
              ) : activityLogs.length === 0 ? (
                <div className="adb-feed-empty">No activity yet</div>
              ) : (
                activityLogs.map((log) => <ActivityRow key={log.id} log={log} />)
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  value,
  label,
  pulse,
}: {
  icon: React.ReactNode
  value: number
  label: string
  pulse?: boolean
}) {
  return (
    <div className="adb-stat-card">
      <div className="adb-stat-icon">
        {icon}
        {pulse && <span className="adb-stat-pulse-dot" />}
      </div>
      <div>
        <div className="adb-stat-value">{value}</div>
        <div className="adb-stat-label">{label.toUpperCase()}</div>
      </div>
    </div>
  )
}

// =====================================================
// EVENT CARD
// =====================================================

function EventCard({ event }: { event: AdminEventResponse }) {
  const status = normalizeStatus(event.status)
  const totalTeams = event.sports?.reduce((sum, s) => sum + (s.registeredTeamsCount || 0), 0) ?? 0
  const sportsCount = event.sports?.length ?? 0
  const imgUrl = event.eventThumbnailUrl || event.eventLogoUrl

  return (
    <Link to={`/admin/event/${event.id}`} className="adb-event-card">
      {imgUrl ? (
        <img src={imgUrl} alt="" className="adb-event-img" />
      ) : (
        <div className="adb-event-img-fallback">{(event.eventName?.[0] ?? "E").toUpperCase()}</div>
      )}

      <div className="adb-event-info">
        <h2>{event.eventName}</h2>
        <div className="adb-event-org">{event.organizationName}</div>

        <div className="adb-info-row">
          <MapPin size={16} />
          {event.city}, {event.state}
        </div>
        <div className="adb-info-row">
          <Building2 size={16} />
          {event.venueName}
        </div>
        <div className="adb-info-row">
          <Calendar size={16} />
          {formatDate(event.startDate)} – {formatDate(event.endDate)}
        </div>

        {sportsCount > 0 && (
          <div className="adb-sports-row">
            {event.sports?.map(sport => (
              <span key={sport.id} className="adb-sport-chip">{sport.sportName}</span>
            ))}
          </div>
        )}
      </div>

      <div className="adb-stats-box">
        <div className="adb-stat-num">
          <h2>{sportsCount}</h2>
          <span>Sports</span>
        </div>
        <div className="adb-num-divider" />
        <div className="adb-stat-num">
          <h2>{totalTeams}</h2>
          <span>Teams</span>
        </div>
      </div>

      <div className={`adb-status-pill adb-status-${status}`}>
        {status === "live" && <span className="adb-status-pulse-dot" />}
        {STATUS_LABEL[status]}
      </div>
    </Link>
  )
}

// =====================================================
// ACTIVITY ROW
// =====================================================

const ACTION_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  EVENT_CREATED:          { icon: <Plus size={13} />,         color: "#22c55e", label: "Event Created" },
  EVENT_PUBLISHED:        { icon: <Zap size={13} />,          color: "#eab308", label: "Event Published" },
  EVENT_STATUS_CHANGED:   { icon: <FileEdit size={13} />,     color: "#0162D1", label: "Status Changed" },
  EVENT_UPDATED:          { icon: <FileEdit size={13} />,     color: "#8A8A8A", label: "Event Updated" },
  EVENT_DELETED:          { icon: <Trash2 size={13} />,       color: "#ef4444", label: "Event Deleted" },
  ROBOT_REGISTERED:       { icon: <CheckCircle2 size={13} />, color: "#22c55e", label: "Robot Registered" },
  REGISTRATION_CANCELLED: { icon: <AlertCircle size={13} />,  color: "#f97316", label: "Registration Cancelled" },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ActivityRow({ log }: { log: AuditLogEntry }) {
  const meta = ACTION_META[log.action] ?? { icon: <Activity size={13} />, color: "#8A8A8A", label: log.action }
  const actor = log.actorEmail
    ? log.actorEmail.split("@")[0]
    : log.actorId
      ? log.actorId.slice(0, 8) + "…"
      : "System"

  return (
    <div className="adb-activity-row">
      <div className="adb-activity-icon" style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}14` }}>
        {meta.icon}
      </div>
      <div className="adb-activity-content">
        <div className="adb-activity-label">{meta.label}</div>
        {log.entityName && <div className="adb-activity-entity">{log.entityName}</div>}
        {(log.oldValue || log.newValue) && (
          <div className="adb-activity-change">
            {log.oldValue && <span style={{ color: "#ef4444" }}>{log.oldValue}</span>}
            {log.oldValue && log.newValue && <span style={{ color: "#9CA3AF", margin: "0 4px" }}>→</span>}
            {log.newValue && <span style={{ color: "#22c55e" }}>{log.newValue}</span>}
          </div>
        )}
        <div className="adb-activity-meta">
          <Clock size={10} />
          {timeAgo(log.createdAt)}
          <span style={{ color: "#D1D5DB" }}>·</span>
          {actor}
        </div>
      </div>
    </div>
  )
}
