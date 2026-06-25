// ======================================================
// RankingsTab.tsx
// Leaderboard / Rankings tab for UserSportDetail
//
// INTEGRATION (4 changes in UserSportDetail.tsx):
//
//  1. ADD IMPORTS at top:
//     import useLeaderboard from "../../Matches/Hooks/useLeaderboard";
//     import RankingsTab from "./RankingsTab";        // adjust path
//
//  2. ADD HOOK in UserSportDetail() body, next to useMatches:
//     const {
//       leaderboard,
//       loading: lbLoading,
//       error:   lbError,
//       refetch: lbRefetch,
//     } = useLeaderboard(eventId ?? "", sportId ?? "");
//
//  3. DELETE the old one-liner:
//     function RankingsTab() { return <EmptyState ... />; }
//
//  4. UPDATE the JSX where RankingsTab is rendered:
//     {tab === "rankings" && (
//       <RankingsTab
//         leaderboard={leaderboard}
//         loading={lbLoading}
//         error={lbError}
//         onRefresh={lbRefetch}
//       />
//     )}
// ======================================================

import type {
  LeaderboardResponseDTO,
  LeaderboardEntryDTO,
  LeaderboardStatus,
} from "../../Leaderboard/api/leaderboard.api";

// ─── Design Tokens (mirrors UserSportDetail) ──────────
const CARD   = "rgba(0,0,0,0.25)";
const CARD2  = "rgba(0,0,0,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const TEXT   = "#ffffff";
const MUTED  = "#9ca3af";
const LABEL  = "#e5e7eb";
const SUCCESS= "#4ade80";
const DANGER = "#f87171";
const BRONZE = "#cd7f32";
const GOLD   = "#f59e0b";
const SILVER = "#94a3b8";

// ─── Helpers ──────────────────────────────────────────

function toLabel(raw?: string | null): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function diffColor(diff: number): string {
  if (diff > 0) return SUCCESS;
  if (diff < 0) return DANGER;
  return MUTED;
}

