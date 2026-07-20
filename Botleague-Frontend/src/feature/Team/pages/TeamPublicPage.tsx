import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicTeamProfile, getPublicTeamProfileByCode, type PublicTeamProfile } from "../api/teamPublic.api";
import ShareButton from "../../../shared/components/ShareButton";
import TeamLogo from "../../../shared/components/TeamLogo";

// ── Design tokens (matching the dark esports aesthetic) ───────────────────────
const BG      = "#0d0d0f";
const CARD    = "#161618";
const CARD2   = "#1a1a1d";
const BORDER  = "rgba(255,255,255,0.07)";
const GOLD    = "#f59e0b";
const GOLD2   = "#fbbf24";
const TEXT    = "#ffffff";
const MUTED   = "#6b6b72";
const SUCCESS = "#22c55e";

function toLabel(raw?: string | null) {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const CrownIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M6 20V10l6-6 6 6v10"/>
    <path d="M12 4L6 10M12 4l6 6"/>
    <rect x="9" y="15" width="6" height="5" rx="1"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v9a6 6 0 01-12 0V4z"/>
    <path d="M12 19v3M8 22h8"/>
  </svg>
);

const MedalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="15" r="6"/>
    <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
  </svg>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string | number;
}) {
  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 10,
      flex: 1,
      minWidth: 140,
    }}>
      {icon}
      <div>
        <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color: TEXT, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
}

