// ======================================================
// UserSportDetail.tsx
// Route: /events/:eventId/sports/:sportId
// ======================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "../hook/useEvent";
import useRobots from "../../Robots/hooks/useRobots";
import type { Robot } from "../../Robots/types/types";
import {
  getLineup,
  addLineupMember,
  removeLineupMember,
  registerTeamToEvent,
} from "../api/event.api";
import type {
  EventResponse,
  EventSportResponse,
  EventRegistrationResponse,
  TeamLineUpResponse,
  LineupRole,
} from "../api/event.api";
import useMatches from "../../Matches/Hooks/useMatches";
import type { PublicMatchView } from "../../Matches/api/matches.api";
import { useSportMatchRealtime } from "../../../shared/realtime/useMatchRealtime";
import useLeaderboard from "../../Leaderboard/hook/useLeaderboard";
import RankingsTab from "../../Leaderboard/components/Ranking";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import type { EligibilityResponse } from "../../Eligibility/api/eligibility.api";

// Age groups that mean "open to all" — no category restriction
const OPEN_AGE_GROUPS = new Set(["OPEN", "ALL", "ALL_AGES", "UNRESTRICTED", ""]);

// ─── Design Tokens ────────────────────────────────────
const BG     = "#3a3a3a";
const CARD   = "rgba(0,0,0,0.25)";
const CARD2  = "rgba(0,0,0,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const ACCENT2= "#f97316";
const TEXT   = "#ffffff";
const MUTED  = "#9ca3af";
const LABEL  = "#e5e7eb";
const SUCCESS= "#4ade80";
const WARNING= "#fbbf24";
const DANGER = "#f87171";
const INFO   = "#60a5fa";
const BRONZE = "#cd7f32";

// ─── Bracket Layout Constants ─────────────────────────
const BOX_W  = 200;
const BOX_H  = 72;
const H_GAP  = 80;
const V_GAP  = 20;

// ─── Tab definition ───────────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview",  icon: "📋" },
  { id: "matches",   label: "Matches",   icon: "⚔️"  },
  { id: "rankings",  label: "Leaderboard",  icon: "🏆" },
  { id: "schedule",  label: "Schedule",  icon: "📅" },
  { id: "news",      label: "News",      icon: "📰" },
] as const;

type TabId = typeof TABS[number]["id"] | "registration" | "lineup";

// ─── Helpers ──────────────────────────────────────────
function toLabel(raw?: string | null): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function fmtDate(val?: string | null): string {
  if (!val) return "—";
  // Date-only ISO strings ("2025-08-01") are parsed as UTC midnight by Date().
  // Appending T00:00:00 forces local-time parse so the date matches what the
  // admin intended regardless of the user's timezone (no off-by-one day).
  const d = new Date(val.includes("T") ? val : val + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function fmtCurrency(val?: number | null): string {
  if (val == null) return "—";
  return `₹${val.toLocaleString("en-IN")}`;
}
function isFinalMatch(m: PublicMatchView, totalRounds: number): boolean {
  return (m.roundNumber ?? 0) === totalRounds && (m.matchNumber ?? 1) === 1;
}
function isThirdPlaceMatch(m: PublicMatchView, totalRounds: number): boolean {
  return (m.roundNumber ?? 0) === totalRounds && (m.matchNumber ?? 1) === 2;
}
function getBracketLayout(matches: PublicMatchView[]) {
  if (!matches.length) return { rounds: [] as PublicMatchView[][], positions: {} as Record<string, { x: number; y: number }>, svgW: 0, svgH: 0, totalRounds: 0 };
  const roundMap: Record<number, PublicMatchView[]> = {};
  matches.forEach(m => { const r = m.roundNumber ?? 0; if (!roundMap[r]) roundMap[r] = []; roundMap[r].push(m); });
  const roundNums = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
  const totalRounds = roundNums.length > 0 ? Math.max(...roundNums) : 0;
  const rounds = roundNums.map(r => [...roundMap[r]].filter(m => !isThirdPlaceMatch(m, totalRounds)).sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)));
  const maxMatchesR1 = rounds[0]?.length || 1;
  const positions: Record<string, { x: number; y: number }> = {};
  rounds.forEach((round, ri) => {
    const x = ri * (BOX_W + H_GAP);
    const spacingFactor = Math.pow(2, ri);
    const slotH = BOX_H + V_GAP;
    const firstOffset = (spacingFactor - 1) * slotH / 2;
    round.forEach((match, mi) => { positions[match.matchId] = { x, y: firstOffset + mi * spacingFactor * slotH }; });
  });
  const thirdPlaceMatch = matches.find(m => isThirdPlaceMatch(m, totalRounds));
  if (thirdPlaceMatch) {
    const finalRoundIdx = rounds.length - 1;
    const x = finalRoundIdx * (BOX_W + H_GAP);
    const lowestFinalY = (rounds[finalRoundIdx] ?? []).reduce((acc, m) => { const pos = positions[m.matchId]; return pos ? Math.max(acc, pos.y + BOX_H) : acc; }, 0);
    positions[thirdPlaceMatch.matchId] = { x, y: lowestFinalY + 48 };
  }
  const svgW = rounds.length * (BOX_W + H_GAP) - H_GAP + 40;
  const maxY = Object.values(positions).reduce((acc, p) => Math.max(acc, p.y + BOX_H), 0);
  const svgH = Math.max(maxMatchesR1 * (BOX_H + V_GAP), maxY) + 20;
  return { rounds, positions, svgW, svgH, totalRounds };
}
function bracketStatusColor(status?: string | null) {
  if (status === "COMPLETED") return SUCCESS;
  if (status === "LIVE" || status === "ONGOING") return ACCENT;
  if (status === "CANCELLED") return MUTED;
  return INFO;
}
function roundLabel(ri: number, total: number) {
  if (ri === total - 1) return "Final";
  if (ri === total - 2 && total > 2) return "Semifinal";
  return `Round ${ri + 1}`;
}

// ─── Spinner ──────────────────────────────────────────
function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return <span style={{ display: "inline-block", width: size, height: size, border: `2px solid rgba(255,255,255,0.12)`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;
}

// ─── Status Pill ──────────────────────────────────────
function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    PUBLISHED:           { bg: "rgba(250,71,21,0.11)",  border: "rgba(250,71,21,0.28)",   color: ACCENT,  icon: "📣" },
    LIVE:                { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🟢" },
    COMPLETED:           { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", color: MUTED,   icon: "✅" },
    ONGOING:             { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🔄" },
    REGISTRATION_OPEN:   { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🔓" },
    REGISTRATION_CLOSED: { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING, icon: "🔒" },
    CANCELLED:           { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", color: DANGER,  icon: "🚫" },
  };
  const key = status?.toUpperCase() || "PUBLISHED";
  const s   = MAP[key] || MAP["PUBLISHED"];
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.icon} {key.replace(/_/g, " ")}
    </span>
  );
}

// ─── Stat Box ─────────────────────────────────────────
function StatBox({ icon, label, value, color = TEXT }: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "120px" }}>
      <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 700, color, fontFamily: "'Orbitron', sans-serif" }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Meta Cell ────────────────────────────────────────
