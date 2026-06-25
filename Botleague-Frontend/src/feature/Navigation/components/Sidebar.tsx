import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../../app/store";
import { useAppDispatch } from "../../../app/hooks";
import { logout as logoutApi } from "../../../feature/Auth/api/auth.api";
import { logout as logoutAction } from "../../../feature/Auth/store/authSlice";
import { clearTeam } from "../../../feature/Team/store/TeamSlice";
import { getNavItemsForRoles, type NavItem } from "../../../shared/config/sidebarConfig";

import {
  HomeIcon,
  DashboardIcon,
  CalendarIcon,
  TeamsIcon,
  RobotIcon,
  MatchesIcon,
  RankingsIcon,
  LogoutIcon,
  BellIcon,
  SettingsGearIcon,
  ChatIcon,
  ReportsIcon,
  StarIcon,
  AchievementIcon,
  CertificateIcon,
  SupportIcon,
  VenueIcon,
  ScheduleIcon,
  BillingIcon,
  CommunicationIcon,
  JudgeIcon,
  AnalyticsIcon,
  TicketIcon,
  AuditIcon,
  PartnersIcon,
  SportsIcon,
  ParticipantsIcon,
} from "./Icons/Icons";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function getIcon(iconName: string) {
  switch (iconName) {
    case "dashboard":     return <DashboardIcon />;
    case "calendar":      return <CalendarIcon />;
    case "teams":         return <TeamsIcon />;
    case "users":         return <ParticipantsIcon />;
    case "participants":  return <ParticipantsIcon />;
    case "robot":         return <RobotIcon />;
    case "matches":       return <MatchesIcon />;
    case "rankings":      return <RankingsIcon />;
    case "bell":          return <BellIcon />;
    case "settings":      return <SettingsGearIcon />;
    case "chat":          return <ChatIcon />;
    case "reports":       return <ReportsIcon />;
    case "star":          return <StarIcon />;
    case "achievement":   return <AchievementIcon />;
    case "certificate":   return <CertificateIcon />;
    case "support":       return <SupportIcon />;
    case "venue":         return <VenueIcon />;
    case "schedule":      return <ScheduleIcon />;
    case "billing":       return <BillingIcon />;
    case "communication": return <CommunicationIcon />;
    case "judge":         return <JudgeIcon />;
    case "analytics":     return <AnalyticsIcon />;
    case "ticket":        return <TicketIcon />;
    case "audit":         return <AuditIcon />;
    case "partners":      return <PartnersIcon />;
    case "sports":        return <SportsIcon />;
    default:              return <HomeIcon />;
  }
}

function SidebarItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative flex w-full items-center rounded-xl py-2 transition-colors duration-150",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active ? "bg-white/[0.04]" : "hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
          active
            ? "bg-red-500 text-neutral-950 shadow-[0_0_16px_-3px_rgba(239,68,68,0.7)]"
            : "text-neutral-400 group-hover:text-[#F44336]",
        ].join(" ")}
      >
        {getIcon(item.iconName)}
      </span>

      {!collapsed && (
        <span
          className={[
            "truncate text-sm font-medium",
            active ? "text-red-500" : "text-neutral-300 group-hover:text-[#F44336]",
          ].join(" ")}
        >
          {item.label}
        </span>
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-md bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [loggingOut, setLoggingOut] = useState(false);

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  const navItems = getNavItemsForRoles(userRoles);

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

  return (
    <aside
      onMouseEnter={() => { if (collapsed) onToggle(); }}
      onMouseLeave={() => { if (!collapsed) onToggle(); }}
      className={[
        "flex h-full shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e10]",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[100px]" : "w-[300px]",
      ].join(" ")}
    >
      <div className="h-4" />

      <nav className="flex flex-1 flex-col justify-center space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={isActive(item.link)}
            collapsed={collapsed}
            onClick={() => navigate(item.link)}
          />
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log out"
            className="group relative flex w-full items-center justify-center rounded-xl p-2.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-md bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100">
              Log out
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_rgba(220,38,38,0.9)] transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        )}
      </div>
    </aside>
  );
}
