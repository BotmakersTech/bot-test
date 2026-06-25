// import { useState } from "react";
// import { CheckCircle, Save } from "lucide-react";

// const BG = "#3a3a3a";
// const CARD = "rgba(0,0,0,0.22)";
// const BORDER = "rgba(255,255,255,0.08)";
// const ACCENT = "#fa4715";
// const ACCENT2 = "#f97316";
// const TEXT = "#ffffff";
// const MUTED = "#9ca3af";

// const dummyMatches = [
//   { id: "1", event: "RoboWars Grand Final 2025", team1: "Apex Ignitors", team2: "Steel Crushers", round: "Semi Final", score1: "", score2: "", winner: "", status: "PENDING" },
//   { id: "2", event: "RoboWars Grand Final 2025", team1: "Volt Riders",   team2: "Sky Hawks",      round: "Semi Final", score1: "", score2: "", winner: "", status: "PENDING" },
//   { id: "3", event: "Drone Soccer League", team1: "Circuit Breakers", team2: "Wire Wolves", round: "Quarter Final", score1: "3", score2: "1", winner: "Circuit Breakers", status: "COMPLETED" },
// ];

// export default function AdminScores() {
//   const [matches, setMatches] = useState(dummyMatches);

//   const update = (id: string, key: string, value: string) => {
//     setMatches(prev => prev.map(m => m.id === id ? { ...m, [key]: value } : m));
//   };

//   const saveScore = (id: string) => {
//     setMatches(prev => prev.map(m => m.id === id && m.winner ? { ...m, status: "COMPLETED" } : m));
//   };

//   const inputStyle = { background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", color: TEXT, fontSize: "0.9rem", outline: "none", width: "64px", textAlign: "center" as const };

//   return (
//     <div style={{ minHeight: "100vh", background: BG, width: "100%", padding: "40px 48px", position: "relative", overflow: "hidden", color: TEXT }}>
//       <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />

//       <div style={{ position: "relative", zIndex: 1 }}>

//         {/* HEADER */}
//         <div style={{ marginBottom: "32px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
//             <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.6)" }} />
//             <h1 style={{ margin: 0, fontSize: "1.9rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.1em", color: TEXT }}>SCORES</h1>
//           </div>
//           <p style={{ margin: "0 0 0 16px", color: MUTED, fontSize: "0.85rem" }}>Enter match scores and declare winners manually</p>
//         </div>

//         {/* MATCHES */}
//         <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
//           {matches.map(match => (
//             <div key={match.id} style={{ background: CARD, border: `1px solid ${match.status === "COMPLETED" ? "rgba(168,85,247,0.25)" : BORDER}`, borderRadius: "16px", padding: "24px" }}>

//               {/* Meta */}
//               <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
//                 <span style={{ fontSize: "0.8rem", color: MUTED }}>{match.event}</span>
//                 <span style={{ color: "#4b5563" }}>•</span>
//                 <span style={{ fontSize: "0.8rem", color: MUTED }}>{match.round}</span>
//                 <span style={{ marginLeft: "auto", background: match.status === "COMPLETED" ? "rgba(168,85,247,0.15)" : "rgba(96,165,250,0.15)", color: match.status === "COMPLETED" ? "#a855f7" : "#60a5fa", borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700 }}>{match.status}</span>
//               </div>

//               {/* Score row */}
//               <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
//                 {/* Team 1 */}
//                 <div style={{ flex: 1, textAlign: "right" }}>
//                   <div style={{ fontWeight: 700, fontSize: "1rem", color: match.winner === match.team1 ? "#4ade80" : TEXT, marginBottom: "8px" }}>{match.team1}</div>
//                   <input type="number" min={0} value={match.score1} onChange={e => update(match.id, "score1", e.target.value)} style={inputStyle} disabled={match.status === "COMPLETED"} />
//                 </div>

//                 <div style={{ fontSize: "1.2rem", fontWeight: 800, color: ACCENT, fontFamily: "'Orbitron', sans-serif", padding: "8px 16px", background: "rgba(250,71,21,0.1)", borderRadius: "10px" }}>VS</div>

//                 {/* Team 2 */}
//                 <div style={{ flex: 1, textAlign: "left" }}>
//                   <div style={{ fontWeight: 700, fontSize: "1rem", color: match.winner === match.team2 ? "#4ade80" : TEXT, marginBottom: "8px" }}>{match.team2}</div>
//                   <input type="number" min={0} value={match.score2} onChange={e => update(match.id, "score2", e.target.value)} style={inputStyle} disabled={match.status === "COMPLETED"} />
//                 </div>
//               </div>

