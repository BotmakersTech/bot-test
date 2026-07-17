import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicRobotProfile, getPublicRobotProfileByCode, type PublicRobotProfile } from "../api/robotPublic.api";
import ShareButton from "../../../shared/components/ShareButton";
import TeamLogo from "../../../shared/components/TeamLogo";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG    = "#0d0d0f";
const CARD  = "#161618";
const CARD2 = "#1a1a1d";
const BORDER= "rgba(255,255,255,0.07)";
const GOLD  = "#f59e0b";
const GOLD2 = "#fbbf24";
const TEXT  = "#ffffff";
const MUTED = "#6b6b72";
const SUCCESS="#22c55e";

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
const BotIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M9 11V7a3 3 0 016 0v4"/>
    <circle cx="9" cy="16" r="1" fill={GOLD}/>
    <circle cx="15" cy="16" r="1" fill={GOLD}/>
  </svg>
);
const TrophyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v9a6 6 0 01-12 0V4z"/>
    <path d="M12 19v3M8 22h8"/>
  </svg>
);
const SwordIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
  </svg>
);
const PointsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4l3 3"/>
  </svg>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
}) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "22px 24px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 130 }}>
      {icon}
      <div>
        <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color: TEXT, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: "0.7rem", color: MUTED, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Spec row ──────────────────────────────────────────────────────────────────
function SpecRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: "0.78rem", color: MUTED }}>{label}</span>
      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: TEXT }}>{value}</span>
    </div>
  );
}

