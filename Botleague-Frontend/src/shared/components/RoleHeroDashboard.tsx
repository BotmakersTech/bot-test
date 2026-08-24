import type { ReactNode } from "react";
import { Award, Pencil, Scale, Share2, ShieldCheck, Swords } from "lucide-react";
import bLogoWatermark from "../../assets/Dashboard/B_LOGO.png";
import starDeco from "../../assets/Auth/Star-two.svg";
import "../../styles/roleHeroDashboard.css";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <div className="rhd-stat-card">
      <span className="rhd-stat-icon">{icon}</span>
      <span className="rhd-stat-num">{value}</span>
      <span className="rhd-stat-label">{label}</span>
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
  return (
    <div className="rhd-root">
      <div className="rhd-welcome-row">
        <p className="rhd-welcome">Welcome back, {welcomeName}!</p>
      </div>

      {/* ---------- profile card ---------- */}
      <section className="rhd-profile-card">
        <img className="rhd-b-watermark" src={bLogoWatermark} alt="" aria-hidden="true" />
        <img className="rhd-star-deco rhd-star-a" src={starDeco} alt="" aria-hidden="true" />
        <img className="rhd-star-deco rhd-star-b" src={starDeco} alt="" aria-hidden="true" />

        <div className="rhd-profile-left">
          <div className="rhd-name-row">
            <h2 className="rhd-name">{name}</h2>
            <span className="rhd-active-badge">
              <span className="rhd-active-dot" />
              Active
            </span>
          </div>
          <p className="rhd-id-text">{idLabel} - {idValue}</p>
          <p className="rhd-role-text">
            <ShieldCheck size={16} />
            {roleLabel}
          </p>

          <div className="rhd-profile-actions">
            {onShare && (
              <button type="button" className="rhd-btn-gradient" onClick={onShare}>
                <Share2 size={12} />
                <span>Share</span>
              </button>
            )}
            {onEdit && (
              <button type="button" className="rhd-btn-gradient" onClick={onEdit}>
                <Pencil size={12} />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        <div className="rhd-hero-photo">
          {photoUrl ? <img alt={name} src={photoUrl} /> : <span className="rhd-hero-photo-initials">{initials(name)}</span>}
        </div>

        <div className="rhd-stats-col">
          <StatCard icon={stat1Icon ?? <Scale size={20} />} value={stat1Value} label={stat1Label} />
          <StatCard icon={stat2Icon ?? <Swords size={20} />} value={stat2Value} label={stat2Label} />
          <StatCard icon={stat3Icon ?? <Award size={20} />} value={stat3Value} label={stat3Label} />
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
