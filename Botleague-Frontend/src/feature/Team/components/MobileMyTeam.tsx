import { Calendar, MapPin, Plus, Star } from "lucide-react";
import TeamLogo from "../../../shared/components/TeamLogo";

/* ============================================================================
   MobileMyTeam — mobile (<=950px) companion to MyTeam.tsx, following the same
   real-data/CSS-toggle pattern as MobileDashboard.tsx: both layouts render at
   once off the same data, a CSS media query at 950px (teamdash-desktop-only /
   teamdash-mobile-only in teamDashboard.css) picks which one is visible, and
   the shared visual language (Sarpanch/Poppins/Inter, the #0162d1->#8c6cff
   gradient, rounded cards, outline stars) is ported pixel-for-pixel from the
   pasted "TeamManagementMobile.jsx" mock.

   Differs from that mock on purpose: MyTeam.tsx has no search/filter/table/
   pagination — it's a dashboard (welcome banner, team panel, squad panel,
   robot build), not a list. So this ports the mock's fonts, gradients, card/
   badge/button/star treatment onto MyTeam's actual sections instead of
   pasting in content this page doesn't have.

   The desktop build stage's angled purple clip-path banner doesn't read at
   375px wide, so the stat banner here is a plain rounded card instead —
   same colors/copy, straight edges.
   ============================================================================ */

function MobileStar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 51 51" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M25.5 2 L31 18.5 L48.5 18.5 L34.3 29 L39.8 45.5 L25.5 35 L11.2 45.5 L16.7 29 L2.5 18.5 L20 18.5 Z"
        fill="rgba(140,108,255,0.35)"
      />
    </svg>
  );
}

export interface MobileMyTeamSquadMember {
  key: string;
  name: string;
  roleLabel: string;
  photoSrc?: string | null;
  initials: string;
  isActive: boolean;
}

export interface MobileMyTeamSideRobot {
  id: string;
  image: string;
  statusLabel: string;
}

export interface MobileMyTeamProps {
  currentTeamName: string;
  currentTeamCode: string;
  teamLogo?: string | null;
  isActive: boolean;
  statusLabel: string;
  rankLabel: string | number;
  winRatePct: number;
  sinceYear: string;
  sinceLine: string;
  sinceLineHref: string;
  canEditTeam: boolean;
  onEditTeam: () => void;
  error: string | null;
  onRetry: () => void;
  onOpenChats: () => void;

  featuredImage: string;
  hasEvent: boolean;
  eventName: string;
  eventLocationLabel: string;
  eventDateLabel: string;
  eventCtaLabel: string;
  onViewEvent: () => void;
  countdown: { days: number; hours: number; mins: number };

  activeSquadCount: number;
  squadPreview: MobileMyTeamSquadMember[];
  onManageMembers: () => void;

