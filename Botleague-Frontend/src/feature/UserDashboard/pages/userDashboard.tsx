// features/Dashboard/pages/UserDashboard.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Medal,
  PenLine,
  Share2,
  Star,
  Swords,
  Trophy,
  AlertCircle,
  Loader2,
} from "lucide-react";

import useDashboard from "../hooks/useDashboardData";
import { getTeamMemberships } from "../api/userMembership.api";
import { resolveDashboardAvatarSrc } from "../../Profile/constants/avatars";
import flight from "../../../assets/Auth/flight.svg";
import mascot from "../../../assets/mascote.png";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import TeamLogo from "../../../shared/components/TeamLogo";
import "../../../styles/dashboard.css";

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
function OutlineStar({ className = "" }: { className?: string }) {
  return <span className={`dash-outline-star ${className}`} aria-hidden="true" />;
}

function StatRibbon({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="dash-stat-ribbon">
      <span className="dash-stat-icon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AchievementBadge({
  title,
  tone,
  icon,
}: {
  title: string;
  tone: "gold" | "steel";
  icon: ReactNode;
}) {
  return (
    <div className="dash-achievement">
      <div className={`dash-achievement-medal dash-achievement-medal-${tone}`}>
        {icon}
      </div>
      <div className="dash-achievement-label">
        <strong>{title}</strong>
        <span>Match</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════ */
export default function UserDashboard() {
  const navigate = useNavigate();
  const [avatarErr, setAvatarErr] = useState(false);
  const {
    user,
    team,
    stats,
    isLoading,
    error,
    refresh,
  } = useDashboard();

  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "BotLeague Member";
  const displayUsername = user?.userName || profileName.split(" ")[0] || "member";
  const botLeagueId = user?.botLeagueId || "Not assigned";
  const avatarSrc = resolveDashboardAvatarSrc(user?.profilePhotoUrl || user?.avatarUrl) || "";
  const hasAvatar = !!avatarSrc && !avatarErr;
  const winRate =
    stats.matchesPlayed > 0
      ? Math.round((stats.wins / stats.matchesPlayed) * 100)
      : stats.winRateNum || 0;

  const [squadSize, setSquadSize] = useState<number | null>(null);

  useEffect(() => {
    if (!team?.teamCode) return;

    let cancelled = false;

    getTeamMemberships(team.teamCode)
      .then((entries) => {
        if (cancelled) return;
        const count = entries
          .flatMap((entry) => entry.members ?? [])
          .filter((member) => member.isActive !== false && String(member.status ?? "").toUpperCase() !== "LEFT").length;
        setSquadSize(count);
      })
      .catch(() => {
        if (!cancelled) setSquadSize(null);
      });

    return () => {
      cancelled = true;
    };
  }, [team?.teamCode]);

  const displaySquadSize = team?.teamCode ? squadSize : null;

  const achievements = useMemo(() => {
    const items: { title: string; tone: "gold" | "steel"; icon: ReactNode }[] = [];
    if (stats.wins > 0) items.push({ title: "Gold Medal", tone: "gold", icon: <Trophy size={34} /> });
    if (winRate >= 50 || stats.matchesTotal > 0)
      items.push({ title: "Untouchables", tone: "steel", icon: <Medal size={34} /> });
    if (items.length === 0) {
      items.push({ title: "Gold Medal", tone: "gold", icon: <Trophy size={34} /> });
      items.push({ title: "Untouchables", tone: "steel", icon: <Medal size={34} /> });
    }
    return items.slice(0, 2);
  }, [stats.matchesTotal, stats.wins, winRate]);

  const shareDashboard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profileName} dashboard`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Share cancellation is harmless.
    }
  };

  /* loading / error */
  if (isLoading && !user?.firstName && !error) {
    return (
      <div className="dash-loading">
        <Loader2 className="animate-spin" size={28} />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-loading">
        <AlertCircle size={30} />
        <span>{String(error)}</span>
        <button type="button" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  /* ── render ── */
  return (
    <main className="dash-page">
      <img src={flight} alt="" aria-hidden="true" className="dash-plane dash-plane-left" />
      <img src={flight} alt="" aria-hidden="true" className="dash-plane dash-plane-right" />
      <OutlineStar className="dash-star-left" />
      <OutlineStar className="dash-star-bottom" />

      <section className="dash-content">
        <div className="dash-top-row">
          <h1>Welcome back, {displayUsername}!</h1>
          <button type="button" className="dash-chat-btn" onClick={() => navigate("/messages")}>
            Chats
          </button>
        </div>

        <section className="dash-hero-card">
          <OutlineStar className="dash-card-star-a" />
          <OutlineStar className="dash-card-star-b" />

          <div className="dash-rank-pill">
            <Star size={20} fill="currentColor" />
            Rank - {stats.rankNum || "Pending"}
          </div>

          <div className="dash-profile-copy">
            <div className="dash-name-row">
              <h2>{profileName}</h2>
              <span className="dash-active-pill">
                <span /> Active
              </span>
            </div>
            <p>Botleague ID - {botLeagueId}</p>
            <p>@{displayUsername.toUpperCase()}</p>

            <div className="dash-actions">
              <button type="button" onClick={shareDashboard}>
                <Share2 size={16} />
                Share
              </button>
              <button type="button" onClick={() => navigate("/profile")}>
                <PenLine size={16} />
                Edit
              </button>
            </div>
          </div>

          <div className="dash-avatar-stage">
            <img src={bLogo} alt="" aria-hidden="true" className="dash-big-b" />
            {hasAvatar ? (
              <img
                src={avatarSrc}
                alt={profileName}
                className="dash-avatar"
                onError={() => setAvatarErr(true)}
              />
            ) : (
              <img src={mascot} alt={profileName} className="dash-avatar dash-avatar-mascot" />
            )}
          </div>

          <div className="dash-stats">
            <StatRibbon
              icon={<CalendarDays size={35} />}
              value={stats.eventsParticipated}
              label="Events"
            />
            <StatRibbon icon={<Swords size={35} />} value={stats.matchesTotal} label="Matches" />
            <StatRibbon icon={<Medal size={38} />} value={`${winRate}%`} label="Win Rate" />
          </div>
        </section>

        <section className="dash-team-card">
          <div className="dash-team-media">
            <TeamLogo src={team?.teamLogo} alt="" />
          </div>

          <div className="dash-team-info">
            <p>
              Current Team
              <span />
            </p>
            <h3>{team?.teamName || "No Team Yet"}</h3>
            <span>
              {team
                ? displaySquadSize != null
                  ? `${displaySquadSize} member${displaySquadSize === 1 ? "" : "s"}`
                  : "Loading members..."
                : "Join or create a team"}
            </span>
            <button type="button" onClick={() => navigate(team ? "/my-team" : "/create-team")}>
              {team ? "Edit Team" : "Create Team"}
            </button>
          </div>

          <div className="dash-divider" />

          <div className="dash-achievements-wrap">
            <h3>Top Achievements</h3>
            <div className="dash-achievements">
              {achievements.map((item) => (
                <AchievementBadge key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}