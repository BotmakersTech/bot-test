import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { CalendarClock, CheckCircle2, HeartHandshake, Layers, MapPin, Timer } from "lucide-react"
import type { RootState } from "../../../app/store"
import RoleHeroDashboard from "../../../shared/components/RoleHeroDashboard"
import { getMyVolunteerAssignments, type VolunteerAssignment } from "../../Event/api/volunteerApplication.api"

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function VolunteerDashboard() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    getMyVolunteerAssignments()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false))
  }, [])

  const approved = assignments.filter(a => a.status === "APPROVED")
  const pending  = assignments.filter(a => a.status === "PENDING")
  const checkedIn = approved.filter(a => a.checkedInAt && !a.checkedOutAt)

  const sortedApproved = [...approved].sort((a, b) => {
    const at = a.eventStartDate ? new Date(a.eventStartDate).getTime() : 0
    const bt = b.eventStartDate ? new Date(b.eventStartDate).getTime() : 0
    return bt - at
  })
  const [latest, ...rest] = sortedApproved
  const miniEvents = rest.slice(0, 2).map(a => a.eventName || "Event")

  const featuredEvent = latest ? {
    title: latest.eventName || "Event",
    tag: latest.checkedOutAt ? "Completed" : latest.checkedInAt ? "Checked In" : "Confirmed",
    meta: [
      ...(latest.dutyStation ? [{ icon: <MapPin size={14} />, label: "Duty", value: latest.dutyStation }] : []),
      ...(latest.shift ? [{ icon: <Timer size={14} />, label: "Shift", value: latest.shift.replace("_", " ") }] : []),
      ...(latest.eventStartDate ? [{ icon: <CalendarClock size={14} />, label: "Date", value: fmtDate(latest.eventStartDate) }] : []),
      ...(latest.eventCity ? [{ icon: <MapPin size={14} />, label: "City", value: latest.eventCity }] : []),
    ],
    onView: () => navigate(`/events/${latest.eventId}`),
    viewLabel: "View Event",
  } : null

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "Volunteer"

  return (
    <div className="min-h-full p-6 space-y-8">
      <RoleHeroDashboard
        name={fullName}
        photoUrl={user?.profilePhotoUrl}
        idLabel="Volunteer ID"
        idValue={user?.botleagueId || "—"}
        roleLabel="Event Volunteer"
        roleIcon={<HeartHandshake size={16} />}
        active
        stat1={{ value: approved.length, label: "Confirmed Events", icon: <CheckCircle2 size={22} /> }}
        stat2={{ value: pending.length, label: "Pending Applications", icon: <Timer size={22} /> }}
        stat3={{ value: assignments.length, label: "Total Applications", icon: <Layers size={22} /> }}
        miniEvents={miniEvents}
        featuredEvent={featuredEvent}
        emptyEventsLabel="No confirmed events yet — apply to volunteer from any event's page to get started."
        achievement1={{ label: "3+ Events Volunteered", status: approved.length >= 3 ? "Unlocked" : `${approved.length}/3`, unlocked: approved.length >= 3, icon: <HeartHandshake size={26} /> }}
        achievement2={{ label: "10+ Events Volunteered", status: approved.length >= 10 ? "Unlocked" : `${approved.length}/10`, unlocked: approved.length >= 10, icon: <Layers size={26} /> }}
      />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Check In / Out",  href: "/volunteer/checkin",  icon: "✅" },
          { label: "My Event",        href: "/volunteer/event",    icon: "📋" },
          { label: "My Schedule",     href: "/volunteer/schedule", icon: "📅" },
        ].map(l => (
          <Link key={l.label} to={l.href}
            className="flex items-center gap-3 rounded-xl border border-[#4b86e8]/20 bg-white px-4 py-3 hover:border-[#0162D1]/40 hover:bg-[#0162D1]/3 transition-colors">
            <span className="text-xl">{l.icon}</span>
            <span className="text-sm text-[#374151] font-medium">{l.label}</span>
          </Link>
        ))}
      </div>

      {checkedIn.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-green-600 mb-3 uppercase tracking-wide">Currently Checked In</h2>
          <div className="space-y-2">
            {checkedIn.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111]">{a.eventName || "Event"}</p>
                  <p className="text-xs text-[#6b7280]">{a.dutyStation || "No duty station set"}{a.shift ? ` · ${a.shift.replace("_", " ")}` : ""}</p>
                </div>
                <span className="text-xs font-bold text-green-600">CHECKED IN</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#b45309] mb-3 uppercase tracking-wide">Awaiting Review</h2>
          <div className="space-y-2">
            {pending.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-[#4b86e8]/20 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111]">{a.eventName || "Event"}</p>
                  <p className="text-xs text-[#6b7280]">Applied {fmtDate(a.appliedAt)}</p>
                </div>
                <span className="text-xs font-semibold text-[#b45309]">PENDING</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && assignments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#6b7280] text-sm">No volunteer applications yet.</p>
          <p className="text-[#9ca3af] text-xs mt-1">Visit any event page to apply.</p>
        </div>
      )}
    </div>
  )
}
