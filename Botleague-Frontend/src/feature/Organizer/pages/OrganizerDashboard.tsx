import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  getMyEvents,
  getMySports,
  type OrganizerEvent,
  type OrganizerSport,
} from "../api/organizer.api"

// ─── date utils ──────────────────────────────────────────────────────────────

function today0(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0]
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function fmtFull(s?: string | null): string {
  if (!s) return "—"
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    })
  } catch { return s }
}

function inRange(key: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  return key >= start && key <= end
}

// ─── status helpers ──────────────────────────────────────────────────────────

type EventStatusKey = "live" | "upcoming" | "completed" | "draft"

function deriveEventStatus(status?: string | null): EventStatusKey {
  switch (status?.toUpperCase()) {
    case "LIVE":      return "live"
    case "PUBLISHED": return "upcoming"
    case "COMPLETED": return "completed"
    default:          return "draft"
  }
}

type RegKey = "OPEN" | "CLOSED" | "DRAFT"

function deriveRegStatus(s: OrganizerSport): RegKey {
  if (s.status === "REGISTRATION_OPEN")   return "OPEN"
  if (s.status === "REGISTRATION_CLOSED") return "CLOSED"
  return "DRAFT"
}

// ─── config maps ─────────────────────────────────────────────────────────────

const EVT_STYLE: Record<EventStatusKey, { label: string; color: string; bg: string }> = {
  live:      { label: "Live",      color: "#4ade80", bg: "rgba(74,222,128,.12)"  },
  upcoming:  { label: "Upcoming",  color: "#fa7545", bg: "rgba(250,117,69,.12)"  },
  completed: { label: "Completed", color: "#94a3b8", bg: "rgba(148,163,184,.12)" },
  draft:     { label: "Draft",     color: "#64748b", bg: "rgba(100,116,139,.12)" },
}

const REG_STYLE: Record<RegKey, { label: string; color: string; bg: string }> = {
  OPEN:   { label: "Reg Open",   color: "#4ade80", bg: "rgba(74,222,128,.10)"  },
  CLOSED: { label: "Reg Closed", color: "#f87171", bg: "rgba(248,113,113,.10)" },
  DRAFT:  { label: "Draft",      color: "#64748b", bg: "rgba(100,116,139,.10)" },
}

// ─── micro components ────────────────────────────────────────────────────────

function EventPill({ status }: { status: EventStatusKey }) {
  const c = EVT_STYLE[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: c.color, background: c.bg }}>
      {status === "live" && (
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: c.color }} />
      )}
      {c.label}
    </span>
  )
}

function RegPill({ reg }: { reg: RegKey }) {
  const c = REG_STYLE[reg]
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: c.color, background: c.bg }}>
      {c.label}
    </span>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5">
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="mt-1 text-xs text-neutral-400">{label}</div>
    </div>
  )
}

function SportLabel({ sport, weightClass }: { sport: string; weightClass?: string | null }) {
  return (
    <span>
      {sport}
      {weightClass && (
        <span className="ml-1.5 text-xs text-neutral-500">({weightClass})</span>
      )}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
      <p className="text-sm text-neutral-500">{text}</p>
    </div>
  )
}

function Skeleton({ n = 3, h = "h-16" }: { n?: number; h?: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`${h} animate-pulse rounded-xl bg-white/[0.04]`} />
      ))}
    </div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

type SportWithEvent = { sport: OrganizerSport; event: OrganizerEvent }

