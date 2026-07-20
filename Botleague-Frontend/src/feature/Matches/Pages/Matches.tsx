import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllMatches,
  selectAllMatches,
  selectMatchesLoading,
  selectMatchesError,
} from "../store/matchesSlice";
import { useSportMatchRealtime } from "../../../shared/realtime/useMatchRealtime";
import type { PublicMatchView } from "../api/matches.api";

// ─── Tokens ───────────────────────────────────────────
const BG     = "#3a3a3a";
const CARD   = "rgba(0,0,0,0.28)";
const CARD2  = "rgba(0,0,0,0.40)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const ACCENT2= "#f97316";
const TEXT   = "#ffffff";
const MUTED  = "#9ca3af";

const STATUS_ORDER: Record<string, number> = {
  LIVE: 0, ONGOING: 1, UPCOMING: 2, SCHEDULED: 3, COMPLETED: 4,
};

const STATUS: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
  UPCOMING:  { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.28)",  label: "Upcoming",  icon: "🕐" },
  SCHEDULED: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.28)",  label: "Scheduled", icon: "📅" },
  LIVE:      { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  label: "Live",      icon: "🟢" },
  ONGOING:   { color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  label: "Ongoing",   icon: "⚡" },
  COMPLETED: { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.22)", label: "Done",      icon: "✅" },
};

