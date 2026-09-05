import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Percent, Share2, Swords, Trophy } from "lucide-react";

import api from "../../../shared/api/Base";
import { resolveDashboardAvatarSrc } from "../constants/avatars";
import flightDecoration from "../../../assets/Auth/flight.svg";
import droneDecoration from "../../../assets/Auth/drone.svg";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import MobileUserProfile from "../components/MobileUserProfile";
import "../../../styles/robotProfile.css";

// The public person page is the same page as the public robot page
// (RobotPublicPage.tsx) with a person's facts on it — same hero card, same
// stat ribbons, same tournament-records table, same mobile companion, same
// stylesheet. Only the fields differ, and they line up one for one:
//
//   robot                    person
//   ─────                    ──────
//   Active / Inactive pill   account type (Player / Organiser / ...)
//   BotID                    BotLeague ID
//   Weight / Scale / ...     Location
//   Team Name                Team Name          (identical, links to /team/:code)
//   —                        Member Since
//   Techfects / Matches / Win Rate   ← same three stats, per person
//   Tournament records       tournament history (see the table below)

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

interface PlayerHistoryEntry {
  tournamentName: string | null;
  teamName:       string | null;
  role:           string | null;
  /** Age group the person competed in — "Tier" on the wire, for historical reasons. */
  tier:           string | null;
  position:       number | null;
  resultLabel:    string | null;
}

interface UserPublicProfile {
  userId:          string;
  botleagueId:     string;
  firstName:       string | null;
  lastName:        string | null;
  username:        string | null;
  profilePhotoUrl: string | null;
  city:            string | null;
  state:           string | null;
  country:         string | null;
  memberSince:     string | null;
  accountType:     string | null;
  teamRole?:       string | null;
  teamId?:         string | null;
  teamCode?:       string | null;
  teamName?:       string | null;
  teamLogo?:       string | null;

  // Career stats, aggregated server-side over every event this person's teams
  // fielded them in — see ProfileController.getPublicProfileByCode.
  tournamentsPlayed?: number | null;
  matchesPlayed?:     number | null;
  wins?:              number | null;
  losses?:            number | null;
  winRate?:           number | null;
  playerHistory?:     PlayerHistoryEntry[] | null;
}

