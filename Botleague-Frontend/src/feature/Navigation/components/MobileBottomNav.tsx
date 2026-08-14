import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../../app/store";
import { getNavItemsForRoles, MOBILE_NAV_VISIBLE_COUNT, type NavItem } from "../../../shared/config/sidebarConfig";
import { getIcon } from "./Sidebar";
import "../../../styles/mobileNav.css";

/**
 * Replaces the (desktop) hover-expand Sidebar at widths <= 950px — see
 * mobileNav.css's breakpoint alongside Layout.tsx's .app-sidebar-slot.
 * Shows the role's MOBILE_NAV_VISIBLE_COUNT most frequent items; anything
 * past that lives in the top navbar's "More" menu (MobileMoreMenu) instead.
 * Whichever item matches the current route renders big, with the same
 * highlighted-circle treatment the old fixed "center" item used to have —
 * now it follows the active page instead of a fixed slot.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  const visible = getNavItemsForRoles(userRoles).slice(0, MOBILE_NAV_VISIBLE_COUNT);
  if (visible.length === 0) return null;

  // NAV_CONFIG always lists "Dashboard" (or its role-specific equivalent)
  // first — move it to the middle slot so it sits centered in the bar,
  // matching where the old fixed "center" item used to be.
  const [dashboard, ...others] = visible;
  const centerIndex = Math.floor(others.length / 2);
  const navItems = [...others.slice(0, centerIndex), dashboard, ...others.slice(centerIndex)];

  const isActive = (link: string) =>
    pathname === link || (link !== "/" && pathname.startsWith(link + "/"));

  return (
    <nav className="mnav-bar" aria-label="Primary">
      {navItems.map((item: NavItem) => {
        const active = isActive(item.link);
        return (
          <button
            key={item.id}
            type="button"
            className={active ? "mnav-item mnav-item--active" : "mnav-item"}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(item.link)}
          >
            <span className={active ? "mnav-icon mnav-icon--active" : "mnav-icon"}>
              {getIcon(item.iconName)}
            </span>
            {!active && <span className="mnav-label">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
