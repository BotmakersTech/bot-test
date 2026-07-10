import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Percent, Share2, Swords, Trophy } from "lucide-react";

import { useAppSelector } from "../../../app/hooks";
import useTeamMembership from "../../Team/TeamMembership/hooks/useTeamMembership";
import { getRobotById } from "../api/robot.api";
import { getPublicRobotProfile, type PublicRobotProfile } from "../api/robotPublic.api";
import RobotDetailModal from "../components/RobotDetailModal";
import type { Robot } from "../types/types";
import robotFallback from "../../../assets/robot.png";
import flightDecoration from "../../../assets/Auth/flight.svg";
import droneDecoration from "../../../assets/Auth/drone.svg";
import bLogo from "../../../assets/Dashboard/B_LOGO.png";
import "../../../styles/robotProfile.css";

function OutlineStar({ className = "" }: { className?: string }) {
  return <span className={`rprofile-outline-star ${className}`} aria-hidden="true" />;
}

function toLabel(value?: string | null) {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function RobotProfilePage() {
  const { robotId } = useParams<{ robotId: string }>();
  const navigate = useNavigate();
  const teamCode = useAppSelector((state) => state.team.teamCode);
  const { isAdmin: canManageRobots } = useTeamMembership(teamCode ?? "");

  const [robot, setRobot] = useState<Robot | null>(null);
  const [profile, setProfile] = useState<PublicRobotProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const load = () => {
    if (!robotId) return;
    setLoading(true);
    setError(null);
    Promise.all([getRobotById(robotId), getPublicRobotProfile(robotId)])
      .then(([robotData, profileData]) => {
        setRobot(robotData);
        setProfile(profileData);
      })
      .catch((e: any) => setError(e?.response?.data?.message ?? "Robot not found"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robotId]);

  const winRate = useMemo(() => {
    if (!profile || profile.totalMatches === 0) return 0;
    return Math.round((profile.totalWins / profile.totalMatches) * 100);
  }, [profile]);

  const shareRobot = async () => {
    if (!robot) return;
    const url = `${window.location.origin}/robot/${robot.robotCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${robot.robotName} - Robot Profile`, url });
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

  if (error || !robot) {
    return (
      <div className="rprofile-page rprofile-state">
        <h1>Robot Profile</h1>
        <p>{error ?? "Robot not found"}</p>
        <button type="button" className="rprofile-secondary" onClick={() => navigate("/robots")}>
          <ArrowLeft size={16} />
          Back to Robots
        </button>
      </div>
    );
  }

  const active = robot.status === "ACTIVE";
  const teamName = robot.teamName || profile?.teamName;

  return (
    <div className="rprofile-page">
      <img className="rprofile-bg rprofile-bg-flight-left" src={flightDecoration} alt="" aria-hidden="true" />
      <img className="rprofile-bg rprofile-bg-drone" src={droneDecoration} alt="" aria-hidden="true" />

      <div className="rprofile-shell">
        <button type="button" className="rprofile-back" onClick={() => navigate("/robots")}>
          <ArrowLeft size={18} />
          Back to Robots
        </button>

        <section className="rprofile-hero">
          <OutlineStar className="rprofile-card-star-a" />
          <OutlineStar className="rprofile-card-star-b" />

          <div className="rprofile-hero-copy">
            <div className="rprofile-name-row">
              <h2>{robot.robotName}</h2>
              <span className={`rprofile-active-pill${active ? "" : " inactive"}`}>
                <span /> {active ? "Active" : "Inactive"}
              </span>
            </div>
            <p><span className="rprofile-info-label">BotID</span> - <span className="rprofile-info-value">{robot.robotCode || "-"}</span></p>
            <p><span className="rprofile-info-label">Team Name</span> - <span className="rprofile-info-value">{teamName || "No Team"}</span></p>
            <p><span className="rprofile-info-label">Created on</span> - <span className="rprofile-info-value">{formatDate(robot.createdAt)}</span></p>

            <div className="rprofile-actions">
              <button type="button" onClick={shareRobot}>
                <Share2 size={16} />
                Share
              </button>
              {canManageRobots && (
                <button type="button" onClick={() => setEditing(true)}>
                  <Pencil size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="rprofile-avatar-stage">
            <img src={bLogo} alt="" aria-hidden="true" className="rprofile-big-b" />
            {robot.robotIMG && !imgErr ? (
              <img
                src={robot.robotIMG}
                alt={robot.robotName}
                className="rprofile-avatar"
                onError={() => setImgErr(true)}
              />
            ) : (
              <img src={robotFallback} alt={robot.robotName} className="rprofile-avatar rprofile-avatar-fallback" />
            )}
          </div>

          <div className="rprofile-stats" aria-label="Robot stats">
            <div className="rprofile-stat-ribbon">
              <span className="rprofile-stat-icon"><Trophy size={35} /></span>
              <strong>{profile?.eventsPlayed ?? 0}</strong>
              <span>Events</span>
            </div>
            <div className="rprofile-stat-ribbon">
              <span className="rprofile-stat-icon"><Swords size={35} /></span>
              <strong>{profile?.totalMatches ?? 0}</strong>
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

          {!profile || profile.records.length === 0 ? (
            <div className="rprofile-records-empty">
              <p>No tournament records yet.</p>
            </div>
          ) : (
            <div className="rprofile-table">
              <div className="rprofile-table-head">
                <span>Tournament</span>
                <span>Points</span>
                <span>Sports</span>
                <span>Position</span>
              </div>
              {profile.records.map((rec, i) => (
                <div className="rprofile-table-row" key={`${rec.eventSportId}-${i}`}>
                  <span className="rprofile-table-tournament">{rec.eventName ?? "Unknown Event"}</span>
                  <span>{rec.pointsEarned}</span>
                  <span>{toLabel(rec.sport)}</span>
                  <span>{rec.eventRank ? ordinal(rec.eventRank) : "-"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <RobotDetailModal
          robot={robot}
          onClose={() => setEditing(false)}
          canEdit={canManageRobots}
          startInEditing
          onUpdated={() => {
            load();
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
