"use client"

import React, { useMemo, useState } from "react"
import {
  CalendarDays, Trophy, Radio, Plus, AlertCircle, CheckCircle2,
  Search, MapPin, Building2, Calendar
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAdminEvents } from "../hooks/useAdmin"
import type { AdminEventResponse } from "../api/admin.api"
import { Link } from "react-router-dom"
import MobileEventList from "../../../shared/components/EventDashboard/MobileEventList"
import "../../../shared/components/EventDashboard/MobileEventList.css"
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
  const navigate = useNavigate()
  const { events: rawEvents, loading, error } = useAdminEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events: AdminEventResponse[] = Array.isArray(rawEvents) ? rawEvents : []

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<(typeof FILTERS)[number]>("all")

  // ── Stats ──
  const totalEvents = events.length

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
    <>
    <div className="adb-page el-desktop-only">
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

        {/* ── EVENTS ── */}
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

      </div>
    </div>

    <div className="el-mobile-only">
      <MobileEventList
        heading="Event Dashboard"
        subheading="Botleague Admin"
        totalCount={totalEvents}
        completedCount={completedCount}
        upcomingCount={upcomingCount}
        liveCount={liveCount}
        search={search}
        onSearchChange={setSearch}
        statusFilter={filterStatus}
        onStatusFilterChange={v => setFilterStatus(v as (typeof FILTERS)[number])}
        statusOptions={FILTERS.map(f => ({ value: f, label: f === "all" ? "All" : STATUS_LABEL[f] }))}
        loading={loading}
        onSelectEvent={id => navigate(`/admin/event/${id}`)}
        onCreateEvent={() => navigate("/admin/events/create")}
        events={filteredEvents.map(event => ({
          id: event.id,
          eventName: event.eventName,
          organizationName: event.organizationName,
          city: event.city,
          state: event.state,
          venueName: event.venueName,
          startDate: event.startDate,
          status: normalizeStatus(event.status),
          statusLabel: STATUS_LABEL[normalizeStatus(event.status)],
          sportsCount: event.sports?.length ?? 0,
          registeredCount: event.sports?.reduce((sum, s) => sum + (s.registeredTeamsCount || 0), 0) ?? 0,
          imageUrl: event.eventThumbnailUrl || event.eventLogoUrl,
        }))}
      />
    </div>
    </>
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
