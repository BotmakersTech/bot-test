
import { useState } from "react";
import useRobots from "../hooks/useRobots";
import { useAppSelector } from "../../../app/hooks";
import RobotDetailModal from "../components/RobotDetailModal";
import CreateRobotForm from "../components/CreateRobotFrom";
import Modal from "../../../shared/components/Modal";
import type { Robot } from "../types/types";

// ─── Category config ───────────────────────────────────────────────────────
const CATEGORY_COLOR: Record<string, string> = {
  COMBAT:     "#ef4444",
  HUMANOID:   "#8b5cf6",
  DRONE:      "#06b6d4",
  AUTOMATION: "#10b981",
};

const CATEGORY_LABEL: Record<string, string> = {
  COMBAT:     "Combat",
  HUMANOID:   "Humanoid",
  DRONE:      "Drone",
  AUTOMATION: "Automation",
};

const STATUS_COLOR: Record<string, { bg: string; dot: string; text: string; border: string }> = {
  ACTIVE:   { bg: "rgba(16,185,129,.1)",  dot: "#10b981", text: "#10b981", border: "rgba(16,185,129,.25)"  },
  INACTIVE: { bg: "rgba(156,163,175,.1)", dot: "#9ca3af", text: "#9ca3af", border: "rgba(156,163,175,.25)" },
  RETIRED:  { bg: "rgba(239,68,68,.1)",   dot: "#ef4444", text: "#ef4444", border: "rgba(239,68,68,.25)"   },
};