export default function OrganizerDashboard() {
  const base = useMemo(today0, [])

  const [events,  setEvents]  = useState<OrganizerEvent[]>([])
  const [sports,  setSports]  = useState<OrganizerSport[]>([])
  const [loading, setLoading] = useState(true)
  const [selDate, setSelDate] = useState<Date>(base)

  useEffect(() => {
    Promise.all([getMyEvents(), getMySports()])
      .then(([evs, sps]) => { setEvents(evs); setSports(sps) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // eventId → event lookup
  const eventMap = useMemo(() => {
    const m: Record<string, OrganizerEvent> = {}
    events.forEach(e => { m[e.id] = e })
    return m
  }, [events])

  // pair every sport with its parent event
  const paired = useMemo<SportWithEvent[]>(() =>
    sports.flatMap(s => {
      const ev = eventMap[s.eventId]
      return ev ? [{ sport: s, event: ev }] : []
    }),
    [sports, eventMap]
  )

  // KPIs
  const totalEvents = events.length
  const totalSports = sports.length
  const liveSports  = useMemo(
    () => paired.filter(p => deriveEventStatus(p.event.status) === "live").length,
    [paired]
  )

  // 5-day bar
  const dateDays = useMemo(
    () => [-2, -1, 0, 1, 2].map(n => addDays(base, n)),
    [base]
  )
  const todayKey = toISO(base)
  const selKey   = toISO(selDate)

  // schedule: sports whose parent event spans selDate, sorted by sport name
  const schedule = useMemo(() =>
    paired
      .filter(p => inRange(selKey, p.event.startDate, p.event.endDate))
      .sort((a, b) => a.sport.sport.localeCompare(b.sport.sport)),
    [paired, selKey]
  )

  // upcoming: parent event starts after selDate, next 5
  const upcoming = useMemo(() =>
    paired
      .filter(p => (p.event.startDate ?? "") > selKey)
      .sort((a, b) => (a.event.startDate ?? "").localeCompare(b.event.startDate ?? ""))
      .slice(0, 5),
    [paired, selKey]
  )

  // live: parent event is LIVE
  const liveList = useMemo(() =>
    paired.filter(p => deriveEventStatus(p.event.status) === "live"),
    [paired]
  )

  return (
    <div className="min-h-full p-6 space-y-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-white">Organiser Dashboard</h1>
        <p className="text-sm text-neutral-500">Daily event operations at a glance</p>
      </div>

      {/* ── KPI Cards ── */}
      {loading
        ? <div className="grid grid-cols-3 gap-4"><Skeleton n={3} h="h-20" /></div>
        : (
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Total Events"       value={totalEvents} accent="#e2e8f0" />
            <KpiCard label="Total Event Sports" value={totalSports} accent="#60a5fa" />
            <KpiCard label="Live Event Sports"  value={liveSports}  accent="#4ade80" />
          </div>
        )
      }

      {/* ── Schedule ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-neutral-200">Schedule</h2>

        {/* Date bar */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {dateDays.map(d => {
            const key      = toISO(d)
            const isToday  = key === todayKey
            const isSel    = key === selKey
            return (
              <button
                key={key}
                onClick={() => setSelDate(d)}
                className={[
                  "shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                  isSel
                    ? "border-[#fa4715] bg-[#fa4715]/10 text-[#fa4715]"
                    : "border-white/[0.06] bg-[#0e0e10] text-neutral-400 hover:border-white/10 hover:text-neutral-200",
                ].join(" ")}
              >
                {isToday && <span className="mr-1 text-[10px] opacity-70">★</span>}
                {fmtDay(d)}
              </button>
            )
          })}
        </div>

        {/* Schedule cards */}
        {loading ? (
          <Skeleton n={3} />
        ) : schedule.length === 0 ? (
          <EmptyState text="No event sports are scheduled for this day." />
        ) : (
          <div className="space-y-2">
            {schedule.map(({ sport, event }) => {
              const evStatus = deriveEventStatus(event.status)
              const regStatus = deriveRegStatus(sport)
              return (
                <div key={sport.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-200">
                      <SportLabel sport={sport.sport} weightClass={sport.weightClass} />
                    </p>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {event.eventName}
                      {event.venueName && <> &middot; {event.venueName}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <EventPill status={evStatus} />
                    <RegPill   reg={regStatus}  />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Bottom two columns ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Upcoming Sports */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-200">Upcoming Sports</h2>
            <Link to="/organizer/events" className="text-xs text-[#fa4715] hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <Skeleton n={3} />
          ) : upcoming.length === 0 ? (
            <EmptyState text="No upcoming sports after the selected date." />
          ) : (
            <div className="space-y-2">
              {upcoming.map(({ sport, event }) => (
                <div key={sport.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-200">
                        <SportLabel sport={sport.sport} weightClass={sport.weightClass} />
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">{event.eventName}</p>
                    </div>
                    <RegPill reg={deriveRegStatus(sport)} />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Starts: <span className="text-neutral-400">{fmtFull(event.startDate)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live Sports */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-200">Live Sports</h2>
            {liveList.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                {liveList.length} live
              </span>
            )}
          </div>
          {loading ? (
            <Skeleton n={2} h="h-20" />
          ) : liveList.length === 0 ? (
            <EmptyState text="No sports are live right now." />
          ) : (
            <div className="space-y-2">
              {liveList.map(({ sport, event }) => (
                <div key={sport.id}
                  className="rounded-xl border border-green-500/20 bg-green-500/[0.04] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-400 animate-pulse" />
                        <p className="truncate text-sm font-medium text-neutral-200">
                          <SportLabel sport={sport.sport} weightClass={sport.weightClass} />
                        </p>
                      </div>
                      <p className="mt-0.5 pl-4 truncate text-xs text-neutral-500">{event.eventName}</p>
                      {event.venueName && (
                        <p className="pl-4 truncate text-xs text-neutral-600">{event.venueName}</p>
                      )}
                    </div>
                    <Link
                      to={`/organizer/matches?sport=${sport.id}`}
                      className="shrink-0 rounded-lg border border-[#fa4715]/30 px-2.5 py-1 text-xs text-[#fa4715] transition-colors hover:bg-[#fa4715]/10">
                      Manage
                    </Link>
                  </div>
                  {(sport.registeredTeamsCount !== undefined && sport.registeredTeamsCount !== null) && (
                    <p className="mt-2 pl-4 text-xs text-neutral-500">
                      {sport.registeredTeamsCount} team{sport.registeredTeamsCount !== 1 ? "s" : ""} registered
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
