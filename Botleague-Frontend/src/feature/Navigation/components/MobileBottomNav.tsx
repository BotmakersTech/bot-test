import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../../app/store";
import { useAppDispatch } from "../../../app/hooks";
import { logout as logoutApi } from "../../../feature/Auth/api/auth.api";
import { logout as logoutAction } from "../../../feature/Auth/store/authSlice";
import { clearTeam } from "../../../feature/Team/store/TeamSlice";
import { getNavItemsForRoles, type NavItem } from "../../../shared/config/sidebarConfig";
import { getIcon } from "./Sidebar";
import { LogoutIcon } from "./Icons/Icons";
import "../../../styles/mobileNav.css";

/**
 * Replaces the (desktop) hover-expand Sidebar at widths <= 950px — see
 * mobileNav.css's breakpoint alongside Layout.tsx's .app-sidebar-slot.
 * The first item in the current role's NAV_CONFIG (always "Dashboard" /
 * its role-specific equivalent) becomes the centered FAB; the rest split
 * left/right around it and reveal progressively as width grows toward
 * 950px, where the real Sidebar takes back over with the full list.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  const navItems = getNavItemsForRoles(userRoles);
  if (navItems.length === 0) return null;

  const [primary, ...rest] = navItems;
  const leftItems: NavItem[] = [];
  const rightItems: NavItem[] = [];
  rest.forEach((item, i) => (i % 2 === 0 ? leftItems : rightItems).push(item));

  const isActive = (link: string) =>
    pathname === link || (link !== "/" && pathname.startsWith(link + "/"));

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

  const renderItem = (item: NavItem) => (
    <button
      key={item.id}
      type="button"
      className="mnav-item"
      aria-label={item.label}
      aria-current={isActive(item.link) ? "page" : undefined}
      onClick={() => navigate(item.link)}
    >
      <span className={"mnav-icon" + (isActive(item.link) ? " mnav-icon--active" : "")}>
        {getIcon(item.iconName)}
      </span>
      <span className="mnav-label">{item.label}</span>
    </button>
  );

  return (
    <nav className="mnav-bar" aria-label="Primary">
      <div className="mnav-side mnav-side--left">{leftItems.map(renderItem)}</div>

      <button
        type="button"
        className="mnav-primary"
        aria-label={primary.label}
        aria-current={isActive(primary.link) ? "page" : undefined}
        onClick={() => navigate(primary.link)}
      >
        {getIcon(primary.iconName)}
      </button>

      <div className="mnav-side mnav-side--right">{rightItems.map(renderItem)}</div>

      <button
        type="button"
        className="mnav-logout"
        aria-label="Log out"
        title="Log out"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogoutIcon />
      </button>
    </nav>
  );
}
