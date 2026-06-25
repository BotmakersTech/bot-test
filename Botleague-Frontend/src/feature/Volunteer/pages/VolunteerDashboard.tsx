import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

interface VolunteerInfo {
  id: string
  eventId: string
  name: string
  dutyStation?: string
  shift?: string
  checkedInAt?: string
  checkedOutAt?: string
}

export default function VolunteerDashboard() {
  const [assignments] = useState<VolunteerInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch volunteer's own records (if a dedicated endpoint exists later)
    setLoading(false)
  }, [])

  const checkedIn  = assignments.filter(a => a.checkedInAt && !a.checkedOutAt).length
  const pending    = assignments.filter(a => !a.checkedInAt).length

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Volunteer Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your event assignments and check-in status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Assignments",  value: assignments.length, color: "text-white" },
          { label: "Checked In",   value: checkedIn,          color: "text-green-400" },
          { label: "Pending",      value: pending,            color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Check In / Out",  href: "/volunteer/checkin",  icon: "✅" },
          { label: "My Event",        href: "/volunteer/event",    icon: "📋" },
          { label: "My Schedule",     href: "/volunteer/schedule", icon: "📅" },
          { label: "Notifications",   href: "/notifications",      icon: "🔔" },
        ].map(l => (
          <Link key={l.label} to={l.href}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0e0e10] px-4 py-3 hover:border-[#fa4715]/30 hover:bg-white/[0.02] transition-colors">
            <span className="text-xl">{l.icon}</span>
            <span className="text-sm text-neutral-300">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Current assignment card */}
      {assignments.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-neutral-400 text-sm">No volunteer assignments found yet.</p>
          <p className="text-neutral-600 text-xs mt-1">Your organiser will assign your duty station.</p>
        </div>
      )}
    </div>
  )
}
