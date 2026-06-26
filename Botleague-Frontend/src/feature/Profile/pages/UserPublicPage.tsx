import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../shared/api/Base";
import ShareButton from "../../../shared/components/ShareButton";

const BG   = "#0d0d0f";
const CARD = "#161618";
const BORDER = "rgba(255,255,255,0.07)";
const GOLD = "#f59e0b";
const TEXT = "#ffffff";
const MUTED = "#6b6b72";

interface UserPublicProfile {
  userId:         string;
  botleagueId:    string;
  firstName:      string | null;
  lastName:       string | null;
  username:       string | null;
  profilePhotoUrl:string | null;
  city:           string | null;
  state:          string | null;
  country:        string | null;
  memberSince:    string | null;
  accountType:    string | null;
  teamRole?:      string | null;
  teamId?:        string | null;
  teamCode?:      string | null;
  teamName?:      string | null;
  teamLogo?:      string | null;
}

function toLabel(raw?: string | null) {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function UserPublicPage() {
  const { code }  = useParams<{ code: string }>();
  const navigate  = useNavigate();
  const shareUrl  = `${window.location.origin}/user/${code}`;

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    api.get(`/profile/public/${code}`)
      .then(r => setProfile(r.data))
      .catch(e => setError(e?.response?.data?.message ?? "User not found"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 44, height: 44, border: `3px solid rgba(255,255,255,0.06)`, borderTop: `3px solid ${GOLD}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !profile) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: MUTED }}>
      <div style={{ fontSize: "3rem" }}>👤</div>
      <p style={{ color: TEXT, fontWeight: 700 }}>{error ?? "User not found"}</p>
      <button onClick={() => navigate(-1)} style={{ background: GOLD, border: "none", color: "#000", borderRadius: 8, padding: "10px 24px", fontWeight: 800, cursor: "pointer" }}>← Go Back</button>
    </div>
  );

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username || profile.botleagueId;
  const initials    = displayName.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const location    = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "12px 32px", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.4)" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 7, padding: "6px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
          ← Back
        </button>
        <span style={{ color: MUTED, fontSize: "0.78rem" }}>Public Profile</span>
        <div style={{ marginLeft: "auto" }}>
          <ShareButton url={shareUrl} label="Share Profile" size="sm" />
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
          {profile.profilePhotoUrl ? (
            <img src={profile.profilePhotoUrl} alt={displayName}
              style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: `2px solid ${BORDER}`, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg,#fa4715,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
          )}

          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 900, color: GOLD, fontFamily: "'Orbitron', sans-serif" }}>
              {displayName}
            </h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: MUTED, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 5, padding: "1px 8px" }}>
                {profile.botleagueId}
              </span>
              {profile.username && (
                <span style={{ fontSize: "0.75rem", color: MUTED }}>@{profile.username}</span>
              )}
            </div>
            {location && (
              <p style={{ margin: 0, fontSize: "0.82rem", color: MUTED }}>📍 {location}</p>
            )}
            {profile.memberSince && (
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: MUTED }}>
                Member since {new Date(profile.memberSince).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
              </p>
            )}
          </div>
        </div>

        {/* Team card */}
        {profile.teamName && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ margin: "0 0 12px", fontSize: "0.65rem", fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>Current Team</p>
            <button
              onClick={() => profile.teamCode && navigate(`/team/${profile.teamCode}`)}
              style={{ display: "flex", alignItems: "center", gap: 14, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 18px", cursor: "pointer", width: "100%", textAlign: "left", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.4)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER}
            >
              {profile.teamLogo ? (
                <img src={profile.teamLogo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, color: GOLD, flexShrink: 0 }}>
                  {profile.teamName.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: TEXT, fontSize: "0.95rem" }}>{profile.teamName}</div>
                <div style={{ fontSize: "0.72rem", color: MUTED }}>
                  {profile.teamCode}
                  {profile.teamRole && <> · <span style={{ color: "#a78bfa" }}>{toLabel(profile.teamRole)}</span></>}
                </div>
              </div>
              <span style={{ color: GOLD, fontSize: "0.9rem" }}>→</span>
            </button>
          </div>
        )}

        {/* Info grid */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 24px" }}>
          <p style={{ margin: "0 0 14px", fontSize: "0.65rem", fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>Info</p>
          {[
            { label: "Account Type", value: toLabel(profile.accountType) },
            { label: "Location",     value: location || null },
          ].filter(r => r.value).map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: "0.8rem", color: MUTED }}>{r.label}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: TEXT }}>{r.value}</span>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 40, textAlign: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.18)" }}>
          BotLeague · Public Profile · {profile.botleagueId}
        </p>
      </div>
    </div>
  );
}