// ─── Styles ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Syne:wght@400;500;600;700;800&display=swap');

  :root {
    --bg:        #3a3a3a;
    --surface:   #242424;
    --surface2:  #1c1c1c;
    --border:    rgba(255,255,255,0.06);
    --border2:   rgba(255,255,255,0.10);
    --accent:    #ff1900;
    --accent2:   #e60000;
    --text:      #ffffff;
    --muted:     #6b7280;
    --muted2:    #9ca3af;
  }

  .rp-page {
    min-height: 100vh;
    background: var(--bg);
    padding: 40px 44px;
    font-family: 'Syne', sans-serif;
    color: var(--text);
    position: relative;
    overflow-x: hidden;
  }

  .rp-page::before { display: none; }

  .rp-content { position: relative; z-index: 1; }

  /* ── Header ── */
  .rp-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;
    gap: 20px;
    flex-wrap: wrap;
  }

  .rp-header-left {}

  .rp-eyebrow {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    color: var(--accent);
    text-transform: uppercase;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rp-eyebrow::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 2px;
    background: var(--accent);
    border-radius: 2px;
  }

  .rp-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 2.6rem;
    font-weight: 900;
    letter-spacing: -0.01em;
    margin: 0 0 6px;
    color: var(--text);
    line-height: 1;
  }

  .rp-subtitle {
    color: var(--muted);
    margin: 0;
    font-size: 0.9rem;
    font-weight: 400;
  }

  /* Stats bar */
  .rp-stats {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 32px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }
  .rp-stat-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--muted2);
    transition: border-color 0.15s;
  }
  .rp-stat-chip:hover { border-color: rgba(255,255,255,0.18); }
  .rp-stat-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .rp-stat-num {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text);
  }

  /* Add button */
  .rp-add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #fb1500 0%, #dd2900 100%);
    border: none;
    color: #fff;
    padding: 13px 22px;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(250,71,21,0.3);
    white-space: nowrap;
  }
  .rp-add-btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(250,71,21,0.4);
  }
  .rp-add-btn:active { transform: translateY(0); }

  /* ── Filter tabs ── */
  .rp-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .rp-filter-btn {
    padding: 7px 16px;
    border-radius: 8px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--muted2);
    font-family: 'Syne', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.03em;
  }
  .rp-filter-btn:hover {
    border-color: rgba(255,255,255,0.2);
    color: var(--text);
  }
  .rp-filter-btn.active {
    background: rgba(250,71,21,0.12);
    border-color: rgba(250,71,21,0.4);
    color: var(--accent);
  }

  /* ── Grid ── */
  .rp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 20px;
  }

  /* ── Card ── */
  .rp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .rp-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 52px rgba(0,0,0,0.5);
    border-color: rgba(250,71,21,0.3);
  }

  /* Accent top bar */
  .rp-card-bar {
    height: 3px;
    width: 100%;
    flex-shrink: 0;
  }

  /* Image */
  .rp-card-img-wrap {
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: var(--surface2);
    position: relative;
    flex-shrink: 0;
  }
  .rp-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .rp-card:hover .rp-card-img { transform: scale(1.06); }

  .rp-card-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Category pill on image */
  .rp-cat-pill {
    position: absolute;
    bottom: 10px;
    left: 12px;
    padding: 4px 10px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.08);
    text-transform: uppercase;
  }

  /* Card body */
  .rp-card-body {
    padding: 18px 20px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .rp-card-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin: 0 0 3px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rp-card-code {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.65rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    margin: 0 0 16px;
  }

  .rp-card-divider {
    height: 1px;
    background: var(--border);
    margin-bottom: 14px;
  }

  /* Meta row */
  .rp-meta {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }
  .rp-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    background: rgba(255,255,255,0.05);
    color: var(--muted2);
    border: 1px solid var(--border2);
    font-family: 'Syne', sans-serif;
  }
  .rp-status {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    margin-left: auto;
    font-family: 'Orbitron', sans-serif;
    border: 1px solid;
  }
  .rp-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: rp-pulse 2s infinite;
  }
  @keyframes rp-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── Empty ── */
  .rp-empty {
    grid-column: 1 / -1;
    background: var(--surface);
    border: 1px dashed rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 72px 40px;
    text-align: center;
  }
  .rp-empty-icon {
    margin: 0 auto 20px;
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: rgba(250,71,21,0.08);
    border: 1px solid rgba(250,71,21,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rp-empty-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 8px;
    letter-spacing: 0.04em;
  }
  .rp-empty-sub {
    color: var(--muted);
    font-size: 0.86rem;
    margin: 0 0 24px;
  }
  .rp-empty-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, #fa2415, #e00f00);
    border: none;
    color: #fff;
    padding: 11px 22px;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Orbitron', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 4px 18px rgba(250,71,21,0.3);
  }
  .rp-empty-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  /* ── Full-screen states ── */
  .rp-center {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    flex-direction: column;
    gap: 12px;
  }
  .rp-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(250,71,21,0.15);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: rp-spin 0.7s linear infinite;
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }
`;

function injectStyles() {
  if (document.getElementById("rp-styles")) return;
  const tag = document.createElement("style");
  tag.id = "rp-styles";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ─── Robot placeholder SVG ─────────────────────────────────────────────────
function RobotPlaceholder({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="8"  width="24" height="16" rx="4" fill={`${color}22`} stroke={`${color}44`} strokeWidth="1.5"/>
      <rect x="10" y="26" width="36" height="22" rx="5" fill={`${color}18`} stroke={`${color}33`} strokeWidth="1.5"/>
      <rect x="4"  y="30" width="7"  height="12" rx="3" fill={`${color}14`} stroke={`${color}28`} strokeWidth="1.5"/>
      <rect x="45" y="30" width="7"  height="12" rx="3" fill={`${color}14`} stroke={`${color}28`} strokeWidth="1.5"/>
      <rect x="18" y="48" width="8"  height="6"  rx="2" fill={`${color}14`}/>
      <rect x="30" y="48" width="8"  height="6"  rx="2" fill={`${color}14`}/>
      <circle cx="22" cy="16" r="3.5" fill={color} opacity="0.6"/>
      <circle cx="34" cy="16" r="3.5" fill={color} opacity="0.6"/>
      <rect x="20" y="32" width="16" height="8" rx="3" fill={`${color}22`} stroke={`${color}44`} strokeWidth="1"/>
    </svg>
  );
}

// ─── Plus icon ─────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function RobotsPage() {
  injectStyles();

  const teamCode = useAppSelector((state) => state.team.teamCode);
  const { robots, loading, error, fetchRobots } = useRobots(teamCode ?? undefined);

  const [selected, setSelected]   = useState<Robot | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");

  // ── loading ──
  if (loading) {
    return (
      <div className="rp-center">
        <div className="rp-spinner" />
        <span style={{ color: "#6b7280", fontSize: "0.85rem", fontFamily: "'Syne', sans-serif" }}>
          Loading robots…
        </span>
      </div>
    );
  }

  // ── error ──
  if (error) {
    return (
      <div className="rp-center">
        <span style={{ color: "#ef4444", fontSize: "0.95rem", fontFamily: "'Syne', sans-serif" }}>
          {error}
        </span>
      </div>
    );
  }

  // Filter options
  const allCategories = ["ALL", ...Array.from(new Set(robots.map(r => r.robotType).filter(Boolean)))];

  const filtered = activeFilter === "ALL"
    ? robots
    : robots.filter(r => r.robotType === activeFilter);

  // Stats
  const activeCount   = robots.filter(r => String(r.status) === "ACTIVE").length;
  const inactiveCount = robots.filter(r => String(r.status) === "INACTIVE").length;
  const retiredCount  = robots.filter(r => String(r.status) === "RETIRED").length;

  return (
    <div className="rp-page">
      <div className="rp-content">

        {/* ── Header ── */}
        <div className="rp-header">
          <div className="rp-header-left">
            <p className="rp-eyebrow">Fleet Management</p>
            <h1 className="rp-title">Team Robots</h1>
            <p className="rp-subtitle">Manage and monitor your competition robots</p>
          </div>
          <button className="rp-add-btn" onClick={() => setShowCreate(true)}>
            <PlusIcon /> ADD ROBOT
          </button>
        </div>

        {/* ── Stats bar ── */}
        <div className="rp-stats">
          <div className="rp-stat-chip">
            <span className="rp-stat-dot" style={{ background: "#9ca3af" }} />
            Total
            <span className="rp-stat-num">{robots.length}</span>
          </div>
          <div className="rp-stat-chip">
            <span className="rp-stat-dot" style={{ background: "#10b981" }} />
            Active
            <span className="rp-stat-num">{activeCount}</span>
          </div>
          <div className="rp-stat-chip">
            <span className="rp-stat-dot" style={{ background: "#9ca3af" }} />
            Inactive
            <span className="rp-stat-num">{inactiveCount}</span>
          </div>
          {retiredCount > 0 && (
            <div className="rp-stat-chip">
              <span className="rp-stat-dot" style={{ background: "#ef4444" }} />
              Retired
              <span className="rp-stat-num">{retiredCount}</span>
            </div>
          )}
        </div>

        {/* ── Category filters ── */}
        {robots.length > 0 && (
          <div className="rp-filters">
            {allCategories.map(cat => (
              <button
                key={cat}
                className={`rp-filter-btn${activeFilter === cat ? " active" : ""}`}
                onClick={() => setActiveFilter(cat)}
                style={activeFilter === cat && cat !== "ALL" ? {
                  background: `${CATEGORY_COLOR[cat]}18`,
                  borderColor: `${CATEGORY_COLOR[cat]}55`,
                  color: CATEGORY_COLOR[cat],
                } : {}}
              >
                {cat === "ALL" ? "All Robots" : (CATEGORY_LABEL[cat] ?? cat)}
              </button>
            ))}
          </div>
        )}

        {/* ── Grid ── */}
        <div className="rp-grid">
          {filtered.length === 0 ? (
            <div className="rp-empty">
              <div className="rp-empty-icon">
                <RobotPlaceholder color="#ff2600" />
              </div>
              <p className="rp-empty-title">No Robots Found</p>
              <p className="rp-empty-sub">
                {activeFilter !== "ALL"
                  ? `No ${CATEGORY_LABEL[activeFilter] ?? activeFilter} robots yet.`
                  : "Add your first robot to get started."}
              </p>
              {activeFilter === "ALL" && (
                <button className="rp-empty-btn" onClick={() => setShowCreate(true)}>
                  <PlusIcon /> ADD FIRST ROBOT
                </button>
              )}
            </div>
          ) : (
            filtered.map((robot) => {
              const accentColor = CATEGORY_COLOR[robot.robotType] ?? "#9ca3af";
              const status = STATUS_COLOR[String(robot.status)] ?? STATUS_COLOR.INACTIVE;

              return (
                <div
                  key={robot.id}
                  className="rp-card"
                  onClick={() => setSelected(robot)}
                >
                  {/* Accent top bar */}
                  <div
                    className="rp-card-bar"
                    style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}44)` }}
                  />

                  {/* Image */}
                  <div className="rp-card-img-wrap">
                  {robot.robotIMG ? (
  <img
    src={robot.robotIMG}
    alt={robot.robotName}
    className="rp-card-img"
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).style.display = "none";
    }}
  />
                    ) : (
                      <div
                        className="rp-card-img-placeholder"
                        style={{ background: `radial-gradient(ellipse at center, ${accentColor}0a 0%, transparent 70%)` }}
                      >
                        <RobotPlaceholder color={accentColor} />
                      </div>
                    )}

                    {/* Category pill */}
                    <span
                      className="rp-cat-pill"
                      style={{
                        background: `${accentColor}18`,
                        color: accentColor,
                        borderColor: `${accentColor}33`,
                      }}
                    >
                      {CATEGORY_LABEL[robot.robotType] ?? robot.robotType}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="rp-card-body">
                    <p className="rp-card-name">{robot.robotName}</p>
                    <p className="rp-card-code">{robot.robotCode}</p>
                    <div className="rp-card-divider" />
                    <div className="rp-meta">
                      {robot.weightClass && (
                        <span className="rp-badge">{robot.weightClass}</span>
                      )}
                      {robot.controlType && (
                        <span className="rp-badge">{robot.controlType}</span>
                      )}
                      <span
                        className="rp-status"
                        style={{
                          background: status.bg,
                          color: status.text,
                          borderColor: status.border,
                        }}
                      >
                        <span
                          className="rp-status-dot"
                          style={{ background: status.dot }}
                        />
                        {robot.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <RobotDetailModal robot={selected} onClose={() => setSelected(null)} />
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create Robot" onClose={() => setShowCreate(false)}>
          <CreateRobotForm
            onSuccess={() => {
              fetchRobots();
              setShowCreate(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}