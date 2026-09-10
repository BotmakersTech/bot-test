import { CalendarDays, CheckCircle2, Radio, Search, MapPin, Trophy, Plus } from "lucide-react"
import "./MobileEventList.css"

// Mobile view of the events list/dashboard page (mockup: "Eventdashboardmobile.jsx").
// Shared by AdminDashboard.tsx (/admin/user) and OrganizerEventsPage.tsx
// (/organizer/events, the Event Head / Sport Head "my techfests" list) via the
// same .el-desktop-only/.el-mobile-only toggle every dual-render page in
// this codebase uses — each page normalizes its own event shape into
// MobileEventListItem[] and passes real, already-fetched data down.

export interface MobileEventListItem {
  id: string
  eventName: string
  organizationName?: string | null
  city?: string | null
  state?: string | null
  venueName?: string | null
  startDate?: string | null
  status: string
  statusLabel: string
  sportsCount: number
  registeredCount: number
  imageUrl?: string | null
}

export interface MobileEventListFilter {
  value: string
  label: string
}

export interface MobileEventListProps {
  heading: string
  subheading?: string
  totalCount: number
  completedCount: number
  upcomingCount: number
  liveCount: number
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  statusOptions: MobileEventListFilter[]
  events: MobileEventListItem[]
  loading: boolean
  onSelectEvent: (id: string) => void
  onCreateEvent?: () => void
}

const fmtDate = (d?: string | null) => {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return d
  }
}

export default function MobileEventList({
  heading, subheading, totalCount, completedCount, upcomingCount, liveCount,
  search, onSearchChange, statusFilter, onStatusFilterChange, statusOptions,
  events, loading, onSelectEvent, onCreateEvent,
}: MobileEventListProps) {
  return (
    <div className="el-m-root">
      <div className="el-m-top-row">
        <h1 className="el-m-title">{heading}</h1>
        {onCreateEvent && (
          <button type="button" className="el-m-create-btn" onClick={onCreateEvent} aria-label="Create event">
            <Plus size={16} />
          </button>
        )}
      </div>
      {subheading && <p className="el-m-subtitle">{subheading}</p>}

      {/* Filter tabs */}
      <div className="el-m-tabs-scroll">
        {statusOptions.map(f => (
          <button
            key={f.value}
            type="button"
            className={`el-m-tab${statusFilter === f.value ? " active" : ""}`}
            onClick={() => onStatusFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="el-m-stats-scroll">
        <div className="el-m-stat-card">
          <div className="el-m-stat-label">Total Techfests</div>
          <div className="el-m-stat-value">{totalCount}</div>
          <div className="el-m-stat-icon-box"><CalendarDays size={20} /></div>
        </div>
        <div className="el-m-stat-card">
          <div className="el-m-stat-label">Completed</div>
          <div className="el-m-stat-value">{completedCount}</div>
          <div className="el-m-stat-icon-box"><CheckCircle2 size={20} /></div>
        </div>
        <div className="el-m-stat-card dark">
          <div className="el-m-stat-label">Upcoming</div>
          <div className="el-m-stat-value">{upcomingCount}</div>
          <div className="el-m-stat-icon-box"><Trophy size={20} /></div>
        </div>
        <div className="el-m-stat-card dark">
          <div className="el-m-stat-label">Live Now</div>
          <div className="el-m-stat-value">{liveCount}</div>
          <div className="el-m-stat-icon-box"><Radio size={20} /></div>
        </div>
      </div>

      {/* Search */}
      <div className="el-m-search-row">
        <div className="el-m-search-box">
          <input
            className="el-m-search-input"
            placeholder="Search techfests…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          <span className="el-m-search-btn"><Search size={16} /></span>
        </div>
      </div>

      {/* Event cards */}
      {loading ? (
        <div className="el-m-empty">Loading techfests…</div>
      ) : events.length === 0 ? (
        <div className="el-m-empty">No techfests found</div>
      ) : (
        <div className="el-m-events-list">
          {events.map(ev => (
            <div className="el-m-event-card" key={ev.id} onClick={() => onSelectEvent(ev.id)}>
              {ev.imageUrl ? (
                <div className="el-m-event-thumb" style={{ backgroundImage: `url(${ev.imageUrl})` }} />
              ) : (
                <div className="el-m-event-thumb el-m-event-thumb-fallback">{(ev.eventName?.[0] ?? "E").toUpperCase()}</div>
              )}
              <div className="el-m-event-info">
                <span className={`el-m-event-status el-m-status-${ev.status.toLowerCase()}`}>{ev.statusLabel}</span>
                <h3 className="el-m-event-name">{ev.eventName}</h3>
                <div className="el-m-event-stats">
                  <div>
                    <div className="el-m-event-stat-value">{ev.sportsCount}</div>
                    <div className="el-m-event-stat-label">Techsports</div>
                  </div>
                  <div>
                    <div className="el-m-event-stat-value">{ev.registeredCount}</div>
                    <div className="el-m-event-stat-label">Registered</div>
                  </div>
                </div>
                <div className="el-m-event-meta">
                  <div className="el-m-event-meta-row">
                    <MapPin size={11} />
                    <span>{[ev.city, ev.state].filter(Boolean).join(", ") || ev.venueName || "—"}</span>
                  </div>
                  <div className="el-m-event-meta-row">
                    <CalendarDays size={11} />
                    <span>{fmtDate(ev.startDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