//               {/* Winner select + save */}
//               {match.status !== "COMPLETED" && (
//                 <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "12px" }}>
//                   <div style={{ flex: 1 }}>
//                     <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Declare Winner</div>
//                     <select value={match.winner} onChange={e => update(match.id, "winner", e.target.value)}
//                       style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 14px", color: match.winner ? TEXT : "#6b7280", fontSize: "0.85rem", outline: "none", cursor: "pointer", width: "100%", maxWidth: "280px" }}>
//                       <option value="">Select Winner</option>
//                       <option value={match.team1}>{match.team1}</option>
//                       <option value={match.team2}>{match.team2}</option>
//                       <option value="DRAW">Draw</option>
//                     </select>
//                   </div>
//                   <button onClick={() => saveScore(match.id)}
//                     style={{ background: match.winner ? `linear-gradient(135deg, #ff4d4d, ${ACCENT})` : "rgba(255,255,255,0.06)", border: match.winner ? "none" : `1px solid ${BORDER}`, color: match.winner ? "#fff" : MUTED, borderRadius: "9px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: match.winner ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "7px", boxShadow: match.winner ? "0 4px 16px rgba(255,77,77,0.3)" : "none", alignSelf: "flex-end" }}>
//                     <Save size={14} /> Save Score
//                   </button>
//                 </div>
//               )}

//               {match.status === "COMPLETED" && (
//                 <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px", color: "#4ade80", fontSize: "0.85rem", fontWeight: 600 }}>
//                   <CheckCircle size={16} /> Winner: {match.winner}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }




import { useState } from "react";
import { Trophy } from "lucide-react";

const matches = [
  {
    id: 1,
    event: "RoboWars Grand Final 2025",
    sport: "Combat Robotics",
    round: "Semi Final",
    teamA: "Apex Ignitors",
    teamB: "Steel Crushers",
  },

  {
    id: 2,
    event: "TechBot Championship",
    sport: "Drone Soccer",
    round: "Quarter Final",
    teamA: "Volt Riders",
    teamB: "Sky Hawks",
  },
];