// ── Position cell ─────────────────────────────────────────────────────────────
function PositionCell({ rank }: { rank: number | null }) {
  if (rank === null) return <span style={{ color: MUTED }}>—</span>;
  const color = rank === 1 ? GOLD : rank === 2 ? "#d1d5db" : rank === 3 ? "#b45309" : MUTED;
  const icon  = rank === 1 ? "🥇 " : rank === 2 ? "🥈 " : rank === 3 ? "🥉 " : "";
  return <span style={{ color, fontWeight: 700 }}>{icon}{ordinal(rank)}</span>;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RobotPublicPage() {
  const { robotId, code } = useParams<{ robotId?: string; code?: string }>();
  const param    = code ?? robotId ?? "";
  const navigate = useNavigate();
  const isCode   = !!code || (param.startsWith("BLR") && !param.includes("-"));

  const [profile, setProfile] = useState<PublicRobotProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!param) return;
    setLoading(true);
    const fetch = isCode
      ? getPublicRobotProfileByCode(param)
      : getPublicRobotProfile(param);
    fetch
      .then(setProfile)
      .catch(e => setError(e?.response?.data?.message ?? "Robot not found"))
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
      <p style={{ color: TEXT, fontWeight: 700, fontSize: "1rem" }}>{error ?? "Robot not found"}</p>
      <button onClick={() => navigate(-1)} style={{ background: GOLD, border: "none", color: "#000", borderRadius: 8, padding: "10px 24px", fontWeight: 800, cursor: "pointer", fontSize: "0.88rem" }}>← Go Back</button>
    </div>
  );

  const winRate  = profile.totalMatches > 0 ? Math.round((profile.totalWins / profile.totalMatches) * 100) : 0;
  const shareUrl = `${window.location.origin}/robot/${profile.robotCode}`;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* ── TOP BAR ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "12px 32px", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.4)" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 7, padding: "6px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
          ← Back
        </button>
        <span style={{ color: MUTED, fontSize: "0.78rem" }}>Public Robot Profile</span>
        {profile.teamName && (
          <>
            <span style={{ color: MUTED }}>·</span>
            <button
              onClick={() => profile.teamCode && navigate(`/team/${profile.teamCode}`)}
              style={{ background: "none", border: "none", color: GOLD, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              {profile.teamName} →
            </button>
          </>
        )}
        <div style={{ marginLeft: "auto" }}>
          <ShareButton url={shareUrl} label="Share" size="sm" />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>

        {/* ── HERO: two-column ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>

          {/* LEFT — name + stats */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Name + status */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, color: GOLD, fontFamily: "'Orbitron', Inter, sans-serif", letterSpacing: "0.02em", lineHeight: 1.1 }}>
                {profile.robotName}
              </h1>
              {profile.status && (
                <span style={{ border: `1.5px solid ${profile.status === "ACTIVE" ? SUCCESS : BORDER}`, color: profile.status === "ACTIVE" ? SUCCESS : MUTED, borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, padding: "3px 12px", background: profile.status === "ACTIVE" ? "rgba(34,197,94,0.08)" : "transparent", flexShrink: 0 }}>
                  {profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}
                </span>
              )}
            </div>

            {/* Code + type */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
              <span style={{ fontSize: "0.75rem", color: MUTED, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 5, padding: "1px 8px" }}>
                {profile.robotCode}
              </span>
              {profile.robotType && (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: GOLD2, background: "rgba(245,158,11,0.1)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 5, padding: "1px 9px" }}>
                  {toLabel(profile.robotType)}
                </span>
              )}
              {profile.weightClass && (
                <span style={{ fontSize: "0.72rem", color: MUTED, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 5, padding: "1px 9px" }}>
                  {toLabel(profile.weightClass)}
                </span>
              )}
            </div>

            {/* Stat cards */}
            <p style={{ margin: "0 0 14px", fontSize: "0.65rem", fontWeight: 700, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase" }}>Robot Stats</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatCard icon={<TrophyIcon />}  label="Events"  value={profile.eventsPlayed} />
              <StatCard icon={<SwordIcon />}   label="Matches" value={profile.totalMatches} sub={`${profile.totalWins}W · ${profile.totalLosses}L`} />
              <StatCard icon={<PointsIcon />}  label="Points"  value={profile.totalPoints} />
              <StatCard icon={<BotIcon />}     label="Win Rate" value={`${winRate}%`} />
            </div>

            {/* Medals */}
            {(profile.goldMedals + profile.silverMedals + profile.bronzeMedals) > 0 && (
              <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                {profile.goldMedals   > 0 && <span style={{ fontSize: "0.82rem", fontWeight: 700, color: GOLD }}>🥇 {profile.goldMedals}× Gold</span>}
                {profile.silverMedals > 0 && <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#d1d5db" }}>🥈 {profile.silverMedals}× Silver</span>}
                {profile.bronzeMedals > 0 && <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#b45309" }}>🥉 {profile.bronzeMedals}× Bronze</span>}
              </div>
            )}
          </div>

          {/* RIGHT — image + specs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flexShrink: 0, width: 240 }}>
            {/* Robot image */}
            {profile.imageUrl ? (
              <img src={profile.imageUrl} alt={profile.robotName}
                style={{ width: 240, height: 190, objectFit: "contain", borderRadius: 14, background: CARD, border: `1px solid ${BORDER}`, padding: 12 }} />
            ) : (
              <div style={{ width: 240, height: 190, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>
                🤖
              </div>
            )}

            {/* Team chip */}
            {profile.teamName && (
              <button
                onClick={() => profile.teamId && navigate(`/team/${profile.teamId}`)}
                style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "border-color 0.15s", width: "100%", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.4)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER}
              >
                <TeamLogo
                  src={profile.teamLogoUrl}
                  style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Team</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT }}>{profile.teamName}</div>
                </div>
                <span style={{ marginLeft: "auto", color: GOLD, fontSize: "0.8rem" }}>→</span>
              </button>
            )}
          </div>
        </div>

        {/* ── SPECS ── */}
        {(profile.sport || profile.ageCategory || profile.controlType || profile.controlMode || profile.weightKg || profile.lengthCm || profile.description) && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>Specifications</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {/* Tech specs card */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.62rem", fontWeight: 700, color: GOLD2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Technical</p>
                <SpecRow label="Sport"        value={toLabel(profile.sport)} />
                <SpecRow label="Age Category" value={toLabel(profile.ageCategory)} />
                <SpecRow label="Robot Type"   value={toLabel(profile.robotType)} />
                <SpecRow label="Control"      value={toLabel(profile.controlType)} />
                <SpecRow label="Connection"   value={toLabel(profile.controlMode)} />
                <SpecRow label="Weight Class" value={toLabel(profile.weightClass)} />
              </div>
              {/* Physical specs card */}
              {(profile.weightKg || profile.lengthCm || profile.widthCm || profile.heightCm) && (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "0.62rem", fontWeight: 700, color: GOLD2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Physical</p>
                  <SpecRow label="Weight"     value={profile.weightKg != null ? `${profile.weightKg} kg` : null} />
                  <SpecRow label="Length"     value={profile.lengthCm != null ? `${profile.lengthCm} cm` : null} />
                  <SpecRow label="Width"      value={profile.widthCm  != null ? `${profile.widthCm}  cm` : null} />
                  <SpecRow label="Height"     value={profile.heightCm != null ? `${profile.heightCm} cm` : null} />
                </div>
              )}
              {/* Description card */}
              {profile.description && (
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "0.62rem", fontWeight: 700, color: GOLD2, textTransform: "uppercase", letterSpacing: "0.1em" }}>About</p>
                  <p style={{ margin: 0, color: MUTED, fontSize: "0.85rem", lineHeight: 1.7 }}>{profile.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TOURNAMENT RECORDS ── */}
        <div>
          <p style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Tournament Records
          </p>

          {profile.records.length === 0 ? (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏅</div>
              <p style={{ margin: 0, color: MUTED, fontSize: "0.9rem" }}>No tournament records yet.</p>
            </div>
          ) : (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.3fr", padding: "14px 20px", background: CARD2, borderBottom: `1px solid ${BORDER}` }}>
                {["Tournament Name", "Matches", "Wins", "Losses", "Points", "Position"].map(h => (
                  <span key={h} style={{ fontSize: "0.62rem", fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {profile.records.map((rec, i) => (
                <div key={`${rec.eventSportId}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.3fr", padding: "16px 20px", borderBottom: i < profile.records.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "center", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  {/* Event + tags */}
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>{rec.eventName ?? "Unknown Event"}</p>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {rec.sport && <span style={{ fontSize: "0.6rem", color: GOLD2, background: "rgba(245,158,11,0.1)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>{toLabel(rec.sport)}</span>}
                      {rec.ageGroup   && <span style={{ fontSize: "0.6rem", color: MUTED, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "1px 7px" }}>{toLabel(rec.ageGroup)}</span>}
                      {rec.weightClass&& <span style={{ fontSize: "0.6rem", color: MUTED, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 4, padding: "1px 7px" }}>{toLabel(rec.weightClass)}</span>}
                      {!rec.isFinalized && <span style={{ fontSize: "0.6rem", color: SUCCESS, background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.25)`, borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>LIVE</span>}
                    </div>
                  </div>
                  <span style={{ color: TEXT, fontWeight: 600 }}>{rec.matchesPlayed}</span>
                  <span style={{ color: SUCCESS, fontWeight: 700 }}>{rec.wins}</span>
                  <span style={{ color: "#f87171", fontWeight: 700 }}>{rec.losses}</span>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{rec.pointsEarned}</span>
                  <span><PositionCell rank={rec.eventRank} /></span>
                </div>
              ))}

              {/* Summary footer */}
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, background: CARD2, display: "flex", gap: 24, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>Matches: <strong style={{ color: TEXT }}>{profile.totalMatches}</strong></span>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>W/L: <strong style={{ color: SUCCESS }}>{profile.totalWins}</strong><span style={{ color: MUTED }}> / </span><strong style={{ color: "#f87171" }}>{profile.totalLosses}</strong></span>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>Win Rate: <strong style={{ color: GOLD }}>{winRate}%</strong></span>
                <span style={{ fontSize: "0.72rem", color: MUTED }}>Total Points: <strong style={{ color: GOLD }}>{profile.totalPoints}</strong></span>
              </div>
            </div>
          )}
        </div>

        <p style={{ marginTop: 40, textAlign: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.18)" }}>
          BotLeague · Public Robot Profile · {profile.robotCode}
        </p>
      </div>
    </div>
  );
}