function fmt(val?: string | null) {
  if (!val) return null;
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 20, height: 20,
      border: "2px solid rgba(255,255,255,0.1)",
      borderTop: `2px solid ${ACCENT}`,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

// ─── Match Card ───────────────────────────────────────
function MatchCard({ match, onClick }: { match: PublicMatchView; onClick: () => void }) {
  const st     = STATUS[match.status] || STATUS["UPCOMING"];
  const won    = (id?: string) => !!id && id === match.winnerRegistrationId;
  const isLive = match.status === "LIVE" || match.status === "ONGOING";

  return (
    <div
      onClick={onClick}
      style={{
        background: CARD,
        border: `1px solid ${isLive ? "rgba(74,222,128,0.28)" : BORDER}`,
        borderRadius: "12px",
        padding: "14px 18px",
        cursor: "pointer",
        transition: "border-color 0.18s, transform 0.15s, box-shadow 0.18s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isLive ? "rgba(74,222,128,0.5)" : "rgba(250,71,21,0.4)";
        el.style.transform   = "translateY(-1px)";
        el.style.boxShadow   = "0 4px 20px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isLive ? "rgba(74,222,128,0.28)" : BORDER;
        el.style.transform   = "translateY(0)";
        el.style.boxShadow   = "none";
      }}
    >
      {/* live top bar */}
      {isLive && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(to right, #4ade80, transparent)" }} />
      )}

      {/* top row: round badge + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            background: "rgba(250,71,21,0.12)", border: "1px solid rgba(250,71,21,0.28)",
            color: ACCENT, borderRadius: "6px", fontSize: "0.6rem", padding: "2px 8px",
            fontWeight: 800, letterSpacing: "0.07em",
          }}>
            R{match.roundNumber ?? "?"} · M{match.matchNumber ?? "?"}
          </span>
          {match.isBye && (
            <span style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: "6px", fontSize: "0.6rem", padding: "2px 7px", fontWeight: 700 }}>BYE</span>
          )}
          {match.autoAdvanced && (
            <span style={{ background: "rgba(156,163,175,0.08)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "6px", fontSize: "0.6rem", padding: "2px 7px", fontWeight: 600 }}>AUTO</span>
          )}
        </div>
        <span style={{
          background: st.bg, border: `1px solid ${st.border}`, color: st.color,
          borderRadius: "999px", fontSize: "0.62rem", padding: "2px 9px", fontWeight: 700,
        }}>
          {st.icon} {st.label}
        </span>
      </div>

      {/* Robots + Score */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Robot A */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 800, fontSize: "0.92rem", fontFamily: "'Sarpanch', sans-serif",
            color: won(match.teamARegistrationId) ? "#4ade80" : TEXT,
            display: "flex", alignItems: "center", gap: "5px",
          }}>
            {won(match.teamARegistrationId) && <span style={{ fontSize: "0.65rem" }}>🏆</span>}
            {match.teamARobotName || match.teamAName || "TBD"}
          </div>
          {match.teamAName && (
            <div style={{ fontSize: "0.68rem", color: MUTED, marginTop: "2px" }}>
              {match.teamAName}
            </div>
          )}
        </div>

        {/* Score box */}
        <div style={{
          background: "rgba(0,0,0,0.35)", border: `1px solid ${BORDER}`,
          borderRadius: "8px", padding: "6px 14px", textAlign: "center", minWidth: "80px", flexShrink: 0,
        }}>
          {match.teamAScore != null && match.teamBScore != null ? (
            <div style={{ fontFamily: "'Sarpanch', sans-serif", fontWeight: 900, fontSize: "1.05rem", color: ACCENT, letterSpacing: "0.05em" }}>
              {match.teamAScore} — {match.teamBScore}
            </div>
          ) : (
            <div style={{ fontFamily: "'Sarpanch', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: MUTED }}>VS</div>
          )}
        </div>

        {/* Robot B */}
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{
            fontWeight: 800, fontSize: "0.92rem", fontFamily: "'Sarpanch', sans-serif",
            color: won(match.teamBRegistrationId) ? "#4ade80" : TEXT,
            display: "flex", alignItems: "center", gap: "5px", justifyContent: "flex-end",
          }}>
            {match.teamBRobotName || match.teamBName || "TBD"}
            {won(match.teamBRegistrationId) && <span style={{ fontSize: "0.65rem" }}>🏆</span>}
          </div>
          {match.teamBName && (
            <div style={{ fontSize: "0.68rem", color: MUTED, marginTop: "2px", textAlign: "right" }}>
              {match.teamBName}
            </div>
          )}
        </div>
      </div>

      {/* Footer: time */}
      {(match.scheduledAt || match.startedAt || match.endedAt) && (
        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
          <span style={{ color: MUTED, fontSize: "0.67rem" }}>
            {match.scheduledAt
              ? `🕐 ${fmt(match.scheduledAt)}`
              : match.startedAt
              ? `▶ ${fmt(match.startedAt)}`
              : ""}
          </span>
          {match.endedAt && (
            <span style={{ color: MUTED, fontSize: "0.67rem" }}>Ended {fmt(match.endedAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sport Group Card ─────────────────────────────────
function SportGroup({
  sportId,
  matches,
  onMatchClick,
}: {
  sportId: string;
  matches: PublicMatchView[];
  onMatchClick: (id: string) => void;
}) {
  // Subscribe to real-time score/status updates for every match in this sport
  useSportMatchRealtime(sportId);

  const [collapsed, setCollapsed] = useState(false);

  const live      = matches.filter(m => m.status === "LIVE" || m.status === "ONGOING").length;
  const upcoming  = matches.filter(m => m.status === "UPCOMING" || m.status === "SCHEDULED").length;
  const completed = matches.filter(m => m.status === "COMPLETED").length;

  const sorted = [...matches].sort((a, b) => {
    const oa = STATUS_ORDER[a.status] ?? 5;
    const ob = STATUS_ORDER[b.status] ?? 5;
    if (oa !== ob) return oa - ob;
    return (a.roundNumber ?? 0) - (b.roundNumber ?? 0);
  });

  return (
    <div style={{
      background: CARD2,
      border: `1px solid ${live > 0 ? "rgba(74,222,128,0.22)" : BORDER}`,
      borderRadius: "16px",
      overflow: "hidden",
    }}>
      {/* Sport header — click to collapse */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          background: live > 0 ? "rgba(74,222,128,0.04)" : "rgba(250,71,21,0.03)",
          borderBottom: collapsed ? "none" : `1px solid ${BORDER}`,
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ width: "3px", height: "22px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", flexShrink: 0 }} />
          <span style={{ fontSize: "0.68rem", color: MUTED, fontFamily: "monospace", letterSpacing: "0.04em" }}>
            {sportId.slice(0, 8)}…
          </span>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {live > 0 && (
              <span style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.28)", color: "#4ade80", borderRadius: "999px", fontSize: "0.6rem", padding: "2px 8px", fontWeight: 700 }}>
                🟢 {live} Live
              </span>
            )}
            {upcoming > 0 && (
              <span style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", borderRadius: "999px", fontSize: "0.6rem", padding: "2px 8px", fontWeight: 700 }}>
                🕐 {upcoming} Upcoming
              </span>
            )}
            {completed > 0 && (
              <span style={{ background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.2)", color: MUTED, borderRadius: "999px", fontSize: "0.6rem", padding: "2px 8px", fontWeight: 600 }}>
                ✅ {completed} Done
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "0.68rem", color: MUTED, fontWeight: 600 }}>
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
          <span style={{
            color: MUTED, fontSize: "0.8rem",
            display: "inline-block", transition: "transform 0.2s",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}>▾</span>
        </div>
      </div>

      {/* Match cards */}
      {!collapsed && (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {sorted.map(m => (
            <MatchCard key={m.matchId} match={m} onClick={() => onMatchClick(m.matchId)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function SearchMatches() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Read matches from Redux so WebSocket updates (updateMatchRealtime) flow to the UI
  const matches = useSelector(selectAllMatches);
  const loading = useSelector(selectMatchesLoading);
  const error   = useSelector(selectMatchesError);
  const [search,         setSearch]         = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDropdown,   setShowDropdown]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dispatch as any)(fetchAllMatches());
  }, [dispatch]);


  // Filter
  const filtered = matches.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || m.teamAName?.toLowerCase().includes(q)
      || m.teamBName?.toLowerCase().includes(q)
      || m.teamARobotName?.toLowerCase().includes(q)
      || m.teamBRobotName?.toLowerCase().includes(q);
    const matchStatus = !selectedStatus || m.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Group by eventSportId
  const sportGroups = filtered.reduce<Record<string, PublicMatchView[]>>((acc, m) => {
    const key = m.eventSportId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  // Sports with live matches bubble to top
  const sortedSportIds = Object.keys(sportGroups).sort((a, b) => {
    const aHasLive = sportGroups[a].some(m => m.status === "LIVE" || m.status === "ONGOING") ? 0 : 1;
    const bHasLive = sportGroups[b].some(m => m.status === "LIVE" || m.status === "ONGOING") ? 0 : 1;
    return aHasLive - bHasLive;
  });

  // Global stats
  const totalLive      = matches.filter(m => m.status === "LIVE" || m.status === "ONGOING").length;
  const totalUpcoming  = matches.filter(m => m.status === "UPCOMING" || m.status === "SCHEDULED").length;
  const totalCompleted = matches.filter(m => m.status === "COMPLETED").length;

  // Dropdown suggestions — search by robot name too
  const suggestions = search
    ? matches.filter(m => {
        const q = search.toLowerCase();
        return m.teamAName?.toLowerCase().includes(q)
          || m.teamBName?.toLowerCase().includes(q)
          || m.teamARobotName?.toLowerCase().includes(q)
          || m.teamBRobotName?.toLowerCase().includes(q);
      }).slice(0, 5)
    : [];

  // Only block the UI on the very first load (no data yet)
  const showLoading = loading && matches.length === 0;
  const showError   = !!error && matches.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "40px 48px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        select option     { background: #2a2a2a; color: #fff; }
        ::placeholder     { color: #6b7280; }
      `}</style>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(250,71,21,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "30px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.5)" }} />
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontFamily: "'Sarpanch', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>MATCHES</h1>
          </div>
          <p style={{ margin: 0, color: MUTED, fontSize: "0.8rem", marginLeft: "16px" }}>All tournament matches, grouped by sport</p>
        </div>

        {/* STAT PILLS */}
        {!showLoading && !showError && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "22px" }}>
            {[
              { label: "Total",     val: matches.length,  color: TEXT },
              { label: "Live",      val: totalLive,       color: "#4ade80" },
              { label: "Upcoming",  val: totalUpcoming,   color: "#60a5fa" },
              { label: "Completed", val: totalCompleted,  color: MUTED },
            ].map(s => (
              <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "7px 14px", display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ fontSize: "1rem", fontWeight: 800, fontFamily: "'Sarpanch', sans-serif", color: s.color }}>{s.val}</span>
                <span style={{ fontSize: "0.65rem", color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "26px", flexWrap: "wrap" }}>
          <div ref={dropdownRef} style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", pointerEvents: "none" }}>🔍</span>
            <input
              type="text"
              value={search}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              placeholder="Search robots or teams…"
              style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 13px 10px 36px", color: TEXT, outline: "none", fontSize: "0.83rem", boxSizing: "border-box" }}
            />
            {showDropdown && suggestions.length > 0 && (
              <div style={{ position: "absolute", width: "100%", top: "calc(100% + 5px)", background: "#2a2a2a", border: `1px solid ${BORDER}`, borderRadius: "10px", zIndex: 50, overflow: "hidden" }}>
                {suggestions.map(m => (
                  <div
                    key={m.matchId}
                    onMouseDown={() => navigate(`/match/${m.matchId}`)}
                    style={{ padding: "9px 15px", cursor: "pointer", fontSize: "0.8rem", color: TEXT, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(250,71,21,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>
                      <span style={{ fontWeight: 700 }}>{m.teamARobotName || m.teamAName || "TBD"}</span>
                      <span style={{ color: MUTED, margin: "0 6px" }}>vs</span>
                      <span style={{ fontWeight: 700 }}>{m.teamBRobotName || m.teamBName || "TBD"}</span>
                    </span>
                    <span style={{ fontSize: "0.62rem", color: MUTED }}>R{m.roundNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 13px", color: selectedStatus ? TEXT : MUTED, fontSize: "0.82rem", outline: "none", cursor: "pointer" }}
          >
            <option value="">All Status</option>
            <option value="LIVE">🟢 Live</option>
            <option value="ONGOING">⚡ Ongoing</option>
            <option value="UPCOMING">🕐 Upcoming</option>
            <option value="SCHEDULED">📅 Scheduled</option>
            <option value="COMPLETED">✅ Completed</option>
          </select>

          {(search || selectedStatus) && (
            <button
              onClick={() => { setSearch(""); setSelectedStatus(""); }}
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "10px", padding: "10px 14px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* STATES */}
        {showLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "70px", gap: "14px", color: MUTED }}>
            <Spinner /> Loading matches…
          </div>
        )}

        {showError && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "12px", padding: "16px 22px", color: "#f87171", fontSize: "0.85rem", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* SPORT GROUPS */}
        {!showLoading && !showError && (
          <>
            {sortedSportIds.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", gap: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "2.4rem" }}>⚔️</div>
                <div style={{ fontFamily: "'Sarpanch', sans-serif", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.08em", color: "#e5e7eb" }}>NO MATCHES FOUND</div>
                <div style={{ color: MUTED, fontSize: "0.78rem" }}>Try adjusting your search or filters.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.25s ease" }}>
                {sortedSportIds.map(sportId => (
                  <SportGroup
                    key={sportId}
                    sportId={sportId}
                    matches={sportGroups[sportId]}
                    onMatchClick={id => navigate(`/match/${id}`)}
                  />
                ))}
              </div>
            )}

            {filtered.length > 0 && (
              <div style={{ marginTop: "18px", textAlign: "center", fontSize: "0.7rem", color: MUTED }}>
                {filtered.length} match{filtered.length !== 1 ? "es" : ""} across {sortedSportIds.length} sport{sortedSportIds.length !== 1 ? "s" : ""}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
