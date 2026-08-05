import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pencil, Share2 } from "lucide-react";
import star from "../../assets/Auth/Star-two.svg";
import plane from "../../assets/Auth/plane.svg";
import "../../styles/roleHeroDashboard.css";

// Design was built at this fixed size (matches the supplied JudgeDashboard.jsx
// export exactly). The whole canvas is scaled down/up to fit the available
// width instead of letting it overflow with a scrollbar — same technique,
// same DESIGN_WIDTH/DESIGN_HEIGHT, as the source file.
const DESIGN_WIDTH = 1513;
const DESIGN_HEIGHT = 1010;

export interface RoleHeroStat {
  value: string | number;
  label: string;
  icon: ReactNode;
}

export interface RoleHeroEventMeta {
  icon: ReactNode;
  label: string;
  value: string;
}

export interface RoleHeroEvent {
  title: string;
  tag?: string;
  imageUrl?: string | null;
  /** Up to 4 rows, rendered at the same 4 fixed positions the source design used. */
  meta: RoleHeroEventMeta[];
  onView?: () => void;
  viewLabel?: string;
}

export interface RoleHeroAchievement {
  label: string;
  status: string;
  unlocked: boolean;
  icon: ReactNode;
}

export interface RoleHeroDashboardProps {
  name: string;
  photoUrl?: string | null;
  idLabel: string;
  idValue: string;
  roleLabel: string;
  roleIcon?: ReactNode;
  active?: boolean;
  onShare?: () => void;
  onEdit?: () => void;
  stat1: RoleHeroStat;
  stat2: RoleHeroStat;
  stat3: RoleHeroStat;
  miniEvents: string[];
  featuredEvent: RoleHeroEvent | null;
  emptyEventsLabel: string;
  achievement1: RoleHeroAchievement;
  achievement2: RoleHeroAchievement;
}

function StatBackdrop({ top }: { top: number }) {
  return <div className="rhd-abs rhd-stat-backdrop" style={{ left: 779, top, width: 345, height: 55 }} />;
}

