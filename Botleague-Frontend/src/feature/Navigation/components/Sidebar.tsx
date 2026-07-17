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
  expanded,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-11 shrink-0 items-center gap-3 rounded-lg transition-[background-color,color,width] duration-200",
        expanded ? "w-full px-3" : "w-11 justify-center",
        active
          ? "bg-[#3269d0] text-white shadow-[0_0_15px_rgba(72,113,219,0.38)]"
          : "text-[#5e6065] hover:bg-[#e8ecff] hover:text-[#3269d0]",
      ].join(" ")}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center [&_svg]:h-[24px] [&_svg]:w-[24px]">
        {getIcon(item.iconName)}
      </span>
      <span
        className={[
          "overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200",
          expanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
        ].join(" ")}
      >
        {item.label}
      </span>
    </button>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    // The sidebar itself is the flex item that changes width on hover —
    // its sibling `<main>` in Layout.tsx is `min-w-0 flex-1`, so it shrinks
    // to make room instead of the sidebar overlaying on top of it.
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={[
        "sticky top-0 z-40 flex h-[calc(100vh-4.5rem)] shrink-0 flex-col items-center overflow-hidden bg-[#eef1ff] py-8 transition-[width] duration-200 ease-out",
        expanded ? "w-[248px] items-stretch px-4 shadow-[6px_0_24px_rgba(17,17,17,0.12)]" : "w-[112px]",
      ].join(" ")}
    >
      <nav className="flex min-h-0 flex-1 w-full flex-col items-center gap-6 overflow-y-auto overflow-x-hidden px-4">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={isActive(item.link)}
            expanded={expanded}
            onClick={() => navigate(item.link)}
          />
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        title="Log out"
        aria-label="Log out"
        className={[
          "mt-8 flex h-11 shrink-0 items-center gap-3 rounded-lg text-[#3269d0] transition-[background-color,width] duration-200 hover:bg-[#e8ecff] disabled:opacity-60",
          expanded ? "w-full px-3" : "w-11 justify-center",
        ].join(" ")}
      >
        <LogoutIcon className="h-[27px] w-[27px] shrink-0" />
        <span
          className={[
            "overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200",
            expanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
          ].join(" ")}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </span>
      </button>
    </aside>
  );
}
