
import { useEffect, useRef } from "react";
import type { Robot } from "../types/types";

interface RobotDetailModalProps {
  robot: Robot;
  onClose: () => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  COMBAT:        "#ef4444",
  DRONE:         "#06b6d4",
  RC:            "#f59e0b",
  AUTONOMOUS:    "#8b5cf6",
  RACING:        "#dc2626",
  SOCCER:        "#10b981",
  LINE_FOLLOWER: "#ec4899",
  CUSTOM:        "#6b7280",
};

const CATEGORY_ICON: Record<string, string> = {
  COMBAT:        "",
  DRONE:         "",
  RC:            "",
  AUTONOMOUS:    "",
  RACING:        "",
  SOCCER:        "",
  LINE_FOLLOWER: "",
  CUSTOM:        "",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE:      { label: "Active",      color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)"  },
  INACTIVE:    { label: "Inactive",    color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)" },
  MAINTENANCE: { label: "Maintenance", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  RETIRED:     { label: "Retired",     color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Syne:wght@400;500;600;700;800&display=swap');

  /* ── Overlay ── */
  .rdm-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0,0,0,0);
    backdrop-filter: blur(0px);
    animation: rdm-overlay-in 0.5s ease forwards;
  }
  @keyframes rdm-overlay-in {
    from { background: rgba(0,0,0,0);    backdrop-filter: blur(0px); }
    to   { background: rgba(0,0,0,0.82); backdrop-filter: blur(10px); }
  }

  /* ── Modal shell — assembles from pieces ── */
  .rdm-modal {
    position: relative;
    width: 100%;
    max-width: 580px;
    background: #1a1a1a;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    overflow: hidden;
    opacity: 0;
    animation: rdm-modal-assemble 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    transform-origin: center center;
  }
  @keyframes rdm-modal-assemble {
    0%   { opacity: 0; transform: scale(0.6) translateY(40px); filter: brightness(2) blur(8px); }
    40%  { opacity: 1; filter: brightness(1.4) blur(2px); }
    70%  { transform: scale(1.02) translateY(-3px); filter: brightness(1) blur(0); }
    100% { opacity: 1; transform: scale(1) translateY(0); filter: brightness(1) blur(0); }
  }

  /* ── Hero ── */
  .rdm-hero {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: hidden;
    background: #111;
    clip-path: inset(100% 0 0 0);
    animation: rdm-hero-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
  }
  @keyframes rdm-hero-reveal {
    from { clip-path: inset(100% 0 0 0); }
    to   { clip-path: inset(0% 0 0 0);   }
  }

  .rdm-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform-origin: center center;
    animation: rdm-ken-burns 12s ease-in-out infinite alternate;
  }
  @keyframes rdm-ken-burns {
    0%   { transform: scale(1)    translateX(0)     translateY(0);    }
    50%  { transform: scale(1.07) translateX(-1.5%) translateY(-1%);  }
    100% { transform: scale(1.04) translateX(1%)    translateY(0.5%); }
  }

  .rdm-hero-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5rem;
  }

  .rdm-hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, #1a1a1a 100%);
  }

  /* ── Accent bar — sweeps left to right ── */
  .rdm-accent-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    transform-origin: left center;
    transform: scaleX(0);
    animation: rdm-bar-sweep 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
  }
  @keyframes rdm-bar-sweep {
    from { transform: scaleX(0); opacity: 0.4; }
    to   { transform: scaleX(1); opacity: 1;   }
  }

  /* ── Close button ── */
  .rdm-close {
    position: absolute;
    top: 14px; right: 14px;
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    opacity: 0;
    animation: rdm-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }
  .rdm-close:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.3);
    transform: scale(1.1) rotate(90deg);
  }
  @keyframes rdm-pop-in {
    from { opacity: 0; transform: scale(0.4) rotate(-90deg); }
    to   { opacity: 1; transform: scale(1)   rotate(0deg);   }
  }

  /* ── Category pill — flies from left ── */
  .rdm-cat-pill {
    position: absolute;
    bottom: 14px; left: 16px;
    padding: 5px 12px;
    border-radius: 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    z-index: 5;
    opacity: 0;
    transform: translateX(-20px);
    animation: rdm-pill-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards;
  }
  @keyframes rdm-pill-in {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0);     }
  }

  /* ── Body ── */
  .rdm-body {
    padding: 20px 24px 28px;
  }

  /* Name row — slides from left */
  .rdm-name-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
    opacity: 0;
    transform: translateX(-30px);
    animation: rdm-from-left 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
  }
  @keyframes rdm-from-left {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0);     }
  }

  .rdm-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.5rem;
    font-weight: 900;
    color: #fff;
    letter-spacing: 0.02em;
    margin: 0;
    line-height: 1.15;
  }

  .rdm-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 4px;
  }

  /* Status dot — radar ping */
  .rdm-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    position: relative;
    animation: rdm-radar 1.8s ease-out infinite;
  }
  @keyframes rdm-radar {
    0%  { box-shadow: 0 0 0 0px currentColor; opacity: 1;   }
    70% { box-shadow: 0 0 0 6px transparent;  opacity: 0.6; }
    100%{ box-shadow: 0 0 0 0px transparent;  opacity: 1;   }
  }

  /* Robot code — slides from right */
  .rdm-code {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.65rem;
    color: #4b5563;
    letter-spacing: 0.14em;
    margin: 0 0 20px;
    opacity: 0;
    transform: translateX(30px);
    animation: rdm-from-right 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
  }
  @keyframes rdm-from-right {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  /* Divider — expands width */
  .rdm-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin-bottom: 20px;
    transform-origin: left center;
    transform: scaleX(0);
    animation: rdm-divider-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.38s forwards;
  }
  @keyframes rdm-divider-in {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  /* ── Specs — fly up staggered from different directions ── */
  .rdm-specs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .rdm-spec-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 14px 16px;
    opacity: 0;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .rdm-spec-card:hover {
    border-color: rgba(255,255,255,0.15);
    transform: translateY(-3px) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  /* Each card from a different corner */
  .rdm-spec-card:nth-child(1) {
    animation: rdm-from-topleft  0.45s cubic-bezier(0.22,1,0.36,1) 0.42s forwards;
  }
  .rdm-spec-card:nth-child(2) {
    animation: rdm-from-topright 0.45s cubic-bezier(0.22,1,0.36,1) 0.48s forwards;
  }
  .rdm-spec-card:nth-child(3) {
    animation: rdm-from-botleft  0.45s cubic-bezier(0.22,1,0.36,1) 0.54s forwards;
  }
  .rdm-spec-card:nth-child(4) {
    animation: rdm-from-botright 0.45s cubic-bezier(0.22,1,0.36,1) 0.60s forwards;
  }

  @keyframes rdm-from-topleft {
    from { opacity: 0; transform: translate(-20px, -20px) scale(0.9); }
    to   { opacity: 1; transform: translate(0, 0)         scale(1);   }
  }
  @keyframes rdm-from-topright {
    from { opacity: 0; transform: translate(20px, -20px) scale(0.9); }
    to   { opacity: 1; transform: translate(0, 0)        scale(1);   }
  }
  @keyframes rdm-from-botleft {
    from { opacity: 0; transform: translate(-20px, 20px) scale(0.9); }
    to   { opacity: 1; transform: translate(0, 0)        scale(1);   }
  }
  @keyframes rdm-from-botright {
    from { opacity: 0; transform: translate(20px, 20px) scale(0.9); }
    to   { opacity: 1; transform: translate(0, 0)       scale(1);   }
  }

  .rdm-spec-label {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    color: #4b5563;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .rdm-spec-value {
    font-family: 'Syne', sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    color: #e5e7eb;
  }

  /* ── Description — blur fade ── */
  .rdm-desc-label {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    color: #4b5563;
    text-transform: uppercase;
    margin-bottom: 8px;
    opacity: 0;
    animation: rdm-fade-blur 0.5s ease 0.68s forwards;
  }

  .rdm-desc-text {
    font-family: 'Syne', sans-serif;
    font-size: 0.875rem;
    color: #9ca3af;
    line-height: 1.65;
    margin: 0;
    opacity: 0;
    animation: rdm-fade-blur 0.5s ease 0.72s forwards;
  }
  @keyframes rdm-fade-blur {
    from { opacity: 0; filter: blur(6px); transform: translateY(8px); }
    to   { opacity: 1; filter: blur(0);   transform: translateY(0);   }
  }

  /* ── Footer ── */
  .rdm-footer {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    opacity: 0;
    animation: rdm-fade-blur 0.4s ease 0.78s forwards;
  }

  .rdm-close-btn {
    padding: 10px 24px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #9ca3af;
    font-family: 'Syne', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .rdm-close-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
    border-color: rgba(255,255,255,0.2);
  }
`;

function injectStyles() {
  const existing = document.getElementById("rdm-styles");
  if (existing) existing.remove(); // always refresh
  const tag = document.createElement("style");
  tag.id = "rdm-styles";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

export default function RobotDetailModal({ robot, onClose }: RobotDetailModalProps) {
  injectStyles();

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const accentColor = CATEGORY_COLOR[robot.robotType] ?? "#9ca3af";
  const icon        = CATEGORY_ICON[robot.robotType]  ?? "⚙️";
  const status      = STATUS_CONFIG[String(robot.status)] ?? STATUS_CONFIG.INACTIVE;

  const specs = [
    { label: "Category",     value: robot.robotType    ?? "—" },
    { label: "Weight Class", value: robot.weightClass  ?? "—" },
    { label: "Control Type", value: robot.controlType  ?? "—" },
    { label: "Robot Code",   value: robot.robotCode    ?? "—" },
  ];

  return (
    <div className="rdm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="rdm-modal" role="dialog" aria-modal="true" aria-label={robot.robotName}>

        {/* Hero */}
        <div className="rdm-hero">
          <div
            className="rdm-accent-bar"
            style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}44)` }}
          />

          {robot.robotIMG ? (
            <img
              src={robot.robotIMG}
              alt={robot.robotName}
              className="rdm-hero-img"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="rdm-hero-placeholder"
              style={{
                background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 70%)`,
              }}
            >
              {icon}
            </div>
          )}

          <div className="rdm-hero-gradient" />

          <span
            className="rdm-cat-pill"
            style={{
              background: `${accentColor}18`,
              color: accentColor,
              borderColor: `${accentColor}40`,
            }}
          >
            {icon} {robot.robotType}
          </span>

          <button className="rdm-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="rdm-body">

          <div className="rdm-name-row">
            <h2 className="rdm-name">{robot.robotName}</h2>
            <span
              className="rdm-status"
              style={{
                background: status.bg,
                color: status.color,
                borderColor: status.border,
              }}
            >
              <span className="rdm-status-dot" style={{ background: status.color }} />
              {status.label}
            </span>
          </div>

          <p className="rdm-code">{robot.robotCode}</p>

          <div className="rdm-divider" />

          <div className="rdm-specs">
            {specs.map(({ label, value }) => (
              <div key={label} className="rdm-spec-card">
                <p className="rdm-spec-label">{label}</p>
                <p className="rdm-spec-value">{value}</p>
              </div>
            ))}
          </div>

          {robot.description && (
            <>
              <p className="rdm-desc-label">Description</p>
              <p className="rdm-desc-text">{robot.description}</p>
            </>
          )}

          <div className="rdm-footer">
            <button className="rdm-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}