import { useState } from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";

import { logout as logoutApi } from
"../../feature/Auth/api/auth.api";

import { logout as logoutAction } from
"../../feature/Auth/store/authSlice";

import {
  clearTeam,
} from "../../feature/Team/store/TeamSlice";
import { GrDashboard } from "react-icons/gr";

// ── Icons ──────────────────────────────────────────────

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const EventsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TeamsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" />
    <path d="M3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" />
    <circle cx="17" cy="7" r="3" />
    <path d="M21 20c0-3-2.7-5.5-6-5.5" />
  </svg>
);

const RobotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="9" width="16" height="11" rx="2" />
    <circle cx="9" cy="14" r="1.5" />
    <circle cx="15" cy="14" r="1.5" />
  </svg>
);

const MatchesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

const RankingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" />
    <rect x="10" y="7" width="4" height="14" />
    <rect x="17" y="3" width="4" height="18" />
  </svg>
);



const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ── Types ──────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  link: string;
};

// ── Navigation ─────────────────────────────────────────

const mainNavItems: NavItem[] = [
  {
    id: "profile",
    label: "My Dashboard",
    icon: <GrDashboard />,
    link: "/user-dashboard",
  },
  {
    id: "events",
    label: "Events",
    icon: <EventsIcon />,
    link: "/events",
  },
  {
    id: "teams",
    label: "My Teams",
    icon: <TeamsIcon />,
    link: "/my-team",
  },
  {
    id: "robots",
    label: "Robots",
    icon: <RobotsIcon />,
    link: "/robots",
  },
  {
    id: "matches",
    label: "Matches",
    icon: <MatchesIcon />,
    link: "/matches",
  },
  {
    id: "rankings",
    label: "Rankings",
    icon: <RankingsIcon />,
    link: "/rankings",
  },
];

const bottomNavItems: NavItem[] = [
  {
    id: "Profile",
    label: "Profile",
    icon: <ProfileIcon />,
    link: "/profile",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <SettingsIcon />,
    link: "/settings",
  },
];

// ── Sidebar ────────────────────────────────────────────

export default function Sidebar() {

  const navigate = useNavigate();

  const location = useLocation();

  const dispatch = useAppDispatch();

  const [logoutHovered, setLogoutHovered] =
    useState(false);

  // ── Logout ───────────────────────────────────────────

  const handleLogout = async () => {

  try {

    // clear auth cookie on backend
    await logoutApi();

  } catch (err) {

    console.error(
      "Logout API failed:",
      err
    );

  } finally {

    // always clear frontend state
    dispatch(logoutAction());

    dispatch(clearTeam());

    // redirect
    navigate("/");
  }
};

  // ── Render ───────────────────────────────────────────

  return (

    <div
      style={{
        width: 280,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#434343",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
      }}
    >

      {/* Logo */}
      <div
        style={{
          padding: "8px 16px 20px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        <img
          src="https://botleague.in/logo/bot.png"
          alt="BotLeague"
        />
      </div>

      {/* Main Nav */}
      <div
        style={{
          flex: 1,
          padding: "0 10px",
        }}
      >

        {mainNavItems.map((item) => {

          const isActive =
            location.pathname === item.link;

          return (

            <div
              key={item.id}
              onClick={() =>
                navigate(item.link)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 4,
                color: "#fff",
                background: isActive
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              }}
            >

              {item.icon}

              <span>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          padding: "0 10px",
        }}
      >

        {bottomNavItems.map((item) => {

          const isActive =
            location.pathname === item.link;

          return (

            <div
              key={item.id}
              onClick={() =>
                navigate(item.link)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 4,
                color: "#fff",
                background: isActive
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              }}
            >

              {item.icon}

              <span>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <div
        style={{
          padding: "12px 16px 8px",
        }}
      >

        <button
          onClick={handleLogout}
          onMouseEnter={() =>
            setLogoutHovered(true)
          }
          onMouseLeave={() =>
            setLogoutHovered(false)
          }
          style={{
            width: "100%",
            background: logoutHovered
              ? "#e74c3c"
              : "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}