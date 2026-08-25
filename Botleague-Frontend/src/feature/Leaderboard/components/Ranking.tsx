// ======================================================
// RankingsTab.tsx
// Leaderboard display + bonus-point awards for AdminSportRankingPage
// (/admin/events/:eventId/sports/:sportId/ranking). Match score/result
// editing lives in the sibling RankingMatchesPanel, not here.
// ======================================================

import { useState } from "react";
import { Gift, X } from "lucide-react";
import {
  awardBonusPoints,
  type LeaderboardResponseDTO,
  type LeaderboardEntryDTO,
  type LeaderboardStatus,
} from "../../Leaderboard/api/leaderboard.api";
import { ORG } from "../../Organizer/theme/organizerTheme";

// ─── Design Tokens (matches ORG — the same light theme every
// other admin/organizer page uses; this tab used to be dark with
// an orange accent left over from an earlier design pass) ─────
const CARD   = "#ffffff";
const CARD2  = "#f8faff";
const BORDER = "rgba(75,134,232,0.18)";
const ACCENT = ORG.violet;
const TEXT   = ORG.text;
const MUTED  = ORG.muted;
const LABEL  = "#374151";
const SUCCESS= ORG.success;
const DANGER = ORG.danger;
const BRONZE = "#b3702f";
const GOLD   = "#92660a";
const SILVER = "#64748b";

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
  ACTIVE:     { bg: "rgba(31,169,82,0.08)",  border: "rgba(31,169,82,0.25)",  color: SUCCESS, label: "Active",     icon: "⚡" },
  ELIMINATED: { bg: "rgba(93,93,93,0.08)",   border: "rgba(93,93,93,0.2)",    color: MUTED,   label: "Eliminated", icon: "✕"  },
};

// ─── Spinner (same as parent) ─────────────────────────
function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid rgba(75,134,232,0.15)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

