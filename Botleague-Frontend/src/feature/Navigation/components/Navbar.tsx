import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"

import {
  BellIcon,
  UserCircleIcon,
  SettingsGearIcon,
  ChatIcon,
  SearchIcon,
  LiveIcon,
  AnalyticsIcon,
  QuickActionsIcon,
} from "./Icons/Icons"
import { useAppDispatch } from "../../../app/hooks"
import { fetchUnreadCount } from "../../Notifications/store/notificationSlice"
import { myInvitations } from "../../UserDashboard/api/userMembership.api"
import type { RootState } from "../../../app/store"
import { getPrimaryRole } from "../../../shared/config/sidebarConfig"
import { AppRole } from "../../../shared/constants/roles"

const LOGO_URL = "https://botleague.in/logo/bot.png"

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </button>
  )
}

function NotificationButton({ unreadCount, onClick }: { unreadCount: number; onClick: () => void }) {
  return (
    <IconButton label={`Notifications (${unreadCount} unread)`} onClick={onClick}>
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-[#8C6CFF] text-[10px] font-bold text-white ring-2 ring-[#111111] px-0.5">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </IconButton>
  )
}

// ── Competitor / Organizer navbar actions ──────────────────────────────────

function CompetitorNavActions({
  unreadCount,
  pendingInvites,
}: {
  unreadCount: number
  pendingInvites: number
}) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {pendingInvites > 0 && (
        <IconButton
          label={`${pendingInvites} pending team invite${pendingInvites !== 1 ? "s" : ""}`}
          onClick={() => navigate("/my-team")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-[#8C6CFF] text-[10px] font-bold text-white ring-2 ring-[#111111] px-0.5">
            {pendingInvites > 9 ? "9+" : pendingInvites}
          </span>
        </IconButton>
      )}
      <IconButton label="Messages" onClick={() => navigate("/messages")}>
        <ChatIcon className="h-5 w-5" />
      </IconButton>
      <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} />
      <span data-tour="navbar-profile">
        <IconButton label="Profile" onClick={() => navigate("/profile")}>
          <UserCircleIcon className="h-[22px] w-[22px]" />
        </IconButton>
      </span>
      <IconButton label="Settings" onClick={() => navigate("/settings")}>
        <SettingsGearIcon className="h-5 w-5" />
      </IconButton>
    </div>
  )
}

// ── Admin navbar actions ───────────────────────────────────────────────────

function AdminNavActions({ unreadCount }: { unreadCount: number }) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(query.trim())}`)
      setQuery("")
      setSearchOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {searchOpen ? (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => { if (!query) setSearchOpen(false) }}
            placeholder="Search…"
            className="h-9 rounded-lg border border-white/10 bg-white/[0.08] px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8C6CFF]/60 focus:bg-white/[0.12] w-52 transition-colors"
          />
        </form>
      ) : (
        <IconButton label="Global Search" onClick={() => setSearchOpen(true)}>
          <SearchIcon className="h-5 w-5" />
        </IconButton>
      )}
      <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} />
      <IconButton label="Quick Actions" onClick={() => navigate("/admin/user")}>
        <QuickActionsIcon className="h-5 w-5" />
      </IconButton>
      <IconButton label="Profile" onClick={() => navigate("/profile")}>
        <UserCircleIcon className="h-[22px] w-[22px]" />
      </IconButton>
      <IconButton label="Settings" onClick={() => navigate("/settings")}>
        <SettingsGearIcon className="h-5 w-5" />
      </IconButton>
    </div>
  )
}

// ── Super Admin navbar actions ─────────────────────────────────────────────

function SuperAdminNavActions({ unreadCount }: { unreadCount: number }) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(query.trim())}`)
      setQuery("")
      setSearchOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {searchOpen ? (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => { if (!query) setSearchOpen(false) }}
            placeholder="Search…"
            className="h-9 rounded-lg border border-white/10 bg-white/[0.08] px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8C6CFF]/60 focus:bg-white/[0.12] w-52 transition-colors"
          />
        </form>
      ) : (
        <IconButton label="Global Search" onClick={() => setSearchOpen(true)}>
          <SearchIcon className="h-5 w-5" />
        </IconButton>
      )}
      <IconButton label="Live Events" onClick={() => navigate("/admin/user")}>
        <LiveIcon className="h-5 w-5" />
      </IconButton>
      <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} />
      <IconButton label="Analytics Snapshot" onClick={() => navigate("/admin/analytics")}>
        <AnalyticsIcon className="h-5 w-5" />
      </IconButton>
      <IconButton label="Profile" onClick={() => navigate("/profile")}>
        <UserCircleIcon className="h-[22px] w-[22px]" />
      </IconButton>
      <IconButton label="System Settings" onClick={() => navigate("/settings")}>
        <SettingsGearIcon className="h-5 w-5" />
      </IconButton>
    </div>
  )
}

// ── Root Navbar ────────────────────────────────────────────────────────────

export default function Navbar() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount)
  const user = useSelector((state: RootState) => state.auth.user)
  const [pendingInvites, setPendingInvites] = useState(0)

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : [])
  const primaryRole = getPrimaryRole(userRoles)

  useEffect(() => {
    dispatch(fetchUnreadCount())
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 30_000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    if (primaryRole !== AppRole.COMPETITOR && primaryRole !== AppRole.EVENT_HEAD) return
    const load = () => {
      myInvitations()
        .then(invites => setPendingInvites(invites.length))
        .catch(() => setPendingInvites(0))
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [primaryRole])

  return (
    <header
      style={{ background: "#111111" }}
      className="flex h-18 shrink-0 items-center justify-between border-b border-white/[0.08] px-4 sm:px-6"
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="BotLeague home"
        className="flex items-center"
      >
        <img
          src={LOGO_URL}
          alt="BotLeague"
          className="h-11.5 w-auto select-none"
          draggable={false}
        />
      </button>

      {primaryRole === AppRole.SUPER_ADMIN ? (
        <SuperAdminNavActions unreadCount={unreadCount} />
      ) : primaryRole === AppRole.ADMIN ? (
        <AdminNavActions unreadCount={unreadCount} />
      ) : (
        <CompetitorNavActions
          unreadCount={unreadCount}
          pendingInvites={pendingInvites}
        />
      )}
    </header>
  )
}
