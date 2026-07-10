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
  onClick,
}: {
  item: NavItem;
  active: boolean;
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
        "group relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-150",
        active
          ? "bg-[#3269d0] text-white shadow-[0_0_15px_rgba(72,113,219,0.38)]"
          : "text-[#5e6065] hover:bg-[#e8ecff] hover:text-[#3269d0]",
      ].join(" ")}
    >
      <span className="flex h-7 w-7 items-center justify-center [&_svg]:h-[24px] [&_svg]:w-[24px]">
        {getIcon(item.iconName)}
      </span>
      <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-md bg-[#111111] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
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
    <aside className="sticky top-0 flex h-[calc(100vh-4.5rem)] w-[112px] shrink-0 flex-col items-center bg-[#eef1ff] py-8">
      <nav className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto overflow-x-visible px-4">
        {navItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={isActive(item.link)}
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
        className="group relative mt-8 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#3269d0] transition-colors hover:bg-[#e8ecff] disabled:opacity-60"
      >
        <LogoutIcon className="h-[27px] w-[27px]" />
        <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-md bg-[#111111] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {loggingOut ? "Logging out..." : "Log out"}
        </span>
      </button>
    </aside>
  );
}