// ─── Empty State ──────────────────────────────────────
function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center", gap: "14px" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "18px", background: "rgba(140,108,255,0.06)", border: "1px solid rgba(140,108,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>{icon}</div>
      <div style={{ fontSize: "0.9rem", fontFamily: ORG.fontHeading, color: TEXT, letterSpacing: "0.06em", fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: "0.82rem", color: MUTED, maxWidth: "260px", lineHeight: 1.6 }}>{subtitle}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────
interface RankingsTabProps {
  sportId:     string;
  leaderboard: LeaderboardResponseDTO | null;
  loading:     boolean;
  error:       string | null;
  onRefresh:   () => void;
}

// ─── Component ────────────────────────────────────────
export default function RankingsTab({
  sportId,
  leaderboard,
  loading,
  error,
  onRefresh,
}: RankingsTabProps) {
  const [bonusTarget, setBonusTarget] = useState<LeaderboardEntryDTO | null>(null);
  const [bonusPointsInput, setBonusPointsInput] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);

  const openBonusModal = (entry: LeaderboardEntryDTO) => {
    setBonusTarget(entry);
    setBonusPointsInput("");
    setBonusReason("");
    setBonusError(null);
  };

  const closeBonusModal = () => setBonusTarget(null);

  const submitBonus = async () => {
    if (!bonusTarget) return;
    const points = Number(bonusPointsInput);
    if (!bonusPointsInput || Number.isNaN(points) || points === 0) {
      setBonusError("Enter a non-zero number of points");
      return;
    }
    setBonusSubmitting(true);
    setBonusError(null);
    try {
      await awardBonusPoints(sportId, {
        registrationId: bonusTarget.registrationId,
        points,
        reason: bonusReason || undefined,
      });
      closeBonusModal();
      onRefresh();
    } catch (err: any) {
      setBonusError(err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to award points");
    } finally {
      setBonusSubmitting(false);
    }
  };

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
            background: "rgba(140,108,255,0.08)", border: `1px solid rgba(140,108,255,0.3)`,
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
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.3)",
        }}>
          <span style={{ fontSize: "1.5rem" }}>🏆</span>
          <div>
            <div style={{ fontSize: "0.62rem", color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Champion
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: GOLD, fontFamily: ORG.fontHeading }}>
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
          background: isFinal ? "rgba(31,169,82,0.08)" : "rgba(75,134,232,0.08)",
          border: `1px solid ${isFinal ? "rgba(31,169,82,0.3)" : "rgba(75,134,232,0.25)"}`,
          color: isFinal ? SUCCESS : ORG.blueHeading,
          borderRadius: "999px", fontSize: "0.65rem", padding: "3px 10px", fontWeight: 700,
        }}>
          {isFinal ? "✅ Final Standings" : "⏳ Live — Provisional"}
        </span>

        {tournamentFormat && (
          <span style={{
            background: "rgba(140,108,255,0.08)", border: "1px solid rgba(140,108,255,0.2)",
            color: ACCENT, borderRadius: "999px", fontSize: "0.65rem", padding: "3px 10px", fontWeight: 700,
          }}>
            {toLabel(tournamentFormat)}
          </span>
        )}

        {matchType && (
          <span style={{
            background: "rgba(75,134,232,0.05)", border: `1px solid ${BORDER}`,
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
            background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`,
            color: MUTED, borderRadius: "6px", padding: "4px 8px",
            fontSize: "0.72rem", cursor: "pointer", lineHeight: 1,
          }}
        >
          ↻
        </button>
      </div>

      {/* ── Leaderboard table ──────────────────────── */}
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px",
        overflow: "hidden",
      }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "52px 1fr 100px 72px 72px 72px 80px 34px",
          gap: "4px",
          padding: "10px 18px",
          borderBottom: `1px solid ${BORDER}`,
          background: CARD2,
        }}>
          {["Rank", "Robot / Team", "Status", "W", "L", "P", "+/−", ""].map((h, i) => (
            <div key={i} style={{
              fontSize: "0.58rem", color: MUTED, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Entry rows */}
        {entries.map((entry, i) => (
          <EntryRow key={entry.registrationId} entry={entry} index={i} onAwardBonus={() => openBonusModal(entry)} />
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

      {/* ── Award Bonus modal ──────────────────────── */}
      {bonusTarget && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(8,8,8,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeBonusModal(); }}
        >
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: "16px", width: "100%", maxWidth: "380px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: TEXT, fontFamily: ORG.fontHeading }}>Award Bonus Points</div>
              <button type="button" onClick={closeBonusModal} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: "0.8rem", color: MUTED, marginBottom: "16px" }}>
              {bonusTarget.robotName || bonusTarget.teamName || "—"}
            </div>

            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Points (negative to dock)
            </label>
            <input
              type="number"
              value={bonusPointsInput}
              onChange={e => setBonusPointsInput(e.target.value)}
              placeholder="e.g. 10 or -5"
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700, color: TEXT, marginBottom: "14px" }}
            />

            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Reason (optional)
            </label>
            <input
              type="text"
              value={bonusReason}
              onChange={e => setBonusReason(e.target.value)}
              placeholder="e.g. Sportsmanship award"
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: `1.5px solid ${BORDER}`, borderRadius: "8px", fontSize: "0.85rem", color: TEXT, marginBottom: "8px" }}
            />

            {bonusError && (
              <div style={{ color: DANGER, fontSize: "0.75rem", fontWeight: 600, marginBottom: "8px" }}>{bonusError}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={closeBonusModal} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={submitBonus} disabled={bonusSubmitting} style={{ background: ORG.gradientCta, border: "none", color: "#fff", borderRadius: "8px", padding: "8px 18px", fontSize: "0.8rem", fontWeight: 700, cursor: bonusSubmitting ? "not-allowed" : "pointer", opacity: bonusSubmitting ? 0.7 : 1 }}>
                {bonusSubmitting ? "Saving…" : "Award"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Entry Row ────────────────────────────────────────
function EntryRow({ entry, index, onAwardBonus }: { entry: LeaderboardEntryDTO; index: number; onAwardBonus: () => void }) {

  const medal     = rankMedal(entry.rank);
  const sCfg      = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.ELIMINATED;
  const isChamp   = entry.status === "CHAMPION";
  const isElim    = entry.status === "ELIMINATED";
  const rowBg     = isChamp
    ? "rgba(245,158,11,0.04)"
    : index % 2 === 0
      ? "transparent"
      : "rgba(75,134,232,0.025)";
  const rowBorder = isChamp ? "rgba(245,158,11,0.3)" : "transparent";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "52px 1fr 100px 72px 72px 72px 80px 34px",
      gap: "4px",
      padding: "11px 18px",
      borderBottom: `1px solid ${BORDER}`,
      borderLeft: `2px solid ${rowBorder}`,
      background: rowBg,
      alignItems: "center",
      opacity: isElim ? 0.75 : 1,
      transition: "background 0.15s",
    }}>
      {/* Rank */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {medal ? (
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{medal}</span>
        ) : (
          <span style={{
            fontSize: "0.95rem", fontWeight: 800, color: LABEL,
            fontFamily: ORG.fontHeading,
          }}>
            {entry.rank}
          </span>
        )}
        {entry.tied && (
          <span style={{
            fontSize: "0.52rem", color: MUTED, fontWeight: 600,
            background: "rgba(75,134,232,0.08)", borderRadius: "3px",
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
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: entry.wins > 0 ? SUCCESS : MUTED, fontFamily: ORG.fontHeading }}>
        {entry.wins}
      </span>

      {/* Losses */}
      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: entry.losses > 0 ? DANGER : MUTED, fontFamily: ORG.fontHeading }}>
        {entry.losses}
      </span>

      {/* Played */}
      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: LABEL, fontFamily: ORG.fontHeading }}>
        {entry.played}
      </span>

      {/* Point differential (bonus, if any, shown as a small tag underneath —
          it's already folded into this number, this is just transparency) */}
      <div>
        <span style={{
          fontSize: "0.88rem", fontWeight: 700,
          color: diffColor(entry.pointDifferential),
          fontFamily: ORG.fontHeading,
        }}>
          {diffLabel(entry.pointDifferential)}
        </span>
        {entry.bonusPoints !== 0 && (
          <div style={{ fontSize: "0.56rem", fontWeight: 700, color: entry.bonusPoints > 0 ? SUCCESS : DANGER }}>
            {entry.bonusPoints > 0 ? `+${entry.bonusPoints}` : entry.bonusPoints} bonus
          </div>
        )}
      </div>

      {/* Award bonus points */}
      <button
        type="button"
        onClick={onAwardBonus}
        title="Award bonus points"
        style={{
          background: "rgba(140,108,255,0.08)", border: `1px solid rgba(140,108,255,0.25)`,
          color: ORG.violetHeading, borderRadius: "6px", width: "28px", height: "28px",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <Gift size={13} />
      </button>
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
      boxShadow: "0 1px 3px rgba(17,17,17,0.04)",
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
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: s.color, fontFamily: ORG.fontHeading }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