  primaryRobot: {
    image: string;
    name: string;
    category: string;
    statusLabel: string;
    weightClassLabel: string;
  } | null;
  sideRobots: MobileMyTeamSideRobot[];
  wins: number;
  onViewAllRobots: () => void;
  onAddRobot: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function MobileMyTeam({
  currentTeamName,
  currentTeamCode,
  teamLogo,
  isActive,
  statusLabel,
  rankLabel,
  winRatePct,
  sinceYear,
  sinceLine,
  sinceLineHref,
  canEditTeam,
  onEditTeam,
  error,
  onRetry,
  onOpenChats,
  featuredImage,
  hasEvent,
  eventName,
  eventLocationLabel,
  eventDateLabel,
  eventCtaLabel,
  onViewEvent,
  countdown,
  activeSquadCount,
  squadPreview,
  onManageMembers,
  primaryRobot,
  sideRobots,
  wins,
  onViewAllRobots,
  onAddRobot,
}: MobileMyTeamProps) {
  return (
    <div className="mmt-root">
      <div className="mmt-top-row">
        <h1>Welcome back, {currentTeamName}!</h1>
        <button type="button" className="mmt-chat-btn" onClick={onOpenChats}>
          Chats
        </button>
      </div>

      {error && (
        <div className="mmt-error">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <section className="mmt-event-banner" style={{ backgroundImage: `url(${featuredImage})` }}>
        <div className="mmt-event-overlay" />
        <MobileStar className="mmt-event-star" style={{ right: "6%", top: "8%", width: 30, height: 30, transform: "rotate(12deg)" }} />
        <div className="mmt-event-copy">
          <div className="mmt-event-badges">
            <span className="mmt-event-badge">{hasEvent ? "FEATURED" : "TEAM"}</span>
            <span className="mmt-event-subtitle">{hasEvent ? "Next Arena" : "Team Overview"}</span>
          </div>
          <h2>{eventName}</h2>
          <div className="mmt-event-meta">
            <span>
              <MapPin size={12} /> {eventLocationLabel}
            </span>
            <span>
              <Calendar size={12} /> {eventDateLabel}
            </span>
          </div>
          <button type="button" className="mmt-event-cta" onClick={onViewEvent}>
            {eventCtaLabel}
          </button>
        </div>

        <div className="mmt-countdown">
          <div className="mmt-countdown-box">
            <strong>{pad(countdown.days)}</strong>
            <span>Days</span>
          </div>
          <span className="mmt-countdown-sep">:</span>
          <div className="mmt-countdown-box">
            <strong>{pad(countdown.hours)}</strong>
            <span>Hrs</span>
          </div>
          <span className="mmt-countdown-sep">:</span>
          <div className="mmt-countdown-box">
            <strong>{pad(countdown.mins)}</strong>
            <span>Mins</span>
          </div>
        </div>
      </section>

      <section className="mmt-team-panel">
        <MobileStar className="mmt-panel-star" style={{ left: "-4%", top: "58%", width: 34, height: 34, transform: "rotate(-14deg)" }} />
        <div className="mmt-team-panel-top">
          <div className="mmt-rank-pill">
            <Star size={13} fill="currentColor" />
            Rank - {rankLabel}
          </div>
          <div className="mmt-team-image">
            <TeamLogo src={teamLogo} alt={currentTeamName} />
          </div>
        </div>

        <span className="mmt-active-pill">
          <span /> {isActive ? "Active" : statusLabel}
        </span>
        <h2 className="mmt-team-name">{currentTeamName}</h2>
        <p className="mmt-team-code">Team ID - {currentTeamCode}</p>
        <p className="mmt-win-rate">
          <strong>{winRatePct}%</strong> Win Rate
        </p>

        <div className="mmt-since">
          <span>In The League Since {sinceYear}</span>
          <a href={sinceLineHref} target={sinceLineHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
            {sinceLine}
          </a>
        </div>

        {canEditTeam && (
          <button type="button" className="mmt-edit-btn" onClick={onEditTeam}>
            Edit Team
          </button>
        )}
      </section>

      <section className="mmt-squad-panel">
        <h2>Active Squad ({activeSquadCount})</h2>
        <div className="mmt-member-list">
          {Array.from({ length: 3 }).map((_, i) => {
            const member = squadPreview[i];
            if (!member) {
              return (
                <div className="mmt-member mmt-member-empty" key={`empty-${i}`}>
                  <span className="mmt-avatar mmt-avatar-empty" />
                  <div className="mmt-member-info">
                    <strong>Empty Slot</strong>
                    <span>No member yet</span>
                  </div>
                </div>
              );
            }
            return (
              <div className="mmt-member" key={member.key}>
                {member.photoSrc ? (
                  <img src={member.photoSrc} alt={member.name} className="mmt-avatar" />
                ) : (
                  <span className="mmt-avatar mmt-avatar-fallback">{member.initials}</span>
                )}
                <div className="mmt-member-info">
                  <strong>{member.name}</strong>
                  <span>{member.roleLabel}</span>
                </div>
                <em className={member.isActive ? "active" : "offline"}>{member.isActive ? "Active" : "Offline"}</em>
              </div>
            );
          })}
        </div>
        <button type="button" className="mmt-manage-btn" onClick={onManageMembers}>
          Member Management
        </button>
      </section>

      <section className="mmt-machines">
        <div className="mmt-machines-head">
          <h2>Team Build</h2>
          <button type="button" onClick={onViewAllRobots}>View All</button>
        </div>

        {primaryRobot ? (
          <div className="mmt-build-stage">
            <div className="mmt-build-primary">
              <img src={primaryRobot.image} alt={primaryRobot.name} />
              <div className="mmt-build-primary-overlay" />
              <span className="mmt-build-status">{primaryRobot.statusLabel}</span>
            </div>

            <div className="mmt-build-banner">
              <div className="mmt-bb-name">{primaryRobot.name}</div>
              <div className="mmt-bb-tag">{primaryRobot.category}</div>
              <div className="mmt-bb-stats">
                <div className="mmt-bb-col">
                  <div className="mmt-bb-num">{wins}</div>
                  <div className="mmt-bb-sub">Victories</div>
                </div>
                <div className="mmt-bb-col">
                  <div className="mmt-bb-num">{primaryRobot.weightClassLabel}</div>
                  <div className="mmt-bb-sub">Class</div>
                </div>
              </div>
            </div>

            {sideRobots.length > 0 && (
              <div className="mmt-build-side-row">
                {sideRobots.map((robot) => (
                  <div className="mmt-build-side-card" key={robot.id}>
                    <img src={robot.image} alt="" />
                    <div className="mmt-build-side-overlay" />
                    <span className="mmt-build-status mmt-build-status-sm">{robot.statusLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mmt-empty-machines">
            <div>
              <h3>No robots yet</h3>
              <p>Add your first robot to connect it with this team.</p>
            </div>
            <button type="button" onClick={onAddRobot}>
              <Plus size={14} /> Add Robot
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
