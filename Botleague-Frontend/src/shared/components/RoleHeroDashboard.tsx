import { useEffect, useRef, useState, type ReactNode } from "react";
import { Building2, Clock3, MapPin, Pencil, Share2, Swords } from "lucide-react";
import star from "../../assets/Auth/Star-two.svg";
import plane from "../../assets/Auth/plane.svg";
import "../../styles/roleHeroDashboard.css";

// Design was built at this fixed size in Figma. We scale the whole canvas
// down/up to fit the available width instead of letting it overflow with
// a scrollbar. Positions below are ported 1:1 from the supplied
// JudgeDashboard.jsx/css. The original's `img` map pointed at
// figma.com/api/mcp/asset/... URLs — those are Figma's own session-scoped
// proxy links and don't resolve for real site visitors (confirmed: every
// image in that map 404s once rendered outside the Figma session, which is
// what caused the broken-icon clutter). Every element below keeps the
// exact same position/size box the source used; only what fills that box
// changed, from a dead external image to a local asset, an icon, or CSS.
const DESIGN_WIDTH = 1513;
const DESIGN_HEIGHT = 1010;

/** One of the three repeating background bars behind the stat numbers. */
function StatBackdrop({ top }: { top: number }) {
  return <div className="rhd-abs rhd-stat-backdrop" style={{ left: 779, top, width: 345, height: 55 }} />;
}

export interface RoleHeroDashboardProps {
  welcomeName: string;
  name: string;
  photoUrl?: string | null;
  idLabel: string;
  idValue: string;
  roleLabel: string;
  roleIcon: ReactNode;
  onShare?: () => void;
  onEdit?: () => void;
  stat1Value: string | number;
  stat1Label: string;
  stat1Icon: ReactNode;
  stat2Value: string | number;
  stat2Label: string;
  stat2Icon: ReactNode;
  stat3Value: string | number;
  stat3Label: string;
  stat3Icon: ReactNode;
  eventTitle: string;
  eventTag: string;
  eventArena?: string;
  eventTime?: string;
  eventPlace?: string;
  eventImageUrl?: string | null;
  onViewEvent?: () => void;
  achievement1Label: string;
  achievement1Icon: ReactNode;
  achievement2Label: string;
  achievement2Icon: ReactNode;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function RoleHeroDashboard({
  welcomeName,
  name,
  photoUrl,
  idLabel,
  idValue,
  roleLabel,
  roleIcon,
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
  eventTitle,
  eventTag,
  eventArena,
  eventTime,
  eventPlace,
  eventImageUrl,
  onViewEvent,
  achievement1Label,
  achievement1Icon,
  achievement2Label,
  achievement2Icon,
}: RoleHeroDashboardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = outerRef.current;
    if (!node) return;

    const updateScale = () => {
      const containerWidth = node.offsetWidth;
      if (containerWidth > 0) {
        setScale(containerWidth / DESIGN_WIDTH);
      }
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rhd-canvas-outer" ref={outerRef} style={{ height: DESIGN_HEIGHT * scale }}>
      <div
        className="rhd-canvas"
        data-name="Role Hero Dashboard"
        style={{ transform: `scale(${scale})` }}
      >
        {/* ---------- decorative stars & background vectors ---------- */}
        <div className="rhd-abs" style={{ left: 854, top: 791, width: 171, height: 202.971 }}>
          <div className="rhd-star-rot-a"><img alt="" className="rhd-fill-img" src={star} /></div>
        </div>
        <div className="rhd-abs" style={{ left: 135, top: 877, width: 58.694, height: 71.31 }}>
          <div className="rhd-star-rot-b"><img alt="" className="rhd-fill-img" src={star} /></div>
        </div>
        <div className="rhd-abs rhd-bg-glow-a" style={{ left: 0, top: 760, width: 1513, height: 256 }} />
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
        <div className="rhd-abs rhd-bg-glow-b" style={{ left: 98, top: 82, width: 1412, height: 372 }} />

        {/* ---------- heading ---------- */}
        <p className="rhd-abs rhd-welcome" style={{ left: 220, top: 135, width: 602 }}>
          Welcome back, {welcomeName}!
        </p>

        {/* ---------- header profile card ---------- */}
        <div className="rhd-abs rhd-profile-card" style={{ left: 224, top: 214, width: 1175, height: 343 }}>
          <div className="rhd-hdivider" />

          <p className="rhd-abs rhd-name" style={{ left: 46, top: 87, width: 283 }}>
            {name}
          </p>

          <div className="rhd-abs rhd-active-badge" style={{ left: 304, top: 106, width: 66, height: 20 }}>
            <span className="rhd-active-dot" />
            <span>Active</span>
          </div>

          {onShare && (
            <button type="button" className="rhd-abs rhd-btn-gradient" style={{ left: 52, top: 256, width: 114, height: 32 }} onClick={onShare}>
              <Share2 size={12} />
              <span>Share</span>
            </button>
          )}

          {onEdit && (
            <button type="button" className="rhd-abs rhd-btn-gradient" style={{ left: 176, top: 256, width: 114, height: 32 }} onClick={onEdit}>
              <Pencil size={12} />
              <span>Edit</span>
            </button>
          )}

          <p className="rhd-abs rhd-id-text" style={{ left: 46, top: 138, width: 210 }}>
            {idLabel} - {idValue}
          </p>
          <p className="rhd-abs rhd-role-text" style={{ left: 74, top: 168, width: 154 }}>
            {roleLabel}
          </p>
          <div className="rhd-abs rhd-icon-box" style={{ left: 46, top: 168, width: 23, height: 23 }}>
            {roleIcon}
          </div>

          <StatBackdrop top={57} />
          <StatBackdrop top={143} />
          <StatBackdrop top={229} />

          <p className="rhd-abs rhd-stat-num" style={{ left: "calc(50% + 308.5px)", top: 60 }}>
            {stat1Value}
          </p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 370.5px)", top: 77, width: 80 }}>
            {stat1Label}
          </p>

          <p
            className="rhd-abs rhd-stat-num"
            style={{ left: "calc(50% + 329px)", top: 143, width: 51, textAlign: "center", transform: "translateX(-50%)" }}
          >
            {stat2Value}
          </p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 365.5px)", top: 160, width: 115 }}>
            {stat2Label}
          </p>

