import { Home, CalendarDays, Trophy, Info, LogIn, LayoutDashboard } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import "../../styles/mobileNav.css";

/**
 * Public-page equivalent of MobileBottomNav — that component reads the
 * logged-in user's role to build its item list (via sidebarConfig), which
 * would point a logged-out visitor at protected routes like /my-team or
 * /robots. This one is a fixed, unconditional link set instead, mirroring
 * PublicNavbar's own Home/Events/Rankings/About Us + Login-or-Dashboard —
 * same reasoning as MOBILE_NAV_VISIBLE_COUNT=5 for the protected bar: five
 * items is what fits in the floating pill without crowding.
 */
export default function PublicBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const items = [
    { id: "home", label: "Home", link: "/", icon: <Home /> },
    { id: "events", label: "Techfects", link: "/events", icon: <CalendarDays /> },
    { id: "rankings", label: "Rankings", link: "/rankings", icon: <Trophy /> },
    { id: "about", label: "About Us", link: "/about-us", icon: <Info /> },
    isAuthenticated
      ? { id: "dashboard", label: "Dashboard", link: "/profile", icon: <LayoutDashboard /> }
      : { id: "login", label: "Login", link: "/login", icon: <LogIn /> },
  ];

  const isActive = (link: string) =>
    pathname === link || (link !== "/" && pathname.startsWith(link + "/"));

  return (
    <nav className="mnav-bar" aria-label="Primary">
      {items.map((item) => {
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
              {item.icon}
            </span>
            {!active && <span className="mnav-label">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
