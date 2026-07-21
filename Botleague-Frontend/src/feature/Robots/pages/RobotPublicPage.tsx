import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Percent, Share2, Swords, Trophy } from "lucide-react";

import { getPublicRobotProfile, getPublicRobotProfileByCode, type PublicRobotProfile } from "../api/robotPublic.api";
import robotFallback from "../../../assets/robot.png";
import flightDecoration from "../../../assets/Auth/flight.svg";
import droneDecoration from "../../../assets/Auth/drone.svg";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import "../../../styles/robotProfile.css";

// Same visual language as the editable /robots/:robotId page (RobotProfilePage.tsx)
// — this is the read-only, unauthenticated counterpart. The only real
// difference is the absence of the Edit button/modal and the public,
// code-or-UUID lookup below.

function OutlineStar({ className = "" }: { className?: string }) {
  return <span className={`rprofile-outline-star ${className}`} aria-hidden="true" />;
}

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export default function RobotPublicPage() {
  const { robotId, code } = useParams<{ robotId?: string; code?: string }>();
  const navigate = useNavigate();
  const param = code ?? robotId ?? "";
  const isCode = !!code || (param.startsWith("BLR") && !param.includes("-"));

  const [profile, setProfile] = useState<PublicRobotProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (!param) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const fetch = isCode ? getPublicRobotProfileByCode(param) : getPublicRobotProfile(param);
    fetch
      .then(setProfile)
      .catch((e) => setError(e?.response?.data?.message ?? "Robot not found"))
      .finally(() => setLoading(false));
  }, [param, isCode]);

  const winRate = profile && profile.totalMatches > 0 ? Math.round((profile.totalWins / profile.totalMatches) * 100) : 0;

  const shareRobot = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/robot/${profile.robotCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.robotName} - Robot Profile`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Share cancellation is harmless.
    }
  };

  if (loading) {
    return (
      <div className="rprofile-page rprofile-state">
        <div className="rprofile-spinner" />
        <p>Loading robot profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rprofile-page rprofile-state">
        <h1>Robot Profile</h1>
        <p>{error ?? "Robot not found"}</p>
        <button type="button" className="rprofile-secondary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  const active = profile.status === "ACTIVE";

  return (
    <div className="rprofile-page">
      <img className="rprofile-bg rprofile-bg-flight-left" src={flightDecoration} alt="" aria-hidden="true" />
      <img className="rprofile-bg rprofile-bg-drone" src={droneDecoration} alt="" aria-hidden="true" />

      <div className="rprofile-shell">
        <section className="rprofile-hero">
          <OutlineStar className="rprofile-card-star-a" />
          <OutlineStar className="rprofile-card-star-b" />

          <div className="rprofile-hero-copy">
            <div className="rprofile-name-row">
              <h2>{profile.robotName}</h2>
              <span className={`rprofile-active-pill${active ? "" : " inactive"}`}>
                <span /> {active ? "Active" : "Inactive"}
              </span>
            </div>
            <p><span className="rprofile-info-label">BotID</span> - <span className="rprofile-info-value">{profile.robotCode || "-"}</span></p>
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

            <div className="rprofile-actions">
              <button type="button" onClick={shareRobot}>
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>

          <div className="rprofile-avatar-stage">
            <img src={bLogo} alt="" aria-hidden="true" className="rprofile-big-b" />
            {profile.imageUrl && !imgErr ? (
              <img
                src={profile.imageUrl}
                alt={profile.robotName}
                className="rprofile-avatar"
                onError={() => setImgErr(true)}
              />
            ) : (
              <img src={robotFallback} alt={profile.robotName} className="rprofile-avatar rprofile-avatar-fallback" />
            )}
          </div>

          <div className="rprofile-stats" aria-label="Robot stats">
            <div className="rprofile-stat-ribbon">
              <span className="rprofile-stat-icon"><Trophy size={35} /></span>
              <strong>{profile.eventsPlayed}</strong>
              <span>Events</span>
            </div>
            <div className="rprofile-stat-ribbon">
              <span className="rprofile-stat-icon"><Swords size={35} /></span>
              <strong>{profile.totalMatches}</strong>
              <span>Matches</span>
            </div>
            <div className="rprofile-stat-ribbon">
              <span className="rprofile-stat-icon"><Percent size={35} /></span>
              <strong>{winRate}%</strong>
              <span>Win Rate</span>
            </div>
           
          </div>
        </section>

        <section className="rprofile-records">
          <h2>Tournament Records</h2>

          {profile.records.length === 0 ? (
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
              {profile.records.map((rec, i) => (
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
