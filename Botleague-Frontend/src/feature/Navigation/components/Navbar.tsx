import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"

import {
  BellIcon,
  UserCircleIcon,
  ChatIcon,
  SearchIcon,
} from "./Icons/Icons"
import { useAppDispatch } from "../../../app/hooks"
import { fetchUnreadCount } from "../../Notifications/store/notificationSlice"
import { myInvitations } from "../../UserDashboard/api/userMembership.api"
import type { RootState } from "../../../app/store"
import { getPrimaryRole } from "../../../shared/config/sidebarConfig"
import { AppRole } from "../../../shared/constants/roles"
import LOGO_URL from "../../../assets/BrandLogo/BotLeaguewhite.png"
import LOGO_BLACK_URL from "../../../assets/BrandLogo/BotLeagu-black.png"
import MobileMoreMenu from "./MobileMoreMenu"
import "../../../styles/mobileNav.css"

function IconButton({
  children,
  label,
  onClick,
  light,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  /** Dark icon on a light circle — for the mobile bar's #F3F3F3 background,
      instead of the default white-on-transparent meant for the desktop
      gradient bar. */
  light?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        light
          ? "relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.06] text-[#1a1a2e] transition-colors hover:bg-black/[0.1]"
          : "relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
      }
    >
      {children}
    </button>
  )
}

function NotificationButton({ unreadCount, onClick, light }: { unreadCount: number; onClick: () => void; light?: boolean }) {
  return (
    <IconButton label={`Notifications (${unreadCount} unread)`} onClick={onClick} light={light}>
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className={`absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white px-0.5 ${light ? "ring-2 ring-[#F3F3F3]" : "ring-2 ring-[#4b86e8]"}`}>
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
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white ring-2 ring-[#4b86e8] px-0.5">
            {pendingInvites > 9 ? "9+" : pendingInvites}
          </span>
        </IconButton>
      )}
      <IconButton label="Messages" onClick={() => navigate("/messages")}>
        <ChatIcon className="h-5 w-5" />
      </IconButton>
      <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} />
      <IconButton label="Profile" onClick={() => navigate("/profile")}>
        <UserCircleIcon className="h-[22px] w-[22px]" />
      </IconButton>
    </div>
  )
}

// ── Admin navbar actions ───────────────────────────────────────────────────

function AdminNavActions({ unreadCount }: { unreadCount: number }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} />
      <IconButton label="Messages" onClick={() => navigate("/messages")}>
        <ChatIcon className="h-5 w-5" />
      </IconButton>
      <IconButton label="Profile" onClick={() => navigate("/profile")}>
        <UserCircleIcon className="h-[22px] w-[22px]" />
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
      <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} />
      <IconButton label="Profile" onClick={() => navigate("/profile")}>
        <UserCircleIcon className="h-[22px] w-[22px]" />
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
    // unreadCount already updates instantly via the realtime pushNotification
    // reducer — this poll is just a reconciliation safety net for reconnect
    // gaps / multi-tab drift, so it doesn't need to run every 30s.
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 5 * 60_000)
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
      className="app-navbar relative flex h-18 shrink-0 items-center justify-between min-[951px]:justify-end px-4 sm:px-6"
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="BotLeague home"
        className="flex items-center min-[951px]:absolute min-[951px]:top-1/2 min-[951px]:left-1/2 min-[951px]:-translate-x-1/2 min-[951px]:-translate-y-1/2"
      >
        {/* Black logo on the mobile bar's light background, white logo once
            the desktop gradient bar takes over at 951px+. Smaller on mobile
            — h-11 read oversized against the 72px bar and the 40px menu
            button next to it. Mobile keeps its original left-aligned flow
            position; only the desktop (951px+) logo is centered on the
            screen (absolute + the header's own relative positioning above),
            with the desktop action-icon row pushed to justify-end since the
            logo sits outside the flex flow at that width only. */}
        <img src={LOGO_BLACK_URL} alt="BotLeague" className="h-7 w-auto select-none min-[951px]:hidden" draggable={false} />
        <img src={LOGO_URL} alt="BotLeague" className="hidden h-11 w-auto select-none min-[951px]:inline" draggable={false} />
      </button>

      {/* > 950px only — the full per-role icon row (MobileMoreMenu covers
          this same ground, plus nav overflow + logout, at mobile widths). */}
      <div className="hidden items-center gap-1 sm:gap-2 min-[951px]:flex">
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
      </div>

      {/* <= 950px only — logo, Notifications (pulled out of the More menu
          so it's reachable in one tap), then the More menu toggle, which
          still covers every other account action (chat/profile/settings)
          plus the rest of the role's nav items and logout. */}
      <div className="flex items-center gap-2 min-[951px]:hidden">
        <NotificationButton unreadCount={unreadCount} onClick={() => navigate("/notifications")} light />
        <MobileMoreMenu primaryRole={primaryRole} pendingInvites={pendingInvites} />
      </div>
    </header>
  )
}