export default function AdminScores() {

const [showScores, setShowScores] =
  useState(false);

  const [selectedMatch, setSelectedMatch] =
    useState<any>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background:
          "linear-gradient(180deg,#3a3a3a,#2f2f2f)",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: "34px",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: "3rem",
            fontWeight: 900,
            margin: 0,
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          SCORES
        </h1>

        <p
          style={{
            color: "#9ca3af",
            marginTop: "10px",
            fontSize: "1rem",
          }}
        >
          Enter match scores and declare winners manually
        </p>
      </div>

      {/* TOP FORM */}

      <div
        style={{
          background:
            "linear-gradient(145deg,#2d2d2d,#252525)",
          border:
            "1px solid rgba(255,91,46,0.25)",
          borderRadius: "30px",
          padding: "32px",
        }}
      >

        {/* TITLE */}

        <h2
          style={{
            color: "#ff5b2e",
            fontSize: "1rem",
            fontWeight: 800,
            marginBottom: "34px",
            letterSpacing: "0.08em",
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          UPDATE SCORES
        </h2>

        {/* GRID */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5,minmax(220px,1fr))",
            gap: "18px",
          }}
        >

          {/* EVENT */}

          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              EVENT
            </label>

            <select
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "16px",
                borderRadius: "16px",
                background: "#111",
                color: "white",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                outline: "none",
                fontSize: "1rem",
              }}
            >
              <option>Select Event</option>

              <option>
                RoboWars Grand Final 2025
              </option>

              <option>
                TechBot Championship
              </option>
            </select>
          </div>

          {/* MATCH */}

          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              MATCH
            </label>

            <select
              onChange={(e) => {

                const match =
                  matches.find(
                    (m) =>
                      m.id ===
                      Number(e.target.value)
                  );

                setSelectedMatch(match);
              }}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "16px",
                borderRadius: "16px",
                background: "#111",
                color: "white",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                outline: "none",
                fontSize: "1rem",
              }}
            >
              <option value="">
                Select Match
              </option>

              {matches.map((match) => (

                <option
                  key={match.id}
                  value={match.id}
                >
                  {match.teamA} VS {match.teamB}
                </option>
              ))}
            </select>
          </div>

          {/* SPORT */}

          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              SPORT
            </label>

            <select
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "16px",
                borderRadius: "16px",
                background: "#111",
                color: "white",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                outline: "none",
                fontSize: "1rem",
              }}
            >
              <option>Select Sport</option>

              <option>
                RoboWars
              </option>

              <option>
                Drone Soccer
              </option>

              <option>
                RC Racing
              </option>
            </select>
          </div>

          {/* ROUND */}

          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              ROUND
            </label>

            <select
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "16px",
                borderRadius: "16px",
                background: "#111",
                color: "white",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                outline: "none",
                fontSize: "1rem",
              }}
            >
              <option>Select Round</option>

              <option>Qualifier</option>
              <option>Quarter Final</option>
              <option>Semi Final</option>
              <option>Final</option>
            </select>
          </div>

          {/* WINNER */}

          <div>
            <label
              style={{
                color: "#9ca3af",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              WINNER
            </label>

            <select
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "16px",
                borderRadius: "16px",
                background: "#111",
                color: "white",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                outline: "none",
                fontSize: "1rem",
              }}
            >
              <option>
                Select Winner
              </option>

              {selectedMatch && (
                <>
                  <option>
                    {selectedMatch.teamA}
                  </option>

                  <option>
                    {selectedMatch.teamB}
                  </option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "34px",
          }}
        >

          <button
            onClick={() =>
              setShowScores(true)
            }
            style={{
              padding: "16px 26px",
              borderRadius: "16px",
              border: "none",
              background:
                "linear-gradient(135deg,#ff5b2e,#ff7a18)",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.95rem",
              boxShadow:
                "0 0 25px rgba(255,91,46,0.25)",
            }}
          >
            Update
          </button>

          <button
            style={{
              padding: "16px 26px",
              borderRadius: "16px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              background:
                "rgba(255,255,255,0.04)",
              color: "#9ca3af",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* SCORE ENTRY */}

     {showScores && selectedMatch && (

  <div
    style={{
      marginTop: "34px",
      background:
        "linear-gradient(145deg,#1a1a1a,#111)",
      border:
        "1px solid rgba(255,255,255,0.06)",
      borderRadius: "30px",
      padding: "32px",
      position: "relative",
      overflow: "hidden",
    }}
  >

    {/* TOP LINE */}

    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background:
          "linear-gradient(to right,#ff5b2e,transparent)",
      }}
    />

    {/* MATCH INFO */}

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
      }}
    >

      <div
        style={{
          color: "#9ca3af",
          fontSize: "0.9rem",
        }}
      >
        {selectedMatch.event}

        <span
          style={{
            margin: "0 10px",
          }}
        >
          •
        </span>

        {selectedMatch.round}
      </div>

      <div
        style={{
          padding: "6px 14px",
          borderRadius: "999px",
          background:
            "rgba(59,130,246,0.15)",
          color: "#60a5fa",
          fontSize: "0.72rem",
          fontWeight: 700,
        }}
      >
        PENDING
      </div>
    </div>

    {/* MATCH */}

    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "1fr auto 1fr",
        alignItems: "center",
        gap: "26px",
      }}
    >

      {/* TEAM A */}

      <div>
        <h2
          style={{
            color: "white",
            marginBottom: "20px",
            fontSize: "2rem",
            fontWeight: 800,
          }}
        >
          {selectedMatch.teamA}
        </h2>

        <input
          type="number"
          placeholder="0"
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "18px",
            border:
              "1px solid rgba(255,255,255,0.06)",
            background: "#0f0f0f",
            color: "white",
            fontSize: "1.4rem",
            fontWeight: 800,
            textAlign: "center",
            outline: "none",
          }}
        />
      </div>

      {/* VS */}

      <div
        style={{
          background:
            "rgba(255,91,46,0.12)",
          padding: "18px 26px",
          borderRadius: "20px",
          color: "#ff5b2e",
          fontSize: "2rem",
          fontWeight: 900,
          boxShadow:
            "0 0 30px rgba(255,91,46,0.2)",
        }}
      >
        VS
      </div>

      {/* TEAM B */}

      <div>
        <h2
          style={{
            color: "white",
            marginBottom: "20px",
            fontSize: "2rem",
            fontWeight: 800,
            textAlign: "right",
          }}
        >
          {selectedMatch.teamB}
        </h2>

        <input
          type="number"
          placeholder="0"
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "18px",
            border:
              "1px solid rgba(255,255,255,0.06)",
            background: "#0f0f0f",
            color: "white",
            fontSize: "1.4rem",
            fontWeight: 800,
            textAlign: "center",
            outline: "none",
          }}
        />
      </div>
    </div>

    {/* SAVE */}

    <button
      style={{
        marginTop: "30px",
        padding: "16px 24px",
        borderRadius: "16px",
        border: "none",
        background:
          "linear-gradient(135deg,#ff5b2e,#ff7a18)",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "0.95rem",
        boxShadow:
          "0 0 25px rgba(255,91,46,0.25)",
      }}
    >
      <Trophy size={18} />
      Save Score
    </button>
  </div>
)}
            </div>
          
  );
}