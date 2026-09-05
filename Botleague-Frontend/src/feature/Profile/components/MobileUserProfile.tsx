import { Share2, CalendarDays, Swords, Percent } from "lucide-react";

/* ============================================================================
   MobileUserProfile — mobile (<=900px) companion for UserPublicPage.tsx, the
   person-shaped sibling of MobileRobotProfile.tsx. Deliberately renders the
   same `mrp-*` markup and classes as that component so the public person page
   and the public robot page are the same page in every respect except whose
   facts are on it: same card, same star placement, same "B" watermark, same
   stat card with dividers, same record rows.

   It is a separate component rather than a generalisation of
   MobileRobotProfile because the two carry genuinely different fields — a
   robot has a spec and a techsport, a person has a location and a team role —
   and threading a person's data through props named `specLabel`/`sportLabel`
   would make both call sites lie about what they render.

   The four record columns line up with the robot table's four slots; only the
   headings and what fills them differ (see .mup-col-* in robotProfile.css,
   which are the same widths as .mrp-col-*).
   ============================================================================ */

export interface MobileUserProfileRecord {
  key: string;
  tournament: string;
  team: string;
  role: string;
  position: string;
}

export interface MobileUserProfileProps {
  displayName: string;
  botleagueId: string;
  /** City/state/country, already joined — "-" when the person has set none. */
  location: string;
  teamName: string;
  /** "Player" / "Organiser" — the person-shaped analogue of the robot's Active pill. */
  accountLabel: string;
  imageUrl?: string | null;
  imageAlt: string;
  /** Rendered in place of the photo when the person has no avatar set. */
  initials: string;
  tournamentsPlayed: number;
  matchesPlayed: number;
  winRate: number;
  records: MobileUserProfileRecord[];
  onShare: () => void;
}

export default function MobileUserProfile({
  displayName,
  botleagueId,
  location,
  teamName,
  accountLabel,
  imageUrl,
  imageAlt,
  initials,
  tournamentsPlayed,
  matchesPlayed,
  winRate,
  records,
  onShare,
}: MobileUserProfileProps) {
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
              <span className="mrp-robot-photo mrp-initials" aria-label={imageAlt}>{initials}</span>
            )}
          </div>
        </div>

        <div className="mrp-profile-top">
          <h2 className="mrp-bot-name">{displayName}</h2>
          <span className="mrp-status-badge">
            <span className="mrp-status-dot" />
            <span className="mrp-status-text">{accountLabel}</span>
          </span>
        </div>

        <div className="mrp-profile-body">
          <div className="mrp-info-list">
            <p className="mrp-info-item">BotLeague ID - <b>{botleagueId || "-"}</b></p>
            <p className="mrp-info-item">Location - <b>{location}</b></p>
            <p className="mrp-info-item">Team - <b>{teamName}</b></p>

            <div className="mrp-actions">
              <button type="button" className="mrp-action-btn" onClick={onShare}>
                <Share2 size={12} />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mrp-stats-card">
        <div className="mrp-stat">
          <CalendarDays size={22} className="mrp-stat-icon" />
          <div>
            <p className="mrp-stat-num">{tournamentsPlayed}</p>
            <p className="mrp-stat-label">Techfects</p>
          </div>
        </div>
        <span className="mrp-divider" />
        <div className="mrp-stat">
          <Swords size={22} className="mrp-stat-icon" />
          <div>
            <p className="mrp-stat-num">{matchesPlayed}</p>
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
            <span className="mup-col-tournament">Tournament</span>
            <span className="mup-col-team">Team</span>
            <span className="mup-col-role">Role</span>
            <span className="mup-col-position">Position</span>
          </div>

          {records.map((r) => (
            <div className="mrp-record-row" key={r.key}>
              <span className="mup-col-tournament">{r.tournament}</span>
              <span className="mup-col-team">{r.team}</span>
              <span className="mup-col-role">{r.role}</span>
              <span className="mup-col-position">{r.position}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