function diffLabel(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

function rankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

const STATUS_CONFIG: Record<LeaderboardStatus, { bg: string; border: string; color: string; label: string; icon: string }> = {
  CHAMPION:   { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: GOLD,    label: "Champion",   icon: "🏆" },
  ACTIVE:     { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)", color: SUCCESS, label: "Active",     icon: "⚡" },
  ELIMINATED: { bg: "rgba(156,163,175,0.08)",border: "rgba(156,163,175,0.2)", color: MUTED,   label: "Eliminated", icon: "✕"  },
};

// ─── Spinner (same as parent) ─────────────────────────
function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid rgba(255,255,255,0.12)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

// ─── Empty State ──────────────────────────────────────
function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center", gap: "14px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "18px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(250,71,21,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>{icon}</div>
      <div style={{ fontSize: "0.9rem", fontFamily: "'Orbitron', sans-serif", color: LABEL, letterSpacing: "0.06em", fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: "0.82rem", color: MUTED, maxWidth: "260px", lineHeight: 1.6 }}>{subtitle}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────
interface RankingsTabProps {
  leaderboard: LeaderboardResponseDTO | null;
  loading:     boolean;
  error:       string | null;
  onRefresh:   () => void;
}

// ─── Component ────────────────────────────────────────
export default function RankingsTab({
  leaderboard,
  loading,
  error,
  onRefresh,
}: RankingsTabProps) {

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: MUTED, gap: "12px", alignItems: "center" }}>
        <Spinner size={20} />
        Loading rankings…
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "48px 24px" }}>
        <EmptyState icon="⚠️" title="RANKINGS UNAVAILABLE" subtitle={error} />
        <button
          onClick={onRefresh}
          style={{
            background: "rgba(250,71,21,0.1)", border: `1px solid rgba(250,71,21,0.3)`,
            color: ACCENT, borderRadius: "8px", padding: "8px 18px",
            fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
          }}
        >
          ↻ Retry
        </button>
      </div>
    );
  }

  // ── Empty / no data ──
  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <EmptyState
        icon="🏆"
        title="NO RANKINGS YET"
        subtitle="Rankings will appear here once matches are played and results are submitted."
      />
    );
  }

  const { entries, isFinal, totalTeams, championRobotName, championTeamName, tournamentFormat, matchType } = leaderboard;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Champion banner ────────────────────────── */}
      {(championRobotName || championTeamName) && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "14px 20px", borderRadius: "12px",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.3)",
        }}>
          <span style={{ fontSize: "1.5rem" }}>🏆</span>
          <div>
            <div style={{ fontSize: "0.62rem", color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Champion
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: GOLD, fontFamily: "'Orbitron', sans-serif" }}>
              {championRobotName || championTeamName}
            </div>
            {championRobotName && championTeamName && (
              <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "1px" }}>{championTeamName}</div>
            )}
          </div>
          <span style={{ marginLeft: "auto", fontSize: "1.3rem" }}>🎉</span>
        </div>
      )}

      {/* ── Tournament info bar ────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
        padding: "10px 16px", borderRadius: "10px",
        background: CARD2, border: `1px solid ${BORDER}`,
      }}>
        {/* Final / Provisional badge */}
        <span style={{
          background: isFinal ? "rgba(74,222,128,0.1)" : "rgba(96,165,250,0.1)",
          border: `1px solid ${isFinal ? "rgba(74,222,128,0.3)" : "rgba(96,165,250,0.25)"}`,
          color: isFinal ? SUCCESS : "#60a5fa",
          borderRadius: "999px", fontSize: "0.65rem", padding: "3px 10px", fontWeight: 700,
        }}>
          {isFinal ? "✅ Final Standings" : "⏳ Live — Provisional"}
        </span>

        {tournamentFormat && (
          <span style={{
            background: "rgba(250,71,21,0.08)", border: "1px solid rgba(250,71,21,0.2)",
            color: ACCENT, borderRadius: "999px", fontSize: "0.65rem", padding: "3px 10px", fontWeight: 700,
          }}>
            {toLabel(tournamentFormat)}
          </span>
        )}

        {matchType && (
          <span style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
            color: MUTED, borderRadius: "999px", fontSize: "0.65rem", padding: "3px 10px", fontWeight: 600,
          }}>
            {toLabel(matchType)}
          </span>
        )}

        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: MUTED }}>
          {totalTeams} team{totalTeams !== 1 ? "s" : ""}
        </span>

        <button
          onClick={onRefresh}
          title="Refresh rankings"
          style={{
            background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
            color: MUTED, borderRadius: "6px", padding: "4px 8px",
            fontSize: "0.72rem", cursor: "pointer", lineHeight: 1,
          }}
        >
          ↻
        </button>
      </div>

      {/* ── Leaderboard table ──────────────────────── */}
      <div style={{
        background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "14px",
        overflow: "hidden",
      }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "52px 1fr 100px 72px 72px 72px 80px",
          gap: "4px",
          padding: "10px 18px",
          borderBottom: `1px solid ${BORDER}`,
          background: "rgba(250,71,21,0.03)",
        }}>
          {["Rank", "Robot / Team", "Status", "W", "L", "P", "+/−"].map(h => (
            <div key={h} style={{
              fontSize: "0.58rem", color: MUTED, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Entry rows */}
        {entries.map((entry, i) => (
          <EntryRow key={entry.registrationId} entry={entry} index={i} />
        ))}
      </div>

      {/* ── Stats detail cards (top 3) ─────────────── */}
      {entries.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}>
          {entries.slice(0, 3).map(entry => (
            <StatsCard key={entry.registrationId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Entry Row ────────────────────────────────────────
function EntryRow({ entry, index }: { entry: LeaderboardEntryDTO; index: number }) {

  const medal     = rankMedal(entry.rank);
  const sCfg      = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.ELIMINATED;
  const isChamp   = entry.status === "CHAMPION";
  const isElim    = entry.status === "ELIMINATED";
  const rowBg     = isChamp
    ? "rgba(245,158,11,0.04)"
    : index % 2 === 0
      ? "transparent"
      : "rgba(255,255,255,0.015)";
  const rowBorder = isChamp ? "rgba(245,158,11,0.15)" : "transparent";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "52px 1fr 100px 72px 72px 72px 80px",
      gap: "4px",
      padding: "11px 18px",
      borderBottom: `1px solid ${BORDER}`,
      borderLeft: `2px solid ${rowBorder}`,
      background: rowBg,
      alignItems: "center",
      opacity: isElim ? 0.7 : 1,
      transition: "background 0.15s",
    }}>
      {/* Rank */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {medal ? (
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{medal}</span>
        ) : (
          <span style={{
            fontSize: "0.95rem", fontWeight: 800, color: LABEL,
            fontFamily: "'Orbitron', sans-serif",
          }}>
            {entry.rank}
          </span>
        )}
        {entry.tied && (
          <span style={{
            fontSize: "0.52rem", color: MUTED, fontWeight: 600,
            background: "rgba(255,255,255,0.06)", borderRadius: "3px",
            padding: "1px 4px", lineHeight: 1.3,
          }}>
            T
          </span>
        )}
      </div>

      {/* Robot / Team name */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
        <span style={{
          fontWeight: isChamp ? 800 : 600,
          color: isChamp ? GOLD : TEXT,
          fontSize: "0.88rem",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {entry.robotName || entry.teamName || "—"}
        </span>
        {entry.robotName && entry.teamName && (
          <span style={{ fontSize: "0.62rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.teamName}
          </span>
        )}
        {entry.eliminatedInRound != null && (
          <span style={{ fontSize: "0.62rem", color: MUTED }}>
            Eliminated R{entry.eliminatedInRound}
          </span>
        )}
      </div>

      {/* Status pill */}
      <div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          background: sCfg.bg, border: `1px solid ${sCfg.border}`,
          color: sCfg.color, borderRadius: "999px",
          fontSize: "0.6rem", padding: "2px 8px", fontWeight: 700,
          whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: "0.55rem" }}>{sCfg.icon}</span>
          {sCfg.label}
        </span>
      </div>

      {/* Wins */}
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: entry.wins > 0 ? SUCCESS : MUTED, fontFamily: "'Orbitron', sans-serif" }}>
        {entry.wins}
      </span>

      {/* Losses */}
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: entry.losses > 0 ? DANGER : MUTED, fontFamily: "'Orbitron', sans-serif" }}>
        {entry.losses}
      </span>

      {/* Played */}
      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: LABEL, fontFamily: "'Orbitron', sans-serif" }}>
        {entry.played}
      </span>

      {/* Point differential */}
      <span style={{
        fontSize: "0.88rem", fontWeight: 700,
        color: diffColor(entry.pointDifferential),
        fontFamily: "'Orbitron', sans-serif",
      }}>
        {diffLabel(entry.pointDifferential)}
      </span>
    </div>
  );
}

// ─── Stats Card (top-3 detail) ────────────────────────
function StatsCard({ entry }: { entry: LeaderboardEntryDTO }) {
  const medal  = rankMedal(entry.rank);
  const accent = entry.rank === 1 ? GOLD : entry.rank === 2 ? SILVER : BRONZE;

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${accent}30`,
      borderRadius: "12px",
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(to right, ${accent}, ${accent}55)`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        {medal && <span style={{ fontSize: "1.3rem" }}>{medal}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, color: TEXT, fontSize: "0.9rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {entry.robotName || entry.teamName || "—"}
          </div>
          {entry.robotName && entry.teamName && (
            <div style={{ fontSize: "0.62rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.teamName}
            </div>
          )}
          <div style={{ fontSize: "0.62rem", color: accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {entry.status === "CHAMPION" ? "Champion" : `Rank #${entry.rank}`}
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[
          { label: "Record",     value: `${entry.wins}W – ${entry.losses}L`, color: TEXT },
          { label: "Pts For",    value: `${entry.pointsFor}`,                color: SUCCESS },
          { label: "Pts Against",value: `${entry.pointsAgainst}`,            color: DANGER },
          { label: "Diff",       value: diffLabel(entry.pointDifferential),  color: diffColor(entry.pointDifferential) },
          { label: "Played",     value: `${entry.played}`,                   color: LABEL },
          { label: "Byes",       value: `${entry.byes}`,                     color: MUTED },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: "0.54rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: s.color, fontFamily: "'Orbitron', sans-serif" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}