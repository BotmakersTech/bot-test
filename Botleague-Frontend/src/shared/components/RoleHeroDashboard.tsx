import type { ReactNode } from "react";
import { Pencil, Share2 } from "lucide-react";
import star from "../../assets/Auth/Star-two.svg";
import "../../styles/roleHeroDashboard.css";

export interface RoleHeroStat {
  value: string | number;
  label: string;
  icon: ReactNode;
}

export interface RoleHeroMeta {
  icon: ReactNode;
  label: string;
  value: string;
}

export interface RoleHeroEvent {
  id: string;
  title: string;
  tag?: string;
  meta: RoleHeroMeta[];
  imageUrl?: string | null;
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
  welcomeLabel: string;
  name: string;
  photoUrl?: string | null;
  idLabel: string;
  idValue: string;
  roleLabel: string;
  roleIcon?: ReactNode;
  active?: boolean;
  onShare?: () => void;
  onEdit?: () => void;
  stats: RoleHeroStat[];
  previousEvents: RoleHeroEvent[];
  emptyEventsLabel: string;
  achievements: RoleHeroAchievement[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function RoleHeroDashboard({
  welcomeLabel,
  name,
  photoUrl,
  idLabel,
  idValue,
  roleLabel,
  roleIcon,
  active = true,
  onShare,
  onEdit,
  stats,
  previousEvents,
  emptyEventsLabel,
  achievements,
}: RoleHeroDashboardProps) {
  const featured = previousEvents[0] ?? null;
  const compact = previousEvents.slice(1, 3);

  return (
    <div className="rhd-root">
      <p className="rhd-welcome">{welcomeLabel}</p>

      <div className="rhd-profile-card">
        <div className="rhd-hdivider" />
        <img src={star} alt="" className="rhd-card-star" style={{ width: 70, height: 70, right: 18, top: -20, transform: "rotate(18deg)" }} />
        <img src={star} alt="" className="rhd-card-star" style={{ width: 46, height: 46, left: -10, bottom: -14, transform: "rotate(-24deg)" }} />

        <div className="rhd-avatar-col">
          <div className="rhd-avatar">
            {photoUrl ? <img src={photoUrl} alt={name} /> : <span className="rhd-avatar-initials">{initials(name)}</span>}
          </div>
          <span className={`rhd-active-badge${active ? "" : " rhd-inactive"}`}>
            <span className="rhd-active-dot" />
            {active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="rhd-identity">
          <h2>{name}</h2>
          <p className="rhd-id-text">{idLabel} - {idValue}</p>
          <div className="rhd-role-row">
            {roleIcon}
            <span>{roleLabel}</span>
          </div>
          <div className="rhd-btn-row">
            {onShare && (
              <button type="button" className="rhd-btn-gradient" onClick={onShare}>
                <Share2 size={13} /> Share
              </button>
            )}
            {onEdit && (
              <button type="button" className="rhd-btn-gradient" onClick={onEdit}>
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
        </div>

        <div className="rhd-stats">
          {stats.map((s) => (
            <div key={s.label} className="rhd-stat">
              <span className="rhd-stat-icon">{s.icon}</span>
              <div>
                <p className="rhd-stat-num">{s.value}</p>
                <p className="rhd-stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rhd-sections">
        <div className="rhd-outline-card">
          <p className="rhd-section-title">Previous Events</p>
          {!featured ? (
            <div className="rhd-empty">{emptyEventsLabel}</div>
          ) : (
            <div className="rhd-events-layout">
              <div className="rhd-mini-events">
                {compact.map((e) => (
                  <div key={e.id} className="rhd-mini-event">
                    <p className="rhd-mini-title">{e.title}</p>
                    {e.tag && <p className="rhd-mini-sub">{e.tag}</p>}
                  </div>
                ))}
              </div>

              <div className="rhd-vdivider" />

              <div className="rhd-featured-event">
                <div className="rhd-featured-image">
                  {featured.imageUrl ? <img src={featured.imageUrl} alt={featured.title} /> : roleIcon}
                </div>
                <div className="rhd-featured-head">
                  <p className="rhd-featured-title">{featured.title}</p>
                  {featured.tag && <p className="rhd-featured-tag">{featured.tag}</p>}
                </div>
                <div className="rhd-meta-rows">
                  {featured.meta.map((m) => (
                    <div key={m.label} className="rhd-meta-row">
                      {m.icon}
                      <span className="rhd-meta-label">{m.label} :</span>
                      <span className="rhd-meta-value">{m.value}</span>
                    </div>
                  ))}
                </div>
                {featured.onView && (
                  <button type="button" className="rhd-btn-gradient rhd-btn-sm" style={{ alignSelf: "flex-start" }} onClick={featured.onView}>
                    {featured.viewLabel ?? "View Details"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rhd-outline-card">
          <p className="rhd-section-title">Achievements</p>
          <div className="rhd-achievements">
            {achievements.map((a) => (
              <div key={a.label} className={`rhd-achievement ${a.unlocked ? "rhd-unlocked" : "rhd-locked"}`}>
                <span className="rhd-achievement-badge">{a.icon}</span>
                <div>
                  <p className="rhd-achievement-label">{a.label}</p>
                  <p className="rhd-achievement-status">{a.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
