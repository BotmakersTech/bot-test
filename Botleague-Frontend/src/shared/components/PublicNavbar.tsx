import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Phone } from "lucide-react";
import type { RootState } from "../../app/store";
import logo from "../../assets/home/Img/BOT-LEAGUE-white.png";

const LINKS_BEFORE_LEAGUES = [{ label: "Home", to: "/" }];
const LINKS_AFTER_LEAGUES = [
  { label: "Events", to: "/events" },
  { label: "Rankings", to: "/rankings" },
  { label: "About Us", to: "/about-us" },
];

/** Matches LeaguesSection.tsx's LEAGUES array order exactly — index here is
 *  what drives which card the pinned-scroll section lands on. */
const LEAGUE_ITEMS = ["Ignite League", "Inferno League", "Apex League"];

interface PublicNavbarProps {
  /** Home's hero sits directly under this nav and the nav overlaps it via a
   * negative margin synced to its own height (sticky header pulled over the
   * hero below). Other public pages don't have that layout, so this
   * defaults to off. */
  overlapHero?: boolean;
  /** The Leagues dropdown only has anywhere to scroll to on Home. */
  showLeagues?: boolean;
}

export default function PublicNavbar({ overlapHero = false, showLeagues = false }: PublicNavbarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const headerRef = useRef<HTMLElement>(null);
  const leaguesRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaguesOpen, setLeaguesOpen] = useState(false);

  useEffect(() => {
    const syncOverlap = () => {
      if (!headerRef.current) return;
      const h = headerRef.current.offsetHeight;
      // Only Home's hero wants the nav pulled over it via negative margin —
      // other public pages keep normal document flow beneath the nav.
      if (overlapHero) {
        headerRef.current.style.marginBottom = `-${h}px`;
      }
      // Home's pinned-scroll sections (OneSection/LeaguesSection/RobotStage)
      // read this to keep their sticky content clear of this nav, which
      // otherwise stays stuck at top:0 for the whole page, not just the hero.
      document.documentElement.style.setProperty("--home-header-h", `${h}px`);
    };
    syncOverlap();
    window.addEventListener("resize", syncOverlap);
    return () => window.removeEventListener("resize", syncOverlap);
  }, [overlapHero]);

  // Close the Leagues dropdown on an outside click — the same pattern any
  // click-to-open menu needs, since there's no native way to detect "click
  // elsewhere" from inside the button that opened it.
  useEffect(() => {
    if (!leaguesOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (leaguesRef.current && !leaguesRef.current.contains(e.target as Node)) {
        setLeaguesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [leaguesOpen]);

  /**
   * Scrolls to the given league's card in LeaguesSection's pinned-scroll
   * stack — same technique as RobotStage's own click-to-step (land in the
   * middle of that step's scroll range so the scroll-driven step
   * calculation picks it up immediately, not right on a boundary edge).
   * Only works on Home, where #leagues actually exists; from another page
   * this can only get the visitor to Home, not deep-link the scroll
   * position across a navigation.
   */
  const scrollToLeague = (index: number) => {
    setLeaguesOpen(false);
    setMenuOpen(false);
    const section = document.getElementById("leagues");
    if (!section) {
      navigate("/");
      return;
    }
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) {
      section.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const progress = (index + 0.5) / LEAGUE_ITEMS.length;
    window.scrollTo({ top: section.offsetTop + progress * total, behavior: "smooth" });
  };

  const linkClass = "font-sans text-[12px] font-semibold tracking-widest uppercase text-white rounded-full px-6 py-3 transition hover:bg-white/10";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 px-6 md:px-10 pt-6 pb-4 bg-[#0a0a14]/90 backdrop-blur-[15px] border-b border-white/10"
    >
      <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-6">
        <button onClick={() => navigate("/")} aria-label="BotLeague home" className="shrink-0">
          <img src={logo} alt="BotLeague" className="h-8 md:h-9 object-contain" />
        </button>

        <nav className="hidden md:flex items-center gap-1 border-2 border-white rounded-full px-1.5 py-1.5 backdrop-blur-[15px]">
          {LINKS_BEFORE_LEAGUES.map((link) => (
            <button key={link.label} onClick={() => navigate(link.to)} className={linkClass}>
              {link.label}
            </button>
          ))}

          {showLeagues && (
            <div ref={leaguesRef} className="relative">
              <button
                onClick={() => setLeaguesOpen((v) => !v)}
                aria-expanded={leaguesOpen}
                className={linkClass}
              >
                Leagues <span className="text-[10px]">▾</span>
              </button>
              {leaguesOpen && (
                <div className="absolute left-1/2 top-full mt-2 w-48 -translate-x-1/2 rounded-2xl border-2 border-white/70 bg-[#0a0a14]/95 backdrop-blur-[15px] p-1.5 flex flex-col gap-1 shadow-[0_12px_30px_rgba(0,0,0,.4)]">
                  {LEAGUE_ITEMS.map((league, i) => (
                    <button
                      key={league}
                      onClick={() => scrollToLeague(i)}
                      className="font-sans text-left text-[11px] font-semibold tracking-widest uppercase text-white rounded-xl px-4 py-2.5 transition hover:bg-white/10"
                    >
                      {league}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {LINKS_AFTER_LEAGUES.map((link) => (
            <button key={link.label} onClick={() => navigate(link.to)} className={linkClass}>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/contact-us")}
            aria-label="Contact us"
            className="hidden sm:flex w-11 h-11 items-center justify-center rounded-full border-2 border-white text-white transition hover:bg-white/10"
          >
            <Phone size={17} strokeWidth={2.25} />
          </button>

          <button
            onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
            className="font-sans bg-[#0D5FE0] hover:brightness-110 active:scale-95 text-white text-[13px] font-bold tracking-widest uppercase px-8 md:px-9 py-3.5 rounded-full transition"
          >
            {isAuthenticated ? "Dashboard" : "Login"}
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 border-2 border-white rounded-full"
          >
            <span className="w-4 h-0.5 bg-white" />
            <span className="w-4 h-0.5 bg-white" />
            <span className="w-4 h-0.5 bg-white" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden max-w-[1300px] mx-auto mt-3 flex flex-col gap-1 rounded-2xl border-2 border-white/40 bg-black/60 backdrop-blur-md p-3">
          {LINKS_BEFORE_LEAGUES.map((link) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.to); setMenuOpen(false); }}
              className="font-sans text-left text-[12px] font-semibold tracking-widest uppercase text-white rounded-lg px-4 py-3 hover:bg-white/10"
            >
              {link.label}
            </button>
          ))}

          {showLeagues && (
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-semibold tracking-widest uppercase text-white/50 px-4 pt-2 pb-1">Leagues</span>
              {LEAGUE_ITEMS.map((league, i) => (
                <button
                  key={league}
                  onClick={() => scrollToLeague(i)}
                  className="font-sans text-left text-[12px] font-semibold tracking-widest uppercase text-white rounded-lg px-6 py-3 hover:bg-white/10"
                >
                  {league}
                </button>
              ))}
            </div>
          )}

          {LINKS_AFTER_LEAGUES.map((link) => (
            <button
              key={link.label}
              onClick={() => { navigate(link.to); setMenuOpen(false); }}
              className="font-sans text-left text-[12px] font-semibold tracking-widest uppercase text-white rounded-lg px-4 py-3 hover:bg-white/10"
            >
              {link.label}
            </button>
          ))}

          <button
            onClick={() => { navigate("/contact-us"); setMenuOpen(false); }}
            className="font-sans flex items-center gap-2 text-left text-[12px] font-semibold tracking-widest uppercase text-white rounded-lg px-4 py-3 hover:bg-white/10"
          >
            <Phone size={14} strokeWidth={2.25} /> Contact Us
          </button>
        </div>
      )}
    </header>
  );
}