export default function UserPublicPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (!code) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    api
      .get(`/profile/public/${code}`)
      .then((r) => setProfile(r.data))
      .catch((e) => setError(e?.response?.data?.message ?? "User not found"))
      .finally(() => setLoading(false));
  }, [code]);

  const shareProfile = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/user/${profile.botleagueId}`;
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.botleagueId;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} - BotLeague Profile`, url });
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
        <p>Loading profile...</p>
      </div>
    );
  } else if (error || !profile) {
    body = (
      <div className="rprofile-page rprofile-state">
        <h1>Public Profile</h1>
        <p>{error ?? "User not found"}</p>
        <button type="button" className="rprofile-secondary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  } else {
    const displayName =
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username || profile.botleagueId;
    const initials =
      displayName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "?";
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "-";
    const avatarSrc = resolveDashboardAvatarSrc(profile.profilePhotoUrl);
    const accountLabel = toLabel(profile.accountType) === "-" ? "Player" : toLabel(profile.accountType);
    const memberSince = profile.memberSince
      ? new Date(profile.memberSince).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
      : "-";

    const tournamentsPlayed = profile.tournamentsPlayed ?? 0;
    const matchesPlayed = profile.matchesPlayed ?? 0;
    const winRate = Math.round(profile.winRate ?? 0);
    const history = profile.playerHistory ?? [];

    body = (
      <div className="rprofile-page">
        <img className="rprofile-bg rprofile-bg-flight-left" src={flightDecoration} alt="" aria-hidden="true" />
        <img className="rprofile-bg rprofile-bg-drone" src={droneDecoration} alt="" aria-hidden="true" />

        <div className="rprofile-shell">
          <div className="rprofile-mobile-only">
            <MobileUserProfile
              displayName={displayName}
              botleagueId={profile.botleagueId}
              location={location}
              teamName={profile.teamName || "No Team"}
              accountLabel={accountLabel}
              imageUrl={!imgErr ? avatarSrc : null}
              imageAlt={displayName}
              initials={initials}
              tournamentsPlayed={tournamentsPlayed}
              matchesPlayed={matchesPlayed}
              winRate={winRate}
              records={history.map((rec, i) => ({
                key: `${rec.tournamentName ?? "event"}-${i}`,
                tournament: rec.tournamentName ?? "Unknown Techfect",
                team: rec.teamName ?? "-",
                role: toLabel(rec.role),
                position: rec.position ? ordinal(rec.position) : "-",
              }))}
              onShare={shareProfile}
            />
          </div>

          <section className="rprofile-hero rprofile-desktop-only">
            <OutlineStar className="rprofile-card-star-a" />
            <OutlineStar className="rprofile-card-star-b" />

            <div className="rprofile-hero-copy">
              <div className="rprofile-name-row">
                <h2>{displayName}</h2>
                <span className="rprofile-active-pill">
                  <span /> {accountLabel}
                </span>
              </div>
              <p>
                <span className="rprofile-info-label">BotLeague ID</span> -{" "}
                <span className="rprofile-info-value">{profile.botleagueId || "-"}</span>
              </p>
              <p>
                <span className="rprofile-info-label">Location</span> -{" "}
                <span className="rprofile-info-value">{location}</span>
              </p>
              <p>
                <span className="rprofile-info-label">Team Name</span> -{" "}
                {profile.teamName ? (
                  <button
                    type="button"
                    className="rprofile-info-value"
                    style={{ background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => profile.teamCode && navigate(`/team/${profile.teamCode}`)}
                  >
                    {profile.teamName}
                  </button>
                ) : (
                  <span className="rprofile-info-value">No Team</span>
                )}
              </p>
              <p>
                <span className="rprofile-info-label">Member Since</span> -{" "}
                <span className="rprofile-info-value">{memberSince}</span>
              </p>

              <div className="rprofile-actions">
                <button type="button" onClick={shareProfile}>
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="rprofile-avatar-stage">
              <img src={bLogo} alt="" aria-hidden="true" className="rprofile-big-b" />
              {avatarSrc && !imgErr ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="rprofile-avatar"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <span className="rprofile-avatar rprofile-avatar-initials" aria-label={displayName}>
                  {initials}
                </span>
              )}
            </div>

            <div className="rprofile-stats" aria-label="Player stats">
              <div className="rprofile-stat-ribbon">
                <span className="rprofile-stat-icon"><Trophy size={35} /></span>
                <strong>{tournamentsPlayed}</strong>
                <span>Techfects</span>
              </div>
              <div className="rprofile-stat-ribbon">
                <span className="rprofile-stat-icon"><Swords size={35} /></span>
                <strong>{matchesPlayed}</strong>
                <span>Matches</span>
              </div>
              <div className="rprofile-stat-ribbon">
                <span className="rprofile-stat-icon"><Percent size={35} /></span>
                <strong>{winRate}%</strong>
                <span>Win Rate</span>
              </div>
            </div>
          </section>

          <section className="rprofile-records rprofile-desktop-only">
            <h2>Tournament Records</h2>

            {history.length === 0 ? (
              <div className="rprofile-records-empty">
                <p>No tournament records yet.</p>
              </div>
            ) : (
              // Six columns, same grid as the robot table — and in the same
              // order of importance, since the stylesheet drops columns 3-4
              // below 900px and column 2 below 560px.
              <div className="rprofile-table">
                <div className="rprofile-table-head">
                  <span>Tournament</span>
                  <span>Team</span>
                  <span>Role</span>
                  <span>Category</span>
                  <span>Result</span>
                  <span>Position</span>
                </div>
                {history.map((rec, i) => (
                  <div className="rprofile-table-row" key={`${rec.tournamentName ?? "event"}-${i}`}>
                    <span className="rprofile-table-tournament">{rec.tournamentName ?? "Unknown Event"}</span>
                    <span>{rec.teamName ?? "-"}</span>
                    <span>{toLabel(rec.role)}</span>
                    <span>{toLabel(rec.tier)}</span>
                    <span>{rec.resultLabel ?? "-"}</span>
                    <span>{rec.position ? ordinal(rec.position) : "-"}</span>
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