function MetaCell({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${BORDER}`, borderRadius: "9px", padding: "10px 14px" }}>
      <div style={{ fontSize: "0.6rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: TEXT }}>{value}</div>
    </div>
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

// ─── Extra Rule value formatter ───────────────────────
function fmtRuleKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, s => s.toUpperCase())
    .trim();
}
function fmtRuleVal(val: string): string {
  if (val.toLowerCase() === "true")  return "Yes";
  if (val.toLowerCase() === "false") return "No";
  return val;
}

// ─── Overview Tab ─────────────────────────────────────
function OverviewTab({ sport }: { sport: EventSportResponse }) {
  const hasPhysical = sport.weightLimitKg != null || sport.maxLengthCm != null || sport.maxWidthCm != null || sport.maxHeightCm != null;
  const hasDimensions = sport.maxLengthCm != null && sport.maxWidthCm != null && sport.maxHeightCm != null;
  const hasExtraRules = sport.extraRules && Object.keys(sport.extraRules).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Description */}
      {sport.sportsDescription && (
        <div style={{ background: "rgba(250,71,21,0.04)", border: "1px solid rgba(250,71,21,0.14)", borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.68rem", color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>About This Sport</div>
          <p style={{ margin: 0, color: MUTED, fontSize: "0.88rem", lineHeight: 1.7 }}>{sport.sportsDescription}</p>
        </div>
      )}

      {/* Core details */}
      <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: ACCENT }}>
          Sport Details
        </div>
        <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          <MetaCell label="Age Group"        value={toLabel(sport.ageGroup)} />
          <MetaCell label="Competition Type" value={toLabel(sport.competitionType)} />
          <MetaCell label="Format"           value={toLabel(sport.formatType)} />
          <MetaCell label="Control Type"     value={toLabel(sport.controlType)} />
          <MetaCell label="Weight Class"     value={toLabel(sport.weightClass)} />
          <MetaCell label="Team Size"        value={sport.minTeamSize != null && sport.maxTeamSize != null ? `${sport.minTeamSize} – ${sport.maxTeamSize} players` : null} />
          <MetaCell label="Max Bots / Team"  value={sport.maxBotsPerTeam} />
          <MetaCell label="Max Teams"        value={sport.maxTeams} />
          <MetaCell label="Entry Fee"        value={sport.entryFee > 0 ? fmtCurrency(sport.entryFee) : "Free"} />
          <MetaCell label="Prize Pool"       value={sport.prizeMoney > 0 ? fmtCurrency(sport.prizeMoney) : null} />
          <MetaCell label="Registered"       value={`${sport.registeredTeamsCount} robots`} />
        </div>
      </div>

      {/* Physical constraints */}
      {hasPhysical && (
        <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: ACCENT }}>
            Robot Specifications
          </div>
          <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
            {sport.weightLimitKg != null && (
              <MetaCell label="Max Weight" value={`${sport.weightLimitKg} kg`} />
            )}
            {hasDimensions && (
              <MetaCell
                label="Max Dimensions (L×W×H)"
                value={`${sport.maxLengthCm} × ${sport.maxWidthCm} × ${sport.maxHeightCm} cm`}
              />
            )}
          </div>
        </div>
      )}

      {/* Registration window */}
      {sport.registrationStartDate && sport.registrationEndDate && (
        <div style={{ background: "rgba(250,71,21,0.04)", border: "1px solid rgba(250,71,21,0.14)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>📅</span>
          <div>
            <div style={{ fontSize: "0.62rem", color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Registration Window</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: TEXT }}>
              {fmtDate(sport.registrationStartDate)}
              <span style={{ color: MUTED, margin: "0 10px" }}>→</span>
              {fmtDate(sport.registrationEndDate)}
            </div>
          </div>
        </div>
      )}

      {/* Special / extra rules */}
      {hasExtraRules && (
        <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: ACCENT }}>
            Special Rules
          </div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(sport.extraRules!).map(([key, val]) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "0.82rem", color: MUTED, fontWeight: 600 }}>{fmtRuleKey(key)}</span>
                <span style={{
                  fontSize: "0.82rem", fontWeight: 700,
                  color: fmtRuleVal(val) === "Yes" ? SUCCESS : fmtRuleVal(val) === "No" ? DANGER : LABEL,
                  background: fmtRuleVal(val) === "Yes"
                    ? "rgba(74,222,128,0.1)"
                    : fmtRuleVal(val) === "No"
                      ? "rgba(248,113,113,0.08)"
                      : "rgba(255,255,255,0.06)",
                  border: `1px solid ${fmtRuleVal(val) === "Yes" ? "rgba(74,222,128,0.25)" : fmtRuleVal(val) === "No" ? "rgba(248,113,113,0.2)" : BORDER}`,
                  borderRadius: "6px", padding: "2px 10px",
                }}>
                  {fmtRuleVal(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Backend may return `id` or `registrationId` — resolve once here
function regId(r: EventRegistrationResponse): string {
  return r.registrationId ?? r.id ?? "";
}

// ─── Robot Card (inside Registration Tab) ─────────────
function RobotRegistrationCard({
  reg,
  isCaptain,
  busyReg,
  onManageLineup,
  onCancel,
}: {
  reg: EventRegistrationResponse;
  isCaptain: boolean;
  busyReg: boolean;
  onManageLineup: (registrationId: string) => void;
  onCancel: (registrationId: string) => void;
}) {
  return (
    <div style={{
      background: "rgba(74,222,128,0.04)",
      border: "1px solid rgba(74,222,128,0.18)",
      borderRadius: "12px",
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    }}>
      {/* Left: robot info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "10px",
          background: "rgba(250,71,21,0.12)", border: "1px solid rgba(250,71,21,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0,
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, color: TEXT, fontSize: "0.9rem" }}>{reg.robotName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
            {reg.botType && (
              <span style={{ fontSize: "0.65rem", color: MUTED, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "1px 7px" }}>{reg.botType}</span>
            )}
            {reg.lineupSize != null && (
              <span style={{ fontSize: "0.65rem", color: MUTED }}>
                Operators: {reg.lineupSize}
              </span>
            )}
            {reg.lineupLocked && (
              <span style={{ fontSize: "0.65rem", color: WARNING, fontWeight: 700 }}>🔒 Locked</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => onManageLineup(regId(reg))}
          style={{
            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
            color: SUCCESS, borderRadius: "8px", padding: "7px 14px",
            fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
          }}
        >
          {isCaptain ? "Manage Lineup →" : "View Lineup →"}
        </button>
        {isCaptain && !reg.lineupLocked && (
          <button
            onClick={() => onCancel(regId(reg))}
            disabled={busyReg}
            style={{
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)",
              color: DANGER, borderRadius: "8px", padding: "7px 14px",
              fontSize: "0.78rem", fontWeight: 700, cursor: busyReg ? "not-allowed" : "pointer", opacity: busyReg ? 0.6 : 1,
            }}
          >
            {busyReg ? "…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Registration Tab ─────────────────────────────────
interface RegistrationTabProps {
  sport:           EventSportResponse;
  teamId:          string;
  teamCode:        string;
  isCaptain:       boolean;
  existingRegs:    EventRegistrationResponse[];
  busyReg:         boolean;
  regError:        string | null;
  eligibility:     EligibilityResponse | null;
  teamMembers:     { userName: string; userId: string; teamMemberId: string; membershipId: string; teamRole: string }[];
  onRegister:      (botId: string, robotName: string, lineup: { membershipId: string; role: string }[]) => Promise<void>;
  onCancel:        (regId: string) => void;
  onManageLineup:  (registrationId: string) => void;
  onDismissError:  () => void;
}

function RegistrationTab({
  sport, teamId, teamCode, isCaptain, existingRegs,
  busyReg, regError, eligibility,
  teamMembers,
  onRegister, onCancel, onManageLineup, onDismissError,
}: RegistrationTabProps) {

  const { robots, loading: robotsLoading } = useRobots(teamCode);

  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [showRegForm,   setShowRegForm]   = useState(false);
  const [step,          setStep]          = useState<1 | 2>(1);
  const [pendingLineup, setPendingLineup] = useState<{ membershipId: string; role: string }[]>([]);
  const [regMember,     setRegMember]     = useState("");
  const [regRole,       setRegRole]       = useState("DRIVER");

  // Robots already registered — check both field names the backend may return
  const registeredBotIds = new Set(
    existingRegs.map(r => r.robotId ?? r.botId).filter(Boolean) as string[]
  );

  // ── Sport compatibility map (mirrors backend ROBOT_SPORT_TO_EVENT_SPORTS) ──
  const ROBOT_TO_EVENT_SPORT: Record<string, string[]> = {
    ROBOWAR_1_5KG:       ["ROBO_WAR", "ROBO_WAR_OPEN"],
    ROBOWAR_8KG:         ["ROBO_WAR", "ROBO_WAR_OPEN"],
    ROBOWAR_15KG:        ["ROBO_WAR", "ROBO_WAR_OPEN"],
    ROBOWAR_30KG:        ["ROBO_WAR", "ROBO_WAR_OPEN"],
    ROBOWAR_60KG:        ["ROBO_WAR", "ROBO_WAR_OPEN"],
    ROBO_SOCCER:         ["ROBO_SOCCER", "ROBO_SOCCER_OPEN"],
    PLUG_N_PLAY_SOCCER:  ["PLUG_N_PLAY_RACE_SOCCER"],
    ROBO_SUMO:           ["ROBO_SUMO"],
    LINE_FOLLOWER:       ["LINE_FOLLOWER"],
    LINE_FOLLOWER_AUTO:  ["LINE_FOLLOWER", "LINE_FOLLOWER_AUTO"],
    MANUAL_TASK:         ["MANUAL_TASK"],
    THEME_BASED_TASKING: ["THEME_BASED_TASKING", "THEME_BASED_TASKING_OPEN"],
    DRONE_RACING:        ["DRONE_RACING_FPV", "DRONE_RACING_SOCCER"],
    DRONE_SOCCER:        ["DRONE_RACING_SOCCER"],
    RC_RACING:           ["RC_ROBO_RACING", "RC_RACING_NITRO"],
    AEROMODELLING:       ["AEROMODELLING"],
    PROJECT_BASED:       ["PROJECT_BASED"],
  };

  const normWc = (wc?: string | null) => (wc ?? "").toUpperCase().replace(/\./g, "_");

  // Filter by sport requirements, then exclude already-registered
  const eligibleRobots = robots.filter(robot => {
    // 1. Physical limits
    if (sport.weightLimitKg != null && robot.weightKg != null && robot.weightKg > sport.weightLimitKg) return false;
    if (sport.maxLengthCm   != null && robot.lengthCm  != null && robot.lengthCm  > sport.maxLengthCm) return false;
    if (sport.maxWidthCm    != null && robot.widthCm   != null && robot.widthCm   > sport.maxWidthCm)  return false;
    if (sport.maxHeightCm   != null && robot.heightCm  != null && robot.heightCm  > sport.maxHeightCm) return false;
    // 2. Age group
    if (sport.ageGroup && robot.eligibleCategories?.length && !robot.eligibleCategories.includes(sport.ageGroup as any)) return false;
    // 3. Sport type must match — robot's sport key must be compatible with this event sport
    if (robot.sport && sport.sport) {
      const robotSportKey = (robot.sport as string).toUpperCase();
      const allowed = ROBOT_TO_EVENT_SPORT[robotSportKey];
      if (allowed && !allowed.includes(sport.sport.toUpperCase())) return false;
    }
    // 4. Weight class must match (normalised: "1.5KG" == "1_5KG")
    if (robot.weightClass && sport.weightClass) {
      if (normWc(robot.weightClass) !== normWc(sport.weightClass)) return false;
    }
    // 5. Control mode (WIRED/WIRELESS) must match — ANY/null means no restriction.
    //    Mirrors backend SportRegistration.validateAgainst() so a robot that would be
    //    rejected at submit time never appears selectable here.
    const sportControl = (sport.controlType ?? "").toUpperCase();
    if (sportControl && sportControl !== "ANY" && robot.controlMode) {
      if (robot.controlMode.toUpperCase() !== sportControl) return false;
    }
    return true;
  });
  const ineligibleCount = robots.length - eligibleRobots.length;
  const availableRobots  = eligibleRobots.filter(r => !registeredBotIds.has(r.id));

  const isRegOpen = sport.status?.toUpperCase() === "REGISTRATION_OPEN";
  const spotsLeft = (sport.maxTeams ?? 0) - (sport.registeredTeamsCount ?? 0);
  const isFull    = sport.maxTeams != null && spotsLeft <= 0;

  // ── Eligibility checks ──────────────────────────────
  // 1. Backend-level block (underage, missing guardian, etc.)
  const eligBlocked = eligibility != null && !eligibility.canRegister;
  // 2. Age category mismatch: sport has a specific age group and user belongs to a different one
  const sportAgeGroup = (sport.ageGroup ?? "").toUpperCase();
  const categoryMismatch =
    !OPEN_AGE_GROUPS.has(sportAgeGroup) &&
    eligibility?.category != null &&
    eligibility.category.toUpperCase() !== sportAgeGroup;

  const canAdd = isCaptain && isRegOpen && !isFull && !!teamId && !eligBlocked && !categoryMismatch;

  // Lineup helpers (step 2)
  const takenRoles    = new Set(pendingLineup.map(l => l.role));
  const assignedMemberIds = new Set(pendingLineup.map(l => l.membershipId));
  const REG_ROLES = [
    { value: "DRIVER",           label: "Driver" },
    { value: "SECONDARY_DRIVER", label: "Secondary Driver" },
    { value: "BUILD_HEAD",       label: "Build Head" },
  ];
  const addToPending = () => {
    if (!regMember || takenRoles.has(regRole) || assignedMemberIds.has(regMember)) return;
    setPendingLineup(prev => [...prev, { membershipId: regMember, role: regRole }]);
    setRegMember("");
    const nextRole = REG_ROLES.find(r => !takenRoles.has(r.value) && r.value !== regRole);
    if (nextRole) setRegRole(nextRole.value);
  };
  const removeFromPending = (membershipId: string) => {
    setPendingLineup(prev => prev.filter(l => l.membershipId !== membershipId));
  };
  const resetForm = () => {
    setSelectedRobot(null); setShowRegForm(false); setStep(1);
    setPendingLineup([]); setRegMember(""); setRegRole("DRIVER");
  };

  const handleConfirmRegistration = async () => {
    if (!selectedRobot) return;
    await onRegister(selectedRobot.id, selectedRobot.robotName, pendingLineup);
    resetForm();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Permissions banner */}
      {!isCaptain && teamId && (
        <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.22)", borderRadius: "10px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", fontWeight: 600, color: INFO }}>
          <span>👁</span>
          <span>You're a <strong>Team Member</strong>. Only the Captain can register or manage operators.</span>
        </div>
      )}
      {!teamId && (
        <div style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "10px 16px", color: WARNING, fontSize: "0.82rem", fontWeight: 600 }}>
          ⚠️ Join or create a team to register for this event.
        </div>
      )}

      {/* Eligibility block — backend says user can't register (underage / no guardian) */}
      {eligBlocked && eligibility && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ color: DANGER, fontWeight: 700, fontSize: "0.85rem" }}>🚫 Registration Blocked</div>
          <div style={{ color: DANGER, fontSize: "0.8rem" }}>
            {eligibility.blockReason ?? "Your account is not eligible to register for events."}
          </div>
          {eligibility.requiresGuardian && !eligibility.hasGuardian && (
            <div style={{ color: WARNING, fontSize: "0.78rem", marginTop: "4px" }}>
              👤 A parent/guardian consent form is required. Complete it in <strong>Profile → Settings</strong>.
            </div>
          )}
        </div>
      )}

      {/* Age category mismatch — user's category ≠ sport's target age group */}
      {!eligBlocked && categoryMismatch && eligibility && (
        <div style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "10px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ color: WARNING, fontWeight: 700, fontSize: "0.85rem" }}>⚠️ Age Category Mismatch</div>
          <div style={{ color: WARNING, fontSize: "0.8rem" }}>
            This sport is open to <strong>{toLabel(sport.ageGroup)}</strong> participants only.
            Your current category is <strong>{eligibility.categoryLabel ?? toLabel(eligibility.category)}</strong>
            {eligibility.ageRange ? ` (age ${eligibility.ageRange})` : ""}.
          </div>
        </div>
      )}

      {/* Status info */}
      {!isRegOpen && (
        <div style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", padding: "10px 16px", color: DANGER, fontSize: "0.82rem", fontWeight: 600 }}>
          🔒 Registration is currently closed for this sport.
        </div>
      )}
      {isRegOpen && isFull && (
        <div style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", padding: "10px 16px", color: DANGER, fontSize: "0.82rem", fontWeight: 600 }}>
          🚫 No spots available. This sport is full.
        </div>
      )}
      {regError && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "10px", padding: "10px 16px", color: DANGER, fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
          <span>⚠️ {regError}</span>
          <button onClick={onDismissError} style={{ background: "none", border: "none", color: DANGER, cursor: "pointer", fontSize: "1rem", lineHeight: 1, flexShrink: 0, padding: "0 2px" }}>✕</button>
        </div>
      )}

      {/* Registered robots list */}
      {existingRegs.length > 0 && (
        <div>
          <div style={{ fontSize: "0.68rem", color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
            Your Registered Robots ({existingRegs.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {existingRegs.map(reg => (
              <RobotRegistrationCard
                key={regId(reg)}
                reg={reg}
                isCaptain={isCaptain}
                busyReg={busyReg}
                onManageLineup={onManageLineup}
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Register another robot */}
      {canAdd && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>

          {/* Header / toggle */}
          <button
            onClick={() => setShowRegForm(v => !v)}
            style={{
              width: "100%", background: "none", border: "none",
              padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", color: TEXT,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1rem" }}>⚡</span>
              <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                {existingRegs.length === 0 ? "Register a Robot" : "Register Another Robot"}
              </span>
              {isRegOpen && !isFull && (
                <span style={{ fontSize: "0.72rem", color: MUTED }}>
                  {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.8rem", color: MUTED, transform: showRegForm ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
          </button>

          {showRegForm && (
            <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Step indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                {[{ n: 1, label: "Select Robot" }, { n: 2, label: "Assign Lineup" }].map(({ n, label }, i) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 1 ? "none" : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: step >= n ? ACCENT : "rgba(255,255,255,0.08)", border: `2px solid ${step >= n ? ACCENT : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, color: step >= n ? "#fff" : MUTED, flexShrink: 0 }}>{n}</div>
                      <span style={{ fontSize: "0.7rem", fontWeight: step === n ? 700 : 500, color: step === n ? TEXT : MUTED, whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                    {i < 1 && <div style={{ flex: 1, height: "1px", background: step >= 2 ? ACCENT : BORDER, margin: "0 8px" }} />}
                  </div>
                ))}
              </div>

              {/* ── STEP 1: Robot picker ── */}
              {step === 1 && (
                <>
                  <div>
                    <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Select Robot <span style={{ color: DANGER }}>*</span></span>
                      {ineligibleCount > 0 && (
                        <span style={{ fontSize: "0.62rem", color: WARNING, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
                          ({ineligibleCount} robot{ineligibleCount !== 1 ? "s" : ""} don't meet sport requirements)
                        </span>
                      )}
                    </div>

                    {robotsLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: MUTED, fontSize: "0.82rem", padding: "10px 0" }}>
                        <Spinner size={14} /> Loading your robots…
                      </div>
                    ) : availableRobots.length === 0 ? (
                      <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: "8px", padding: "10px 14px", color: WARNING, fontSize: "0.82rem" }}>
                        {robots.length === 0
                          ? "⚠️ Your team has no robots yet. Add a robot from your team dashboard first."
                          : eligibleRobots.length === 0
                            ? `⚠️ None of your robots are eligible for this competition. Robots must be built for "${sport.sport?.replace(/_/g, " ")}" with matching weight class.`
                            : "✅ All eligible robots are already registered in this sport."}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {availableRobots.map(robot => {
                          const isSelected = selectedRobot?.id === robot.id;
                          return (
                            <div
                              key={robot.id}
                              onClick={() => setSelectedRobot(isSelected ? null : robot)}
                              style={{ background: isSelected ? "rgba(250,71,21,0.1)" : "rgba(0,0,0,0.2)", border: `1px solid ${isSelected ? "rgba(250,71,21,0.4)" : BORDER}`, borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", transition: "all 0.15s" }}
                            >
                              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: isSelected ? "rgba(250,71,21,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${isSelected ? "rgba(250,71,21,0.35)" : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>🤖</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: isSelected ? ACCENT : TEXT, fontSize: "0.88rem" }}>{robot.robotName}</div>
                                {robot.robotType && <div style={{ fontSize: "0.67rem", color: MUTED, marginTop: "2px" }}>{robot.robotType}</div>}
                              </div>
                              <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${isSelected ? ACCENT : BORDER}`, background: isSelected ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.6rem", color: "#fff", transition: "all 0.15s" }}>
                                {isSelected && "✓"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {availableRobots.length > 0 && (
                    <button
                      onClick={() => { if (selectedRobot) { setStep(2); setPendingLineup([]); setRegMember(""); setRegRole("DRIVER"); } }}
                      disabled={!selectedRobot}
                      style={{ background: selectedRobot ? `linear-gradient(135deg, #ff4d4d, ${ACCENT})` : "rgba(255,255,255,0.06)", border: "none", color: selectedRobot ? "#fff" : MUTED, borderRadius: "8px", padding: "11px 24px", fontSize: "0.88rem", fontWeight: 700, cursor: selectedRobot ? "pointer" : "not-allowed", boxShadow: selectedRobot ? "0 4px 14px rgba(255,77,77,0.3)" : "none", display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", transition: "all 0.18s" }}
                    >
                      {selectedRobot ? <>Next: Assign Lineup →</> : "Select a robot above"}
                    </button>
                  )}
                </>
              )}

              {/* ── STEP 2: Lineup assignment ── */}
              {step === 2 && selectedRobot && (
                <>
                  {/* Selected robot summary */}
                  <div style={{ background: "rgba(250,71,21,0.07)", border: "1px solid rgba(250,71,21,0.2)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.1rem" }}>🤖</span>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: MUTED, fontWeight: 600 }}>Registering robot</div>
                      <div style={{ fontWeight: 700, color: ACCENT, fontSize: "0.9rem" }}>{selectedRobot.robotName}</div>
                    </div>
                  </div>

                  {/* Role slots status */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {REG_ROLES.map(r => {
                      const taken = takenRoles.has(r.value);
                      const member = taken ? teamMembers.find(m => pendingLineup.find(l => l.membershipId === m.membershipId && l.role === r.value)) : null;
                      return (
                        <span key={r.value} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: taken ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${taken ? "rgba(74,222,128,0.3)" : BORDER}`, color: taken ? SUCCESS : MUTED }}>
                          {taken ? "✓ " : "○ "}{r.label}{member ? ` — ${member.userName}` : ""}
                        </span>
                      );
                    })}
                  </div>

                  {/* Member picker */}
                  <div>
                    <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Assign Team Member</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {teamMembers.length === 0 && (
                        <div style={{ color: WARNING, fontSize: "0.82rem", padding: "8px 0" }}>⚠️ No team members found.</div>
                      )}
                      {teamMembers.map(m => {
                        const inPending  = assignedMemberIds.has(m.membershipId);
                        const isSelected = regMember === m.membershipId;
                        return (
                          <div
                            key={m.membershipId || m.userId}
                            onClick={() => !inPending && setRegMember(isSelected ? "" : m.membershipId)}
                            style={{ background: inPending ? "rgba(74,222,128,0.06)" : isSelected ? "rgba(250,71,21,0.1)" : "rgba(0,0,0,0.2)", border: `1px solid ${inPending ? "rgba(74,222,128,0.2)" : isSelected ? "rgba(250,71,21,0.4)" : BORDER}`, borderRadius: "8px", padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: inPending ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isSelected ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: isSelected ? "#fff" : MUTED, flexShrink: 0 }}>
                                {m.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: inPending ? MUTED : isSelected ? ACCENT : TEXT }}>{m.userName}</div>
                                <div style={{ fontSize: "0.65rem", color: MUTED }}>{toLabel(m.teamRole)}</div>
                              </div>
                            </div>
                            {inPending  && <span style={{ fontSize: "0.65rem", color: SUCCESS, fontWeight: 700 }}>✓ Added</span>}
                            {isSelected && !inPending && <span style={{ fontSize: "0.65rem", color: ACCENT, fontWeight: 700 }}>● Selected</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Role picker + Add */}
                  {regMember && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "160px" }}>
                        <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, marginBottom: "4px" }}>Role</div>
                        <select
                          value={regRole}
                          onChange={e => setRegRole(e.target.value)}
                          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 10px", color: TEXT, fontSize: "0.82rem", outline: "none" }}
                        >
                          {REG_ROLES.map(r => (
                            <option key={r.value} value={r.value} disabled={takenRoles.has(r.value)}>
                              {r.label}{takenRoles.has(r.value) ? " (taken)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={addToPending}
                        disabled={takenRoles.has(regRole)}
                        style={{ background: takenRoles.has(regRole) ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: takenRoles.has(regRole) ? MUTED : "#fff", borderRadius: "8px", padding: "9px 20px", fontSize: "0.82rem", fontWeight: 700, cursor: takenRoles.has(regRole) ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: takenRoles.has(regRole) ? "none" : "0 4px 14px rgba(255,77,77,0.25)" }}
                      >+ Add to Lineup</button>
                    </div>
                  )}

                  {/* Pending lineup list */}
                  {pendingLineup.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lineup ({pendingLineup.length}/3)</div>
                      {pendingLineup.map(entry => {
                        const member = teamMembers.find(m => m.membershipId === entry.membershipId);
                        const roleLabel = REG_ROLES.find(r => r.value === entry.role)?.label ?? entry.role;
                        return (
                          <div key={entry.membershipId} style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                              <span style={{ fontWeight: 700, color: TEXT, fontSize: "0.85rem" }}>{member?.userName ?? "Unknown"}</span>
                              <span style={{ color: MUTED, fontSize: "0.72rem", marginLeft: "8px" }}>{roleLabel}</span>
                            </div>
                            <button onClick={() => removeFromPending(entry.membershipId)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: DANGER, borderRadius: "6px", padding: "3px 9px", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer" }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setStep(1)}
                      style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                    >← Back</button>
                    <button
                      onClick={handleConfirmRegistration}
                      disabled={busyReg || pendingLineup.length === 0}
                      style={{ flex: 1, background: !busyReg && pendingLineup.length > 0 ? `linear-gradient(135deg, #ff4d4d, ${ACCENT})` : "rgba(255,255,255,0.06)", border: "none", color: !busyReg && pendingLineup.length > 0 ? "#fff" : MUTED, borderRadius: "8px", padding: "11px 24px", fontSize: "0.88rem", fontWeight: 700, cursor: !busyReg && pendingLineup.length > 0 ? "pointer" : "not-allowed", boxShadow: !busyReg && pendingLineup.length > 0 ? "0 4px 14px rgba(255,77,77,0.3)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.18s" }}
                    >
                      {busyReg
                        ? <><Spinner size={14} color="#fff" /> Registering…</>
                        : pendingLineup.length === 0
                          ? "Add at least one lineup member"
                          : <>⚡ Complete Registration</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* No team state */}
      {!teamId && (
        <EmptyState icon="🤖" title="NO TEAM YET" subtitle="Join or create a team first to register your robots." />
      )}
    </div>
  );
}

// ─── Lineup Tab ───────────────────────────────────────
interface LineupTabProps {
  sport:          EventSportResponse;
  existingRegs:   EventRegistrationResponse[];
  activeRegId:    string;
  setActiveRegId: (id: string) => void;
  isCaptain:      boolean;
  teamMembers:    { userName: string; userId: string; teamMemberId: string; membershipId: string; teamRole: string }[];
  lineupsMap:     Record<string, TeamLineUpResponse[]>;
  lineupLoading:  boolean;
  lineupError:    string | null;
  onFetch:        (regId: string) => void;
  onAdd:          (membershipId: string, role: string) => void;
  onRemove:       (lineupId: string) => void;
}

function LineupTab({
  sport, existingRegs, activeRegId, setActiveRegId, isCaptain, teamMembers, lineupsMap,
  lineupLoading, lineupError, onFetch, onAdd, onRemove,
}: LineupTabProps) {
  const [selectedMember, setSelectedMember] = useState("");
  const [lineupRole,     setLineupRole]     = useState("DRIVER");

  const activeReg     = existingRegs.find(r => regId(r) === activeRegId);
  const currentLineup = lineupsMap[activeRegId] ?? [];

  // Lineup size constraints from the sport spec
  const minSize = sport.minTeamSize ?? 0;
  const maxSize = sport.maxTeamSize ?? Infinity;
  const atMax   = currentLineup.length >= maxSize;
  const belowMin = minSize > 0 && currentLineup.length < minSize;

  // Resolve whichever field name backend returns
  const memberKey = (e: TeamLineUpResponse) =>
    e.teamMembershipId ?? "";

  // All members assigned to ANY robot in this sport (uniqueness enforcement)
  const allAssigned = new Set(
    Object.values(lineupsMap).flatMap(l => l.map(memberKey))
  );
  // Members already in the CURRENT robot's lineup
  const inCurrentLineup = new Set(currentLineup.map(memberKey));
  // Roles already assigned in the CURRENT robot's lineup (each role is unique per registration)
  const takenRoles = new Set(
    currentLineup.filter(m => m.isActive).map(m => m.lineupRole)
  );

  useEffect(() => {
    if (activeRegId) onFetch(activeRegId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Robot selector (always show if multiple registrations) */}
      {existingRegs.length > 1 && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 18px" }}>
          <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Managing Lineup For</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {existingRegs.map(reg => {
              const isActive = regId(reg) === activeRegId;
              return (
                <button
                  key={regId(reg)}
                  onClick={() => setActiveRegId(regId(reg))}
                  style={{
                    background: isActive ? "rgba(250,71,21,0.14)" : "rgba(0,0,0,0.2)",
                    border: `1px solid ${isActive ? "rgba(250,71,21,0.4)" : BORDER}`,
                    borderRadius: "8px",
                    padding: "7px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    color: isActive ? ACCENT : MUTED,
                    fontSize: "0.82rem",
                    fontWeight: isActive ? 700 : 500,
                    transition: "all 0.15s",
                  }}
                >
                  <span>🤖</span> {reg.robotName}
                  {reg.lineupLocked && <span style={{ fontSize: "0.65rem" }}>🔒</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active robot header */}
      {activeReg && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(250,71,21,0.12)", border: "1px solid rgba(250,71,21,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, color: TEXT, fontSize: "0.92rem" }}>{activeReg.robotName}</div>
            <div style={{ fontSize: "0.7rem", color: MUTED }}>
              {activeReg.lineupLocked ? "🔒 Lineup locked" : `${currentLineup.length} member${currentLineup.length !== 1 ? "s" : ""} assigned`}
            </div>
          </div>
        </div>
      )}

      {lineupError && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "10px", padding: "10px 16px", color: DANGER, fontSize: "0.82rem", fontWeight: 600 }}>
          ⚠️ {lineupError}
        </div>
      )}

      {/* Lineup size progress */}
      {activeReg && (maxSize !== Infinity || minSize > 0) && (
        <div style={{ background: CARD2, border: `1px solid ${atMax ? "rgba(74,222,128,0.25)" : belowMin ? "rgba(251,191,36,0.25)" : BORDER}`, borderRadius: "10px", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lineup Progress</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: atMax ? SUCCESS : belowMin ? WARNING : TEXT }}>
              {currentLineup.length} / {maxSize === Infinity ? "∞" : maxSize}
              {minSize > 0 && ` (min ${minSize})`}
            </span>
          </div>
          {maxSize !== Infinity && (
            <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "3px", transition: "width 0.3s ease",
                width: `${Math.min((currentLineup.length / maxSize) * 100, 100)}%`,
                background: atMax
                  ? `linear-gradient(to right, ${SUCCESS}, #22c55e)`
                  : belowMin
                    ? `linear-gradient(to right, ${WARNING}, #f59e0b)`
                    : `linear-gradient(to right, ${ACCENT}, ${ACCENT2})`,
              }} />
            </div>
          )}
          {atMax && <div style={{ fontSize: "0.72rem", color: SUCCESS, marginTop: "5px", fontWeight: 600 }}>✅ Lineup complete — maximum players reached.</div>}
          {!atMax && belowMin && <div style={{ fontSize: "0.72rem", color: WARNING, marginTop: "5px", fontWeight: 600 }}>⚠️ Add at least {minSize - currentLineup.length} more player{minSize - currentLineup.length !== 1 ? "s" : ""} to meet the minimum.</div>}
        </div>
      )}

      {/* Add member form */}
      {isCaptain && activeReg && !activeReg.lineupLocked && (
        <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 18px" }}>
          <div style={{ fontSize: "0.72rem", color: ACCENT, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "12px" }}>Assign Team Member</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Click-based member picker */}
            <div>
              <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, marginBottom: "6px" }}>Select Member</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {teamMembers.map(m => {
                  const isInCurrent = inCurrentLineup.has(m.membershipId);
                  const isInOther   = !isInCurrent && allAssigned.has(m.membershipId);
                  const isSelected  = selectedMember === m.membershipId;
                  const disabled    = isInCurrent || isInOther;
                  return (
                    <div
                      key={m.membershipId || m.userId}
                      onClick={() => !disabled && setSelectedMember(isSelected ? "" : m.membershipId)}
                      style={{
                        background: isInCurrent
                          ? "rgba(74,222,128,0.06)"
                          : isInOther
                            ? "rgba(255,255,255,0.02)"
                            : isSelected
                              ? "rgba(250,71,21,0.1)"
                              : "rgba(0,0,0,0.2)",
                        border: `1px solid ${isInCurrent ? "rgba(74,222,128,0.2)" : isInOther ? BORDER : isSelected ? "rgba(250,71,21,0.4)" : BORDER}`,
                        borderRadius: "8px",
                        padding: "9px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: isInOther ? 0.45 : 1,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isSelected ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: isSelected ? "#fff" : MUTED, flexShrink: 0 }}>
                          {m.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: disabled ? MUTED : isSelected ? ACCENT : TEXT }}>{m.userName}</div>
                          <div style={{ fontSize: "0.65rem", color: MUTED }}>{toLabel(m.teamRole)}</div>
                        </div>
                      </div>
                      {isInCurrent && <span style={{ fontSize: "0.65rem", color: SUCCESS, fontWeight: 700 }}>✓ In lineup</span>}
                      {isInOther   && <span style={{ fontSize: "0.65rem", color: MUTED,    fontWeight: 600 }}>In other robot</span>}
                      {isSelected  && !disabled && <span style={{ fontSize: "0.65rem", color: ACCENT, fontWeight: 700 }}>● Selected</span>}
                    </div>
                  );
                })}
                {teamMembers.length === 0 && (
                  <div style={{ color: WARNING, fontSize: "0.82rem", padding: "8px 0" }}>⚠️ No team members available.</div>
                )}
              </div>
            </div>

            {/* Max-lineup reached — block adding more */}
            {atMax && (
              <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "8px", padding: "10px 14px", color: SUCCESS, fontSize: "0.8rem", fontWeight: 600 }}>
                ✅ Lineup is full ({maxSize}/{maxSize} players). Remove a player to make room.
              </div>
            )}

            {/* Role slots summary */}
            {(() => {
              const roles = [
                { value: "DRIVER",           label: "Driver" },
                { value: "SECONDARY_DRIVER", label: "Secondary Driver" },
                { value: "BUILD_HEAD",        label: "Build Head" },
              ];
              return (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {roles.map(r => {
                    const taken = takenRoles.has(r.value);
                    return (
                      <span key={r.value} style={{
                        fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px",
                        background: taken ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${taken ? "rgba(74,222,128,0.3)" : BORDER}`,
                        color: taken ? SUCCESS : MUTED,
                      }}>
                        {taken ? "✓ " : "○ "}{r.label}
                      </span>
                    );
                  })}
                </div>
              );
            })()}

            {/* Role picker + Add button */}
            {selectedMember && !atMax && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, marginBottom: "4px" }}>Role</div>
                  <select
                    value={lineupRole}
                    onChange={e => setLineupRole(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 10px", color: TEXT, fontSize: "0.82rem", outline: "none" }}
                  >
                    <option value="DRIVER"           disabled={takenRoles.has("DRIVER")}>Driver{takenRoles.has("DRIVER") ? " (taken)" : ""}</option>
                    <option value="SECONDARY_DRIVER" disabled={takenRoles.has("SECONDARY_DRIVER")}>Secondary Driver{takenRoles.has("SECONDARY_DRIVER") ? " (taken)" : ""}</option>
                    <option value="BUILD_HEAD"       disabled={takenRoles.has("BUILD_HEAD")}>Build Head{takenRoles.has("BUILD_HEAD") ? " (taken)" : ""}</option>
                  </select>
                </div>
                <button
                  disabled={takenRoles.has(lineupRole)}
                  onClick={() => { onAdd(selectedMember, lineupRole); setSelectedMember(""); }}
                  style={{ background: takenRoles.has(lineupRole) ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: takenRoles.has(lineupRole) ? MUTED : "#fff", borderRadius: "8px", padding: "9px 20px", fontSize: "0.82rem", fontWeight: 700, cursor: takenRoles.has(lineupRole) ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: takenRoles.has(lineupRole) ? "none" : "0 4px 14px rgba(255,77,77,0.25)" }}
                >+ Assign</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member list */}
      {lineupLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px", gap: "12px", color: MUTED }}>
          <Spinner size={20} /> Loading lineup…
        </div>
      ) : currentLineup.length === 0 ? (
        <EmptyState icon="👥" title="NO MEMBERS YET" subtitle={isCaptain ? "Assign team members above to this robot's lineup." : "The captain hasn't assigned any members yet."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {currentLineup.map((member, i) => (
            <div key={member.lineupId} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, color: TEXT, fontSize: "0.88rem" }}>{member.memberName}</div>
                  <div style={{ color: MUTED, fontSize: "0.72rem", marginTop: "2px" }}>{toLabel(member.lineupRole)}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ background: member.isActive ? "rgba(74,222,128,0.1)" : "rgba(156,163,175,0.1)", border: `1px solid ${member.isActive ? "rgba(74,222,128,0.25)" : "rgba(156,163,175,0.2)"}`, color: member.isActive ? SUCCESS : MUTED, borderRadius: "999px", fontSize: "0.65rem", padding: "2px 9px", fontWeight: 700 }}>
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                {isCaptain && !activeReg?.lineupLocked && (
                  <button
                    onClick={() => onRemove(member.lineupId)}
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: DANGER, borderRadius: "6px", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                  >Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Match Status Colors ──────────────────────────────
const MATCH_STATUS_COLOR: Record<string, string> = {
  COMPLETED: MUTED,
  LIVE: SUCCESS,
  UPCOMING: INFO,
  SCHEDULED: INFO,
  ONGOING: SUCCESS,
};

// ─── Match Card ───────────────────────────────────────
function MatchCard({ m, accent }: { m: PublicMatchView; accent?: string }) {
  const statusColor = MATCH_STATUS_COLOR[m.status] || TEXT;
  const isLive      = m.status === "LIVE" || m.status === "ONGOING";
  return (
    <div style={{ background: CARD, border: `1px solid ${accent ? `${accent}55` : isLive ? "rgba(250,71,21,0.35)" : BORDER}`, borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", position: "relative" }}>
      {(isLive || accent) && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: accent ? `linear-gradient(to right, ${accent}, ${accent}88)` : `linear-gradient(to right, ${ACCENT}, ${ACCENT2})`, borderRadius: "12px 12px 0 0" }} />}
      <div style={{ position: "absolute", top: "8px", right: "12px", fontSize: "0.6rem", color: MUTED, fontWeight: 600 }}>M{m.matchNumber ?? "—"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, justifyContent: "space-between", minWidth: "220px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "80px" }}>
          <span style={{ fontWeight: m.winnerRegistrationId === m.teamARegistrationId ? 700 : 600, color: m.winnerRegistrationId === m.teamARegistrationId ? (accent ?? SUCCESS) : TEXT, fontSize: "0.9rem" }}>{m.teamARobotName || m.teamAName || "TBD"}</span>
          {m.teamARobotName && m.teamAName && <span style={{ fontSize: "0.65rem", color: MUTED }}>{m.teamAName}</span>}
          {m.winnerRegistrationId === m.teamARegistrationId && <span style={{ fontSize: "0.6rem", color: accent ?? SUCCESS, fontWeight: 700 }}>{accent ? "🥉 3rd" : "🏆 Winner"}</span>}
        </div>
        <span style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${isLive ? "rgba(250,71,21,0.3)" : BORDER}`, borderRadius: "6px", padding: "4px 12px", fontWeight: 800, color: isLive ? ACCENT : statusColor, fontFamily: "'Orbitron', sans-serif", fontSize: "0.9rem", minWidth: "64px", textAlign: "center" }}>
          {m.teamAScore != null && m.teamBScore != null ? `${m.teamAScore} — ${m.teamBScore}` : "VS"}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end", minWidth: "80px" }}>
          <span style={{ fontWeight: m.winnerRegistrationId === m.teamBRegistrationId ? 700 : 600, color: m.winnerRegistrationId === m.teamBRegistrationId ? (accent ?? SUCCESS) : TEXT, fontSize: "0.9rem" }}>{m.teamBRobotName || m.teamBName || "TBD"}</span>
          {m.teamBRobotName && m.teamBName && <span style={{ fontSize: "0.65rem", color: MUTED, textAlign: "right" }}>{m.teamBName}</span>}
          {m.winnerRegistrationId === m.teamBRegistrationId && <span style={{ fontSize: "0.6rem", color: accent ?? SUCCESS, fontWeight: 700 }}>{accent ? "🥉 3rd" : "🏆 Winner"}</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}40`, color: statusColor, borderRadius: "999px", fontSize: "0.65rem", padding: "2px 9px", fontWeight: 700 }}>
          {isLive && <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: SUCCESS, marginRight: "4px", verticalAlign: "middle" }} />}{m.status}
        </span>
        {m.scheduledAt && <span style={{ color: MUTED, fontSize: "0.72rem" }}>{new Date(m.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
    </div>
  );
}

// ─── Matches Tab ──────────────────────────────────────
function MatchesTab({ matches, loading, error }: { matches: PublicMatchView[]; loading: boolean; error: string | null }) {
  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: MUTED, gap: "12px", alignItems: "center" }}><Spinner size={20} />Loading matches...</div>;
  if (error)   return <EmptyState icon="⚠️" title="MATCHES UNAVAILABLE" subtitle={error} />;
  if (matches.length === 0) return <EmptyState icon="⚔️" title="NO MATCHES YET" subtitle="Matches will appear here once the bracket is published." />;

  const totalRounds = Math.max(...matches.map(m => m.roundNumber ?? 0));
  const thirdPlaceMatch = matches.find(m => isThirdPlaceMatch(m, totalRounds));
  const normalMatches   = matches.filter(m => !isThirdPlaceMatch(m, totalRounds));
  const rounds = Array.from(new Set(normalMatches.map(m => m.roundNumber ?? 0))).sort((a, b) => a - b);
  function matchRoundLabel(roundNum: number) {
    const ri = rounds.indexOf(roundNum);
    if (ri === rounds.length - 1) return "Final";
    if (ri === rounds.length - 2 && rounds.length > 2) return "Semifinal";
    return `Round ${roundNum}`;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {rounds.map(round => (
        <div key={round}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ height: "1px", flex: 1, background: BORDER }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>{matchRoundLabel(round)}</span>
            <div style={{ height: "1px", flex: 1, background: BORDER }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {normalMatches.filter(m => (m.roundNumber ?? 0) === round).map(m => <MatchCard key={m.matchId} m={m} />)}
          </div>
        </div>
      ))}
      {thirdPlaceMatch && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ height: "1px", flex: 1, background: `${BRONZE}40` }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: BRONZE, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>🥉 3rd Place Match</span>
            <div style={{ height: "1px", flex: 1, background: `${BRONZE}40` }} />
          </div>
          <div style={{ background: `rgba(205,127,50,0.06)`, border: `1px solid rgba(205,127,50,0.2)`, borderRadius: "8px", padding: "8px 14px", marginBottom: "10px", fontSize: "0.75rem", color: MUTED }}>
            Contested by the two semifinal runners-up.
          </div>
          <MatchCard m={thirdPlaceMatch} accent={BRONZE} />
        </div>
      )}
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────
function ScheduleTab({ matches, loading, error }: { matches: PublicMatchView[]; loading: boolean; error: string | null }) {
  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: MUTED, gap: "12px", alignItems: "center" }}><Spinner size={20} />Loading bracket…</div>;
  if (error)   return <EmptyState icon="⚠️" title="BRACKET UNAVAILABLE" subtitle={error} />;
  if (matches.length === 0) return <EmptyState icon="📅" title="BRACKET NOT YET PUBLISHED" subtitle="The tournament bracket will appear here once the organiser generates it." />;

  const { rounds, positions, svgW, svgH, totalRounds } = getBracketLayout(matches);
  const lines: { x1: number; y1: number; x2: number; y2: number; completed: boolean }[] = [];
  matches.forEach(m => {
    if (isThirdPlaceMatch(m, totalRounds)) return;
    const next = m.nextMatchId;
    if (!next || !positions[m.matchId] || !positions[next]) return;
    const from = positions[m.matchId]; const to = positions[next];
    lines.push({ x1: from.x + BOX_W, y1: from.y + BOX_H / 2, x2: to.x, y2: to.y + BOX_H / 2, completed: m.status === "COMPLETED" && !!m.winnerRegistrationId });
  });
  const champion = matches.find(m => isFinalMatch(m, totalRounds) && m.status === "COMPLETED" && !!m.winnerRegistrationId);
  const thirdPlaceMatch = matches.find(m => isThirdPlaceMatch(m, totalRounds));
  const thirdPlaceWinnerRegId = thirdPlaceMatch?.winnerRegistrationId;
  const thirdPlaceWinnerName = thirdPlaceWinnerRegId
    ? (thirdPlaceWinnerRegId === thirdPlaceMatch?.teamARegistrationId
        ? (thirdPlaceMatch?.teamARobotName || thirdPlaceMatch?.teamAName)
        : (thirdPlaceMatch?.teamBRobotName || thirdPlaceMatch?.teamBName))
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        {[{ color: INFO, label: "Scheduled" }, { color: ACCENT, label: "Live" }, { color: SUCCESS, label: "Completed" }, { color: BRONZE, label: "3rd Place" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: "0.72rem", color: MUTED }}>{l.label}</span>
          </div>
        ))}
      </div>
      {champion && <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", borderRadius: "12px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}><span style={{ fontSize: "1.3rem" }}>🏆</span><span style={{ fontSize: "1rem", fontWeight: 800, color: "#f59e0b" }}>Champion: {champion.winnerRegistrationId === champion.teamARegistrationId ? (champion.teamARobotName || champion.teamAName) : (champion.teamBRobotName || champion.teamBName)}</span><span>🎉</span></div>}
      {thirdPlaceWinnerName && <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px", borderRadius: "12px", background: `rgba(205,127,50,0.08)`, border: `1px solid rgba(205,127,50,0.3)` }}><span style={{ fontSize: "1.3rem" }}>🥉</span><span style={{ fontSize: "1rem", fontWeight: 800, color: BRONZE }}>3rd Place: {thirdPlaceWinnerName}</span></div>}
      <div style={{ overflowX: "auto", background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "20px", scrollbarWidth: "thin" }}>
        <svg width={svgW + 40} height={svgH + 60} style={{ display: "block", overflow: "visible" }}>
          <defs><filter id="pub-glow"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          {rounds.map((_, ri) => (<text key={ri} x={ri * (BOX_W + H_GAP) + BOX_W / 2 + 20} y={16} textAnchor="middle" fill={ri === rounds.length - 1 ? ACCENT : MUTED} fontSize={11} fontWeight={700} fontFamily="'Orbitron', 'Syne', 'Inter', sans-serif" letterSpacing={1.5}>{roundLabel(ri, rounds.length)}</text>))}
          <g transform="translate(20, 28)">
            {lines.map((l, i) => { const mx = l.x1 + H_GAP / 2; return <path key={i} d={`M${l.x1},${l.y1} C${mx},${l.y1} ${mx},${l.y2} ${l.x2},${l.y2}`} fill="none" stroke={l.completed ? ACCENT : "rgba(255,255,255,0.1)"} strokeWidth={l.completed ? 1.5 : 1} opacity={l.completed ? 0.65 : 0.3} filter={l.completed ? "url(#pub-glow)" : undefined} />; })}
            {matches.map(match => {
              if (!positions?.[match.matchId]) return null;
              const { x, y } = positions[match.matchId];
              const is3rd = isThirdPlaceMatch(match, totalRounds);
              const sc = is3rd ? BRONZE : bracketStatusColor(match.status);
              const isCompleted = match.status === "COMPLETED"; const isLive = match.status === "LIVE" || match.status === "ONGOING";
              const isBye = match.isBye; const winnerRegId = match.winnerRegistrationId;
              const teamARegId = match.teamARegistrationId; const teamBRegId = match.teamBRegistrationId;
              const displayNameA = match.teamARobotName || match.teamAName;
              const displayNameB = match.teamBRobotName || match.teamBName;
              return (
                <g key={match.matchId}>
                  <rect x={x} y={y} width={BOX_W} height={BOX_H} rx={13} ry={13} fill={isBye ? "rgba(255,255,255,0.02)" : is3rd ? "rgba(205,127,50,0.07)" : "rgba(0,0,0,0.35)"} stroke={is3rd ? `rgba(205,127,50,0.35)` : isLive ? "rgba(250,71,21,0.4)" : "rgba(255,255,255,0.07)"} strokeWidth={1} />
                  <rect x={x} y={y} width={3} height={BOX_H} rx={2} ry={2} fill={sc} opacity={isBye ? 0.2 : 0.8} />
                  {is3rd && <text x={x + BOX_W / 2} y={y - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill={BRONZE} fontFamily="'Orbitron', sans-serif" letterSpacing={1.2}>🥉 3RD PLACE</text>}
                  <text x={x + 16} y={y + 22} fontSize={12} fontWeight={winnerRegId === teamARegId ? 700 : 400} fill={isBye ? MUTED : winnerRegId === teamARegId ? (is3rd ? BRONZE : SUCCESS) : displayNameA ? TEXT : MUTED} fontFamily="'Syne', 'Inter', sans-serif">{displayNameA ? (displayNameA.length > 16 ? displayNameA.slice(0, 15) + "…" : displayNameA) : (teamARegId ? "…" : "TBD")}</text>
                  {match.teamAName && match.teamARobotName && <text x={x + 16} y={y + 33} fontSize={9} fill={MUTED} fontFamily="'Inter', sans-serif">{match.teamAName.length > 18 ? match.teamAName.slice(0, 17) + "…" : match.teamAName}</text>}
                  {(isCompleted || isLive) && <text x={x + BOX_W - 14} y={y + 24} fontSize={13} fontWeight={700} fill={winnerRegId === teamARegId ? (is3rd ? BRONZE : SUCCESS) : MUTED} fontFamily="'Syne', 'Inter', sans-serif" textAnchor="end">{match.teamAScore ?? 0}</text>}
                  <line x1={x + 10} y1={y + BOX_H / 2} x2={x + BOX_W - 10} y2={y + BOX_H / 2} stroke={is3rd ? "rgba(205,127,50,0.15)" : "rgba(255,255,255,0.06)"} strokeWidth={1} />
                  <text x={x + 16} y={y + BOX_H - 16} fontSize={12} fontWeight={winnerRegId === teamBRegId ? 700 : 400} fill={isBye ? MUTED : winnerRegId === teamBRegId ? (is3rd ? BRONZE : SUCCESS) : displayNameB ? TEXT : MUTED} fontFamily="'Syne', 'Inter', sans-serif">{displayNameB ? (displayNameB.length > 16 ? displayNameB.slice(0, 15) + "…" : displayNameB) : (teamBRegId ? "…" : "TBD")}</text>
                  {match.teamBName && match.teamBRobotName && <text x={x + 16} y={y + BOX_H - 5} fontSize={9} fill={MUTED} fontFamily="'Inter', sans-serif">{match.teamBName.length > 18 ? match.teamBName.slice(0, 17) + "…" : match.teamBName}</text>}
                  {(isCompleted || isLive) && <text x={x + BOX_W - 14} y={y + BOX_H - 14} fontSize={13} fontWeight={700} fill={winnerRegId === teamBRegId ? (is3rd ? BRONZE : SUCCESS) : MUTED} fontFamily="'Syne', 'Inter', sans-serif" textAnchor="end">{match.teamBScore ?? 0}</text>}
                  {isBye && <text x={x + BOX_W - 10} y={y + BOX_H / 2 + 4} fontSize={9} fontWeight={700} fill={MUTED} fontFamily="'Syne', 'Inter', sans-serif" textAnchor="end" letterSpacing={1}>BYE</text>}
                  {isLive && <circle cx={x + BOX_W - 10} cy={y + 10} r={4} fill={ACCENT} opacity={0.9}><animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" /></circle>}
                  {isCompleted && !is3rd && !match.nextMatchId && winnerRegId && <text x={x + BOX_W / 2} y={y - 8} textAnchor="middle" fontSize={14}>🏆</text>}
                  {is3rd && isCompleted && winnerRegId && <text x={x + BOX_W / 2} y={y - 22} textAnchor="middle" fontSize={14}>🥉</text>}
                  {match.scheduledAt && !isCompleted && <text x={x + BOX_W / 2} y={y + BOX_H + 13} textAnchor="middle" fontSize={9} fill={MUTED} fontFamily="'Inter', sans-serif">{new Date(match.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</text>}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginTop: "4px" }}>
        {rounds.map((round, ri) => {
          const completed = round.filter(m => m.status === "COMPLETED").length;
          const live      = round.filter(m => m.status === "LIVE" || m.status === "ONGOING").length;
          const label     = roundLabel(ri, rounds.length);
          const isFinalRound = ri === rounds.length - 1;
          return (
            <div key={ri} style={{ background: CARD, border: `1px solid ${isFinalRound ? "rgba(250,71,21,0.2)" : BORDER}`, borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "0.62rem", color: isFinalRound ? ACCENT : MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: TEXT, fontFamily: "'Orbitron', sans-serif" }}>{completed}/{round.length}</div>
              <div style={{ fontSize: "0.7rem", color: MUTED, marginTop: "2px" }}>matches done{live > 0 && <span style={{ color: ACCENT, marginLeft: "6px" }}>· {live} live</span>}</div>
            </div>
          );
        })}
        {thirdPlaceMatch && (
          <div style={{ background: `rgba(205,127,50,0.06)`, border: `1px solid rgba(205,127,50,0.25)`, borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontSize: "0.62rem", color: BRONZE, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>🥉 3rd Place</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: TEXT, fontFamily: "'Orbitron', sans-serif" }}>{thirdPlaceMatch.status === "COMPLETED" ? "1/1" : "0/1"}</div>
            <div style={{ fontSize: "0.7rem", color: MUTED, marginTop: "2px" }}>{thirdPlaceMatch.status === "COMPLETED" ? "match done" : (thirdPlaceMatch.status === "LIVE" || thirdPlaceMatch.status === "ONGOING") ? <span style={{ color: ACCENT }}>live now</span> : "match pending"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── News Tab ─────────────────────────────────────────
const MOCK_NEWS = [
  { id: "n1", tag: "ANNOUNCEMENT", tagColor: ACCENT,  title: "Registration Extended by One Week",                      body: "Due to overwhelming interest, the registration deadline has been extended to 10th August 2025.", author: "BotLeague Organising Committee", date: "2025-07-28T09:00:00", pinned: true },
  { id: "n4", tag: "LIVE",         tagColor: SUCCESS,  title: "Semi Final 1 Underway — Apex Ignitors vs Volt Riders", body: "The first semi final is live right now! Both bots are evenly matched at 1-1 after the first two rounds.",  author: "BotLeague Live Desk",          date: "2025-08-16T10:15:00", pinned: true },
];
function NewsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {MOCK_NEWS.map(news => (
        <div key={news.id} style={{ background: CARD, border: `1px solid ${news.pinned ? "rgba(250,71,21,0.28)" : BORDER}`, borderRadius: "14px", padding: "20px 22px", position: "relative", overflow: "hidden" }}>
          {news.pinned && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2})` }} />}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ background: `${news.tagColor}20`, border: `1px solid ${news.tagColor}50`, color: news.tagColor, borderRadius: "6px", fontSize: "0.6rem", padding: "2px 8px", fontWeight: 800 }}>{news.tag}</span>
              {news.pinned && <span style={{ background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.2)", color: ACCENT, borderRadius: "6px", fontSize: "0.6rem", padding: "2px 8px", fontWeight: 700 }}>📌 PINNED</span>}
            </div>
            <span style={{ fontSize: "0.68rem", color: MUTED, whiteSpace: "nowrap" }}>{new Date(news.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {new Date(news.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700, color: TEXT, lineHeight: 1.4 }}>{news.title}</h3>
          <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: MUTED, lineHeight: 1.7 }}>{news.body}</p>
          <div style={{ fontSize: "0.68rem", color: MUTED, display: "flex", alignItems: "center", gap: "5px" }}><span>✍️</span><span>{news.author}</span></div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function UserSportDetail() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>();
  const navigate = useNavigate();

  const {
    events, eventSports, registrations, loading, error,
    teamId, teamCode,
    teamMembers, isCaptain,
    fetchLiveEvents, fetchEventSports, fetchTeamRegistrations,
    cancelRegistration,
    clearError,
  } = useEvent();

  const { eligibility } = useEligibility();

  const {
    matches, loading: matchesLoading, error: matchesError,
  } = useMatches(sportId ?? "");

  // Subscribe to live score/status pushes — updates flow into Redux matchesByEventSport
  useSportMatchRealtime(sportId);

  const {
    leaderboard, loading: lbLoading, error: lbError, refetch: lbRefetch,
  } = useLeaderboard(eventId ?? "", sportId ?? "");

  const [tab,           setTab]           = useState<TabId>("overview");
  const [busyReg,       setBusyReg]       = useState(false);
  const [regError,      setRegError]      = useState<string | null>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupError,   setLineupError]   = useState<string | null>(null);
  const [activeRegId,   setActiveRegId]   = useState<string>("");
  // Per-robot lineup map: regId → lineup entries
  const [lineupsMap, setLineupsMap] = useState<Record<string, TeamLineUpResponse[]>>({});

  useEffect(() => {
    if (!eventId || !sportId) return;
    const load = async () => {
      if (events.length === 0) await fetchLiveEvents();
      await fetchEventSports(eventId);
    };
    load();
  }, [eventId, events.length, fetchEventSports, fetchLiveEvents, sportId]);

  useEffect(() => {
    if (teamId) fetchTeamRegistrations(teamId);
  }, [fetchTeamRegistrations, teamId]);

  const event: EventResponse | undefined      = events.find(e => e.id === eventId);
  const sport: EventSportResponse | undefined = eventSports.find(s => s.id === sportId);

  // All registrations this team has in this sport (multiple robots allowed)
  const existingRegs: EventRegistrationResponse[] = registrations.filter(
    r => r.eventSportId === sportId && r.teamId === teamId
  );

  // Reset lineup cache and active selection when sport changes — prevents
  // stale lineups from sport A contaminating sport B's lineup view.
  // eslint-disable-next-line react-compiler/react-compiler
  useEffect(() => {
    setLineupsMap({});
    setActiveRegId("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportId]);

  // Auto-seed activeRegId from the first registration once existingRegs
  // populates. Without this, "Add Member" silently exits early on the lineup
  // tab because handleAddMember guards: if (!activeRegId) return.
  // eslint-disable-next-line react-compiler/react-compiler
  useEffect(() => {
    if (!activeRegId && existingRegs.length > 0) {
      setActiveRegId(regId(existingRegs[0]));
    }
  // Intentional: dep on length only — never override the user's selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRegs.length]);

  const handleRegister = async (botId: string, robotName: string, lineup: { membershipId: string; role: string }[]) => {
    if (!teamId || !sportId) return;
    setBusyReg(true);
    setRegError(null);

    // ── Step A: register the robot ────────────────────────
    let newRegId   = "";
    let robotIdVal = botId;
    try {
      const reg  = await registerTeamToEvent({ eventSportId: sportId, teamId, botId, robotId: botId, robotName });
      newRegId   = reg.registrationId ?? reg.id ?? "";
      robotIdVal = reg.robotId ?? reg.botId ?? botId;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setRegError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Registration failed.");
      setBusyReg(false);
      return;
    }

    // Registration succeeded — refresh list so robot shows up immediately
    try { await fetchTeamRegistrations(teamId); } catch (_) { /* non-fatal */ }

    // ── Step B: submit lineup entries (each independently) ──
    const lineupErrors: string[] = [];
    for (const entry of lineup) {
      try {
        await addLineupMember({
          sportRegistrationId: newRegId,
          robotId:             robotIdVal,
          teamMembershipId:    entry.membershipId,
          lineupRole:          entry.role as LineupRole,
        });
      } catch (le) {
        const e = le as { response?: { data?: { message?: string; error?: string } }; message?: string };
        lineupErrors.push(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Unknown error");
      }
    }

    // Seed lineup cache with whatever was saved
    if (newRegId) {
      try {
        const lineupData = await getLineup(newRegId);
        setLineupsMap(prev => ({ ...prev, [newRegId]: lineupData }));
      } catch (_) { /* non-fatal */ }
    }

    if (lineupErrors.length > 0) {
      setRegError(`Robot registered! But lineup failed: ${lineupErrors[0]} — use the Lineup tab to add members.`);
    }

    setBusyReg(false);
  };

  const handleCancel = async (registrationId: string) => {
    setBusyReg(true);
    setRegError(null);
    try {
      const ok = await cancelRegistration(registrationId);
      if (!ok) {
        // cancelRegistration returns false on error — show a stable message
        // (reading the hook's `error` closure would be stale at this point).
        setRegError("Failed to cancel registration. Please try again.");
        return;
      }
      // If the active lineup tab was showing this registration, reset to the
      // first remaining one so the lineup tab doesn't silently break.
      if (activeRegId === registrationId) {
        const remaining = existingRegs.filter(r => regId(r) !== registrationId);
        setActiveRegId(remaining.length > 0 ? regId(remaining[0]) : "");
      }
      if (teamId) await fetchTeamRegistrations(teamId);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setRegError(
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        "Failed to cancel registration."
      );
    } finally {
      setBusyReg(false);
    }
  };

  const handleManageLineup = (registrationId: string) => {
    setActiveRegId(registrationId);
    setTab("lineup");
  };

  const handleFetchLineup = async (regId: string) => {
    if (lineupsMap[regId] !== undefined) return;
    setLineupLoading(true);
    setLineupError(null);
    try {
      const data = await getLineup(regId);
      setLineupsMap(prev => ({ ...prev, [regId]: data }));
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setLineupError(e?.response?.data?.error ?? e?.message ?? "Failed to load lineup.");
    } finally {
      setLineupLoading(false);
    }
  };

  const handleAddMember = async (membershipId: string, role: string) => {
    if (!activeRegId) return;
    const activeReg = existingRegs.find(
      r => (r.registrationId ?? r.id) === activeRegId
    );
    const robotUUID = activeReg?.robotId ?? activeReg?.botId;
    if (!robotUUID) return;
    setLineupError(null);
    try {
      const result = await addLineupMember({
        sportRegistrationId: activeRegId,
        robotId: robotUUID,
        teamMembershipId: membershipId,
        lineupRole: role as LineupRole,
      });
      setLineupsMap(prev => ({
        ...prev,
        [activeRegId]: [...(prev[activeRegId] ?? []), result],
      }));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setLineupError(
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        "Failed to add member."
      );
    }
  };

  const handleRemoveMember = async (lineupId: string) => {
    setLineupError(null);
    try {
      await removeLineupMember(lineupId);
      setLineupsMap(prev => {
        const updated = { ...prev };
        for (const regId in updated) {
          updated[regId] = updated[regId].filter(l => l.lineupId !== lineupId);
        }
        return updated;
      });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setLineupError(
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        "Failed to remove member."
      );
    }
  };

  if (loading && !sport) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", color: MUTED }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner size={40} /><div style={{ fontSize: "0.9rem" }}>Loading sport…</div>
      </div>
    );
  }

  if ((error && !sport) || (!loading && !sport)) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "12px", padding: "20px 28px", color: DANGER, fontSize: "0.85rem", fontWeight: 600, maxWidth: "400px", textAlign: "center" }}>
          ⚠️ {error || "Sport not found."}
          <br />
          <button onClick={() => { clearError(); navigate(eventId ? `/events/${eventId}` : "/events"); }} style={{ marginTop: "12px", background: ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>← Back</button>
        </div>
      </div>
    );
  }

  if (!sport) return null;

  const spotsLeft = (sport.maxTeams ?? 0) - (sport.registeredTeamsCount ?? 0);
  const isFull    = sport.maxTeams != null && spotsLeft <= 0;

  const ALL_TABS = [
    ...TABS,
    ...(teamId ? [
      { id: "registration" as const, label: "Register", icon: "📝" },
      ...(existingRegs.length > 0 ? [{ id: "lineup" as const, label: "Lineup", icon: "👥" }] : []),
    ] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "40px 48px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #2a2a2a; color: #fff; }
      `}</style>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />
      <div style={{ position: "absolute", top: "-120px", right: "-120px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(250,71,21,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(eventId ? `/events/${eventId}` : "/events")}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", marginBottom: "28px" }}
        >
          ← Back to Event
        </button>

        <div style={{ marginBottom: "28px" }}>
          {event && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "0.78rem", color: MUTED }}>
              <span onClick={() => navigate("/events")} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = ACCENT)} onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>Events</span>
              <span>›</span>
              <span onClick={() => navigate(`/events/${eventId}`)} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = ACCENT)} onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>{event.eventName}</span>
              <span>›</span>
              <span style={{ color: LABEL, fontWeight: 600 }}>{toLabel(sport.sport)}</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.5)", flexShrink: 0 }} />
              <h1 style={{ margin: 0, fontSize: "1.85rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
                {toLabel(sport.sport)}
              </h1>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <StatusPill status={sport.status} />
              {existingRegs.length > 0 && (
                <span style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.28)", color: SUCCESS, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700 }}>
                  ✅ {existingRegs.length} Robot{existingRegs.length !== 1 ? "s" : ""} Registered
                </span>
              )}
              {teamId && (
                <span style={{ background: isCaptain ? "rgba(250,71,21,0.12)" : "rgba(96,165,250,0.1)", border: `1px solid ${isCaptain ? "rgba(250,71,21,0.3)" : "rgba(96,165,250,0.25)"}`, color: isCaptain ? ACCENT : INFO, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700 }}>
                  {isCaptain ? "⚡ Captain" : "👁 Member"}
                </span>
              )}
            </div>
          </div>

          {sport.sportsDescription && (
            <p style={{ marginLeft: "16px", marginTop: "6px", color: MUTED, fontSize: "0.88rem", lineHeight: 1.6, maxWidth: "680px" }}>
              {sport.sportsDescription}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "28px" }}>
          <StatBox icon="🤖" label="Robots Registered" value={sport.registeredTeamsCount} color={WARNING} />
          <StatBox icon="🎯" label="Slots Left"         value={isFull ? "Full" : spotsLeft} color={isFull ? DANGER : SUCCESS} />
          {sport.prizeMoney > 0 && <StatBox icon="🏆" label="Prize Pool" value={fmtCurrency(sport.prizeMoney)} color={SUCCESS} />}
          {sport.entryFee != null && <StatBox icon="💰" label="Entry Fee"  value={sport.entryFee > 0 ? fmtCurrency(sport.entryFee) : "Free"} color={sport.entryFee > 0 ? WARNING : SUCCESS} />}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
          {ALL_TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as TabId)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: active ? `linear-gradient(135deg, rgba(250,71,21,0.22), rgba(249,115,22,0.18))` : "transparent",
                  border: `1px solid ${active ? "rgba(250,71,21,0.4)" : "transparent"}`,
                  color: active ? TEXT : MUTED, borderRadius: "8px", padding: "8px 16px",
                  fontSize: "0.8rem", fontWeight: active ? 700 : 500, cursor: "pointer",
                  transition: "all 0.18s", boxShadow: active ? "0 2px 10px rgba(250,71,21,0.15)" : "none",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = TEXT; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
              >
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          {tab === "overview"  && <OverviewTab sport={sport} />}
          {tab === "matches"   && <MatchesTab matches={matches} loading={matchesLoading} error={matchesError} />}
          {tab === "rankings"  && <RankingsTab leaderboard={leaderboard} loading={lbLoading} error={lbError} onRefresh={lbRefetch} />}
          {tab === "schedule"  && <ScheduleTab matches={matches} loading={matchesLoading} error={matchesError} />}
          {tab === "news"      && <NewsTab />}

          {tab === "registration" && (
            <RegistrationTab
              sport={sport}
              teamId={teamId}
              teamCode={teamCode}
              isCaptain={isCaptain}
              existingRegs={existingRegs}
              busyReg={busyReg}
              regError={regError}
              eligibility={eligibility}
              teamMembers={teamMembers}
              onRegister={handleRegister}
              onCancel={handleCancel}
              onManageLineup={handleManageLineup}
              onDismissError={() => setRegError(null)}
            />
          )}

          {tab === "lineup" && existingRegs.length > 0 && (
            <LineupTab
              sport={sport}
              existingRegs={existingRegs}
              activeRegId={activeRegId || regId(existingRegs[0])}
              setActiveRegId={setActiveRegId}
              isCaptain={isCaptain}
              teamMembers={teamMembers}
              lineupsMap={lineupsMap}
              lineupLoading={lineupLoading}
              lineupError={lineupError}
              onFetch={handleFetchLineup}
              onAdd={handleAddMember}
              onRemove={handleRemoveMember}
            />
          )}
        </div>
      </div>
    </div>
  );
}