import { useState } from "react";
import { TrendingUp, Save, Trash2 } from "lucide-react";

const BG = "#3a3a3a";
const CARD = "rgba(0,0,0,0.22)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const ACCENT2 = "#f97316";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";

const dummyLeaderboard = [
  { id: "1", rank: 1, teamName: "Apex Ignitors",   event: "RoboWars Grand Final 2025", points: 120, wins: 4, losses: 1 },
  { id: "2", rank: 2, teamName: "Steel Crushers",   event: "RoboWars Grand Final 2025", points: 100, wins: 3, losses: 2 },
  { id: "3", rank: 3, teamName: "Volt Riders",       event: "Drone Soccer League",        points: 90,  wins: 3, losses: 1 },
  { id: "4", rank: 4, teamName: "Circuit Breakers",  event: "Drone Soccer League",        points: 60,  wins: 2, losses: 2 },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", boxShadow: "0 0 16px rgba(245,158,11,0.35)" };
  if (rank === 2) return { background: "linear-gradient(135deg, #9ca3af, #6b7280)", color: "#fff" };
  if (rank === 3) return { background: "linear-gradient(135deg, #b45309, #92400e)", color: "#fff" };
  return { background: "rgba(0,0,0,0.3)", color: MUTED };
};

export default function AdminLeaderboard() {
  const [entries, setEntries] = useState(dummyLeaderboard);
  const [editId, setEditId] = useState<string | null>(null);

  const update = (id: string, key: string, value: number) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [key]: value };
      return updated;
    }));
  };

  const save = () => {
    const sorted = [...entries].sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
    setEntries(sorted);
    setEditId(null);
  };

  const remove = (id: string) => {
    const updated = entries.filter(e => e.id !== id).map((e, i) => ({ ...e, rank: i + 1 }));
    setEntries(updated);
  };

  const inputStyle = { background: "rgba(0,0,0,0.3)", border: `1px solid rgba(250,71,21,0.4)`, borderRadius: "6px", padding: "5px 10px", color: TEXT, fontSize: "0.85rem", outline: "none", width: "70px", textAlign: "center" as const };

  return (
    <div style={{ minHeight: "100vh", background: BG, width: "100%", padding: "40px 48px", position: "relative", overflow: "hidden", color: TEXT }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.6)" }} />
              <h1 style={{ margin: 0, fontSize: "1.9rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: TEXT }}>LEADERBOARD</h1>
            </div>
            <p style={{ margin: "0 0 0 16px", color: MUTED, fontSize: "0.85rem" }}>Update event points and rankings manually</p>
          </div>
          <button onClick={save}
            style={{ background: `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: "#fff", borderRadius: "10px", padding: "12px 22px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(255,77,77,0.35)" }}>
            <TrendingUp size={16} /> Recalculate Rankings
          </button>
        </div>

        {/* LEADERBOARD TABLE */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 2fr 100px 80px 80px 80px", gap: "0", padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.2)" }}>
            {["Rank", "Team", "Event", "Points", "Wins", "Losses", ""].map(h => (
              <span key={h} style={{ fontSize: "0.67rem", fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {entries.map((entry, i) => {
            const rs = rankStyle(entry.rank);
            const isEditing = editId === entry.id;
            return (
              <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 2fr 100px 80px 80px 80px", gap: "0", padding: "14px 20px", borderBottom: i < entries.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                {/* Rank */}
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "0.85rem", ...rs }}>#{entry.rank}</div>

                {/* Team */}
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT }}>{entry.teamName}</span>

                {/* Event */}
                <span style={{ fontSize: "0.8rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.event}</span>

                {/* Points */}
                {isEditing ? (
                  <input type="number" value={entry.points} onChange={e => update(entry.id, "points", Number(e.target.value))} style={inputStyle} />
                ) : (
                  <span style={{ fontWeight: 700, color: ACCENT, fontSize: "0.95rem", cursor: "pointer" }} onClick={() => setEditId(entry.id)}>{entry.points} pts</span>
                )}

                {/* Wins */}
                {isEditing ? (
                  <input type="number" value={entry.wins} onChange={e => update(entry.id, "wins", Number(e.target.value))} style={inputStyle} />
                ) : (
                  <span style={{ color: "#4ade80", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }} onClick={() => setEditId(entry.id)}>W {entry.wins}</span>
                )}

                {/* Losses */}
                {isEditing ? (
                  <input type="number" value={entry.losses} onChange={e => update(entry.id, "losses", Number(e.target.value))} style={inputStyle} />
                ) : (
                  <span style={{ color: "#f87171", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }} onClick={() => setEditId(entry.id)}>L {entry.losses}</span>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {isEditing ? (
                    <button onClick={save} style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Save size={11} /> Save
                    </button>
                  ) : (
                    <button onClick={() => remove(entry.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", display: "flex" }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ color: "#4b5563", fontSize: "0.78rem", marginTop: "14px" }}>
          Click on any Points / Wins / Losses value to edit inline. Click "Recalculate Rankings" to re-sort by points.
        </p>
      </div>
    </div>
  );
}