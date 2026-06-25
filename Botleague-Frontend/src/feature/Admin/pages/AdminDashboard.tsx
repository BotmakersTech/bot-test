"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  CalendarDays, Trophy, Users, Search, MapPin, Building2, Calendar,
  Activity, Plus, ShieldCheck, AlertCircle, CheckCircle2, Clock, Trash2,
  FileEdit, Zap
} from "lucide-react"
import { useAdminEvents } from "../hooks/useAdmin"
import type { AdminEventResponse } from "../api/admin.api"
import { getRecentAuditLogs, type AuditLogEntry } from "../api/auditLog.api"
import { Link } from "react-router-dom"
import TierBadge from "../../../shared/components/TierBadge"

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: boolean }> = {
  live: {
    label: "Live",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.13)",
    border: "rgba(74,222,128,0.3)",
    dot: true
  },
  upcoming: {
    label: "Published",
    color: "#fa7545",
    bg: "rgba(250,71,21,0.12)",
    border: "rgba(250,71,21,0.28)",
    dot: false
  },
  draft: {
    label: "Draft",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.28)",
    dot: false
  },
  completed: {
    label: "Completed",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.3)",
    dot: false
  },
  archived: {
    label: "Archived",
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
    border: "rgba(100,116,139,0.25)",
    dot: false
  }
}

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
// TOKENS
// =====================================================

const tokens = {
  accent: "#fa4715",
  accentHover: "rgba(250,71,21,0.88)",
  accentBg: "rgba(250,71,21,0.12)",
  accentBorder: "rgba(250,71,21,0.28)",
  border: "rgba(255,255,255,0.09)",
  borderHover: "rgba(250,71,21,0.38)",
  text: "#ffffff",
  textMuted: "#9ca3af",
  textSub: "#6b7280",
  textDim: "#d1d5db",
  radius: "12px",
  radiusLg: "18px",
}

// =====================================================
// PAGE
// =====================================================

