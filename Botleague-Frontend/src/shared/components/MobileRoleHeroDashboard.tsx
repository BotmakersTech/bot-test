import { useEffect, useRef, useState, type ReactNode } from "react";
import { Award, Pencil, Share2 } from "lucide-react";
import flight from "../../assets/Auth/flight.svg";
import bLogo from "../../assets/Dashboard/B_LOGO.png";
import mascot from "../../assets/mascote.png";
import type { RoleHeroDashboardProps } from "./RoleHeroDashboard";

/* ============================================================================
   MobileRoleHeroDashboard — same fixed-canvas Figma-port technique as
   UserDashboard's MobileDashboard.tsx (identical gradient, font, card-blur,
   border, radius and shadow values, same 412px design width scaled to fit,
   same decorative flight/star doodles), reused here so the Volunteer/Judge
   hero matches dash-hero-card's mobile/tablet look exactly instead of just
   reflowing the desktop rhd-profile-card at narrow widths.

   Differences from MobileDashboard, all because Volunteer/Judge have no
   rank or team concept:
   - No Rank badge — the Active badge takes its slot instead.
   - No Team card — replaced by a "recent items" card in the same slot/size,
     listing real rows (assignments/matches) instead of team info.
   ============================================================================ */

const GRADIENT_75 = "linear-gradient(180deg, rgba(1,98,209,0.75) 0%, rgba(140,108,255,0.75) 100%)";
const GRADIENT_SOLID = "linear-gradient(180deg, #0162d1 0%, #8c6cff 100%)";
const gradientText = {
  backgroundImage: GRADIENT_SOLID,
  WebkitBackgroundClip: "text" as const,
  backgroundClip: "text" as const,
  color: "transparent",
};
const statLabelStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 500 as const,
  fontSize: 12,
  color: "#6b7280",
  whiteSpace: "nowrap" as const,
};

const DESIGN_WIDTH = 412;
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
      className="rhd-outline-star"
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

