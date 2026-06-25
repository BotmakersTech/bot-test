import { useEffect, useState } from "react"
import api from "../../../shared/api/Base"

interface EventInfo {
  id: string
  eventCode: string
  eventName: string
  eventDescription?: string
  venueName?: string
  venueAddress?: string
  city?: string
  state?: string
  country?: string
  startDate?: string
  endDate?: string
  status: string
  organizationName?: string
}

function fmt(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    LIVE:      "bg-green-500/10 text-green-400",
    PUBLISHED: "bg-blue-500/10 text-blue-400",
    COMPLETED: "bg-neutral-500/10 text-neutral-400",
    DRAFT:     "bg-yellow-500/10 text-yellow-400",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status] ?? "bg-white/5 text-neutral-400"}`}>
      {status}
    </span>
  )
}

export default function VolunteerEventPage() {
  const [events, setEvents] = useState<EventInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Volunteers can view the live events they're assigned to
    api.get("/Events/live")
      .then(r => setEvents(r.data ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">My Event</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Details about the event you are volunteering at</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No active events found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(ev => (
            <div key={ev.id} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">{ev.eventName}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">{ev.eventCode}</p>
                </div>
                <StatusBadge status={ev.status} />
              </div>

              {ev.eventDescription && (
                <p className="text-sm text-neutral-400 leading-relaxed">{ev.eventDescription}</p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Organisation", value: ev.organizationName },
                  { label: "Venue", value: ev.venueName },
                  { label: "Address", value: [ev.venueAddress, ev.city, ev.state, ev.country].filter(Boolean).join(", ") },
                  { label: "Dates", value: `${fmt(ev.startDate)} – ${fmt(ev.endDate)}` },
                ].map(f => f.value ? (
                  <div key={f.label}>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold">{f.label}</p>
                    <p className="text-sm text-neutral-200 mt-0.5">{f.value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
