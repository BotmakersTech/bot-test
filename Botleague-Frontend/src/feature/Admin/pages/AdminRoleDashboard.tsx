import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Users, Bot, ShieldCheck } from "lucide-react"
import { useAppSelector } from "../../../app/hooks"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import { listUsers } from "../../SuperAdmin/api/userManagement.api"
import { searchAdminRobots } from "../../SuperAdmin/api/robotManagement.api"
import { searchAdminTeams } from "../../SuperAdmin/api/teamManagement.api"

const FONT_HEADING = "'Sarpanch', sans-serif"

function normalizeStatus(s?: string) {
  const v = s?.toLowerCase() ?? ""
  if (v === "live" || v === "ongoing") return "live"
  if (v === "completed") return "completed"
  return "upcoming"
}

// ── large stat card (Total Users / Robots / Teams) ─────────────────────────

function LargeCard({
  label, value, icon, href, loading,
}: { label: string; value: number; icon: React.ReactNode; href: string; loading: boolean }) {
  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-[22px] p-8 shadow-[0_10px_25px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_18px_rgba(1,98,209,0.12)]"
      style={{ background: "linear-gradient(135deg, #d7ebff 0%, #e7ddff 100%)" }}
    >
      <div
        className="absolute right-6 top-6 flex h-13 w-13 items-center justify-center rounded-2xl text-white transition-colors group-hover:bg-[#0052b4]"
        style={{ background: "#0162D1" }}
      >
        {icon}
      </div>
      <h2 className="mb-4 text-2xl font-semibold text-[#1d1d1d]">{label}</h2>
      <div className="text-[64px] font-semibold leading-none text-[#111] transition-colors group-hover:text-[#0162D1] sm:text-[76px]">
        {loading ? "—" : value.toLocaleString("en-IN")}
      </div>
    </Link>
  )
}

// ── small stat card (event breakdown) ───────────────────────────────────────

function SmallCard({
  title, value, href, linkLabel, loading,
}: { title: string; value: number; href: string; linkLabel: string; loading: boolean }) {
  return (
    <div
      className="flex h-[210px] flex-col justify-between rounded-[20px] p-[22px] shadow-[0_8px_20px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-[3px]"
      style={{ background: "linear-gradient(135deg, #eef6ff, #f5efff)" }}
    >
      <div>
        <h3 className="mb-4 text-[22px] font-semibold text-[#1d1d1d]">{title}</h3>
        <div className="text-[52px] font-semibold leading-none text-[#111]">{loading ? "—" : value}</div>
      </div>
      <Link to={href} className="text-lg font-semibold text-[#0162D1] transition-all hover:tracking-wide">
        {linkLabel} →
      </Link>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function AdminRoleDashboard() {
  const authUser = useAppSelector((s) => s.auth.user)

  const [totalUsers, setTotalUsers]   = useState(0)
  const [totalRobots, setTotalRobots] = useState(0)
  const [totalTeams, setTotalTeams]   = useState(0)
  const [events, setEvents]           = useState<AdminEventResponse[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      listUsers(undefined, 0, 1).catch(() => null),
      searchAdminRobots(undefined, undefined, undefined, 0, 1).catch(() => null),
      searchAdminTeams(undefined, 0, 1).catch(() => null),
      getAllEvents().catch(() => []),
    ]).then(([usersRes, robotsRes, teamsRes, eventsRes]) => {
      setTotalUsers(usersRes?.totalElements ?? 0)
      setTotalRobots(robotsRes?.totalElements ?? 0)
      setTotalTeams(teamsRes?.totalElements ?? 0)
      setEvents(eventsRes)
    }).finally(() => setLoading(false))
  }, [])

  const live      = events.filter(e => normalizeStatus(e.status) === "live").length
  const upcoming  = events.filter(e => normalizeStatus(e.status) === "upcoming").length
  const completed = events.filter(e => normalizeStatus(e.status) === "completed").length
  const totalSports = events.reduce((n, e) => n + (e.sports?.length ?? 0), 0)

  return (
    <div className="min-h-full p-6 md:p-10" style={{ background: "#fafafa" }}>
      <h1
        className="mb-9 text-[32px] font-semibold tracking-wide text-[#0162D1] md:text-[38px]"
        style={{ fontFamily: FONT_HEADING }}
      >
        Welcome back, {authUser?.firstName || "Admin"}!
      </h1>

      {/* ── Large cards ── */}
      <div className="mb-9 grid grid-cols-1 gap-7 md:grid-cols-3">
        <LargeCard label="Total Users"  value={totalUsers}  icon={<Users size={24} />}      href="/admin/users"  loading={loading} />
        <LargeCard label="Total Robots" value={totalRobots} icon={<Bot size={24} />}         href="/admin/robots" loading={loading} />
        <LargeCard label="Total Teams"  value={totalTeams}  icon={<ShieldCheck size={24} />} href="/admin/teams"  loading={loading} />
      </div>

      {/* ── Small cards ── */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 md:grid-cols-5">
        <SmallCard title="Total Events" value={events.length} href="/admin/user"  linkLabel="All Events"     loading={loading} />
        <SmallCard title="Live Events"  value={live}           href="/admin/user"  linkLabel="View Live"      loading={loading} />
        <SmallCard title="Upcoming"     value={upcoming}        href="/admin/user"  linkLabel="View Upcoming"  loading={loading} />
        <SmallCard title="Completed"    value={completed}       href="/admin/user"  linkLabel="View Completed" loading={loading} />
        <SmallCard title="Total Sports" value={totalSports}     href="/admin/sports" linkLabel="All Sports"    loading={loading} />
      </div>
    </div>
  )
}
