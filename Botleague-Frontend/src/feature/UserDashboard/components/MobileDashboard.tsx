import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Medal,
  PenLine,
  Share2,
  Star,
  Swords,
} from "lucide-react";

import flight from "../../../assets/Auth/flight.svg";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import TeamLogo from "../../../shared/components/TeamLogo";

/* ============================================================================
   MobileDashboard — pixel-perfect port of the Figma "Dashboard- MOBILE" frame
   (node 6517:17583), rendered only at widths <= 950px (see .dash-mobile-only
   in dashboard.css); the desktop card-grid layout in userDashboard.tsx is
   untouched and takes over above that.

   Differences from the Figma export, and why:
   - No page-level top bar (logo/bell/menu) — Layout.tsx already renders a
     persistent app header above every page; duplicating it here would stack
     two BotLeague headers. Content starts where the Figma "Welcome back"
     row begins, with everything below shifted up by the removed bar's 69px.
   - No page-level bottom nav either — that role is now played by the global
     MobileBottomNav (Layout.tsx's floating pill, replacing the desktop
     Sidebar at this same <=950px breakpoint), shared by every page instead
     of a one-off nav baked into this canvas.
   - All data is real (user/team/stats passed down from userDashboard.tsx's
     useDashboard() hook), not the Figma frame's static placeholder copy.
   - Figma's per-icon vector exports (CDN asset URLs that expire) are
     replaced with lucide-react icons, matching what the desktop layout
     already uses for the same stats/actions.
   - Star decorations reuse the existing CSS-only .dash-outline-star instead
     of 7 separate expiring star SVGs.
   - The two purely-ornamental background wave bands (behind the hero card,
     above the bottom nav) aren't ported — no local asset for them and they
     carry no content/functionality.
   ============================================================================ */

const GRADIENT_75 = "linear-gradient(180deg, rgba(1,98,209,0.75) 0%, rgba(140,108,255,0.75) 100%)";
const GRADIENT_SOLID = "linear-gradient(180deg, #0162d1 0%, #8c6cff 100%)";
const GRADIENT_SOFT = "linear-gradient(180deg, rgba(1,98,209,0.15) 0%, rgba(140,108,255,0.15) 100%)";
const gradientText = {
  backgroundImage: GRADIENT_SOLID,
  WebkitBackgroundClip: "text" as const,
  backgroundClip: "text" as const,
  color: "transparent",
};
// Plain, muted caption under a gradient-filled stat number — sharing the
// number's own gradient fill (as this used to) reads as more number than
// label, since both end up the same eye-catching color; a flat neutral
// tone makes it unambiguous which text is the value and which is the tag.
const statLabelStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 500 as const,
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap" as const,
};

const DESIGN_WIDTH = 412;
// 917 (Figma) minus the omitted 69px top bar and the page's own bottom nav
// (~192px incl. margin) — that role is now played by the global
// MobileBottomNav (Layout.tsx), not a per-page nav baked into this canvas.
const DESIGN_HEIGHT = 738;
const MAX_WIDTH = 900;

function MobileStar({
  size,
  left,
  top,
  right,
  rotate,
  skew,
}: {
  size: number;
  left?: number;
  top?: number;
  right?: number;
  rotate: number;
  skew?: number;
}) {
  return (
    <span
      className="dash-outline-star"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        left,
        right,
        top,
        transform: `rotate(${rotate}deg)${skew ? ` skewX(${skew}deg)` : ""}`,
      }}
    />
  );
}

export interface MobileDashboardAchievement {
  title: string;
  tone: "gold" | "steel";
  icon: ReactNode;
}

export interface MobileDashboardProps {
  displayUsername: string;
  profileName: string;
  botLeagueId: string;
  hasAvatar: boolean;
  avatarSrc: string;
  onAvatarError: () => void;
  rankLabel: string | number;
  eventsParticipated: number;
  matchesTotal: number;
  winRate: number;
  teamName: string | null;
  teamLogo: string | null | undefined;
  teamMemberLabel: string;
  hasTeam: boolean;
  achievements: MobileDashboardAchievement[];
  onShare: () => void;
  onEditProfile: () => void;
  onOpenChats: () => void;
  onTeamAction: () => void;
}

