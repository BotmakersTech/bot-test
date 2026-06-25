import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, TrendingUp, Swords, ClipboardList, Save, Trash2, Plus, CheckCircle } from "lucide-react";

const BG = "#3a3a3a";
const CARD = "rgba(0,0,0,0.22)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const ACCENT2 = "#f97316";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";

// ─── Dummy data ───────────────────────────────────────────────────────────────

const dummyEventNames: Record<string, string> = {
  "1": "RoboWars Grand Final 2025",
  "2": "Drone Soccer League",
  "3": "Line Follower Open 2025",
  "4": "Robot Race Championship",
  "5": "Sumo Bot Clash 2025",
  "6": "Maze Solver Nationals",
};

const allTeams = ["Apex Ignitors", "Steel Crushers", "Volt Riders", "Sky Hawks", "Circuit Breakers", "Wire Wolves"];
const rounds = ["Group Stage", "Quarter Final", "Semi Final", "Final"];

type ActiveSection = "leaderboard" | "matches" | "scores" | null;

// ─── Sub-components ───────────────────────────────────────────────────────────

// LEADERBOARD SECTION
function LeaderboardSection() {
  const [entries, setEntries] = useState([
    { id: "1", rank: 1, teamName: "Apex Ignitors",   points: 120, wins: 4, losses: 1 },
    { id: "2", rank: 2, teamName: "Steel Crushers",  points: 100, wins: 3, losses: 2 },
    { id: "3", rank: 3, teamName: "Volt Riders",     points: 90,  wins: 3, losses: 1 },
    { id: "4", rank: 4, teamName: "Circuit Breakers",points: 60,  wins: 2, losses: 2 },
  ]);
  const [editId, setEditId] = useState<string | null>(null);

  const update = (id: string, key: string, value: number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [key]: value } : e));
  };
  const save = () => {
    const sorted = [...entries].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
    setEntries(sorted);
    setEditId(null);
  };
  const remove = (id: string) => {
    setEntries(entries.filter(e => e.id !== id).map((e, i) => ({ ...e, rank: i + 1 })));
  };

  const rankStyle = (rank: number) => {
    if (rank === 1) return { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", boxShadow: "0 0 16px rgba(245,158,11,0.35)" };
    if (rank === 2) return { background: "linear-gradient(135deg, #9ca3af, #6b7280)", color: "#fff" };
    if (rank === 3) return { background: "linear-gradient(135deg, #b45309, #92400e)", color: "#fff" };
    return { background: "rgba(0,0,0,0.3)", color: MUTED };
  };

  const inputStyle = { background: "rgba(0,0,0,0.3)", border: `1px solid rgba(250,71,21,0.4)`, borderRadius: "6px", padding: "5px 10px", color: TEXT, fontSize: "0.85rem", outline: "none", width: "70px", textAlign: "center" as const };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button onClick={save} style={{ background: `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: "#fff", borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 4px 20px rgba(255,77,77,0.3)" }}>
          <TrendingUp size={14} /> Recalculate Rankings
        </button>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "52px 1fr 100px 80px 80px 72px", padding: "11px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.2)" }}>
          {["Rank", "Team", "Points", "Wins", "Losses", ""].map(h => (
            <span key={h} style={{ fontSize: "0.66rem", fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {entries.map((entry, i) => {
          const rs = rankStyle(entry.rank);
          const isEditing = editId === entry.id;
          return (
            <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "52px 1fr 100px 80px 80px 72px", padding: "13px 18px", borderBottom: i < entries.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem", ...rs }}>#{entry.rank}</div>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT }}>{entry.teamName}</span>
              {isEditing ? (
                <input type="number" value={entry.points} onChange={e => update(entry.id, "points", Number(e.target.value))} style={inputStyle} />
              ) : (
                <span style={{ fontWeight: 700, color: ACCENT, cursor: "pointer" }} onClick={() => setEditId(entry.id)}>{entry.points} pts</span>
              )}
              {isEditing ? (
                <input type="number" value={entry.wins} onChange={e => update(entry.id, "wins", Number(e.target.value))} style={inputStyle} />
              ) : (
                <span style={{ color: "#4ade80", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }} onClick={() => setEditId(entry.id)}>W {entry.wins}</span>
              )}
              {isEditing ? (
                <input type="number" value={entry.losses} onChange={e => update(entry.id, "losses", Number(e.target.value))} style={inputStyle} />
              ) : (
                <span style={{ color: "#f87171", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }} onClick={() => setEditId(entry.id)}>L {entry.losses}</span>
              )}
              <div style={{ display: "flex", gap: "5px" }}>
                {isEditing ? (
                  <button onClick={save} style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "3px" }}>
                    <Save size={10} /> Save
                  </button>
                ) : (
                  <button onClick={() => remove(entry.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: "6px", padding: "5px 7px", cursor: "pointer", display: "flex" }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ color: "#4b5563", fontSize: "0.75rem", marginTop: "10px" }}>Click on Points / Wins / Losses value to edit inline.</p>
    </div>
  );
}

// CREATE MATCHES SECTION
function MatchesSection() {
  const [matches, setMatches] = useState([
    { id: "1", team1: "Apex Ignitors",   team2: "Steel Crushers", round: "Semi Final",    order: 1, status: "PENDING" },
    { id: "2", team1: "Volt Riders",     team2: "Sky Hawks",      round: "Semi Final",    order: 2, status: "PENDING" },
    { id: "3", team1: "Circuit Breakers",team2: "Wire Wolves",    round: "Quarter Final", order: 1, status: "COMPLETED" },
  ]);
  const [form, setForm] = useState({ team1: "", team2: "", round: "", order: 1 });
  const [showForm, setShowForm] = useState(false);

  const addMatch = () => {
    if (!form.team1 || !form.team2 || !form.round) return;
    setMatches(prev => [...prev, { id: Date.now().toString(), ...form, status: "PENDING" }]);
    setForm({ team1: "", team2: "", round: "", order: 1 });
    setShowForm(false);
  };
  const deleteMatch = (id: string) => setMatches(prev => prev.filter(m => m.id !== id));

  const selectStyle = { background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 14px", color: TEXT, fontSize: "0.85rem", outline: "none", cursor: "pointer", width: "100%" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button onClick={() => setShowForm(!showForm)} style={{ background: `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: "#fff", borderRadius: "10px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 4px 20px rgba(255,77,77,0.3)" }}>
          <Plus size={14} /> Create Match
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: CARD, border: `1px solid rgba(250,71,21,0.25)`, borderRadius: "14px", padding: "22px", marginBottom: "18px" }}>
          <div style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif", marginBottom: "16px" }}>New Match</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "14px" }}>
            {[
              { label: "Team 1", key: "team1", options: allTeams },
              { label: "Team 2", key: "team2", options: allTeams },
              { label: "Round",  key: "round", options: rounds   },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <div style={{ fontSize: "0.65rem", color: MUTED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
                <select value={form[key as keyof typeof form] as string} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} style={selectStyle}>
                  <option value="">Select {label}</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <div style={{ fontSize: "0.65rem", color: MUTED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "5px" }}>Match Order</div>
              <input type="number" min={1} value={form.order} onChange={e => setForm(prev => ({ ...prev, order: Number(e.target.value) }))} style={{ ...selectStyle, appearance: "none" as const }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={addMatch} style={{ background: `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 20px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>Save Match</button>
            <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 16px", fontSize: "0.82rem", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Matches list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {matches.map(match => (
          <div key={match.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid rgba(250,71,21,0.3)`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${BORDER}`; }}
          >
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(250,71,21,0.12)", border: "1px solid rgba(250,71,21,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>#{match.order}</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>{match.team1}</span>
              <span style={{ color: ACCENT, fontSize: "0.7rem", fontWeight: 800, fontFamily: "'Orbitron', sans-serif", padding: "2px 7px", background: "rgba(250,71,21,0.1)", borderRadius: "5px" }}>VS</span>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>{match.team2}</span>
              <span style={{ fontSize: "0.73rem", color: MUTED, marginLeft: "6px" }}>• {match.round}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span style={{ background: match.status === "PENDING" ? "rgba(96,165,250,0.15)" : "rgba(168,85,247,0.15)", color: match.status === "PENDING" ? "#60a5fa" : "#a855f7", borderRadius: "999px", fontSize: "0.65rem", padding: "3px 9px", fontWeight: 700 }}>{match.status}</span>
              <button onClick={() => deleteMatch(match.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: "6px", padding: "5px 6px", cursor: "pointer", display: "flex" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ENTER SCORES SECTION
function ScoresSection() {
  const [matches, setMatches] = useState([
    { id: "1", team1: "Apex Ignitors",   team2: "Steel Crushers", round: "Semi Final",    score1: "", score2: "", winner: "", status: "PENDING" },
    { id: "2", team1: "Volt Riders",     team2: "Sky Hawks",      round: "Semi Final",    score1: "", score2: "", winner: "", status: "PENDING" },
    { id: "3", team1: "Circuit Breakers",team2: "Wire Wolves",    round: "Quarter Final", score1: "3", score2: "1", winner: "Circuit Breakers", status: "COMPLETED" },
  ]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [filterRound, setFilterRound] = useState("");

  const update = (id: string, key: string, value: string) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, [key]: value } : m));
  };
  const saveScore = (id: string) => {
    setMatches(prev => prev.map(m => m.id === id && m.winner ? { ...m, status: "COMPLETED" } : m));
    setSelectedMatchId(null);
  };

  const filteredMatches = filterRound ? matches.filter(m => m.round === filterRound) : matches;
  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const inputStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.3)",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "8px 12px",
    color: TEXT,
    fontSize: "0.9rem",
    outline: "none",
    width: "72px",
    textAlign: "center",
  };

  return (
    <div>
      {/* Round filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {["", ...rounds].map(r => (
          <button key={r} onClick={() => setFilterRound(r)}
            style={{ background: filterRound === r ? "rgba(250,71,21,0.2)" : CARD, border: filterRound === r ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`, color: filterRound === r ? ACCENT : MUTED, borderRadius: "8px", padding: "6px 13px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
            {r === "" ? "All Rounds" : r}
          </button>
        ))}
      </div>

      {/* Match selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "22px" }}>
        {filteredMatches.map(match => (
          <div key={match.id}
            onClick={() => match.status !== "COMPLETED" && setSelectedMatchId(match.id === selectedMatchId ? null : match.id)}
            style={{
              background: selectedMatchId === match.id ? "rgba(250,71,21,0.1)" : CARD,
              border: `1px solid ${selectedMatchId === match.id ? "rgba(250,71,21,0.5)" : match.status === "COMPLETED" ? "rgba(168,85,247,0.2)" : BORDER}`,
              borderRadius: "12px",
              padding: "14px 18px",
              cursor: match.status === "COMPLETED" ? "default" : "pointer",
              transition: "all 0.18s",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>{match.team1}</span>
                <span style={{ color: ACCENT, fontSize: "0.68rem", fontWeight: 800, padding: "1px 6px", background: "rgba(250,71,21,0.1)", borderRadius: "4px" }}>VS</span>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>{match.team2}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: MUTED, marginTop: "3px" }}>{match.round}</div>
            </div>
            <span style={{ background: match.status === "COMPLETED" ? "rgba(168,85,247,0.15)" : "rgba(96,165,250,0.15)", color: match.status === "COMPLETED" ? "#a855f7" : "#60a5fa", borderRadius: "999px", fontSize: "0.64rem", padding: "3px 9px", fontWeight: 700, flexShrink: 0 }}>
              {match.status}
            </span>
            {match.status !== "COMPLETED" && (
              <span style={{ fontSize: "0.72rem", color: selectedMatchId === match.id ? ACCENT : MUTED, fontWeight: 600 }}>
                {selectedMatchId === match.id ? "▲ selected" : "click to enter"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Score entry card — shows only for selected match — exactly like screenshot */}
      {selectedMatch && selectedMatch.status !== "COMPLETED" && (
        <div style={{ background: CARD, border: `1px solid rgba(250,71,21,0.3)`, borderRadius: "16px", padding: "24px", marginTop: "4px" }}>
          {/* Meta header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ fontSize: "0.8rem", color: MUTED }}>
              {/* event name comes from parent — we use the round for context */}
              {selectedMatch.round}
            </span>
            <span style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", borderRadius: "999px", fontSize: "0.66rem", padding: "3px 10px", fontWeight: 700, marginLeft: "auto" }}>
              PENDING
            </span>
          </div>

          {/* VS row with score inputs */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Team 1 */}
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: selectedMatch.winner === selectedMatch.team1 ? "#4ade80" : TEXT, marginBottom: "8px" }}>
                {selectedMatch.team1}
              </div>
              <input type="number" min={0} value={selectedMatch.score1} onChange={e => update(selectedMatch.id, "score1", e.target.value)} style={inputStyle} />
            </div>

            {/* VS badge */}
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", fontFamily: "'Orbitron', sans-serif", padding: "10px 16px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, borderRadius: "10px", boxShadow: "0 4px 16px rgba(250,71,21,0.35)" }}>
              VS
            </div>

            {/* Team 2 */}
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: selectedMatch.winner === selectedMatch.team2 ? "#4ade80" : TEXT, marginBottom: "8px" }}>
                {selectedMatch.team2}
              </div>
              <input type="number" min={0} value={selectedMatch.score2} onChange={e => update(selectedMatch.id, "score2", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Declare winner + save */}
          <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.66rem", color: MUTED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Declare Winner</div>
              <select value={selectedMatch.winner} onChange={e => update(selectedMatch.id, "winner", e.target.value)}
                style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 14px", color: selectedMatch.winner ? TEXT : "#6b7280", fontSize: "0.85rem", outline: "none", cursor: "pointer", width: "100%", maxWidth: "280px" }}>
                <option value="">Select Winner</option>
                <option value={selectedMatch.team1}>{selectedMatch.team1}</option>
                <option value={selectedMatch.team2}>{selectedMatch.team2}</option>
                <option value="DRAW">Draw</option>
              </select>
            </div>
            <button
              onClick={() => saveScore(selectedMatch.id)}
              style={{ background: selectedMatch.winner ? `linear-gradient(135deg, #ff4d4d, ${ACCENT})` : "rgba(255,255,255,0.06)", border: selectedMatch.winner ? "none" : `1px solid ${BORDER}`, color: selectedMatch.winner ? "#fff" : MUTED, borderRadius: "9px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: selectedMatch.winner ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "7px", boxShadow: selectedMatch.winner ? "0 4px 16px rgba(255,77,77,0.3)" : "none" }}>
              <Save size={14} /> Save Score
            </button>
          </div>
        </div>
      )}

      {/* Completed matches shown as done cards */}
      {matches.filter(m => m.status === "COMPLETED").map(match => (
        <div key={match.id + "done"} style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "14px", padding: "18px 22px", marginTop: "10px", display: "flex", alignItems: "center", gap: "14px" }}>
          <CheckCircle size={18} color="#a855f7" />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT }}>{match.team1} vs {match.team2}</div>
            <div style={{ fontSize: "0.75rem", color: MUTED, marginTop: "2px" }}>{match.round} • Score: {match.score1} – {match.score2} • Winner: <span style={{ color: "#4ade80", fontWeight: 600 }}>{match.winner}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminEventManage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sport = searchParams.get("sport") || "Unknown Sport";
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const eventName = eventId ? (dummyEventNames[eventId] || "Event") : "Event";

  const quickActions = [
    {
      key: "leaderboard" as ActiveSection,
      icon: <TrendingUp size={28} color={ACCENT} />,
      title: "Update Leaderboard",
      desc: "Edit points, wins, losses and recalculate rankings",
      color: ACCENT,
    },
    {
      key: "matches" as ActiveSection,
      icon: <Swords size={28} color="#60a5fa" />,
      title: "Create Matches",
      desc: "Schedule new matches between teams with rounds",
      color: "#60a5fa",
    },
    {
      key: "scores" as ActiveSection,
      icon: <ClipboardList size={28} color="#4ade80" />,
      title: "Enter Score",
      desc: "Select a match, enter scores and declare winner",
      color: "#4ade80",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, width: "100%", padding: "40px 48px", position: "relative", overflow: "hidden", color: TEXT }}>
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Back button */}
        <button
          onClick={() => activeSection ? setActiveSection(null) : navigate(`/admin/event/${eventId}`)}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: "0.85rem", marginBottom: "28px", padding: 0, transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
          onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={15} /> {activeSection ? "Back to Quick Actions" : "Back to Event"}
        </button>

        {/* Header — Event name + sport */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.6)" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.06em", color: TEXT }}>{eventName.toUpperCase()}</h1>
              <div style={{ fontSize: "0.8rem", color: ACCENT, fontWeight: 600, marginTop: "3px", letterSpacing: "0.05em" }}>{sport}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions — show when no section active */}
        {!activeSection && (
          <>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: MUTED, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif", marginBottom: "16px" }}>
              QUICK ACTIONS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {quickActions.map(action => (
                <div
                  key={action.key}
                  onClick={() => setActiveSection(action.key)}
                  style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "16px",
                    padding: "26px 22px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.border = `1px solid ${action.color}50`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${action.color}18`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.border = `1px solid ${BORDER}`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, width: "50px", height: "3px", background: `linear-gradient(to right, ${action.color}, transparent)` }} />
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `${action.color}15`, border: `1px solid ${action.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    {action.icon}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: TEXT, marginBottom: "6px" }}>{action.title}</div>
                  <div style={{ fontSize: "0.78rem", color: MUTED, lineHeight: 1.5 }}>{action.desc}</div>
                  <div style={{ marginTop: "16px", fontSize: "0.72rem", color: action.color, fontWeight: 600 }}>OPEN →</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Active section content */}
        {activeSection === "leaderboard" && (
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif", marginBottom: "18px" }}>
              UPDATE LEADERBOARD
            </div>
            <LeaderboardSection />
          </div>
        )}
        {activeSection === "matches" && (
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#60a5fa", textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif", marginBottom: "18px" }}>
              CREATE MATCHES
            </div>
            <MatchesSection />
          </div>
        )}
        {activeSection === "scores" && (
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: "#4ade80", textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif", marginBottom: "18px" }}>
              ENTER SCORE
            </div>
            <ScoresSection />
          </div>
        )}

      </div>
    </div>
  );
}