export default function MobileRoleHeroDashboard({
  welcomeName,
  name,
  photoUrl,
  idLabel,
  idValue,
  roleLabel,
  onShare,
  onEdit,
  stat1Value,
  stat1Label,
  stat1Icon,
  stat2Value,
  stat2Label,
  stat2Icon,
  stat3Value,
  stat3Label,
  stat3Icon,
  recentItemsTitle,
  recentItems,
  recentItemsEmptyText,
  achievement1Label,
  achievement1Sublabel,
  achievement1Achieved = false,
  achievement2Label,
  achievement2Sublabel,
  achievement2Achieved = false,
}: RoleHeroDashboardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [photoErr, setPhotoErr] = useState(false);
  const hasPhoto = !!photoUrl && !photoErr;

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

  const iconAt = (icon: ReactNode | undefined, fallback: ReactNode) => icon ?? fallback;

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
            color: "#0162d1", left: 25, top: 20, width: 340, lineHeight: "normal",
          }}
        >
          Welcome back, {welcomeName}!
        </p>

        {/* Profile card */}
        <div
          style={{
            position: "absolute", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            backgroundColor: "rgba(255,255,255,0.43)", border: "1px solid #0162d1",
            height: 205, left: 25, top: 72, width: 361, borderRadius: 12, overflow: "clip",
          }}
        >
          <div style={{ position: "absolute", backgroundColor: "rgba(180,197,255,0.1)", height: 2, left: 0, right: 0, top: 0 }} />

          {/* Active badge (takes the Rank badge's slot — no rank concept here) */}
          <div style={{ position: "absolute", border: "1px solid #0162d1", height: 18, left: 13, top: 13, width: 51, borderRadius: 10, overflow: "clip", display: "flex", alignItems: "center", gap: 4, paddingLeft: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#0162d1", flexShrink: 0 }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 9, color: "#0162d1", letterSpacing: "0.18px" }}>Active</span>
          </div>

          {/* Name */}
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", textTransform: "capitalize", fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, left: 12, top: 39, letterSpacing: "0.4px", whiteSpace: "nowrap", ...gradientText }}>
            {name}
          </p>

          <MobileStar size={53} left={-20} top={97} rotate={-16.54} />
          <MobileStar size={40} left={144} top={-19} rotate={30.6} />

          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, color: "#000", left: 11, top: 67, whiteSpace: "nowrap" }}>
            {idLabel} - {idValue}
          </p>
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 10, color: "#000", left: 12, top: 81, whiteSpace: "nowrap" }}>
            {roleLabel}
          </p>

          {/* Share / Edit */}
          {onShare && (
            <button type="button" onClick={onShare} style={{ position: "absolute", background: GRADIENT_75, height: 27, left: 12, top: 155, width: 67, borderRadius: 5, border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
              <Share2 size={12} color="#fff" />
              <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 10, color: "#fff", whiteSpace: "nowrap" }}>Share</span>
            </button>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} style={{ position: "absolute", background: GRADIENT_75, height: 27, left: 86, top: 155, width: 67, borderRadius: 5, border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
              <Pencil size={12} color="#fff" />
              <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 10, color: "#fff", whiteSpace: "nowrap" }}>Edit</span>
            </button>
          )}
        </div>

        {/* decorative "B" watermark + avatar */}
        <img alt="" aria-hidden="true" src={bLogo} style={{ position: "absolute", left: 178, top: 145, width: 186, height: 150, objectFit: "contain", opacity: 0.5, pointerEvents: "none" }} />
        {hasPhoto ? (
          <img src={photoUrl!} alt={name} onError={() => setPhotoErr(true)} style={{ position: "absolute", left: 208, top: 47, width: 140, height: 230, objectFit: "cover", objectPosition: "top center", filter: "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }} />
        ) : (
          <img src={mascot} alt={name} style={{ position: "absolute", left: 208, top: 67, width: 140, height: 190, objectFit: "contain" }} />
        )}

        {/* Stats card */}
        <div style={{ position: "absolute", backgroundColor: "#fff", border: "1px solid #0162d1", height: 84, left: 25, top: 289, width: 361, borderRadius: 10, boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.13)", overflow: "visible" }}>
          <div style={{ position: "absolute", background: GRADIENT_SOLID, height: 57, left: 113, top: 12, width: 1, borderRadius: 15 }} />
          <div style={{ position: "absolute", background: GRADIENT_SOLID, height: 57, left: 239, top: 12, width: 1, borderRadius: 15 }} />

          <div style={{ position: "absolute", display: "flex", gap: 38, alignItems: "center", left: 24, top: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: 78 }}>
              <span style={{ color: "#3269d0", display: "flex" }}>{iconAt(stat1Icon, <Award size={20} />)}</span>
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 18, whiteSpace: "nowrap" }}>{stat1Value}</p>
              <p style={statLabelStyle}>{stat1Label}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: 78 }}>
              <span style={{ color: "#3269d0", display: "flex" }}>{iconAt(stat2Icon, <Award size={20} />)}</span>
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 18, whiteSpace: "nowrap" }}>{stat2Value}</p>
              <p style={statLabelStyle}>{stat2Label}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: 78 }}>
              <span style={{ color: "#3269d0", display: "flex" }}>{iconAt(stat3Icon, <Award size={20} />)}</span>
              <p style={{ ...gradientText, margin: 0, fontFamily: "Sarpanch, sans-serif", fontWeight: 600, fontSize: 18, whiteSpace: "nowrap" }}>{stat3Value}</p>
              <p style={statLabelStyle}>{stat3Label}</p>
            </div>
          </div>
        </div>

        {/* Recent items card — same slot/size as UserDashboard's Team card */}
        <div style={{ position: "absolute", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.43)", border: "1px solid #0162d1", height: 170, left: 25, top: 385, width: 361, borderRadius: 10, boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.13)", overflow: "clip" }}>
          <div style={{ position: "absolute", backgroundColor: "rgba(180,197,255,0.1)", height: 2, left: 0, right: 0, top: 0 }} />
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14, color: "#000", left: 14, top: 12, whiteSpace: "nowrap" }}>
            {recentItemsTitle}
          </p>

          {recentItems.length === 0 ? (
            <p style={{ position: "absolute", margin: 0, left: 14, right: 14, top: 76, textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9ca3af" }}>
              {recentItemsEmptyText}
            </p>
          ) : (
            <div style={{ position: "absolute", left: 14, right: 14, top: 40, display: "flex", flexDirection: "column", gap: 8 }}>
              {recentItems.slice(0, 2).map((item) => (
                <div key={item.id} style={{ borderRadius: 8, padding: "8px 10px", background: "linear-gradient(90deg, rgba(1,98,209,0.08), rgba(140,108,255,0.08))" }}>
                  <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 12, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                  {item.subtitle && (
                    <p style={{ margin: "2px 0 0", fontFamily: "Inter, sans-serif", fontSize: 10, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.subtitle}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements card */}
        <div style={{ position: "absolute", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.43)", border: "1px solid #0162d1", height: 142, left: 26, top: 566, width: 361, borderRadius: 10, boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.13)", overflow: "clip" }}>
          <div style={{ position: "absolute", backgroundColor: "rgba(180,197,255,0.1)", height: 2, left: 0, right: 0, top: 0 }} />
          <p style={{ position: "absolute", margin: 0, wordBreak: "break-word", fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 16, color: "#000", left: 11, top: 9, whiteSpace: "nowrap" }}>
            Achievements
          </p>
          <div style={{ position: "absolute", display: "flex", gap: 16, alignItems: "flex-end", left: 12, top: 42 }}>
            {[
              { label: achievement1Label, sub: achievement1Sublabel, achieved: achievement1Achieved },
              { label: achievement2Label, sub: achievement2Sublabel, achieved: achievement2Achieved },
            ].map((item) => (
              <div key={item.label} style={{ position: "relative", width: 68.679, height: 84 }}>
                <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", color: item.achieved ? "#e6a422" : "#c2c2cc", zIndex: 2 }}>
                  <Award size={30} />
                </div>
                <div style={{ position: "absolute", left: 0, bottom: 0, background: item.achieved ? "rgba(140,108,255,0.15)" : "rgba(0,0,0,0.03)", border: "1px solid #0162d1", height: 30.195, width: 68.679, borderRadius: 8, overflow: "clip" }}>
                  <p style={{ position: "absolute", left: "50%", top: 5, transform: "translateX(-50%)", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 9, color: "#000", whiteSpace: "nowrap" }}>{item.label}</p>
                  <p style={{ position: "absolute", left: "50%", top: 18, transform: "translateX(-50%)", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 8, color: "#000", whiteSpace: "nowrap" }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