          <p
            className="rhd-abs rhd-stat-num"
            style={{ left: "calc(50% + 328.5px)", top: 233, width: 50, textAlign: "center", transform: "translateX(-50%)" }}
          >
            {stat3Value}
          </p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 365.5px)", top: 250, width: 115 }}>
            {stat3Label}
          </p>

          {/* stat icons */}
          <div className="rhd-abs rhd-icon-box" style={{ left: 837, top: 58, width: 38, height: 36 }}>{stat1Icon}</div>
          <div className="rhd-abs rhd-icon-box" style={{ left: 837, top: 144, width: 38, height: 36 }}>{stat2Icon}</div>
          <div className="rhd-abs rhd-icon-box" style={{ left: 837, top: 230, width: 38, height: 36 }}>{stat3Icon}</div>

          {/* decorative stars inside the card */}
          <img alt="" className="rhd-abs rhd-star-rot-c" style={{ left: -27, top: 161, width: 116.874, height: 116.874 }} src={star} />
          <img alt="" className="rhd-abs rhd-star-rot-c" style={{ left: 1084, top: -36, width: 116.874, height: 116.874 }} src={star} />
          <img alt="" className="rhd-abs rhd-star-rot-d" style={{ left: 370, top: -31, width: 106.668, height: 106.668 }} src={star} />
          <img alt="" className="rhd-abs rhd-star-rot-e" style={{ left: 997.08, top: 285.08, width: 92.516, height: 92.516 }} src={star} />

          <div className="rhd-abs rhd-fade-soft rhd-card-glow" style={{ left: 376, top: -3, width: 402.232, height: 344 }} />
        </div>

        {/* far-right gradient chip near top of card */}
        <div className="rhd-abs rhd-gradient-fill" style={{ left: 1261, top: 138, width: 133, height: 40, borderRadius: 6 }} />

        <img alt="" className="rhd-abs rhd-star-rot-f" style={{ left: 871, top: 565, width: 53, height: 55.102 }} src={star} />
        <img alt="" className="rhd-abs rhd-star-rot-d" style={{ left: 1252, top: 680, width: 106.668, height: 106.668 }} src={star} />

        {/* profile photo — real photo when available, else an initials
            avatar, filling the exact same box the source design used */}
        <div className="rhd-abs" style={{ left: 635, top: 122, width: 338, height: 435, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}>
          {photoUrl ? (
            <img alt={name} className="rhd-fill-img" src={photoUrl} />
          ) : (
            <div className="rhd-avatar-fallback">
              <span>{initials(name)}</span>
            </div>
          )}
        </div>

        {/* ---------- previous events card ---------- */}
        <div className="rhd-abs rhd-outline-card" style={{ left: 225, top: 571, width: 686, height: 332 }}>
          <p className="rhd-abs rhd-section-title" style={{ left: 26, top: 17, width: 238 }}>
            Previous Events
          </p>

          <div className="rhd-abs rhd-event-placeholder" style={{ left: 26, top: 67, width: 279, height: 43 }} />
          <div className="rhd-abs rhd-event-placeholder" style={{ left: 26, top: 122, width: 279, height: 43 }} />

          <div className="rhd-abs rhd-vdivider-v" style={{ left: 342, top: 12, height: 305 }} />

          <div
            className="rhd-abs"
            style={{ left: 357, top: 17, width: 311, height: 132, borderRadius: 12, overflow: "hidden", background: eventImageUrl ? "#d9d9d9" : "linear-gradient(135deg, var(--rhd-blue), var(--rhd-purple))" }}
          >
            {eventImageUrl && <img alt={eventTitle} className="rhd-fill-img" style={{ objectFit: "cover" }} src={eventImageUrl} />}
          </div>

          <p className="rhd-abs rhd-event-title" style={{ left: 370, top: 157, width: 131 }}>
            {eventTitle}
          </p>
          <p className="rhd-abs rhd-event-upcoming" style={{ left: 565, top: 165, width: 102 }}>
            {eventTag}
          </p>

          {onViewEvent && (
            <button type="button" className="rhd-abs rhd-btn-gradient rhd-btn-sm" style={{ left: 569, top: 292, width: 94, height: 25 }} onClick={onViewEvent}>
              <span>View Details</span>
            </button>
          )}

          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 195 }}>Match : </p>
          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 222 }}>Arena :</p>
          <p className="rhd-abs rhd-meta-value" style={{ left: 454, top: 222 }}>{eventArena}</p>
          <p className="rhd-abs rhd-meta-value" style={{ left: 454, top: 249 }}>{eventTime}</p>
          <p className="rhd-abs rhd-meta-value" style={{ left: 454, top: 276 }}>{eventPlace}</p>
          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 249 }}>Time : </p>
          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 276 }}>Place :</p>

          <div className="rhd-abs rhd-icon-box" style={{ left: 371, top: 194, width: 17, height: 17 }}><Swords size={14} /></div>
          <div className="rhd-abs rhd-icon-box" style={{ left: 371, top: 248, width: 17, height: 17 }}><Clock3 size={14} /></div>
          <div className="rhd-abs rhd-icon-box" style={{ left: 371, top: 276, width: 18, height: 18 }}><MapPin size={14} /></div>
          <div className="rhd-abs rhd-icon-box" style={{ left: 370, top: 220, width: 19, height: 19 }}><Building2 size={15} /></div>
        </div>

        {/* ---------- achievements card ---------- */}
        <div className="rhd-abs rhd-outline-card" style={{ left: 933, top: 571, width: 463, height: 332 }}>
          <p className="rhd-abs rhd-section-title" style={{ left: 35, top: 19, width: 238 }}>
            Achievements
          </p>
          <div className="rhd-abs rhd-vdivider-h" style={{ left: 35, top: 54, width: 400 }} />

          <div className="rhd-abs rhd-achievement" style={{ left: 35, top: 72, width: 154, height: 189 }}>
            <div className="rhd-abs rhd-achievement-badge" style={{ left: 27, top: 30 }}>{achievement1Icon}</div>
            <p className="rhd-abs rhd-achievement-label" style={{ left: 30, top: 166, width: 94 }}>
              {achievement1Label}
            </p>
          </div>
          <div className="rhd-abs rhd-achievement" style={{ left: 211, top: 72, width: 154, height: 189 }}>
            <div className="rhd-abs rhd-achievement-badge" style={{ left: 43, top: 30 }}>{achievement2Icon}</div>
            <p
              className="rhd-abs rhd-achievement-label"
              style={{ left: "50%", top: 166, width: 55, textAlign: "center", transform: "translateX(-50%)" }}
            >
              {achievement2Label}
            </p>
          </div>

          <div className="rhd-abs rhd-dot" style={{ left: "calc(50% + 0.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }} />
          <div className="rhd-abs rhd-dot" style={{ left: "calc(50% - 19.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }} />
          <div className="rhd-abs rhd-dot" style={{ left: "calc(50% + 20.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }} />
        </div>

        <div className="rhd-abs rhd-vdivider-h" style={{ left: 241, top: 624, width: 308 }} />
      </div>
    </div>
  );
}