export default function MobileDashboard({
  displayUsername,
  profileName,
  botLeagueId,
  hasAvatar,
  avatarSrc,
  onAvatarError,
  rankLabel,
  eventsParticipated,
  matchesTotal,
  winRate,
  teamName,
  teamLogo,
  teamMemberLabel,
  hasTeam,
  achievements,
  onShare,
  onEditProfile,
  onOpenChats,
  onTeamAction,
}: MobileDashboardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const compute = (width: number) => {
      const clampedWidth = Math.min(Math.max(width, DESIGN_WIDTH), MAX_WIDTH);
      setScale(clampedWidth / DESIGN_WIDTH);
    };
    compute(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) compute(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        maxWidth: MAX_WIDTH,
        margin: "0 auto",
        position: "relative",
        height: DESIGN_HEIGHT * scale,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          backgroundColor: "#ffffff",
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* floating decorative doodles */}
        <img
          alt=""
          aria-hidden="true"
          src={flight}
          style={{ position: "absolute", left: 350, top: 555, width: 78, opacity: 0.14, transform: "rotate(18deg)", pointerEvents: "none" }}
        />
        <img
          alt=""
          aria-hidden="true"
          src={flight}
          style={{ position: "absolute", left: 165, top: 650, width: 66, opacity: 0.14, transform: "rotate(-150deg)", pointerEvents: "none" }}
        />

        <MobileStar size={51} left={180} top={348} rotate={-16.68} skew={-5.42} />
        <MobileStar size={62} left={370} top={359} rotate={12.15} />
        <MobileStar size={86} left={-29} top={432} rotate={-16.54} />
        <MobileStar size={69} left={-10} top={685} rotate={-16.68} skew={-5.42} />
        <MobileStar size={59} left={334} top={711} rotate={-16.54} />

        {/* Welcome text */}
        <p
          style={{
            position: "absolute", margin: 0, wordBreak: "break-word",
            fontFamily: "Sarpanch, sans-serif", fontWeight: 700, fontSize: 20,
            color: "#0162d1", left: 25, top: 20, width: 215, lineHeight: "normal",
          }}
        >
          Welcome back, {displayUsername}!
        </p>

        {/* Chats pill */}
        <button
          type="button"
          className="dash-m-hover-lift"
          onClick={onOpenChats}
          style={{ position: "absolute", background: GRADIENT_75, height: 28, left: 320, top: 21, width: 66, borderRadius: 4, border: "none", padding: 0 }}
        >
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 12, color: "rgba(255,255,255,0.97)" }}>Chats</span>
        </button>

        {/* Profile card */}
        <div
          className="dash-m-hover-card"
          style={{
            position: "absolute", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            backgroundColor: "rgba(255,255,255,0.43)", border: "1px solid #0162d1",
            height: 205, left: 25, top: 72, width: 361, borderRadius: 12, overflow: "clip",
          }}
        >
          <div style={{ position: "absolute", backgroundColor: "rgba(180,197,255,0.1)", height: 2, left: 0, right: 0, top: 0 }} />

          {/* Rank badge */}
          <div style={{ position: "absolute", background: GRADIENT_75, height: 20, left: 13, top: 13, width: 72, borderRadius: 5, display: "flex", alignItems: "center", gap: 4, paddingLeft: 8 }}>
            <Star size={10} fill="#f4fb41" color="#f4fb41" />
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 9, color: "#fff", whiteSpace: "nowrap" }}>Rank - {rankLabel}</span>
          </div>

          {/* Active badge */}
          <div style={{ position: "absolute", border: "1px solid #0162d1", height: 18, left: 91, top: 13, width: 51, borderRadius: 10, overflow: "clip", display: "flex", alignItems: "center", gap: 4, paddingLeft: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#0162d1", flexShrink: 0 }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 9, color: "#0162d1", letterSpacing: "0.18px" }}>Active</span>
          </div>

          {/* Name */}
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", textTransform: "capitalize", fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, left: 12, top: 39, letterSpacing: "0.4px", whiteSpace: "nowrap", ...gradientText }}>
            {profileName}
          </p>

          <MobileStar size={53} left={-20} top={97} rotate={-16.54} />
          <MobileStar size={40} left={144} top={-19} rotate={30.6} />

          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, color: "#000", left: 11, top: 67, whiteSpace: "nowrap" }}>
            Botleague ID - {botLeagueId}
          </p>
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 10, color: "#000", left: 12, top: 81, whiteSpace: "nowrap" }}>
            @{displayUsername.toUpperCase()}
          </p>

          {/* Share / Edit */}
          <button type="button" className="dash-m-hover-lift" onClick={onShare} style={{ position: "absolute", background: GRADIENT_75, height: 27, left: 12, top: 155, width: 67, borderRadius: 5, border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Share2 size={12} color="#fff" />
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 10, color: "#fff", whiteSpace: "nowrap" }}>Share</span>
          </button>
          <button type="button" className="dash-m-hover-lift" onClick={onEditProfile} style={{ position: "absolute", background: GRADIENT_75, height: 27, left: 86, top: 155, width: 67, borderRadius: 5, border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <PenLine size={12} color="#fff" />
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 10, color: "#fff", whiteSpace: "nowrap" }}>Edit</span>
          </button>
        </div>

        {/* decorative "B" watermark + avatar (page-relative, sit above the profile card) */}
        <img alt="" aria-hidden="true" src={bLogo} style={{ position: "absolute", left: 178, top: 145, width: 186, height: 150, objectFit: "contain", opacity: 0.5, pointerEvents: "none" }} />
        {hasAvatar ? (
          <img src={avatarSrc} alt={profileName} onError={onAvatarError} style={{ position: "absolute", left: 208, top: 47, width: 140, height: 230, objectFit: "cover", objectPosition: "top center", filter: "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }} />
        ) : (
          <img src={avatarSrc} alt={profileName} style={{ position: "absolute", left: 208, top: 67, width: 140, height: 190, objectFit: "contain" }} />
        )}

        {/* Stats card */}
        <div className="dash-m-hover-card" style={{ position: "absolute", backgroundColor: "#fff", border: "1px solid #0162d1", height: 84, left: 25, top: 289, width: 361, borderRadius: 10, boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.13)", overflow: "clip" }}>
          <div style={{ position: "absolute", background: GRADIENT_SOLID, height: 57, left: 113, top: 12, width: 1, borderRadius: 15 }} />
          <div style={{ position: "absolute", background: GRADIENT_SOLID, height: 57, left: 239, top: 12, width: 1, borderRadius: 15 }} />

          <div style={{ position: "absolute", display: "flex", gap: 38, alignItems: "center", left: 24, top: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 78 }}>
              <CalendarDays size={24} style={{ color: "#3269d0" }} />
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 20, whiteSpace: "nowrap" }}>{eventsParticipated}</p>
              <p style={statLabelStyle}>Events</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 78 }}>
              <Swords size={24} style={{ color: "#3269d0" }} />
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 20, whiteSpace: "nowrap" }}>{matchesTotal}</p>
              <p style={statLabelStyle}>Matches</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 78 }}>
              <Medal size={24} style={{ color: "#3269d0" }} />
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 20, whiteSpace: "nowrap" }}>{winRate}%</p>
              <p style={statLabelStyle}>Win Rate</p>
            </div>
          </div>
        </div>

        {/* Current Team card */}
        <div className="dash-m-hover-card" style={{ position: "absolute", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.43)", border: "1px solid #0162d1", height: 170, left: 25, top: 385, width: 361, borderRadius: 10, boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.13)", overflow: "clip" }}>
          <div style={{ position: "absolute", backgroundColor: "rgba(180,197,255,0.1)", height: 2, left: 0, right: 0, top: 0 }} />
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-start", left: 225, top: 21, width: 112 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14, color: "#000", whiteSpace: "nowrap" }}>Current Team</span>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "#0162d1", flexShrink: 0 }} />
            </div>
            <div>
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 16, whiteSpace: "nowrap" }}>{teamName || "No Team Yet"}</p>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{teamMemberLabel}</p>
            </div>
            <button type="button" className="dash-m-hover-lift" onClick={onTeamAction} style={{ background: GRADIENT_75, position: "relative", borderRadius: 5, height: 28, width: 98, border: "none", padding: 0 }}>
              <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 12, color: "#fff" }}>{hasTeam ? "Edit Team" : "Create Team"}</span>
            </button>
          </div>
        </div>
        <div style={{ position: "absolute", height: 143, left: 38, top: 398, width: 203, borderRadius: 12, overflow: "hidden", background: "#111" }}>
          <TeamLogo src={teamLogo} alt="Current team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Top Achievements card */}
        <div className="dash-m-hover-card" style={{ position: "absolute", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.43)", border: "1px solid #0162d1", height: 142, left: 26, top: 566, width: 361, borderRadius: 10, boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.13)", overflow: "clip" }}>
          <div style={{ position: "absolute", backgroundColor: "rgba(180,197,255,0.1)", height: 2, left: 0, right: 0, top: 0 }} />
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 16, color: "#000", left: 11, top: 9, whiteSpace: "nowrap" }}>
            Top Achievements
          </p>
          <div style={{ position: "absolute", display: "flex", gap: 16, alignItems: "flex-end", left: 12, top: 42 }}>
            {achievements.map((item) => (
              <div key={item.title} className="dash-m-achievement" style={{ position: "relative", width: 68.679, height: 84 }}>
                <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", color: item.tone === "gold" ? "#e6a422" : "#6f7b88", zIndex: 2 }}>
                  {item.icon}
                </div>
                <div style={{ position: "absolute", left: 0, bottom: 0, background: GRADIENT_SOFT, border: "1px solid #0162d1", height: 30.195, width: 68.679, borderRadius: 8, overflow: "clip" }}>
                  <p style={{ position: "absolute", left: "50%", top: 5, transform: "translateX(-50%)", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 9, color: "#000", whiteSpace: "nowrap" }}>{item.title}</p>
                  <p style={{ position: "absolute", left: "50%", top: 18, transform: "translateX(-50%)", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 8, color: "#000", whiteSpace: "nowrap" }}>Match</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