// ── Position badge ────────────────────────────────────────────────────────────
function PositionCell({ rank }: { rank: number | null }) {
  if (rank === null) return <span style={{ color: MUTED }}>—</span>;
  const colors = rank === 1 ? GOLD : rank === 2 ? "#d1d5db" : rank === 3 ? "#b45309" : MUTED;
  const prefix = rank === 1 ? "🥇 " : rank === 2 ? "🥈 " : rank === 3 ? "🥉 " : "";
  return <span style={{ color: colors, fontWeight: 700 }}>{prefix}{ordinal(rank)}</span>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeamPublicPage() {
  // supports both /team/:teamId (UUID) and /team/:code (BLT...)
  const { teamId, code } = useParams<{ teamId?: string; code?: string }>();
  const param    = code ?? teamId ?? "";
  const navigate = useNavigate();
  const isCode   = !!code || (param.startsWith("BLT") && !param.includes("-"));

  const [profile, setProfile] = useState<PublicTeamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!param) return;
    setLoading(true);
    const fetch = isCode
      ? getPublicTeamProfileByCode(param)
      : getPublicTeamProfile(param);
    fetch
      .then(setProfile)
      .catch(e => setError(e?.response?.data?.message ?? "Team not found"))
      .finally(() => setLoading(false));
  }, [param, isCode]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 44, height: 44, border: `3px solid rgba(255,255,255,0.06)`, borderTop: `3px solid ${GOLD}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !profile) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: MUTED }}>
      <div style={{ fontSize: "3rem" }}>🤖</div>
      <p style={{ color: TEXT, fontWeight: 700, fontSize: "1rem" }}>{error ?? "Team not found"}</p>
      <button onClick={() => navigate(-1)} style={{ background: GOLD, border: "none", color: "#000", borderRadius: 8, padding: "10px 24px", fontWeight: 800, cursor: "pointer", fontSize: "0.88rem" }}>← Go Back</button>
    </div>
  );

  const winRate   = profile.matchesPlayed > 0 ? Math.round((profile.totalWins / profile.matchesPlayed) * 100) : 0;
  const shareUrl  = `${window.location.origin}/team/${profile.teamCode}`;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * { box-sizing: border-box; }`}</style>

      {/* ── TOP BAR ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "12px 32px", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.4)" }}>
        <button onClick={() => navigate(-1)}
          style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 7, padding: "6px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
          ← Back
        </button>
        <span style={{ color: MUTED, fontSize: "0.78rem" }}>Public Team Profile</span>
        <div style={{ marginLeft: "auto" }}>
          <ShareButton url={shareUrl} label="Share" size="sm" />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>

        {/* ── HERO: two-column — info left, logo right ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>

          {/* LEFT */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Team name + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: GOLD, fontFamily: "'Sarpanch', Inter, sans-serif", letterSpacing: "0.02em", lineHeight: 1.1 }}>
                {profile.teamName}
              </h1>
              {profile.status && (
                <span style={{
                  border: `1.5px solid ${profile.status === "ACTIVE" ? SUCCESS : BORDER}`,
                  color: profile.status === "ACTIVE" ? SUCCESS : MUTED,
                  borderRadius: 999,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "3px 12px",
                  background: profile.status === "ACTIVE" ? "rgba(34,197,94,0.08)" : "transparent",
                  flexShrink: 0,
                }}>
                  {profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}
                </span>
              )}
            </div>

            {/* Location + code */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
              {[profile.institutionName, profile.city, profile.state].filter(Boolean).join(", ") && (
                <span style={{ fontSize: "0.82rem", color: MUTED }}>
                  📍 {[profile.institutionName, profile.city, profile.state].filter(Boolean).join(", ")}
                </span>
              )}
              <span style={{ fontSize: "0.78rem", color: MUTED, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 5, padding: "1px 8px" }}>
                {profile.teamCode}
              </span>
            </div>

            {/* Stat cards */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ margin: "0 0 14px", fontSize: "0.65rem", fontWeight: 700, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase" }}>Team Stats</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <StatCard icon={<CrownIcon />} label="Rank"
                  value={profile.bestGlobalRank != null ? profile.bestGlobalRank : "—"} />
                <StatCard icon={<TrophyIcon />} label="Tot.Points" value={profile.totalPoints} />
                <StatCard icon={<MedalIcon />}  label="Global Points" value={profile.totalPoints} />
              </div>
            </div>

            {/* Medals row */}
            {(profile.goldMedals + profile.silverMedals + profile.bronzeMedals) > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {profile.goldMedals   > 0 && <span style={{ fontSize: "0.8rem", fontWeight: 700, color: GOLD }}> 🥇 {profile.goldMedals}×  Gold</span>}
                {profile.silverMedals > 0 && <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#d1d5db" }}>🥈 {profile.silverMedals}×  Silver</span>}
                {profile.bronzeMedals > 0 && <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#b45309" }}>🥉 {profile.bronzeMedals}×  Bronze</span>}
              </div>
            )}
          </div>

          {/* RIGHT — Logo */}
          <div style={{ flexShrink: 0 }}>
            <TeamLogo
              src={profile.logoUrl}
              alt={profile.teamName}
              style={{ width: 220, height: 180, objectFit: "contain", borderRadius: 14, background: CARD, border: `1px solid ${BORDER}`, padding: 16 }}
            />
          </div>
        </div>

        {/* ── TOURNAMENT RECORDS ── */}
        <div>
          <p style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Tournament Records
          </p>

          {profile.eventRecords.length === 0 ? (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏅</div>
              <p style={{ margin: 0, color: MUTED, fontSize: "0.9rem" }}>No tournament records yet.</p>
            </div>
          ) : (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.3fr",
                padding: "14px 20px",
                background: CARD2,
                borderBottom: `1px solid ${BORDER}`,
              }}>
                {["Tournament Name", "Matches", "Wins", "Losses", "Points", "Tournament Position"].map(h => (
                  <span key={h} style={{ fontSize: "0.62rem", fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {profile.eventRecords.map((rec, i) => (
                <div key={`${rec.eventSportId}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.3fr",
                    padding: "16px 20px",
                    borderBottom: i < profile.eventRecords.length - 1 ? `1px solid ${BORDER}` : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  {/* Tournament name + tags */}
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>
                      {rec.eventName ?? "Unknown Event"}
                    </p>
                    {rec.robotName && (
                      <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: GOLD2 }}>
                        🤖 {rec.robotName}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.6rem", color: GOLD2, background: "rgba(245,158,11,0.1)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>
                        {toLabel(rec.sport)}
                      </span>
                      {rec.ageGroup && (
                        <span style={{ fontSize: "0.6rem", color: MUTED, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "1px 7px" }}>
                          {toLabel(rec.ageGroup)}
                        </span>
                      )}
                      {rec.weightClass && (
                        <span style={{ fontSize: "0.6rem", color: MUTED, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "1px 7px" }}>
                          {toLabel(rec.weightClass)}
                        </span>
                      )}
                      {!rec.isFinalized && (
                        <span style={{ fontSize: "0.6rem", color: SUCCESS, background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.25)`, borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matches */}
                  <span style={{ color: TEXT, fontWeight: 600, fontSize: "0.95rem" }}>{rec.matchesPlayed}</span>

                  {/* Wins */}
                  <span style={{ color: SUCCESS, fontWeight: 700, fontSize: "0.95rem" }}>{rec.wins}</span>

                  {/* Losses */}
                  <span style={{ color: "#f87171", fontWeight: 700, fontSize: "0.95rem" }}>{rec.losses}</span>

                  {/* Points */}
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: "0.95rem" }}>{rec.pointsEarned}</span>

                  {/* Position */}
                  <span style={{ fontSize: "0.9rem" }}>
                    <PositionCell rank={rec.eventRank} />
                  </span>
                </div>
              ))}

              {/* Win-rate footer */}
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, background: CARD2, display: "flex", gap: 24, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>
                  Total Matches: <strong style={{ color: TEXT }}>{profile.matchesPlayed}</strong>
                </span>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>
                  Overall W/L: <strong style={{ color: SUCCESS }}>{profile.totalWins}</strong>
                  <span style={{ color: MUTED }}> / </span>
                  <strong style={{ color: "#f87171" }}>{profile.totalLosses}</strong>
                </span>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>
                  Win Rate: <strong style={{ color: GOLD }}>{winRate}%</strong>
                </span>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>
                  Events Played: <strong style={{ color: TEXT }}>{profile.eventsPlayed}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ marginTop: 40, textAlign: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.18)" }}>
          BotLeague · Public Team Profile · {profile.teamCode}
        </p>
      </div>
    </div>
  );
}
