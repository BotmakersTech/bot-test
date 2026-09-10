import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Crown, Medal, Percent, Share2, Swords, Trophy } from "lucide-react";

import { getPublicTeamProfile, getPublicTeamProfileByCode, type PublicTeamProfile, type TeamMemberSummary } from "../api/teamPublic.api";
import { resolveAvatarSrc } from "../../Profile/constants/avatars";
import teamDefault from "../../../assets/TeamDefault.png";
import flightDecoration from "../../../assets/Auth/flight.svg";
import droneDecoration from "../../../assets/Auth/drone.svg";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import MobileTeamProfile from "../components/MobileTeamProfile";
import "../../../styles/robotProfile.css";

// The public team page is the same page as the public robot/person pages
// (RobotPublicPage.tsx / UserPublicPage.tsx) with a team's facts on it — same
// hero card, stat ribbons, tournament-records table (a team's EventRecord is
// literally the same shape as a robot's, so it reuses that six-column table
// unchanged), and mobile companion. Only two things are genuinely new here,
// since neither a robot nor a person has one: the Global Rank / medals line,
// and the Team Members section, whose cards link to each member's own public
// profile at /user/:botleagueId — the exact page built for UserPublicPage.tsx.

function OutlineStar({ className = "" }: { className?: string }) {
  return <span className={`rprofile-outline-star ${className}`} aria-hidden="true" />;
}

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function toLabel(raw?: string | null) {
  if (!raw) return "-";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function memberDisplayName(m: TeamMemberSummary) {
  return m.username || [m.firstName, m.lastName].filter(Boolean).join(" ") || m.botleagueId || "Member";
}

function memberInitials(m: TeamMemberSummary) {
  const name = memberDisplayName(m);
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export default function TeamPublicPage() {
  // supports both /team/:teamId (UUID) and /team/:code (BLT...)
  const { teamId, code } = useParams<{ teamId?: string; code?: string }>();
  const param = code ?? teamId ?? "";
  const navigate = useNavigate();
  const isCode = !!code || (param.startsWith("BLT") && !param.includes("-"));

  const [profile, setProfile] = useState<PublicTeamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoErr, setLogoErr] = useState(false);

  useEffect(() => {
    if (!param) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const fetch = isCode ? getPublicTeamProfileByCode(param) : getPublicTeamProfile(param);
    fetch
      .then(setProfile)
      .catch((e) => setError(e?.response?.data?.message ?? "Team not found"))
      .finally(() => setLoading(false));
  }, [param, isCode]);

  const shareTeam = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/team/${profile.teamCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.teamName} - Team Profile`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Share cancellation is harmless.
    }
  };

  let body: React.ReactNode;

  if (loading) {
    body = (
      <div className="rprofile-page rprofile-state">
        <div className="rprofile-spinner" />
        <p>Loading team profile...</p>
      </div>
    );
  } else if (error || !profile) {
    body = (
      <div className="rprofile-page rprofile-state">
        <h1>Team Profile</h1>
        <p>{error ?? "Team not found"}</p>
        <button type="button" className="rprofile-secondary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  } else {
    const active = profile.status === "ACTIVE";
    const winRate = profile.matchesPlayed > 0 ? Math.round((profile.totalWins / profile.matchesPlayed) * 100) : 0;
    const location = [profile.institutionName, profile.city, profile.state].filter(Boolean).join(", ") || "-";
    const members = profile.members ?? [];

    const goToMember = (m: TeamMemberSummary) => {
      if (m.botleagueId) navigate(`/user/${m.botleagueId}`);
    };

    body = (
      <div className="rprofile-page">
        <img className="rprofile-bg rprofile-bg-flight-left" src={flightDecoration} alt="" aria-hidden="true" />
        <img className="rprofile-bg rprofile-bg-drone" src={droneDecoration} alt="" aria-hidden="true" />

        <div className="rprofile-shell">
          <div className="rprofile-mobile-only">
            <MobileTeamProfile
              teamName={profile.teamName}
              teamCode={profile.teamCode}
              location={location}
              active={active}
              logoUrl={!logoErr ? profile.logoUrl : null}
              eventsPlayed={profile.eventsPlayed}
              matchesPlayed={profile.matchesPlayed}
              winRate={winRate}
              members={members.map((m) => ({
                key: m.userId,
                name: memberDisplayName(m),
                botleagueId: m.botleagueId || "-",
                imageUrl: resolveAvatarSrc(m.profilePhotoUrl),
                initials: memberInitials(m),
                isLead: m.teamRole === "CAPTAIN",
                onClick: () => goToMember(m),
              }))}
              records={profile.eventRecords.map((rec, i) => ({
                key: `${rec.eventSportId}-${i}`,
                tournament: rec.eventName ?? "Unknown Techfest",
                points: rec.pointsEarned,
                sport: rec.sport?.replace(/_/g, " ") ?? "-",
                position: rec.eventRank ? ordinal(rec.eventRank) : "-",
              }))}
              onShare={shareTeam}
            />
          </div>

          <section className="rprofile-hero rprofile-desktop-only">
            <OutlineStar className="rprofile-card-star-a" />
            <OutlineStar className="rprofile-card-star-b" />

            <div className="rprofile-hero-copy">
              <div className="rprofile-name-row">
                <h2>{profile.teamName}</h2>
                <span className={`rprofile-active-pill${active ? "" : " inactive"}`}>
                  <span /> {active ? "Active" : "Inactive"}
                </span>
              </div>
              <p><span className="rprofile-info-label">Team Code</span> - <span className="rprofile-info-value">{profile.teamCode || "-"}</span></p>
              <p><span className="rprofile-info-label">Location</span> - <span className="rprofile-info-value">{location}</span></p>
              <p>
                <span className="rprofile-info-label">Global Rank</span> -{" "}
                <span className="rprofile-info-value">{profile.bestGlobalRank != null ? `#${profile.bestGlobalRank}` : "Unranked"}</span>
              </p>

              {(profile.goldMedals + profile.silverMedals + profile.bronzeMedals) > 0 && (
                <div className="rprofile-medal-row">
                  {profile.goldMedals > 0 && <span className="rprofile-medal-chip gold"><Medal size={13} /> {profile.goldMedals}× Gold</span>}
                  {profile.silverMedals > 0 && <span className="rprofile-medal-chip silver"><Medal size={13} /> {profile.silverMedals}× Silver</span>}
                  {profile.bronzeMedals > 0 && <span className="rprofile-medal-chip bronze"><Medal size={13} /> {profile.bronzeMedals}× Bronze</span>}
                </div>
              )}

              <div className="rprofile-actions">
                <button type="button" onClick={shareTeam}>
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="rprofile-avatar-stage">
              <img src={bLogo} alt="" aria-hidden="true" className="rprofile-big-b" />
              <img
                src={!logoErr && profile.logoUrl ? profile.logoUrl : teamDefault}
                alt={profile.teamName}
                className="rprofile-avatar rprofile-avatar-fallback"
                style={{ objectFit: "contain", padding: 16 }}
                onError={() => setLogoErr(true)}
              />
            </div>

            <div className="rprofile-stats" aria-label="Team stats">
              <div className="rprofile-stat-ribbon">
                <span className="rprofile-stat-icon"><Trophy size={35} /></span>
                <strong>{profile.eventsPlayed}</strong>
                <span>Techfests</span>
              </div>
              <div className="rprofile-stat-ribbon">
                <span className="rprofile-stat-icon"><Swords size={35} /></span>
                <strong>{profile.matchesPlayed}</strong>
                <span>Matches</span>
              </div>
              <div className="rprofile-stat-ribbon">
                <span className="rprofile-stat-icon"><Percent size={35} /></span>
                <strong>{winRate}%</strong>
                <span>Win Rate</span>
              </div>
            </div>
          </section>

          <section className="rprofile-members rprofile-desktop-only">
            <h2>Team Members</h2>

            {members.length === 0 ? (
              <div className="rprofile-records-empty">
                <p>No members yet.</p>
              </div>
            ) : (
              <div className="rprofile-member-grid">
                {members.map((m) => {
                  const avatarSrc = resolveAvatarSrc(m.profilePhotoUrl);
                  return (
                    <button type="button" className="rprofile-member-card" key={m.userId} onClick={() => goToMember(m)}>
                      {avatarSrc ? (
                        <img className="rprofile-member-avatar" src={avatarSrc} alt={memberDisplayName(m)} />
                      ) : (
                        <span className="rprofile-member-avatar rprofile-member-avatar-fallback">{memberInitials(m)}</span>
                      )}
                      <span className="rprofile-member-text">
                        <span className="rprofile-member-name">
                          {memberDisplayName(m)}
                          {m.teamRole === "CAPTAIN" && <Crown size={13} className="rprofile-member-crown" />}
                        </span>
                        <span className="rprofile-member-meta">{m.botleagueId || "-"}{m.teamRole && m.teamRole !== "CAPTAIN" && <> · {toLabel(m.teamRole)}</>}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rprofile-records rprofile-desktop-only">
            <h2>Tournament Records</h2>

            {profile.eventRecords.length === 0 ? (
              <div className="rprofile-records-empty">
                <p>No tournament records yet.</p>
              </div>
            ) : (
              <div className="rprofile-table">
                <div className="rprofile-table-head">
                  <span>Tournament</span>
                  <span>Matches</span>
                  <span>Wins</span>
                  <span>Losses</span>
                  <span>Points</span>
                  <span>Position</span>
                </div>
                {profile.eventRecords.map((rec, i) => (
                  <div className="rprofile-table-row" key={`${rec.eventSportId}-${i}`}>
                    <span className="rprofile-table-tournament">{rec.eventName ?? "Unknown Event"}</span>
                    <span>{rec.matchesPlayed}</span>
                    <span>{rec.wins}</span>
                    <span>{rec.losses}</span>
                    <span>{rec.pointsEarned}</span>
                    <span>{rec.eventRank ? ordinal(rec.eventRank) : "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      <PublicNavbar />
      {body}
    </>
  );
}
