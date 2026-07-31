import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import logo from "../../assets/home/Img/BOT-LEAGUE-white.png";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Events", to: "/events" },
  { label: "About Us", to: "/about-us" },
  { label: "Contact Us", to: "/contact-us" },
];

interface PublicNavbarProps {
  /** Home's hero sits directly under this nav and the nav overlaps it via a
   * negative margin synced to its own height (sticky header pulled over the
   * hero below). Other public pages don't have that layout, so this
   * defaults to off. */
  overlapHero?: boolean;
  /** "Leagues ▾" scrolls to a `#leagues` section that only exists on Home. */
  showLeagues?: boolean;
}

export default function PublicNavbar({ overlapHero = false, showLeagues = false }: PublicNavbarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overlapHero) return;
    const syncOverlap = () => {
      if (headerRef.current) {
        headerRef.current.style.marginBottom = `-${headerRef.current.offsetHeight}px`;
      }
    };
    syncOverlap();
    window.addEventListener("resize", syncOverlap);
    return () => window.removeEventListener("resize", syncOverlap);
  }, [overlapHero]);

  const scrollToLeagues = () => {
    document.getElementById("leagues")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 px-6 md:px-10 pt-6">
      <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-6">
        <button onClick={() => navigate("/")} aria-label="BotLeague home" className="shrink-0">
          <img src={logo} alt="BotLeague" className="h-8 md:h-9 object-contain" />
        </button>

        <nav className="hidden md:flex items-center gap-1 border-2 border-white rounded-full px-1.5 py-1.5 backdrop-blur-[15px]">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.to)}
              className="font-sans text-[12px] font-semibold tracking-widest uppercase text-white rounded-full px-6 py-3 transition hover:bg-white/10"
            >
              {link.label}
            </button>
          ))}
          {showLeagues && (
            <button
              onClick={scrollToLeagues}
              className="font-sans text-[12px] font-semibold tracking-widest uppercase text-white rounded-full px-6 py-3 transition hover:bg-white/10"
            >
              Leagues <span className="text-[10px]">▾</span>
            </button>
          )}
        </nav>

        <button
          onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
          className="font-sans shrink-0 bg-[#0D5FE0] hover:brightness-110 active:scale-95 text-white text-[13px] font-bold tracking-widest uppercase px-8 md:px-9 py-3.5 rounded-full transition"
        >
          {isAuthenticated ? "Dashboard" : "Login"}
        </button>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden shrink-0 w-10 h-10 flex flex-col items-center justify-center gap-1.5 border-2 border-white rounded-full"
        >
          <span className="w-4 h-0.5 bg-white" />
          <span className="w-4 h-0.5 bg-white" />
          <span className="w-4 h-0.5 bg-white" />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden max-w-[1300px] mx-auto mt-3 flex flex-col gap-1 rounded-2xl border-2 border-white/40 bg-black/60 backdrop-blur-md p-3">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.to); setMenuOpen(false); }}
              className="font-sans text-left text-[12px] font-semibold tracking-widest uppercase text-white rounded-lg px-4 py-3 hover:bg-white/10"
            >
              {link.label}
            </button>
          ))}
          {showLeagues && (
            <button
              onClick={scrollToLeagues}
              className="font-sans text-left text-[12px] font-semibold tracking-widest uppercase text-white rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Leagues
            </button>
          )}
        </div>
      )}
    </header>
  );
}
