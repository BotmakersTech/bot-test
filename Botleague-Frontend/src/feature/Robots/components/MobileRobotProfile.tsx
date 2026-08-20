import { Pencil, Share2, CalendarDays, Swords, Percent } from "lucide-react";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";

/* ============================================================================
   MobileRobotProfile — mobile (<=900px) companion shared by both
   RobotProfilePage.tsx (own team's robot, Edit button for captain/vice-
   captain) and RobotPublicPage.tsx (public, view-only). Same real-data/
   CSS-toggle pattern as the rest of the app's Mobile* components: the
   desktop tree renders alongside this one off the same page state, a CSS
   media query at 900px picks which is visible. Ported pixel-for-pixel from
   the pasted "Robotdetailpage.jsx" mock (Roboto/Sarpanch/Poppins/Inter, the
   #0162d1->#8c6cff gradient, translucent "B" watermark, stat-card/table
   treatment) — no page-level top bar or bottom nav, since the real
   Navbar/PublicNavbar and MobileBottomNav/PublicBottomNav already provide
   those everywhere in the app.

   Differs from the mock on purpose:
   - The mock's decorative "stars" are plain unshaped square outlines (a
     placeholder, not an actual star) — reused the app's own proper star
     shape (.rprofile-outline-star's clip-path) instead for visual quality.
   - Table columns are Tournament/Points/Sport/Position, matching the mock,
     using the real RobotTournamentRecord.sport field (the mock's static
     data happened to repeat "Robowar" for every row, which reads as a
     placeholder rather than a deliberate single-sport-only design).
   ============================================================================ */

export interface MobileRobotProfileRecord {
  key: string;
  tournament: string;
  points: number;
  sport: string;
  position: string;
}

export interface MobileRobotProfileProps {
  robotName: string;
  botId: string;
  weightLabel: string;
  sportLabel: string;
  active: boolean;
  imageUrl?: string | null;
  imageAlt: string;
  eventsPlayed: number;
  totalMatches: number;
  winRate: number;
  records: MobileRobotProfileRecord[];
  onShare: () => void;
  /** Omitted entirely (not just disabled) for viewers who can't manage this
   * robot — public visitors, or a teammate who isn't captain/vice-captain. */
  onEdit?: () => void;
}

export default function MobileRobotProfile({
  robotName,
  botId,
  weightLabel,
  sportLabel,
  active,
  imageUrl,
  imageAlt,
  eventsPlayed,
  totalMatches,
  winRate,
  records,
  onShare,
  onEdit,
}: MobileRobotProfileProps) {
  return (
    <div className="mrp-root">
      <section className="mrp-profile-card">
        <span className="mrp-star" style={{ width: 30, height: 30, left: -10, top: 56, transform: "rotate(-16.5deg)" }} />
        <span className="mrp-star" style={{ width: 22, height: 22, right: 24, top: -8, transform: "rotate(30.6deg)" }} />

        <div className="mrp-robot-wrap">
          <span className="mrp-brand-letter" aria-hidden="true">B</span>
          <div className="mrp-robot-frame">
            {imageUrl ? (
              <img className="mrp-robot-photo" src={imageUrl} alt={imageAlt} />
            ) : (
              <img className="mrp-robot-photo" src={bLogo} alt="" style={{ opacity: 0.35, objectFit: "contain", padding: 20 }} />
            )}
          </div>
        </div>

        <div className="mrp-profile-top">
          <h2 className="mrp-bot-name">{robotName}</h2>
          <span className={active ? "mrp-status-badge" : "mrp-status-badge inactive"}>
            <span className="mrp-status-dot" />
            <span className="mrp-status-text">{active ? "Active" : "Inactive"}</span>
          </span>
        </div>

        <div className="mrp-profile-body">
          <div className="mrp-info-list">
            <p className="mrp-info-item">BotID - <b>{botId || "-"}</b></p>
            <p className="mrp-info-item">Weight - <b>{weightLabel}</b></p>
            <p className="mrp-info-item">Sports - <b>{sportLabel}</b></p>

            <div className="mrp-actions">
              <button type="button" className="mrp-action-btn" onClick={onShare}>
                <Share2 size={12} />
                Share
              </button>
              {onEdit && (
                <button type="button" className="mrp-action-btn" onClick={onEdit}>
                  <Pencil size={12} />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mrp-stats-card">
        <div className="mrp-stat">
          <CalendarDays size={22} className="mrp-stat-icon" />
          <div>
            <p className="mrp-stat-num">{eventsPlayed}</p>
            <p className="mrp-stat-label">Events</p>
          </div>
        </div>
        <span className="mrp-divider" />
        <div className="mrp-stat">
          <Swords size={22} className="mrp-stat-icon" />
          <div>
            <p className="mrp-stat-num">{totalMatches}</p>
            <p className="mrp-stat-label">Matches</p>
          </div>
        </div>
        <span className="mrp-divider" />
        <div className="mrp-stat">
          <Percent size={22} className="mrp-stat-icon" />
          <div>
            <p className="mrp-stat-num">{winRate}%</p>
            <p className="mrp-stat-label">Win Rate</p>
          </div>
        </div>
      </section>

      <h3 className="mrp-section-title">Tournament Records</h3>

      {records.length === 0 ? (
        <div className="mrp-records-empty">No tournament records yet.</div>
      ) : (
        <>
          <div className="mrp-table-head">
            <span className="mrp-col-tournament">Tournament</span>
            <span className="mrp-col-points">Points</span>
            <span className="mrp-col-sport">Sports</span>
            <span className="mrp-col-position">Position</span>
          </div>

          {records.map((r) => (
            <div className="mrp-record-row" key={r.key}>
              <span className="mrp-col-tournament">{r.tournament}</span>
              <span className="mrp-col-points">{r.points}</span>
              <span className="mrp-col-sport">{r.sport}</span>
              <span className="mrp-col-position">{r.position}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
