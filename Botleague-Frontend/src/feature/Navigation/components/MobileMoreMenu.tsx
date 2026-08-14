import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu } from "lucide-react";

import type { RootState } from "../../../app/store";
import { useAppDispatch } from "../../../app/hooks";
import { logout as logoutApi } from "../../../feature/Auth/api/auth.api";
import { logout as logoutAction } from "../../../feature/Auth/store/authSlice";
import { clearTeam } from "../../../feature/Team/store/TeamSlice";
import { getNavItemsForRoles, MOBILE_NAV_VISIBLE_COUNT } from "../../../shared/config/sidebarConfig";
import { AppRole, type AppRoleType } from "../../../shared/constants/roles";
import { getIcon } from "./Sidebar";
import {
  BellIcon,
  ChatIcon,
  UserCircleIcon,
  SettingsGearIcon,
  SearchIcon,
  LiveIcon,
  AnalyticsIcon,
  LogoutIcon,
} from "./Icons/Icons";
import "../../../styles/mobileNav.css";

interface AccountRow {
  key: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
}

/**
 * The entire mobile (<= 950px) top bar: logo + this single toggle. Every
 * account action (chat/notifications/profile/settings/etc — normally a row
 * of icon buttons on desktop) plus whatever didn't fit in the bottom bar's
 * fixed 5 slots, plus Logout, all live in the one dropdown this opens —
 * the Sidebar was previously the only way to log out, and desktop's icon
 * row is hidden at this width (see Navbar.tsx's min-[951px]:flex).
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
  const [loggingOut, setLoggingOut] = useState(false);

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  const overflowItems = getNavItemsForRoles(userRoles).slice(MOBILE_NAV_VISIBLE_COUNT);

  const isActive = (link: string) =>
    pathname === link || (link !== "/" && pathname.startsWith(link + "/"));

  const go = (link: string) => {
    setOpen(false);
    navigate(link);
  };

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

  const accountRows: AccountRow[] = (() => {
    if (primaryRole === AppRole.SUPER_ADMIN) {
      return [
        { key: "search", label: "Global Search", icon: <SearchIcon />, onClick: () => go("/admin/search") },
        { key: "live", label: "Live Events", icon: <LiveIcon />, onClick: () => go("/admin/user") },
        { key: "notif", label: "Notifications", icon: <BellIcon />, badge: unreadCount, onClick: () => go("/notifications") },
        { key: "analytics", label: "Analytics Snapshot", icon: <AnalyticsIcon />, onClick: () => go("/admin/analytics") },
        { key: "profile", label: "Profile", icon: <UserCircleIcon />, onClick: () => go("/profile") },
        { key: "settings", label: "System Settings", icon: <SettingsGearIcon />, onClick: () => go("/settings") },
      ];
    }
    if (primaryRole === AppRole.ADMIN) {
      return [
        { key: "notif", label: "Notifications", icon: <BellIcon />, badge: unreadCount, onClick: () => go("/notifications") },
        { key: "messages", label: "Messages", icon: <ChatIcon />, onClick: () => go("/messages") },
        { key: "profile", label: "Profile", icon: <UserCircleIcon />, onClick: () => go("/profile") },
      ];
    }
    const rows: AccountRow[] = [];
    if (pendingInvites > 0) {
      rows.push({
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
    rows.push(
      { key: "messages", label: "Messages", icon: <ChatIcon />, onClick: () => go("/messages") },
      { key: "notif", label: "Notifications", icon: <BellIcon />, badge: unreadCount, onClick: () => go("/notifications") },
      { key: "profile", label: "Profile", icon: <UserCircleIcon />, onClick: () => go("/profile") },
    );
    if (primaryRole !== AppRole.COMPETITOR) {
      rows.push({ key: "settings", label: "Settings", icon: <SettingsGearIcon />, onClick: () => go("/settings") });
    }
    return rows;
  })();

  const hasAlert = unreadCount > 0 || pendingInvites > 0;

  return (
    <div className="mnav-topmenu-slot mnav-more-wrap">
      {open && <div className="mnav-more-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        aria-label="More menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={20} />
        {hasAlert && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ff3b30] ring-2 ring-[#0162d1]" />}
      </button>

      {open && (
        <div className="mnav-more-panel mnav-more-panel--down" role="menu">
          {accountRows.map((row) => (
            <button key={row.key} type="button" role="menuitem" className="mnav-more-row" onClick={row.onClick}>
              <span className="mnav-icon">{row.icon}</span>
              <span className="mnav-more-row-label">{row.label}</span>
              {!!row.badge && row.badge > 0 && (
                <span className="mnav-more-badge">{row.badge > 99 ? "99+" : row.badge}</span>
              )}
            </button>
          ))}

          <div className="mnav-more-divider" />

          {overflowItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={"mnav-more-row" + (isActive(item.link) ? " mnav-more-row--active" : "")}
              onClick={() => go(item.link)}
            >
              <span className="mnav-icon">{getIcon(item.iconName)}</span>
              <span className="mnav-more-row-label">{item.label}</span>
            </button>
          ))}

          <div className="mnav-more-divider" />

          <button
            type="button"
            role="menuitem"
            className="mnav-more-row mnav-more-row--danger"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span className="mnav-icon"><LogoutIcon /></span>
            <span className="mnav-more-row-label">{loggingOut ? "Logging out…" : "Log out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