export default function RoleHeroDashboard({
  name,
  photoUrl,
  idLabel,
  idValue,
  roleLabel,
  roleIcon,
  active = true,
  onShare,
  onEdit,
  stat1,
  stat2,
  stat3,
  miniEvents,
  featuredEvent,
  emptyEventsLabel,
  achievement1,
  achievement2,
}: RoleHeroDashboardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = outerRef.current;
    if (!node) return;

    const updateScale = () => {
      const containerWidth = node.offsetWidth;
      if (containerWidth > 0) setScale(containerWidth / DESIGN_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rhd-canvas-outer" ref={outerRef} style={{ height: DESIGN_HEIGHT * scale }}>
      <div className="rhd-canvas" style={{ transform: `scale(${scale})` }}>
        {/* ---------- decorative stars & background vectors ---------- */}
        <div className="rhd-abs" style={{ left: 854, top: 791, width: 171, height: 202.971 }}>
          <div className="rhd-star-rot-a"><img alt="" className="rhd-fill-img" src={star} /></div>
        </div>
        <div className="rhd-abs" style={{ left: 135, top: 877, width: 58.694, height: 71.31 }}>
          <div className="rhd-star-rot-b"><img alt="" className="rhd-fill-img" src={star} /></div>
        </div>
        <div className="rhd-abs rhd-fade" style={{ left: 33, top: 442, width: 318.396, height: 279.223 }}>
          <div style={{ transform: "rotate(30.36deg)" }}>
            <img alt="" src={plane} style={{ width: 273, opacity: 0.11 }} />
          </div>
        </div>
        <div className="rhd-abs rhd-fade" style={{ left: 1295, top: 655, width: 243.014, height: 222.13 }}>
          <div style={{ transform: "rotate(-22.71deg)" }}>
            <img alt="" src={plane} style={{ width: 197, opacity: 0.11 }} />
          </div>
        </div>

        {/* ---------- heading ---------- */}
        <p className="rhd-abs rhd-welcome" style={{ left: 220, top: 135, width: 602 }}>
          Welcome back, {name.split(" ")[0]}!
        </p>

        {/* ---------- header profile card ---------- */}
        <div className="rhd-abs rhd-profile-card" style={{ left: 224, top: 214, width: 1175, height: 343 }}>
          <div className="rhd-hdivider" />

          <p className="rhd-abs rhd-name" style={{ left: 46, top: 87, width: 400 }}>{name}</p>

          <div className="rhd-abs rhd-active-badge" style={{ left: 304, top: 106, height: 20 }}>
            <span className="rhd-active-dot" />
            <span>{active ? "Active" : "Inactive"}</span>
          </div>

          {onShare && (
            <button type="button" className="rhd-abs rhd-btn-gradient" style={{ left: 52, top: 256, width: 114, height: 32 }} onClick={onShare}>
              <Share2 size={12} /> <span>Share</span>
            </button>
          )}

          {onEdit && (
            <button type="button" className="rhd-abs rhd-btn-gradient" style={{ left: 176, top: 256, width: 114, height: 32 }} onClick={onEdit}>
              <Pencil size={12} /> <span>Edit</span>
            </button>
          )}

          <p className="rhd-abs rhd-id-text" style={{ left: 46, top: 138, width: 260 }}>{idLabel} - {idValue}</p>
          <p className="rhd-abs rhd-role-text" style={{ left: 74, top: 168, width: 220 }}>{roleLabel}</p>
          <div className="rhd-abs rhd-role-icon" style={{ left: 46, top: 168, width: 23, height: 23 }}>
            {roleIcon}
          </div>

          <StatBackdrop top={57} />
          <StatBackdrop top={143} />
          <StatBackdrop top={229} />

          <p className="rhd-abs rhd-stat-num" style={{ left: "calc(50% + 308.5px)", top: 60 }}>{stat1.value}</p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 370.5px)", top: 77, width: 100 }}>{stat1.label}</p>

          <p className="rhd-abs rhd-stat-num" style={{ left: "calc(50% + 329px)", top: 143, width: 51, textAlign: "center", transform: "translateX(-50%)" }}>{stat2.value}</p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 365.5px)", top: 160, width: 130 }}>{stat2.label}</p>

          <p className="rhd-abs rhd-stat-num" style={{ left: "calc(50% + 328.5px)", top: 233, width: 50, textAlign: "center", transform: "translateX(-50%)" }}>{stat3.value}</p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 365.5px)", top: 250, width: 130 }}>{stat3.label}</p>

          <div className="rhd-abs rhd-stat-icon" style={{ left: 837, top: 58, width: 38, height: 36 }}>{stat1.icon}</div>
          <div className="rhd-abs rhd-stat-icon" style={{ left: 837, top: 144, width: 38, height: 36 }}>{stat2.icon}</div>
          <div className="rhd-abs rhd-stat-icon" style={{ left: 837, top: 230, width: 38, height: 36 }}>{stat3.icon}</div>

          {/* decorative stars inside the card */}
          <img alt="" className="rhd-abs rhd-star-rot-c" style={{ left: -27, top: 161, width: 116.874, height: 116.874 }} src={star} />
          <img alt="" className="rhd-abs rhd-star-rot-c" style={{ left: 1084, top: -36, width: 116.874, height: 116.874 }} src={star} />
          <img alt="" className="rhd-abs rhd-star-rot-d" style={{ left: 370, top: -31, width: 106.668, height: 106.668 }} src={star} />
          <img alt="" className="rhd-abs rhd-star-rot-e" style={{ left: 997.08, top: 285.08, width: 92.516, height: 92.516 }} src={star} />
        </div>

        {/* far-right gradient chip near top of card */}
        <div className="rhd-abs rhd-gradient-fill" style={{ left: 1261, top: 138, width: 133, height: 40, borderRadius: 6 }} />

        <img alt="" className="rhd-abs rhd-star-rot-f" style={{ left: 871, top: 565, width: 53, height: 55.102 }} src={star} />
        <img alt="" className="rhd-abs rhd-star-rot-d" style={{ left: 1252, top: 680, width: 106.668, height: 106.668 }} src={star} />

        {/* profile photo — real photo when available, else an initials avatar,
            filling the exact same box the source design's hero art used */}
        <div className="rhd-abs" style={{ left: 635, top: 122, width: 338, height: 435, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}>
          {photoUrl ? (
            <img alt={name} className="rhd-fill-img" src={photoUrl} />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(150deg, var(--rhd-blue), var(--rhd-purple))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "'Sarpanch', sans-serif", fontSize: 96, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                {name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>

        {/* ---------- previous events card ---------- */}
        <div className="rhd-abs rhd-outline-card" style={{ left: 225, top: 571, width: 686, height: 332 }}>
          <p className="rhd-abs rhd-section-title" style={{ left: 26, top: 17, width: 238 }}>Previous Events</p>

          {!featuredEvent ? (
            <p className="rhd-abs rhd-empty-note" style={{ left: 26, top: 70, width: 634 }}>{emptyEventsLabel}</p>
          ) : (
            <>
              <div className="rhd-abs rhd-event-placeholder" style={{ left: 26, top: 67, width: 279, height: 43 }}>
                {miniEvents[0] && <span>{miniEvents[0]}</span>}
              </div>
              <div className="rhd-abs rhd-event-placeholder" style={{ left: 26, top: 122, width: 279, height: 43 }}>
                {miniEvents[1] && <span>{miniEvents[1]}</span>}
              </div>

              <div className="rhd-abs rhd-vdivider-v" style={{ left: 342, top: 12, height: 305 }} />

              <div className="rhd-abs" style={{ left: 357, top: 17, width: 311, height: 132, borderRadius: 12, overflow: "hidden", background: "linear-gradient(135deg, var(--rhd-blue), var(--rhd-purple))" }}>
                {featuredEvent.imageUrl && <img alt={featuredEvent.title} className="rhd-fill-img" src={featuredEvent.imageUrl} />}
              </div>

              <p className="rhd-abs rhd-event-title" style={{ left: 370, top: 157, width: 180 }}>{featuredEvent.title}</p>
              {featuredEvent.tag && (
                <p className="rhd-abs rhd-event-tag" style={{ left: 565, top: 165, width: 105 }}>{featuredEvent.tag}</p>
              )}

              {featuredEvent.onView && (
                <button type="button" className="rhd-abs rhd-btn-gradient rhd-btn-sm" style={{ left: 569, top: 292, width: 94, height: 25 }} onClick={featuredEvent.onView}>
                  <span>{featuredEvent.viewLabel ?? "View Details"}</span>
                </button>
              )}

              {featuredEvent.meta.slice(0, 4).map((m, i) => {
                const top = 195 + i * 27;
                return (
                  <div key={m.label}>
                    <div className="rhd-abs rhd-meta-icon" style={{ left: 370, top: top - 2, width: 18, height: 18 }}>{m.icon}</div>
                    <p className="rhd-abs rhd-meta-label" style={{ left: 396, top }}>{m.label} :</p>
                    <p className="rhd-abs rhd-meta-value" style={{ left: 454, top, width: 195 }}>{m.value}</p>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ---------- achievements card ---------- */}
        <div className="rhd-abs rhd-outline-card" style={{ left: 933, top: 571, width: 463, height: 332 }}>
          <p className="rhd-abs rhd-section-title" style={{ left: 35, top: 19, width: 238 }}>Achievements</p>
          <div className="rhd-abs rhd-vdivider-h" style={{ left: 35, top: 54, width: 400 }} />

          <div className="rhd-abs rhd-achievement" style={{ left: 35, top: 72, width: 154, height: 189 }}>
            <div className="rhd-abs rhd-achievement-badge" style={{ top: 30, left: 43 }}>{achievement1.icon}</div>
            <p className="rhd-abs rhd-achievement-label" style={{ left: 12, top: 130, width: 130 }}>{achievement1.label}</p>
            <p className="rhd-abs rhd-achievement-status" style={{ left: 12, top: 150, width: 130 }}>{achievement1.status}</p>
          </div>
          <div className="rhd-abs rhd-achievement" style={{ left: 211, top: 72, width: 154, height: 189 }}>
            <div className="rhd-abs rhd-achievement-badge" style={{ top: 30, left: 43 }}>{achievement2.icon}</div>
            <p className="rhd-abs rhd-achievement-label" style={{ left: 12, top: 130, width: 130 }}>{achievement2.label}</p>
            <p className="rhd-abs rhd-achievement-status" style={{ left: 12, top: 150, width: 130 }}>{achievement2.status}</p>
          </div>

          <div className="rhd-abs rhd-achievement-dot" style={{ left: "calc(50% + 0.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }} />
          <div className="rhd-abs rhd-achievement-dot rhd-dot-light" style={{ left: "calc(50% - 19.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }} />
          <div className="rhd-abs rhd-achievement-dot rhd-dot-light" style={{ left: "calc(50% + 20.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }} />
        </div>

        <div className="rhd-abs rhd-vdivider-h" style={{ left: 241, top: 624, width: 308 }} />
      </div>
    </div>
  );
}
