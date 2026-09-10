import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { Clock, ClipboardList, Award, type LucideIcon } from "lucide-react"
import type { RootState } from "../../../app/store"
import RoleHeroDashboard, { type RoleHeroRecentItem } from "../../../shared/components/RoleHeroDashboard"
import { getMyVolunteerAssignments, type VolunteerAssignment } from "../../Event/api/volunteerApplication.api"
import { getMyCertificates, type IssuedCertificate } from "../../Certificates/api/certificate.api"
import { resolveDashboardAvatarSrc } from "../../Profile/constants/avatars"

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function VolunteerDashboard() {
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([])
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)

  useEffect(() => {
    Promise.all([
      getMyVolunteerAssignments().catch(() => []),
      getMyCertificates().catch(() => []),
    ])
      .then(([a, c]) => { setAssignments(a); setCertificates(c) })
      .finally(() => setLoading(false))
  }, [])

  const approved = assignments.filter(a => a.status === "APPROVED")
  const pending  = assignments.filter(a => a.status === "PENDING")
  const checkedIn = approved.filter(a => a.checkedInAt && !a.checkedOutAt)

  const now = Date.now()
  const nextEvents = approved.filter(a => {
    const end = a.eventEndDate ? new Date(a.eventEndDate).getTime() : null
    const start = a.eventStartDate ? new Date(a.eventStartDate).getTime() : null
    return (end ?? start ?? 0) >= now
  })

  const totalHours = approved.reduce((sum, a) => {
    if (!a.checkedInAt || !a.checkedOutAt) return sum
    const ms = new Date(a.checkedOutAt).getTime() - new Date(a.checkedInAt).getTime()
    return ms > 0 ? sum + ms / 3_600_000 : sum
  }, 0)

  const sortedApproved = [...approved].sort((a, b) => {
    const at = a.eventStartDate ? new Date(a.eventStartDate).getTime() : 0
    const bt = b.eventStartDate ? new Date(b.eventStartDate).getTime() : 0
    return bt - at
  })

  const certByEventId = new Map(certificates.map(c => [c.eventId, c]))

  const recentItems: RoleHeroRecentItem[] = sortedApproved.slice(0, 5).map(a => {
    const cert = certByEventId.get(a.eventId)
    return {
      id: a.id,
      title: a.eventName || "Techfest",
      subtitle: [
        a.dutyStation || null,
        a.eventStartDate ? fmtDate(a.eventStartDate) : null,
      ].filter(Boolean).join(" · "),
      actionLabel: cert ? "View Certificate" : undefined,
      actionHref: cert?.pdfUrl,
    }
  })

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "Volunteer"

  return (
    <div className="min-h-full p-8 space-y-8">
      <RoleHeroDashboard
        welcomeName="Volunteer"
        name={fullName}
        photoUrl={resolveDashboardAvatarSrc(user?.profilePhotoUrl)}
        idLabel="Volunteer ID"
        idValue={user?.botleagueId || "—"}
        roleLabel="Techfest Volunteer"
        stat1Value={approved.length}
        stat1Label="Volunteered"
        stat2Value={nextEvents.length}
        stat2Label="Next Techfests"
        stat3Value={Math.round(totalHours)}
        stat3Label="Total Hours"
        stat3Icon={<Clock size={20} />}
        recentItemsTitle="Matches Volunteered"
        recentItems={recentItems}
        recentItemsEmptyText="No volunteer assignments yet."
        recentItemsHref="/volunteer/event"
        achievement1Label="3+ Techfests Volunteered"
        achievement1Sublabel="Volunteering"
        achievement1Achieved={approved.length >= 3}
        achievement2Label="10+ Techfests Volunteered"
        achievement2Sublabel="Volunteering"
        achievement2Achieved={approved.length >= 10}
      />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {[
          { label: "My Techfest",        href: "/volunteer/event", icon: ClipboardList },
          { label: "Certificates",    href: "/certificates",    icon: Award },
        ].map((l: { label: string; href: string; icon: LucideIcon }) => (
          <Link key={l.label} to={l.href}
            className="flex items-center gap-3 rounded-xl border border-[#4b86e8]/20 bg-white px-4 py-3 hover:border-[#0162D1]/40 hover:bg-[#0162D1]/3 transition-colors">
            <l.icon size={20} className="text-[#0162D1]" />
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
                  <p className="text-sm font-medium text-[#111]">{a.eventName || "Techfest"}</p>
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
                  <p className="text-sm font-medium text-[#111]">{a.eventName || "Techfest"}</p>
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
          <p className="text-[#9ca3af] text-xs mt-1">Visit any techfest page to apply.</p>
        </div>
      )}
    </div>
  )
}
