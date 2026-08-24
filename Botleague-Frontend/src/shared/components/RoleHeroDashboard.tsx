import { useState, type ReactNode } from "react";
import { Award, Pencil, Scale, Share2, Swords } from "lucide-react";
import bLogoWatermark from "../../assets/Dashboard/B_LOGO.png";
import mascot from "../../assets/mascote.png";
import "../../styles/roleHeroDashboard.css";

function OutlineStar({ className = "" }: { className?: string }) {
  return <span className={`rhd-outline-star ${className}`} aria-hidden="true" />;
}

function StatRibbon({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <div className="rhd-stat-ribbon">
      <span className="rhd-stat-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export interface RoleHeroRecentItem {
  id: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export interface RoleHeroDashboardProps {
  welcomeName: string;
  name: string;
  photoUrl?: string | null;
  idLabel: string;
  idValue: string;
  roleLabel: string;
  onShare?: () => void;
  onEdit?: () => void;

  stat1Value: string | number;
  stat1Label: string;
  stat1Icon?: ReactNode;
  stat2Value: string | number;
  stat2Label: string;
  stat2Icon?: ReactNode;
  stat3Value: string | number;
  stat3Label: string;
  stat3Icon?: ReactNode;

  recentItemsTitle: string;
  recentItems: RoleHeroRecentItem[];
  recentItemsEmptyText: string;
  recentItemsHref?: string;

  achievement1Label: string;
  achievement1Sublabel: string;
  achievement1Achieved?: boolean;
  achievement2Label: string;
  achievement2Sublabel: string;
  achievement2Achieved?: boolean;
}

export default function RoleHeroDashboard({
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
  recentItemsHref,
  achievement1Label,
  achievement1Sublabel,
  achievement1Achieved = false,
  achievement2Label,
  achievement2Sublabel,
  achievement2Achieved = false,
}: RoleHeroDashboardProps) {
  const [photoErr, setPhotoErr] = useState(false);
  const hasPhoto = !!photoUrl && !photoErr;

  return (
    <div className="rhd-root">
      <div className="rhd-welcome-row">
        <p className="rhd-welcome">Welcome back, {welcomeName}!</p>
      </div>

      {/* ---------- profile card — pixel-matches UserDashboard's dash-hero-card ---------- */}
      <section className="rhd-profile-card">
        <OutlineStar className="rhd-card-star-a" />
        <OutlineStar className="rhd-card-star-b" />

        <div className="rhd-profile-copy">
          <div className="rhd-name-row">
            <h2>{name}</h2>
            <span className="rhd-active-pill">
              <span /> Active
            </span>
          </div>
          <p>{idLabel} - {idValue}</p>
          <p>{roleLabel}</p>

          <div className="rhd-actions">
            {onShare && (
              <button type="button" onClick={onShare}>
                <Share2 size={16} />
                Share
              </button>
            )}
            {onEdit && (
              <button type="button" onClick={onEdit}>
                <Pencil size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="rhd-avatar-stage">
          <img src={bLogoWatermark} alt="" aria-hidden="true" className="rhd-big-b" />
          {hasPhoto ? (
            <img src={photoUrl!} alt={name} className="rhd-avatar" onError={() => setPhotoErr(true)} />
          ) : (
            <img src={mascot} alt={name} className="rhd-avatar rhd-avatar-mascot" />
          )}
        </div>

        <div className="rhd-stats">
          <StatRibbon icon={stat1Icon ?? <Scale size={35} />} value={stat1Value} label={stat1Label} />
          <StatRibbon icon={stat2Icon ?? <Swords size={35} />} value={stat2Value} label={stat2Label} />
          <StatRibbon icon={stat3Icon ?? <Award size={38} />} value={stat3Value} label={stat3Label} />
        </div>
      </section>

      {/* ---------- bottom row ---------- */}
      <div className="rhd-bottom-grid">
        <section className="rhd-outline-card rhd-recent-card">
          <div className="rhd-card-header">
            <p className="rhd-section-title">{recentItemsTitle}</p>
            {recentItemsHref && recentItems.length > 0 && (
              <a className="rhd-view-all" href={recentItemsHref}>View all</a>
            )}
          </div>

          {recentItems.length === 0 ? (
            <p className="rhd-empty-note">{recentItemsEmptyText}</p>
          ) : (
            <div className="rhd-recent-list">
              {recentItems.map((item) => (
                <div className="rhd-recent-row" key={item.id}>
                  <div className="rhd-recent-row-text">
                    <p className="rhd-recent-title">{item.title}</p>
                    {item.subtitle && <p className="rhd-recent-subtitle">{item.subtitle}</p>}
                  </div>
                  {item.actionLabel && item.actionHref && (
                    <a className="rhd-btn-outline" href={item.actionHref} target="_blank" rel="noreferrer">
                      {item.actionLabel}
                    </a>
                  )}
                  {item.actionLabel && item.onAction && !item.actionHref && (
                    <button type="button" className="rhd-btn-outline" onClick={item.onAction}>
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rhd-outline-card rhd-achievements-card">
          <div className="rhd-card-header">
            <p className="rhd-section-title">Achievements</p>
          </div>

          <div className="rhd-achievements-grid">
            <div className={"rhd-achievement" + (achievement1Achieved ? " rhd-achievement-earned" : "")}>
              <Award size={40} />
              <p className="rhd-achievement-label">{achievement1Label}</p>
              <p className="rhd-achievement-sublabel">{achievement1Sublabel}</p>
            </div>
            <div className={"rhd-achievement" + (achievement2Achieved ? " rhd-achievement-earned" : "")}>
              <Award size={40} />
              <p className="rhd-achievement-label">{achievement2Label}</p>
              <p className="rhd-achievement-sublabel">{achievement2Sublabel}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
