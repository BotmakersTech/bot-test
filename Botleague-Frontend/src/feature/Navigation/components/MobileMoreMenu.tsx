import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu, X, Search, LogOut } from "lucide-react";

import type { RootState } from "../../../app/store";
import { useAppDispatch } from "../../../app/hooks";
import { logout as logoutApi } from "../../../feature/Auth/api/auth.api";
import { logout as logoutAction } from "../../../feature/Auth/store/authSlice";
import { clearTeam } from "../../../feature/Team/store/TeamSlice";
import { getNavItemsForRoles, MOBILE_NAV_VISIBLE_COUNT } from "../../../shared/config/sidebarConfig";
import { AppRole, type AppRoleType } from "../../../shared/constants/roles";
import { getIcon } from "./Sidebar";
import { BellIcon, ChatIcon, UserCircleIcon, SettingsGearIcon, SearchIcon, LiveIcon, AnalyticsIcon } from "./Icons/Icons";
import "../../../styles/mobileNav.css";

interface MenuRow {
  key: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  active?: boolean;
  onClick: () => void;
}

function initials(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
  const i = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  return i || fallback?.charAt(0).toUpperCase() || "?";
}

/**
 * The entire mobile (<= 950px) top bar: logo + this single toggle, which
 * opens a full-screen sheet holding every account action
 * (chat/notifications/profile/settings/etc — normally a row of icon
 * buttons on desktop), whatever didn't fit in the bottom bar's fixed 5
 * slots, and Logout — the Sidebar was previously the only way to log out,
 * and desktop's icon row is hidden at this width (Navbar.tsx's
 * min-[951px]:flex).
 */
interface Props {
  primaryRole: AppRoleType;
  unreadCount: number;
  pendingInvites: number;
}

export default function MobileMoreMenu({ primaryRole, unreadCount, pendingInvites }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  const overflowItems = getNavItemsForRoles(userRoles).slice(MOBILE_NAV_VISIBLE_COUNT);

  const isActive = (link: string) =>
    pathname === link || (link !== "/" && pathname.startsWith(link + "/"));

  const close = () => { setOpen(false); setQuery(""); };
  const go = (link: string) => { close(); navigate(link); };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      dispatch(logoutAction());
      dispatch(clearTeam());
      navigate("/");
    }
  };

  const rows: MenuRow[] = useMemo(() => {
    const accountRows: MenuRow[] = [];

    if (pendingInvites > 0 && primaryRole !== AppRole.ADMIN && primaryRole !== AppRole.SUPER_ADMIN) {
      accountRows.push({
        key: "invites",
        label: `${pendingInvites} pending team invite${pendingInvites !== 1 ? "s" : ""}`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        ),
        badge: pendingInvites,
        onClick: () => go("/my-team"),
      });
    }

    if (primaryRole === AppRole.SUPER_ADMIN) {
      accountRows.push(
        { key: "search", label: "Global Search", icon: <SearchIcon />, onClick: () => go("/admin/search") },
        { key: "live", label: "Live Events", icon: <LiveIcon />, onClick: () => go("/admin/user") },
        { key: "notif", label: "Notifications", icon: <BellIcon />, badge: unreadCount, onClick: () => go("/notifications") },
        { key: "analytics", label: "Analytics Snapshot", icon: <AnalyticsIcon />, onClick: () => go("/admin/analytics") },
        { key: "profile", label: "Profile", icon: <UserCircleIcon />, onClick: () => go("/profile") },
        { key: "settings", label: "System Settings", icon: <SettingsGearIcon />, onClick: () => go("/settings") },
      );
    } else if (primaryRole === AppRole.ADMIN) {
      accountRows.push(
        { key: "notif", label: "Notifications", icon: <BellIcon />, badge: unreadCount, onClick: () => go("/notifications") },
        { key: "messages", label: "Messages", icon: <ChatIcon />, onClick: () => go("/messages") },
        { key: "profile", label: "Profile", icon: <UserCircleIcon />, onClick: () => go("/profile") },
      );
    } else {
      accountRows.push(
        { key: "messages", label: "Chats", icon: <ChatIcon />, onClick: () => go("/messages") },
        { key: "notif", label: "Notifications", icon: <BellIcon />, badge: unreadCount, onClick: () => go("/notifications") },
        { key: "profile", label: "Profile", icon: <UserCircleIcon />, onClick: () => go("/profile") },
      );
      if (primaryRole !== AppRole.COMPETITOR) {
        accountRows.push({ key: "settings", label: "Settings", icon: <SettingsGearIcon />, onClick: () => go("/settings") });
      }
    }

    const navRows: MenuRow[] = overflowItems.map((item) => ({
      key: item.id,
      label: item.label,
      icon: getIcon(item.iconName),
      active: isActive(item.link),
      onClick: () => go(item.link),
    }));

    return [...accountRows, ...navRows];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryRole, unreadCount, pendingInvites, overflowItems, pathname]);

  const filteredRows = query.trim()
    ? rows.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()))
    : rows;

  const hasAlert = unreadCount > 0 || pendingInvites > 0;
  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "BotLeague Member";

  return (
    <div className="mnav-topmenu-slot">
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        aria-label="More menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
        {hasAlert && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff3b30] ring-2 ring-[#0162d1]" />}
      </button>

      {open && (
        <div className="mnav-sheet" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="mnav-sheet-close" aria-label="Close menu" onClick={close}>
            <X size={22} />
          </button>

          <div className="mnav-sheet-search">
            <Search size={17} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search menu"
              autoFocus
            />
          </div>

          <div className="mnav-sheet-list">
            {filteredRows.length === 0 ? (
              <p className="mnav-sheet-empty">No matches for "{query}"</p>
            ) : (
              filteredRows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={row.active ? "mnav-sheet-row mnav-sheet-row--active" : "mnav-sheet-row"}
                  onClick={row.onClick}
                >
                  <span className="mnav-sheet-row-icon">{row.icon}</span>
                  <span className="mnav-sheet-row-label">{row.label}</span>
                  {!!row.badge && row.badge > 0 && (
                    <span className="mnav-sheet-badge">{row.badge > 99 ? "99+" : row.badge}</span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="mnav-sheet-footer">
            {user?.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt="" className="mnav-sheet-avatar" />
            ) : (
              <span className="mnav-sheet-avatar mnav-sheet-avatar--initials">
                {initials(user?.firstName, user?.lastName, user?.email)}
              </span>
            )}
            <div className="mnav-sheet-user-info">
              <strong>{profileName}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="mnav-sheet-logout"
              aria-label="Log out"
              title="Log out"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