export default function AdminEventsDashboard() {
  const { events: rawEvents, loading, error } = useAdminEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events: AdminEventResponse[] = Array.isArray(rawEvents) ? rawEvents : []

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

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

  const upcomingCount = events.filter(e => normalizeStatus(e?.status) === "upcoming").length
  const ongoingCount  = events.filter(e => normalizeStatus(e?.status) === "live").length

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
      <div style={styles.centerScreen}>
        <div style={styles.loadingSpinner} />
        <span style={{ color: tokens.textMuted, fontSize: "0.9rem", marginTop: "16px" }}>
          Loading events…
        </span>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.errorBox}>
          <Activity size={20} color="#f87171" />
          <span style={{ color: "#f87171" }}>{error}</span>
        </div>
      </div>
    )
  }

  // ── UI ──
  return (
    <div style={styles.page}>
      <style>{`.adm-two-col { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; } @media (max-width: 900px) { .adm-two-col { grid-template-columns: 1fr; } }`}</style>

      {/* Background glows */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.content}>

        {/* ── HEADER ── */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerEyebrow}>BotLeague Admin</div>
            <h1 style={styles.headerTitle}>Events Dashboard</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" as const }}>
            <div style={styles.headerMeta}>
              <span style={styles.headerMetaText}>
                {filteredEvents.length} of {totalEvents} events
              </span>
            </div>
            <Link to="/admin/events/create" style={styles.createBtn}>
              <Plus size={15} strokeWidth={2.5} />
              Create Event
            </Link>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={styles.statsGrid}>
          <StatCard
            title="Total Events"
            value={totalEvents}
            icon={<CalendarDays size={17} />}
          />
          <StatCard
            title="Total Teams"
            value={totalTeams}
            icon={<Users size={17} />}
          />
          <StatCard
            title="Upcoming"
            value={upcomingCount}
            icon={<Trophy size={17} />}
          />
          <StatCard
            title="Live Now"
            value={ongoingCount}
            icon={<Activity size={17} />}
            pulse={ongoingCount > 0}
          />
        </div>

        {/* ── FILTERS ── */}
        <div style={styles.filtersRow}>
          <div style={styles.searchWrapper}>
            <Search
              size={14}
              style={{
                position: "absolute", top: "50%", left: "12px",
                transform: "translateY(-50%)", color: tokens.textSub,
                pointerEvents: "none"
              }}
            />
            <input
              type="text"
              placeholder="Search events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.tabGroup}>
            {(["all", "draft", "upcoming", "live", "completed", "archived"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  ...styles.tabBtn,
                  ...(filterStatus === s ? styles.tabBtnActive : {})
                }}
              >
                {s === "all" ? "All"
                  : s === "live" ? "Live"
                  : s === "upcoming" ? "Published"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT: Events + Activity Feed ── */}
        <div className="adm-two-col">

          {/* Events column */}
          <div style={styles.eventsCol}>
            {filteredEvents.length === 0 ? (
              <div style={styles.emptyState}>
                <CalendarDays size={32} color="#334155" />
                <p style={{ color: tokens.textSub, marginTop: "12px" }}>No events match your filters</p>
              </div>
            ) : (
              <div style={styles.eventGrid}>
                {filteredEvents.map((event, idx) => (
                  <Link key={event.id || idx} to={`/admin/event/${event.id}`}>
                    <EventCard event={event} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed column */}
          <div style={styles.feedCol}>
            <div style={styles.feedHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color={tokens.accent} />
                <span style={styles.feedTitle}>Activity Feed</span>
              </div>
              <span style={styles.feedSubtitle}>Governance log</span>
            </div>

            <div style={styles.feedBody}>
              {activityLoading ? (
                <div style={styles.feedEmpty}>Loading…</div>
              ) : activityLogs.length === 0 ? (
                <div style={styles.feedEmpty}>No activity yet</div>
              ) : (
                activityLogs.map((log) => (
                  <ActivityRow key={log.id} log={log} />
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

// =====================================================
// EVENT CARD
// =====================================================

function EventCard({ event }: { event: AdminEventResponse }) {
  const [hovered, setHovered] = useState(false)

  const status = normalizeStatus(event.status)
  const cfg = STATUS_CONFIG[status]
  const totalTeams = event.sports?.reduce((sum, s) => sum + (s.registeredTeamsCount || 0), 0) ?? 0
  const sportsCount = event.sports?.length ?? 0

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered ? styles.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent top bar on hover */}
      <div style={{
        position: "absolute" as const,
        top: 0, left: 0, right: 0,
        height: "2px",
        background: "linear-gradient(90deg, #fa4715, #f97316)",
        borderRadius: "18px 18px 0 0",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s"
      }} />

      {/* Top row */}
      <div style={styles.cardTop}>
        <div style={styles.cardLeft}>
          {event.eventLogoUrl ? (
            <img src={event.eventLogoUrl} alt="" style={styles.eventLogo} />
          ) : (
            <div style={styles.eventLogoFallback}>
              {(event.eventName?.[0] ?? "E").toUpperCase()}
            </div>
          )}
          <div>
            <div style={styles.cardTitle}>{event.eventName}</div>
            <div style={styles.cardOrg}>{event.organizationName}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <TierBadge tier={event.tier} size="sm" />
          <StatusBadge config={cfg} />
        </div>
      </div>

      {/* Description */}
      {event.eventDescription && (
        <p style={styles.cardDesc}>{event.eventDescription}</p>
      )}

      {/* Meta */}
      <div style={styles.cardMeta}>
        <MetaItem icon={<MapPin size={13} />} text={`${event.city}, ${event.state}`} />
        <MetaItem icon={<Building2 size={13} />} text={event.venueName} />
        <MetaItem icon={<Calendar size={13} />} text={`${formatDate(event.startDate)} – ${formatDate(event.endDate)}`} />
      </div>

      {/* Sports & teams */}
      {sportsCount > 0 && (
        <div style={styles.cardFooter}>
          <div style={styles.sportsRow}>
            {event.sports?.map(sport => (
              <span key={sport.id} style={styles.sportChip}>
                {sport.sportName}
                {sport.registeredTeamsCount != null && (
                  <span style={styles.sportChipCount}>{sport.registeredTeamsCount}</span>
                )}
              </span>
            ))}
          </div>
          <div style={styles.teamsCount}>
            <Users size={12} />
            {totalTeams} teams
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({ config }: { config: typeof STATUS_CONFIG["ongoing"] }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 11px",
      borderRadius: "999px",
      background: config.bg,
      border: `1px solid ${config.border}`,
      fontSize: "0.71rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      color: config.color,
      whiteSpace: "nowrap" as const,
      flexShrink: 0
    }}>
      {config.dot && (
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: config.color,
          animation: "pulse 1.5s ease-in-out infinite"
        }} />
      )}
      {config.label}
    </div>
  )
}

// =====================================================
// META ITEM
// =====================================================

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={styles.metaItem}>
      <span style={{ color: tokens.textSub, display: "flex", alignItems: "center" }}>{icon}</span>
      <span>{text}</span>
    </div>
  )
}

// =====================================================
// STAT CARD  — single accent color (orange)
// =====================================================

function StatCard({
  title,
  value,
  icon,
  pulse
}: {
  title: string
  value: number
  icon: React.ReactNode
  pulse?: boolean
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <span style={styles.statLabel}>{title}</span>
        <div style={styles.statIconWrap}>
          {icon}
          {pulse && (
            <span style={{
              position: "absolute" as const,
              top: "3px", right: "3px",
              width: "7px", height: "7px",
              borderRadius: "50%",
              background: "#4ade80",
              animation: "pulse 1.5s ease-in-out infinite"
            }} />
          )}
        </div>
      </div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

// =====================================================
// ACTIVITY ROW
// =====================================================

const ACTION_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  EVENT_CREATED:          { icon: <Plus size={13} />,         color: "#4ade80", label: "Event Created" },
  EVENT_PUBLISHED:        { icon: <Zap size={13} />,          color: "#facc15", label: "Event Published" },
  EVENT_STATUS_CHANGED:   { icon: <FileEdit size={13} />,     color: "#60a5fa", label: "Status Changed" },
  EVENT_UPDATED:          { icon: <FileEdit size={13} />,     color: "#94a3b8", label: "Event Updated" },
  EVENT_DELETED:          { icon: <Trash2 size={13} />,       color: "#f87171", label: "Event Deleted" },
  ROBOT_REGISTERED:       { icon: <CheckCircle2 size={13} />, color: "#34d399", label: "Robot Registered" },
  REGISTRATION_CANCELLED: { icon: <AlertCircle size={13} />,  color: "#fb923c", label: "Registration Cancelled" },
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
  const meta = ACTION_META[log.action] ?? { icon: <Activity size={13} />, color: "#94a3b8", label: log.action }
  const actor = log.actorEmail
    ? log.actorEmail.split("@")[0]
    : log.actorId
      ? log.actorId.slice(0, 8) + "…"
      : "System"

  return (
    <div style={styles.activityRow}>
      <div style={{ ...styles.activityIcon, color: meta.color, border: `1px solid ${meta.color}30`, background: `${meta.color}12` }}>
        {meta.icon}
      </div>
      <div style={styles.activityContent}>
        <div style={styles.activityLabel}>{meta.label}</div>
        {log.entityName && (
          <div style={styles.activityEntity}>{log.entityName}</div>
        )}
        {(log.oldValue || log.newValue) && (
          <div style={styles.activityChange}>
            {log.oldValue && <span style={{ color: "#f87171" }}>{log.oldValue}</span>}
            {log.oldValue && log.newValue && <span style={{ color: "#6b7280", margin: "0 4px" }}>→</span>}
            {log.newValue && <span style={{ color: "#4ade80" }}>{log.newValue}</span>}
          </div>
        )}
        <div style={styles.activityMeta}>
          <Clock size={10} />
          {timeAgo(log.createdAt)}
          <span style={{ color: "#374151" }}>·</span>
          {actor}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// STYLES
// =====================================================

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 36px",
    minHeight: "100vh",
    background: "#282727",
    color: "#e2e8f0",
    fontFamily: "'Syne', 'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden"
  },
  glow1: {
    position: "absolute",
    top: "-180px", right: "-180px",
    width: "460px", height: "460px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(250,71,21,0.09), transparent 70%)",
    pointerEvents: "none"
  },
  glow2: {
    position: "absolute",
    bottom: "-200px", left: "-100px",
    width: "400px", height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(249,115,22,0.05), transparent 70%)",
    pointerEvents: "none"
  },
  content: {
    position: "relative",
    zIndex: 1
  },
  centerScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#282727"
  },
  loadingSpinner: {
    width: "36px", height: "36px",
    borderRadius: "50%",
    border: "2px solid rgba(250,71,21,0.2)",
    borderTop: "2px solid #fa4715",
    animation: "spin 0.8s linear infinite"
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px 24px",
    borderRadius: "12px",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)"
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "32px",
    flexWrap: "wrap" as const,
    gap: "12px"
  },
  headerEyebrow: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: tokens.accent,
    marginBottom: "5px"
  },
  headerTitle: {
    fontSize: "1.65rem",
    fontWeight: 800,
    color: "#f1f5f9",
    margin: 0,
    letterSpacing: "-0.02em"
  },
  headerMeta: {
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  headerMetaText: {
    fontSize: "0.8rem",
    color: tokens.textSub
  },
  createBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 20px",
    borderRadius: "10px",
    background: tokens.accent,
    color: "#fff",
    fontSize: "0.84rem",
    fontWeight: 700,
    textDecoration: "none",
    letterSpacing: "0.01em",
    border: "1px solid rgba(255,255,255,0.15)",
    whiteSpace: "nowrap" as const
  },

  // ── Stat card — single orange top border ──
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "28px"
  },
  statCard: {
    padding: "20px 22px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderTop: `2.5px solid ${tokens.accent}`,   // ← single unified accent color
    transition: "background 0.2s"
  },
  statLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: tokens.textSub,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const
  },
  statIconWrap: {
    width: "32px", height: "32px",
    borderRadius: "9px",
    background: tokens.accentBg,
    border: `1px solid ${tokens.accentBorder}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.accent,
    position: "relative" as const
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#f1f5f9",
    letterSpacing: "-0.02em"
  },

  // ── Filters ──
  filtersRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px",
    flexWrap: "wrap" as const
  },
  searchWrapper: {
    position: "relative" as const,
    flex: 1,
    minWidth: "180px"
  },
  searchInput: {
    width: "100%",
    padding: "9px 12px 9px 36px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.15s"
  },
  tabGroup: {
    display: "flex",
    gap: "4px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "5px"
  },
  tabBtn: {
    padding: "7px 15px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: tokens.textSub,
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const
  },
  tabBtnActive: {
    background: "linear-gradient(135deg, #ff4d4d, #fa4715)",
    color: "#fff"
  },

  // ── Empty state ──
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "70px 20px",
    borderRadius: "18px",
    border: "1px dashed rgba(255,255,255,0.09)"
  },

  // ── Two-column layout ──
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "20px",
    alignItems: "start",
  },
  eventsCol: {
    minWidth: 0
  },

  // ── Activity Feed ──
  feedCol: {
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    overflow: "hidden",
    position: "sticky" as const,
    top: "24px"
  },
  feedHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.07)"
  },
  feedTitle: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "0.02em"
  },
  feedSubtitle: {
    fontSize: "0.7rem",
    color: "#4b5563",
    fontWeight: 500
  },
  feedBody: {
    maxHeight: "680px",
    overflowY: "auto" as const,
    padding: "6px 0"
  },
  feedEmpty: {
    padding: "40px 20px",
    textAlign: "center" as const,
    color: "#4b5563",
    fontSize: "0.8rem"
  },

  // ── Activity row ──
  activityRow: {
    display: "flex",
    gap: "11px",
    padding: "11px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    alignItems: "flex-start"
  },
  activityIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  activityContent: {
    flex: 1,
    minWidth: 0
  },
  activityLabel: {
    fontSize: "0.77rem",
    fontWeight: 700,
    color: "#e2e8f0",
    lineHeight: 1.3
  },
  activityEntity: {
    fontSize: "0.72rem",
    color: "#64748b",
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  activityChange: {
    fontSize: "0.7rem",
    marginTop: "3px",
    display: "flex",
    alignItems: "center"
  },
  activityMeta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.67rem",
    color: "#4b5563",
    marginTop: "4px"
  },

  // ── Event grid & card ──
  eventGrid: {
    display: "grid",
    gap: "14px"
  },
  card: {
    padding: "22px 24px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "border-color 0.2s, background 0.2s",
    cursor: "pointer",
    position: "relative" as const,
    overflow: "hidden"
  },
  cardHover: {
    border: `1px solid ${tokens.borderHover}`,
    background: "rgba(250,71,21,0.04)"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "12px"
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0
  },
  eventLogo: {
    width: "42px", height: "42px",
    borderRadius: "11px",
    objectFit: "cover" as const,
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0
  },
  eventLogoFallback: {
    width: "42px", height: "42px",
    borderRadius: "11px",
    background: tokens.accentBg,
    border: `1px solid ${tokens.accentBorder}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.05rem",
    fontWeight: 800,
    color: tokens.accent,
    flexShrink: 0
  },
  cardTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1.3
  },
  cardOrg: {
    fontSize: "0.77rem",
    color: tokens.textSub,
    marginTop: "2px"
  },
  cardDesc: {
    fontSize: "0.82rem",
    color: "#94a3b8",
    lineHeight: 1.6,
    marginBottom: "13px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden"
  },
  cardMeta: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap" as const,
    marginBottom: "13px"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.77rem",
    color: tokens.textSub
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "13px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap" as const,
    gap: "8px"
  },
  sportsRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const
  },
  sportChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.09)",
    fontSize: "0.71rem",
    color: "#94a3b8",
    fontWeight: 600
  },
  sportChipCount: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "999px",
    padding: "1px 6px",
    fontSize: "0.67rem",
    color: "#cbd5e1"
  },
  teamsCount: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.75rem",
    color: tokens.textSub
  }
}