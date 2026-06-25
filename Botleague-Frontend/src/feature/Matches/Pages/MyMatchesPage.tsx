import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../../shared/api/Base";
import type { PublicMatchView } from "../api/matches.api";
import { selectMatchLastUpdated } from "../store/matchesSlice";

// ── Design tokens (matching existing Matches.tsx) ──────────────────────────
const BG     = "#3a3a3a";
const CARD   = "rgba(0,0,0,0.28)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const TEXT   = "#ffffff";
const MUTED  = "#9ca3af";

const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  SCHEDULED: { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.28)",  label: "Scheduled" },
  UPCOMING:  { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.28)",  label: "Upcoming"  },
  LIVE:      { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.28)",  label: "Live"      },
  ONGOING:   { color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.28)",  label: "Ongoing"   },
  COMPLETED: { color: "#9ca3af", bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.22)", label: "Done"      },
  CANCELLED: { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.22)", label: "Cancelled" },
};

function fmt(val?: string | null) {
  if (!val) return "TBD";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 22, height: 22,
      border: "2px solid rgba(255,255,255,0.10)",
      borderTop: `2px solid ${ACCENT}`,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { color: MUTED, bg: "transparent", border: BORDER, label: status };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "3px 9px",
      borderRadius: "6px", color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {s.label}
    </span>
  );
}

function MatchCard({ match }: { match: PublicMatchView }) {
  const isLive = match.status === "LIVE" || match.status === "ONGOING";

  const teamA = match.teamARobotName
    ? `${match.teamAName ?? ""} · ${match.teamARobotName}`
    : (match.teamAName ?? "TBD");
  const teamB = match.teamBRobotName
    ? `${match.teamBName ?? ""} · ${match.teamBRobotName}`
    : (match.teamBName ?? "TBD");

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${isLive ? "rgba(74,222,128,0.28)" : BORDER}`,
      borderRadius: "12px", padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: "10px",
    }}>
      {/* Top row: round + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Round {match.roundNumber ?? "?"} · Match {match.matchNumber ?? "?"}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams vs */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{
            fontSize: "14px", fontWeight: 700, color: TEXT,
            opacity: match.winnerRegistrationId && match.winnerRegistrationId !== match.teamARegistrationId ? 0.45 : 1,
          }}>
            {teamA}
          </div>
          {match.status === "COMPLETED" && (
            <div style={{ fontSize: "22px", fontWeight: 800, color: ACCENT }}>
              {match.teamAScore ?? 0}
            </div>
          )}
        </div>

        <div style={{
          fontSize: "13px", fontWeight: 700, color: MUTED,
          padding: "4px 10px", background: "rgba(255,255,255,0.05)",
          borderRadius: "6px", flexShrink: 0,
        }}>
          VS
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "14px", fontWeight: 700, color: TEXT,
            opacity: match.winnerRegistrationId && match.winnerRegistrationId !== match.teamBRegistrationId ? 0.45 : 1,
          }}>
            {teamB}
          </div>
          {match.status === "COMPLETED" && (
            <div style={{ fontSize: "22px", fontWeight: 800, color: ACCENT }}>
              {match.teamBScore ?? 0}
            </div>
          )}
        </div>
      </div>

      {/* Winner banner */}
      {match.status === "COMPLETED" && match.winnerTeamName && (
        <div style={{
          fontSize: "12px", color: "#4ade80", fontWeight: 600,
          background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: "6px", padding: "5px 10px", textAlign: "center",
        }}>
          Winner: {match.winnerRobotName ?? match.winnerTeamName}
        </div>
      )}

      {/* Footer: time */}
      <div style={{ fontSize: "12px", color: MUTED }}>
        {match.status === "COMPLETED"
          ? `Ended: ${fmt(match.endedAt)}`
          : match.status === "LIVE" || match.status === "ONGOING"
            ? `Started: ${fmt(match.startedAt)}`
            : `Scheduled: ${fmt(match.scheduledAt)}`}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyMatchesPage() {
  const [matches, setMatches] = useState<PublicMatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const matchLastUpdated = useSelector(selectMatchLastUpdated);

  const fetchMyMatches = useCallback(() => {
    let cancelled = false;
    setError(null);
    api.get<PublicMatchView[]>("/v1/matches/my")
      .then((res) => { if (!cancelled) setMatches(res.data); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? "Failed to load matches"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    return fetchMyMatches();
  }, [fetchMyMatches]);

  // Refetch silently whenever any match is updated in realtime
  useEffect(() => {
    if (matchLastUpdated === 0) return;
    fetchMyMatches();
  }, [matchLastUpdated, fetchMyMatches]);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "32px 20px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{
          fontSize: "24px", fontWeight: 800, color: TEXT, marginBottom: "6px",
        }}>
          My Matches
        </h1>
        <p style={{ fontSize: "14px", color: MUTED, marginBottom: "28px" }}>
          All matches involving your teams
        </p>

        {/* States */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)",
            borderRadius: "10px", padding: "16px", color: "#f87171", textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: "12px", padding: "40px", textAlign: "center", color: MUTED,
          }}>
            No matches found for your teams yet.
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {matches.map((m) => (
              <MatchCard key={m.matchId} match={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
