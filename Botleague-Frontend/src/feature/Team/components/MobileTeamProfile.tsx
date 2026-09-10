import { Share2, CalendarDays, Swords, Percent, Crown } from "lucide-react";
import teamDefault from "../../../assets/TeamDefault.png";

/* ============================================================================
   MobileTeamProfile — mobile (<=900px) companion for TeamPublicPage.tsx, the
   team-shaped sibling of MobileRobotProfile.tsx / MobileUserProfile.tsx. Same
   `mrp-*` card/stats/table markup as those two; only the Team Members list
   below the stats card is new (a team has a roster, a robot/person doesn't),
   using its own `mtp-member-*` classes in robotProfile.css.

   Records reuse the exact same four columns as MobileRobotProfile
   (Tournament / Points / Techsports / Position) rather than the six-column
   desktop table — a team's EventRecord is the same shape as a robot's, so
   there's no reason for the two mobile tables to disagree.
   ============================================================================ */

export interface MobileTeamProfileRecord {
  key: string;
  tournament: string;
  points: number;
  sport: string;
  position: string;
}

export interface MobileTeamProfileMember {
  key: string;
  name: string;
  botleagueId: string;
  imageUrl?: string | null;
  initials: string;
  isLead: boolean;
  onClick?: () => void;
}

export interface MobileTeamProfileProps {
  teamName: string;
  teamCode: string;
  location: string;
  active: boolean;
  logoUrl?: string | null;
  eventsPlayed: number;
  matchesPlayed: number;
  winRate: number;
  members: MobileTeamProfileMember[];
  records: MobileTeamProfileRecord[];
  onShare: () => void;
}

export default function MobileTeamProfile({
  teamName,
  teamCode,
  location,
  active,
  logoUrl,
  eventsPlayed,
  matchesPlayed,
  winRate,
  members,
  records,
  onShare,
}: MobileTeamProfileProps) {
  return (
    <div className="mrp-root">
      <section className="mrp-profile-card">
        <span className="mrp-star" style={{ width: 30, height: 30, left: -10, top: 56, transform: "rotate(-16.5deg)" }} />
        <span className="mrp-star" style={{ width: 22, height: 22, right: 24, top: -8, transform: "rotate(30.6deg)" }} />

        <div className="mrp-robot-wrap">
          <span className="mrp-brand-letter" aria-hidden="true">B</span>
          <div className="mrp-robot-frame">
            <img className="mrp-robot-photo" src={logoUrl || teamDefault} alt={teamName} style={{ objectFit: "contain", padding: 8 }} />
          </div>
        </div>

        <div className="mrp-profile-top">
          <h2 className="mrp-bot-name">{teamName}</h2>
          <span className={active ? "mrp-status-badge" : "mrp-status-badge inactive"}>
            <span className="mrp-status-dot" />
            <span className="mrp-status-text">{active ? "Active" : "Inactive"}</span>
          </span>
        </div>

        <div className="mrp-profile-body">
          <div className="mrp-info-list">
            <p className="mrp-info-item">Team Code - <b>{teamCode || "-"}</b></p>
            <p className="mrp-info-item">Location - <b>{location}</b></p>

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
            <p className="mrp-stat-num">{eventsPlayed}</p>
            <p className="mrp-stat-label">Techfests</p>
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

      <h3 className="mrp-section-title">Team Members</h3>

      {members.length === 0 ? (
        <div className="mrp-records-empty">No members yet.</div>
      ) : (
        <div className="mtp-member-list">
          {members.map((m) => (
            <button type="button" className="mtp-member-row" key={m.key} onClick={m.onClick}>
              {m.imageUrl ? (
                <img className="mtp-member-avatar" src={m.imageUrl} alt={m.name} />
              ) : (
                <span className="mtp-member-avatar mtp-member-avatar-fallback">{m.initials}</span>
              )}
              <span className="mtp-member-text">
                <span className="mtp-member-name">{m.name}{m.isLead && <Crown size={11} className="mtp-member-crown" />}</span>
                <span className="mtp-member-id">{m.botleagueId}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <h3 className="mrp-section-title">Tournament Records</h3>

      {records.length === 0 ? (
        <div className="mrp-records-empty">No tournament records yet.</div>
      ) : (
        <>
          <div className="mrp-table-head">
            <span className="mrp-col-tournament">Tournament</span>
            <span className="mrp-col-points">Points</span>
            <span className="mrp-col-sport">Techsports</span>
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
