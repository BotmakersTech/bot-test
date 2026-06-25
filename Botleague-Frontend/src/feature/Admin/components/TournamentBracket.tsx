// import { useState, useRef, useCallback } from "react";
// import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// import {
//   ArrowLeft, Zap, Flame, Swords, Plus, Trash2,
//   ChevronRight, Trophy, Users, Shield, CheckCircle2, X,
// } from "lucide-react";

// // ─── Design Tokens ─────────────────────────────────────────────────────────────
// const T = {
//   bg:       "#3a3a3a",
//   surface:  "#2e2e2e",
//   surface2: "#272727",
//   card:     "#323232",
//   border:   "rgba(255,255,255,0.08)",
//   accent:   "#fa4715",
//   accent2:  "#f97316",
//   green:    "#4ade80",
//   text:     "#ffffff",
//   muted:    "#9ca3af",
//   dimmed:   "rgba(255,255,255,0.16)",
//   font:     "'Orbitron', sans-serif",
// } as const;

// // ─── Event data ────────────────────────────────────────────────────────────────
// const EVENTS: Record<string, string> = {
//   "1": "RoboWars Grand Final 2025",
//   "2": "Drone Soccer League",
//   "3": "Line Follower Open 2025",
//   "4": "Robot Race Championship",
//   "5": "Sumo Bot Clash 2025",
//   "6": "Maze Solver Nationals",
// };

// // ─── Types ─────────────────────────────────────────────────────────────────────
// type Format = "single" | "double" | "roundrobin";

// interface Team  { id: string; name: string; seed: number }
// interface Match {
//   id: string; round: number; matchIndex: number;
//   team1: Team | null; team2: Team | null;
//   winner: Team | null; score1: string; score2: string; isBye: boolean;
// }

// // ─── Layout constants ──────────────────────────────────────────────────────────
// const CARD_W = 200;   // match card width
// const CARD_H = 72;    // match card height (two rows of 36)
// const ROW_H  = 36;    // single team row height
// const COL_GAP = 56;   // horizontal gap between columns (connector zone)
// const MIN_VGAP = 16;  // minimum vertical gap between cards in round 0

// // Vertical centre of match (rIdx, mIdx)
// function matchCY(rIdx: number, mIdx: number,): number {
//   // Each slot in round rIdx spans 2^rIdx slots of round 0
//   // const slots0 = r0Count; // total matches in round 0
//   const h0 = CARD_H + MIN_VGAP; // height of one round-0 slot
//   const span = Math.pow(2, rIdx);
//   const slotH = span * h0;
//   return mIdx * slotH + slotH / 2;
// }

// // ─── Helpers ───────────────────────────────────────────────────────────────────
// const gid = () => Math.random().toString(36).slice(2, 9);
// const pow2 = (n: number) => { let p = 1; while (p < n) p *= 2; return p; };

// function genSingle(teams: Team[]): Match[][] {
//   const n = pow2(teams.length);
//   const padded = [...teams];
//   while (padded.length < n)
//     padded.push({ id: "bye-" + gid(), name: "BYE", seed: padded.length + 1 });

//   const rounds: Match[][] = [];
//   let cur: (Team | null)[] = padded;
//   let ri = 0;

//   while (cur.length > 1) {
//     const ms: Match[] = [];
//     const nxt: (Team | null)[] = [];
//     for (let i = 0; i < cur.length; i += 2) {
//       const t1 = cur[i], t2 = cur[i + 1];
//       const isBye = t1?.name === "BYE" || t2?.name === "BYE";
//       const autoW = t1?.name === "BYE" ? t2 : t2?.name === "BYE" ? t1 : null;
//       ms.push({
//         id: gid(), round: ri, matchIndex: i / 2,
//         team1: t1?.name === "BYE" ? null : (t1 ?? null),
//         team2: t2?.name === "BYE" ? null : (t2 ?? null),
//         winner: autoW ?? null, score1: "", score2: "", isBye,
//       });
//       nxt.push(autoW ?? null);
//     }
//     rounds.push(ms); cur = nxt; ri++;
//   }
//   return rounds;
// }

// function genRR(teams: Team[]): Match[][] {
//   const n = teams.length % 2 === 0 ? teams.length : teams.length + 1;
//   const padded = [...teams];
//   if (teams.length % 2 !== 0)
//     padded.push({ id: "bye-" + gid(), name: "BYE", seed: n });
//   const fixed = padded[0];
//   const rotating = padded.slice(1);
//   const rounds: Match[][] = [];
//   for (let r = 0; r < n - 1; r++) {
//     const circle = [fixed, ...rotating];
//     const round: Match[] = [];
//     for (let i = 0; i < n / 2; i++) {
//       const t1 = circle[i], t2 = circle[n - 1 - i];
//       if (t1.name !== "BYE" && t2.name !== "BYE")
//         round.push({ id: gid(), round: r, matchIndex: i, team1: t1, team2: t2, winner: null, score1: "", score2: "", isBye: false });
//     }
//     if (round.length > 0) rounds.push(round);
//     rotating.unshift(rotating.pop()!);
//   }
//   return rounds;
// }

// function roundLabel(ri: number, total: number, fmt: Format) {
//   if (fmt === "roundrobin") return `Round ${ri + 1}`;
//   const r = total - ri;
//   if (r === 1) return "Grand Final";
//   if (r === 2) return "Semifinal";
//   if (r === 3) return "Quarterfinal";
//   return `Round of ${Math.pow(2, r)}`;
// }

// // ─── Match Card ───────────────────────────────────────────────────────────────
// function MatchCard({
//   match, hovered, onHover, onClick,
// }: {
//   match: Match; hovered: boolean;
//   onHover: (id: string | null) => void;
//   onClick: (m: Match) => void;
// }) {
//   const hasW = !!match.winner;

//   // BYE card — show as ghost
//   if (match.isBye && !match.team1 && !match.team2) {
//     return (
//       <div style={{
//         width: CARD_W, height: CARD_H,
//         border: "1px dashed rgba(255,255,255,.06)",
//         borderRadius: 8, display: "flex", alignItems: "center",
//         justifyContent: "center", color: "rgba(255,255,255,.12)",
//         fontSize: "0.6rem", letterSpacing: "0.18em", fontFamily: T.font,
//       }}>BYE</div>
//     );
//   }

//   const TeamRow = ({ team, score, isWinner }: { team: Team | null; score: string; isWinner: boolean }) => {
//     const won  = hasW && isWinner;
//     const lost = hasW && !isWinner && !!team;
//     return (
//       <div style={{
//         height: ROW_H, display: "flex", alignItems: "center",
//         justifyContent: "space-between", padding: "0 10px",
//         background: won ? "rgba(74,222,128,.07)" : lost ? "rgba(0,0,0,.15)" : "transparent",
//         position: "relative",
//       }}>
//         {won && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: T.green, borderRadius: "0 1px 1px 0" }} />}
//         <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
//           {team ? (
//             <>
//               <span style={{
//                 width: 18, height: 18, borderRadius: 4, flexShrink: 0,
//                 background: won ? "rgba(74,222,128,.1)" : T.surface2,
//                 border: `1px solid ${won ? "rgba(74,222,128,.3)" : T.border}`,
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 fontSize: "0.5rem", color: won ? T.green : T.muted,
//                 fontWeight: 700, fontFamily: T.font,
//               }}>{team.seed}</span>
//               <span style={{
//                 fontSize: "0.75rem", fontWeight: won ? 700 : 400,
//                 color: won ? T.text : lost ? "#b8b9bb": T.muted,
//                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
//               }}>{team.name}</span>
//             </>
//           ) : (
//             <span style={{ fontSize: "0.62rem", color: "#878787", fontStyle: "italic" }}>TBD</span>
//           )}
//         </div>
//         {hasW && team && (
//           <span style={{ fontSize: "0.68rem", fontWeight: 700, color: won ? T.green : "rgba(255,255,255,.18)", marginLeft: 6, fontFamily: "monospace" }}>
//             {score || "—"}
//           </span>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div
//       onMouseEnter={() => onHover(match.id)}
//       onMouseLeave={() => onHover(null)}
//       onClick={() => onClick(match)}
//       style={{
//         width: CARD_W, height: CARD_H,
//         background: T.card,
//         border: `1px solid ${hovered ? `${T.accent}70` : hasW ? "rgba(74,222,128,.2)" : T.border}`,
//         borderRadius: 8, overflow: "hidden", cursor: "pointer",
//         transition: "border-color 0.15s, box-shadow 0.15s",
//         boxShadow: hovered ? `0 0 18px ${T.accent}20` : "none",
//         position: "relative",
//       }}
//     >
//       // eslint-disable-next-line react-hooks/static-components
//       <TeamRow team={match.team1} score={match.score1} isWinner={match.winner?.id === match.team1?.id} />
//       <div style={{ height: 1, background: T.border, margin: "0 8px" }} />
//       <TeamRow team={match.team2} score={match.score2} isWinner={match.winner?.id === match.team2?.id} />
//     </div>
//   );
// }

// // ─── SVG Connectors ───────────────────────────────────────────────────────────
// // Draws bracket connector lines between two rounds
// function Connectors({
  
//   toMatches,
//   r0Count,
//   fromRIdx,
// }: {
//   fromMatches: Match[];
//   toMatches: Match[];
//   r0Count: number;
//   fromRIdx: number;
// }) {

//   const W = COL_GAP + 40;
//   const totalH0 =
//     r0Count * (CARD_H + MIN_VGAP);

//   const H = totalH0 + 120;

//   const paths: string[] = [];

//   toMatches.forEach((toMatch, tIdx) => {

//   const toCY =
//     matchCY(
//       fromRIdx + 1,
//       tIdx,
//       r0Count
//     );

//   const child1CY =
//     matchCY(
//       fromRIdx,
//       tIdx * 2,
//       r0Count
//     );

//   const child2CY =
//     matchCY(
//       fromRIdx,
//       tIdx * 2 + 1,
//       r0Count
//     );

//   const startX = 0;

//   const endX = W;

//   const midX = W * 0.45;

//   // SINGLE COMPLETE BRACKET CONNECTOR

//   paths.push(`
//     M ${startX} ${child1CY}
//     H ${midX}
//     V ${child2CY}
//     M ${midX} ${toCY}
//     H ${endX}
//   `);

//  paths.push(`
//   M ${startX} ${child2CY}
//   H ${midX}
//   V ${toCY}
//   H ${endX}
// `);
// });
 

//   return (
//     <svg
//       width={W}
//       height={H}
//       style={{
//         flexShrink: 0,
//         overflow: "visible",
//         zIndex: 0,
//       }}
//     >
//       {paths.map((d, i) => (
//         <path
//           key={i}
//           d={d}
//           fill="none"
//           stroke="url(#lineGradient)"
//           strokeWidth={1}
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           opacity={0.95}
//         //   filter="drop-shadow(0 0 8px rgba(255,91,46,0.45))"
//         />
//       ))}

//       <defs>
//         <linearGradient
//           id="lineGradient"
//           x1="0%"
//           y1="0%"
//           x2="100%"
//           y2="0%"
//         >
//           <stop
//             offset="0%"
//             stopColor="#ff0000ec"
//           />

//           <stop
//             offset="100%"
//             stopColor="#ff0000ec"
//           />
//         </linearGradient>
//       </defs>
//     </svg>
//   );
// }

//     // ─── Champion card ─────────────────────────────────────────────────────────────

//    function ChampionCard({
//   team,
// }: {
//   team: Team | null;
// }) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: 12,
//       }}
//     >
//       <div
//         style={{
//           fontSize: "0.52rem",
//           letterSpacing: "0.18em",
//           color: T.accent,
//           fontWeight: 700,
//           fontFamily: T.font,
//         }}
//       >
//         CHAMPION
//       </div>

//       <div
//         style={{
//           width: CARD_W + 20,
//           minHeight: CARD_H + 20,
//           background: team
//             ? "rgba(74,222,128,.06)"
//             : T.card,
//           border: `1px solid ${
//             team
//               ? "rgba(74,222,128,.25)"
//               : T.border
//           }`,
//           borderRadius: 12,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           gap: 10,
//           padding: 16,
//         }}
//       >
//         <Trophy
//           size={26}
//           color={
//             team
//               ? T.green
//               : "rgba(255,255,255,.12)"
//           }
//         />

//         {team ? (
//           <>
//             <span
//               style={{
//                 fontSize: "0.62rem",
//                 color: T.green,
//                 fontWeight: 700,
//                 fontFamily: T.font,
//                 letterSpacing: "0.1em",
//               }}
//             >
//               WINNER
//             </span>

//             <span
//               style={{
//                 fontSize: "0.92rem",
//                 fontWeight: 700,
//                 color: T.text,
//                 textAlign: "center",
//               }}
//             >
//               {team.name}
//             </span>
//           </>
//         ) : (
//           <span
//             style={{
//               fontSize: "0.7rem",
//               color: "#878787",
//               fontStyle: "italic",
//             }}
//           >
//             TBD
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Match Modal ──────────────────────────────────────────────────────────────
// function MatchModal({ match, matchNumber, rlabel, onClose, onSave }: {
//   match: Match; matchNumber: number; rlabel: string;
//   onClose: () => void;
//   onSave: (winnerId: string, s1: string, s2: string) => void;
// }) {
//   const [selected, setSelected] = useState<string | null>(match.winner?.id ?? null);
//   const [s1, setS1] = useState(match.score1);
//   const [s2, setS2] = useState(match.score2);
//   const canSave = !!selected && !!(match.team1 && match.team2);

//   const Corner = ({ team, side, score, setScore }: {
//     team: Team | null; side: "red" | "blue"; score: string; setScore: (v: string) => void;
//   }) => {
//     const sel = selected === team?.id;
//     const clr = side === "red" ? "#ef4444" : "#3b82f6";
//     return (
//       <div
//         onClick={() => team && setSelected(team.id)}
//         style={{
//           flex: 1, borderRadius: 14, padding: "20px 14px",
//           background: sel ? (side === "red" ? "rgba(239,68,68,.13)" : "rgba(59,130,246,.13)") : "rgba(0,0,0,.22)",
//           border: `2px solid ${sel ? clr : "rgba(255,255,255,.07)"}`,
//           cursor: team ? "pointer" : "default",
//           transition: "all 0.18s", position: "relative", textAlign: "center",
//         }}
//       >
//         {sel && (
//           <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#fff", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", padding: "2px 10px", borderRadius: 20, fontFamily: T.font, whiteSpace: "nowrap" }}>
//             WINNER
//           </div>
//         )}
//         <div style={{ fontSize: "0.52rem", letterSpacing: "0.14em", color: clr, fontWeight: 700, fontFamily: T.font, marginBottom: 10, marginTop: sel ? 18 : 0 }}>
//           {side === "red" ? "RED CORNER" : "BLUE CORNER"}
//         </div>
//         <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${clr}25,rgba(0,0,0,.35))`, border: `2px solid ${clr}40`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
//           🤖
//         </div>
//         <div style={{ fontSize: "0.92rem", fontWeight: 700, color: T.text, marginBottom: 4 }}>{team?.name || "TBD"}</div>
//         {team && (
//           <input
//             value={score} onChange={e => setScore(e.target.value)} onClick={e => e.stopPropagation()}
//             placeholder="Score"
//             style={{ marginTop: 10, width: 64, background: "rgba(0,0,0,.38)", border: `1px solid ${clr}40`, borderRadius: 7, padding: "5px 8px", color: T.text, fontSize: "0.9rem", fontWeight: 700, textAlign: "center", fontFamily: "monospace", outline: "none" }}
//           />
//         )}
//       </div>
//     );
//   };

//   return (
//     <div
//       style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}
//       onClick={onClose}
//     >
//       <div
//         style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: "28px 22px", width: 560, maxWidth: "94vw", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,.8)" }}
//         onClick={e => e.stopPropagation()}
//       >
//         {/* top gradient bar */}
//         <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right,${T.accent},${T.accent2},transparent)`, borderRadius: "18px 18px 0 0" }} />

//         <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: T.muted, cursor: "pointer", display: "flex" }}><X size={17} /></button>

//         <div style={{ marginBottom: 20, paddingTop: 4 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <span style={{ fontSize: "1.05rem", fontWeight: 700, color: T.text }}>Match {matchNumber}</span>
//             <span style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px", fontSize: "0.58rem", color: T.muted, fontWeight: 700, letterSpacing: "0.06em" }}>M{matchNumber}</span>
//           </div>
//           <div style={{ fontSize: "0.6rem", color: T.muted, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
//             {rlabel} • {match.winner ? "COMPLETED" : "PENDING"}
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 16 }}>
//           <Corner team={match.team1} side="red"  score={s1} setScore={setS1} />
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 900, color: "rgba(255,255,255,.15)", fontFamily: T.font, flexShrink: 0 }}>VS</div>
//           <Corner team={match.team2} side="blue" score={s2} setScore={setS2} />
//         </div>

//         <div style={{ background: "rgba(0,0,0,.2)", border: "1px solid rgba(45, 45, 45, 0.06)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//           <div>
//             <div style={{ fontSize: "0.5rem", letterSpacing: "0.12em", color: T.muted, marginBottom: 3, textTransform: "uppercase" }}>DECISION METHOD</div>
//             <div style={{ fontSize: "0.84rem", fontWeight: 700, color: T.text }}>Knockout</div>
//           </div>
//           {match.winner && (
//             <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.green, fontSize: "0.68rem", fontWeight: 700 }}>
//               <CheckCircle2 size={13} color={T.green} /> Result Saved
//             </div>
//           )}
//         </div>

//         <div style={{ display: "flex", gap: 10 }}>
//           <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,.04)", border: `1px solid ${T.border}`, borderRadius: 9, padding: "11px", color: T.muted, fontSize: "0.72rem", cursor: "pointer", fontFamily: T.font, letterSpacing: "0.06em" }}>
//             CANCEL
//           </button>
//           <button
//             onClick={() => canSave && onSave(selected!, s1, s2)}
//             disabled={!canSave}
//             style={{ flex: 2, background: canSave ? `linear-gradient(135deg,${T.accent},${T.accent2})` : "rgba(255,255,255,.05)", border: "none", borderRadius: 9, padding: "11px", color: canSave ? "#fff" : "rgba(255,255,255,.18)", fontSize: "0.72rem", fontWeight: 700, cursor: canSave ? "pointer" : "default", fontFamily: T.font, letterSpacing: "0.08em", boxShadow: canSave ? `0 4px 18px ${T.accent}30` : "none", transition: "all 0.2s" }}
//           >
//             {match.winner ? "UPDATE RESULT" : "CONFIRM WINNER"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Format buttons ────────────────────────────────────────────────────────────
// const FMT: Record<Format, { label: string; sub: string; Icon: any }> = {
//   single:     { label: "Single Elimination", sub: "One loss — you're out",   Icon: Zap    },
//   double:     { label: "Double Elimination", sub: "Two losses to eliminate", Icon: Flame  },
//   roundrobin: { label: "Round Robin",        sub: "Everyone faces everyone", Icon: Swords },
// };

// // ─── Reusable setup components ────────────────────────────────────────────────
// const inputBase: React.CSSProperties = {
//   background: "#272727", border: `1px solid ${T.border}`, borderRadius: 8,
//   padding: "9px 13px", color: T.text, fontSize: "0.8rem",
//   fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
// };

// function Section({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
//   return (
//     <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22, marginBottom: 14 }}>
//       <div style={{ fontSize: "0.54rem", letterSpacing: "0.16em", color: T.accent, fontWeight: 700, marginBottom: 18, textTransform: "uppercase", fontFamily: T.font, display: "flex", alignItems: "center", gap: 6 }}>
//         {label}
//       </div>
//       {children}
//     </div>
//   );
// }

// function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: "148px 1fr", alignItems: "center", gap: 12, marginBottom: 14 }}>
//       <span style={{ fontSize: "0.76rem", color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>{label}</span>
//       {children}
//     </div>
//   );
// }

// // ─── BRACKET VIEW ─────────────────────────────────────────────────────────────
// function BracketView({
//   rounds, format, onClickMatch,
// }: {
//   rounds: Match[][];
//   format: Format;
//   onClickMatch: (m: Match, rIdx: number, mIdx: number) => void;
// }) {
//   const [hovered, setHovered] = useState<string | null>(null);
//   const r0Count = rounds[0]?.length ?? 1;

//   // total SVG canvas height based on round 0
//   const totalH = r0Count * (CARD_H + MIN_VGAP);

//   // Build columns: for each round, position cards absolutely inside a div of height totalH
//   const columns = rounds.map((round, rIdx) => {
//     const cards = round.map((match, mIdx) => {
//       const cy = matchCY(rIdx, mIdx, r0Count);
//       const top = cy - CARD_H / 2;
//       return (
//         <div key={match.id} style={{ position: "absolute", top, left: 0 }}>
//           <MatchCard
//             match={match}
//             hovered={hovered === match.id}
//             onHover={setHovered}
//             onClick={m => onClickMatch(m, rIdx, mIdx)}
//           />
//         </div>
//       );
//     });
//     return (
//       <div key={rIdx} style={{ position: "relative", width: CARD_W, height: totalH, flexShrink: 0 }}>
//         {cards}
//       </div>
//     );
//   });

//   // Interleave columns with connector SVGs
//   const elements: React.ReactNode[] = [];
//   columns.forEach((col, rIdx) => {
//     elements.push(col);
//     if (rIdx < rounds.length - 1) {
//       elements.push(
//         <Connectors
//           key={`con-${rIdx}`}
//           fromMatches={rounds[rIdx]}
//           toMatches={rounds[rIdx + 1]}
//           r0Count={r0Count}
//           fromRIdx={rIdx}
//         />
//       );
//     }
//   });

//   // Champion card at the end
//  const champion =
//   rounds[rounds.length - 1]?.[0]?.winner ?? null;

// const finalCY = matchCY(
//   rounds.length - 1,
//   0,
//   rounds[0].length
// );

// elements.push(
//   <div
//     key="champion"
//     style={{
//       flexShrink: 0,
//       display: "flex",
//       alignItems: "flex-start",
//       paddingLeft: 0,
//     }}
//   >

//     {/* DYNAMIC CONNECTOR */}
//     <svg
//       width={100}
//       height={finalCY + 100}
//       style={{
//         overflow: "visible",
//         flexShrink: 0,
//       }}
//     >
//       <path
//         d={`
//           M 0 ${finalCY}
//           H 140
//         `}
//         fill="none"
//         stroke="#ff0000ec"
//         strokeWidth={1}
//         strokeLinecap="round"
//       />
//     </svg>

//     {/* CHAMPION */}
//     <div
//       style={{
//         marginTop: finalCY -75,
//       }}
//     >
//       <ChampionCard team={champion} />
//     </div>

//   </div>
// );
//   return (
//     <div style={{ display: "flex", alignItems: "flex-start", paddingBottom: 24 }}>
//       {elements}
//     </div>
//   );
// }

// // ─── ROUND LABELS row ─────────────────────────────────────────────────────────
// function RoundLabels({ rounds, format }: { rounds: Match[][]; format: Format }) {
//   return (
//     <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 18 }}>
//       {rounds.map((_, rIdx) => (
//         <div key={rIdx} style={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
//           <div style={{ width: CARD_W, textAlign: "center", fontSize: "0.56rem", letterSpacing: "0.16em", color: T.accent, fontWeight: 700, fontFamily: T.font, textTransform: "uppercase" }}>
//             {roundLabel(rIdx, rounds.length, format)}
//           </div>
//           {rIdx < rounds.length - 1 && <div style={{ width: COL_GAP }} />}
//         </div>
//       ))}
//       {/* Champion label */}
//       <div style={{ width: COL_GAP / 2 }} />
//     </div>
//   );
// }

// // ─── MAIN ──────────────────────────────────────────────────────────────────────
// export default function TournamentBracket() {
//   const { eventId }    = useParams<{ eventId: string }>();
//   const [searchParams] = useSearchParams();
//   const navigate       = useNavigate();

//   const eventName = eventId ? (EVENTS[eventId] || decodeURIComponent(eventId)) : "Tournament";
//   const sport     = searchParams.get("sport") || "";

//   // Pre-filled from CreateMatch page via URL params
//   const urlFormat  = (searchParams.get("format") as Format | null) || "single";
//   const urlTeamsRaw = searchParams.get("teams");
//   const urlTeamNames: string[] = urlTeamsRaw ? (() => { try { return JSON.parse(decodeURIComponent(urlTeamsRaw)); } catch { return []; } })() : [];
//   const comingFromCreate = urlTeamNames.length >= 2;

//   const initTeams: Team[] = comingFromCreate
//     ? urlTeamNames.map((name, i) => ({ id: gid(), name, seed: i + 1 }))
//     : Array.from({ length: 4 }, (_, i) => ({ id: gid(), name: "", seed: i + 1 }));

//   // If coming from CreateMatch, skip setup and go straight to bracket
//   const initPhase: "setup" | "bracket" = comingFromCreate ? "bracket" : "setup";
//   const initRounds: Match[][] = comingFromCreate
//     ? (urlFormat === "roundrobin" ? genRR(initTeams) : genSingle(initTeams))
//     : [];

//   const [phase, setPhase]     = useState<"setup" | "bracket">(initPhase);
//   const [format, setFormat]   = useState<Format>(urlFormat);
//   const [totalInput, setTotalInput] = useState(String(initTeams.length));
//   const [teams, setTeams]     = useState<Team[]>(initTeams);
//   const [rounds, setRounds]   = useState<Match[][]>(initRounds);
//   const [error, setError]     = useState("");
//   const [modalMatch, setModalMatch] = useState<{ match: Match; roundIdx: number; matchIdx: number } | null>(null);
//   const [activeRound, setActiveRound] = useState(0);

//   const applyTotal = (val: string) => {
//     const n = Math.max(2, Math.min(64, Number(val) || 2));
//     setTotalInput(String(n));
//     setTeams(prev => {
//       if (n > prev.length) {
//         const extra = Array.from({ length: n - prev.length }, (_, i) => ({ id: gid(), name: "", seed: prev.length + i + 1 }));
//         return [...prev, ...extra];
//       }
//       return prev.slice(0, n).map((t, i) => ({ ...t, seed: i + 1 }));
//     });
//   };

//   const updateTeam = (id: string, name: string) => setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
//   const addTeam    = () => { const n = teams.length + 1; setTotalInput(String(n)); setTeams(prev => [...prev, { id: gid(), name: "", seed: n }]); };
//   const removeTeam = (id: string) => {
//     if (teams.length <= 2) return;
//     const u = teams.filter(t => t.id !== id).map((t, i) => ({ ...t, seed: i + 1 }));
//     setTeams(u); setTotalInput(String(u.length));
//   };

//   const generate = () => {
//     const filled = teams.filter(t => t.name.trim());
//     if (filled.length < 2) { setError("Please enter at least 2 team names."); return; }
//     setError("");
//     const seeded = filled.map((t, i) => ({ ...t, seed: i + 1 }));
//     setRounds(format === "roundrobin" ? genRR(seeded) : genSingle(seeded));
//     setActiveRound(0);
//     setPhase("bracket");
//   };

//   const handleClickMatch = (match: Match, roundIdx: number, matchIdx: number) => {
//     setModalMatch({ match, roundIdx, matchIdx });
//   };

//   const handleSaveResult = (winnerId: string, s1: string, s2: string) => {
//     if (!modalMatch) return;
//     const { roundIdx, matchIdx } = modalMatch;
//     setRounds(prev => {
//       const next = prev.map(r => r.map(m => ({ ...m })));
//       const m = next[roundIdx][matchIdx];
//       m.winner = m.team1?.id === winnerId ? m.team1 : m.team2;
//       m.score1 = s1; m.score2 = s2;
//       if (format !== "roundrobin" && roundIdx + 1 < next.length) {
//         const nm = next[roundIdx + 1][Math.floor(matchIdx / 2)];
//         if (matchIdx % 2 === 0) nm.team1 = m.winner;
//         else                    nm.team2 = m.winner;
//         nm.winner = null; nm.score1 = ""; nm.score2 = "";
//       }
//       return next;
//     });
//     setModalMatch(null);
//   };

//   const bracketRef = useRef<HTMLDivElement>(null);

//   const handleDownload = useCallback(() => {
//     // Use html2canvas if available, else fallback to print
//     const el = bracketRef.current;
//     if (!el) return;
//     // Try print-based download
//     const printWin = window.open("", "_blank");
//     if (!printWin) return;
//     printWin.document.write(`
//       <html><head><title>${eventName} - ${sport} Bracket</title>
//       <style>
//         body { margin:0; background:#3a3a3a; color:#fff; font-family:sans-serif; }
//         @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
//       </style>
//       <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
//       </head><body>
//       ${el.outerHTML}
//       <script>setTimeout(()=>{window.print();window.close();},600);<\/script>
//       </body></html>
//     `);
//     printWin.document.close();
//   }, [eventName, sport]);

//   const totalMatches = rounds.reduce((a, r) => a + r.length, 0);
//   const doneMatches  = rounds.flat().filter(m => m.winner).length;
//   const filledTeams  = teams.filter(t => t.name.trim()).length;

//   // ── SETUP ───────────────────────────────────────────────────────────────────
//   if (phase === "setup") return (
//     <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "inherit", position: "relative" }}>
//       <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right,${T.accent},${T.accent2},transparent)` }} />
//       <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 28px" }}>
//         <button
//           onClick={() => navigate(-1)}
//           style={{ background: "none", border: "none", color: T.muted, fontSize: "0.7rem", cursor: "pointer", fontFamily: T.font, marginBottom: 28, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.06em", padding: 0 }}
//           onMouseEnter={e => (e.currentTarget.style.color = T.text)}
//           onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
//         >
//           <ArrowLeft size={13} /> BACK
//         </button>

//         <div style={{ marginBottom: 28 }}>
//           <div style={{ fontSize: "0.54rem", letterSpacing: "0.18em", color: T.accent, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", fontFamily: T.font, display: "flex", alignItems: "center", gap: 6 }}>
//             <Zap size={10} color={T.accent} /> BRACKET SETUP
//           </div>
//           <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 700, color: T.text, letterSpacing: "0.04em", lineHeight: 1.1, fontFamily: T.font }}>{eventName.toUpperCase()}</h1>
//           {sport && <div style={{ fontSize: "0.72rem", color: T.accent2, fontWeight: 600, marginTop: 6, letterSpacing: "0.06em" }}>{sport}</div>}
//         </div>

//         <Section label={<><Shield size={10} color={T.accent} /> Bracket Information</>}>
//           <Row label={<><Shield size={13} color={T.muted} /> Event Name</>}>
//             <div style={{ ...inputBase, opacity: 0.6 }}>{eventName}</div>
//           </Row>
//           {sport && (
//             <Row label={<><Swords size={13} color={T.muted} /> Sport</>}>
//               <div style={{ ...inputBase, color: T.accent2, fontWeight: 600 }}>{sport}</div>
//             </Row>
//           )}
//           <Row label={<><Users size={13} color={T.muted} /> Total Teams</>}>
//             <input
//               type="number" min={2} max={64} value={totalInput}
//               onChange={e => applyTotal(e.target.value)}
//               onBlur={e => applyTotal(e.target.value)}
//               style={{ ...inputBase, width: 100, boxSizing: "border-box" }}
//               onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}55`)}
//             />
//           </Row>
//         </Section>

//         <Section label={<><Zap size={10} color={T.accent} /> Bracket Type</>}>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
//             {(Object.keys(FMT) as Format[]).map(fmt => {
//               const { label, sub, Icon } = FMT[fmt];
//               const active = format === fmt;
//               return (
//                 <div
//                   key={fmt} onClick={() => setFormat(fmt)}
//                   style={{ background: active ? "rgba(250,71,21,.1)" : T.surface2, border: `1px solid ${active ? T.accent : T.border}`, borderRadius: 12, padding: "18px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.18s", boxShadow: active ? `0 0 18px ${T.accent}18` : "none", position: "relative" }}
//                 >
//                   {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right,${T.accent},${T.accent2})`, borderRadius: "12px 12px 0 0" }} />}
//                   <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Icon size={20} color={active ? T.accent : T.muted} /></div>
//                   <div style={{ fontSize: "0.66rem", fontWeight: 700, color: active ? T.accent : T.muted, marginBottom: 4, fontFamily: T.font, letterSpacing: "0.04em" }}>{label}</div>
//                   <div style={{ fontSize: "0.58rem", color: "#6b7280", lineHeight: 1.4 }}>{sub}</div>
//                 </div>
//               );
//             })}
//           </div>
//         </Section>

//         <Section label={
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
//             <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={10} color={T.accent} /> Teams</span>
//             <span style={{ fontSize: "0.64rem", color: filledTeams === teams.length ? T.green : T.muted, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", fontWeight: 400 }}>
//               {filledTeams === teams.length && <CheckCircle2 size={10} color={T.green} />}
//               {filledTeams} / {teams.length} filled
//             </span>
//           </div>
//         }>
//           <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 300, overflowY: "auto" }}>
//             {teams.map(team => (
//               <div key={team.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <div style={{ width: 30, height: 30, borderRadius: 7, background: T.surface2, border: `1px solid rgba(250,71,21,.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: T.accent, fontWeight: 700, flexShrink: 0, fontFamily: T.font }}>
//                   #{team.seed}
//                 </div>
//                 <input
//                   value={team.name} onChange={e => updateTeam(team.id, e.target.value)}
//                   placeholder={`Team ${team.seed} name...`}
//                   style={{ flex: 1, ...inputBase }}
//                   onFocus={e => (e.currentTarget.style.borderColor = `${T.accent}55`)}
//                   onBlur={e => (e.currentTarget.style.borderColor = T.border)}
//                 />
//                 <button
//                   onClick={() => removeTeam(team.id)} disabled={teams.length <= 2}
//                   style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.18)", color: teams.length <= 2 ? "rgba(255,255,255,.1)" : "#f87171", borderRadius: 7, padding: "6px 7px", cursor: teams.length <= 2 ? "default" : "pointer", display: "flex", alignItems: "center" }}
//                 >
//                   <Trash2 size={13} />
//                 </button>
//               </div>
//             ))}
//           </div>
//           <button
//             onClick={addTeam}
//             style={{ background: "none", border: `1px dashed rgba(250,71,21,.25)`, borderRadius: 9, padding: "9px 16px", color: T.muted, fontSize: "0.7rem", cursor: "pointer", fontFamily: T.font, width: "100%", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
//             onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
//             onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,71,21,.25)"; e.currentTarget.style.color = T.muted; }}
//           >
//             <Plus size={13} /> ADD TEAM
//           </button>
//         </Section>

//         {error && <p style={{ color: "#f87171", fontSize: "0.74rem", textAlign: "center", marginBottom: 12 }}>{error}</p>}

//         <button
//           onClick={generate}
//           style={{ width: "100%", background: `linear-gradient(135deg,${T.accent},${T.accent2})`, border: "none", borderRadius: 10, padding: "14px", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: T.font, letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: `0 4px 24px ${T.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
//         >
//           <Zap size={14} /> CREATE MATCH <ChevronRight size={14} />
//         </button>
//       </div>
//     </div>
//   );

//   // ── BRACKET ──────────────────────────────────────────────────────────────────
//   const Header = () => (
//     <div style={{ background: "rgba(0,0,0,.3)", borderBottom: `1px solid ${T.border}`, padding: "0 28px", position: "relative", flexShrink: 0 }}>
//       <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right,${T.accent},${T.accent2},transparent)` }} />
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//           <button
//             onClick={() => setPhase("setup")}
//             style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 12px", color: T.muted, fontSize: "0.64rem", cursor: "pointer", fontFamily: T.font, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5 }}
//           >
//             <ArrowLeft size={11} /> EDIT
//           </button>
//           <div style={{ width: 3, height: 28, background: `linear-gradient(to bottom,${T.accent},${T.accent2})`, borderRadius: 2 }} />
//           <div>
//             <div style={{ fontSize: "0.48rem", letterSpacing: "0.18em", color: T.accent, fontWeight: 700, marginBottom: 2, textTransform: "uppercase", fontFamily: T.font, display: "flex", alignItems: "center", gap: 4 }}>
//               <Zap size={8} color={T.accent} /> LIVE BRACKET
//             </div>
//             <h1 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: T.text, letterSpacing: "0.04em", fontFamily: T.font }}>{eventName.toUpperCase()}</h1>
//           </div>
//           <div style={{ display: "flex", gap: 6 }}>
//             {sport && <span style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 9px", fontSize: "0.56rem", color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sport}</span>}
//             <span style={{ background: "rgba(250,71,21,.1)", border: `1px solid rgba(250,71,21,.28)`, borderRadius: 6, padding: "3px 9px", fontSize: "0.56rem", color: T.accent, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: T.font }}>{FMT[format].label}</span>
//           </div>
//         </div>
//         <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
//           {[
//             { v: teams.filter(t => t.name.trim()).length, l: "TEAMS" },
//             { v: totalMatches, l: "MATCHES" },
//             { v: doneMatches, l: "DONE" },
//           ].map(s => (
//             <div key={s.l} style={{ textAlign: "center" }}>
//               <div style={{ fontSize: "1rem", fontWeight: 700, color: T.accent, lineHeight: 1, fontFamily: T.font }}>{s.v}</div>
//               <div style={{ fontSize: "0.48rem", letterSpacing: "0.12em", color: T.muted, marginTop: 2, fontFamily: T.font }}>{s.l}</div>
//             </div>
//           ))}
//           <button
//             onClick={handleDownload}
//             title="Download Bracket"
//             style={{ marginLeft: 8, background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.3)", borderRadius: 8, padding: "6px 14px", color: T.accent, fontSize: "0.58rem", fontWeight: 700, cursor: "pointer", fontFamily: T.font, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
//             onMouseEnter={e => { e.currentTarget.style.background = "rgba(250,71,21,0.2)"; }}
//             onMouseLeave={e => { e.currentTarget.style.background = "rgba(250,71,21,0.1)"; }}
//           >
//             ⬇ DOWNLOAD
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   // Round Robin view
//   if (format === "roundrobin") {
//     return (
//       <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
//         <Header />
//         <div ref={bracketRef} style={{ padding: "24px 28px", flex: 1 }}>
//           {/* Round tabs */}
//           <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
//             {rounds.map((_, rIdx) => {
//               const done = rounds[rIdx].filter(m => m.winner).length;
//               const tot  = rounds[rIdx].length;
//               const all  = done === tot;
//               const act  = activeRound === rIdx;
//               return (
//                 <button
//                   key={rIdx} onClick={() => setActiveRound(rIdx)}
//                   style={{ background: act ? "rgba(250,71,21,.15)" : T.surface, border: `1px solid ${act ? T.accent : all ? "rgba(74,222,128,.28)" : T.border}`, borderRadius: 8, padding: "6px 14px", color: act ? T.accent : all ? T.green : T.muted, fontSize: "0.64rem", fontWeight: 700, cursor: "pointer", fontFamily: T.font, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
//                 >
//                   {all && <CheckCircle2 size={9} color={T.green} />}
//                   ROUND {rIdx + 1} <span style={{ opacity: 0.5 }}>({done}/{tot})</span>
//                 </button>
//               );
//             })}
//           </div>

//           {/* Match grid */}
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
//             {rounds[activeRound]?.map((match, mIdx) => {
//               const matchNum = rounds.slice(0, activeRound).reduce((a, r) => a + r.length, 0) + mIdx + 1;
//               return (
//                 <div
//                   key={match.id}
//                   onClick={() => handleClickMatch(match, activeRound, mIdx)}
//                   style={{ background: T.card, border: `1px solid ${match.winner ? "rgba(74,222,128,.2)" : T.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
//                   onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.accent}70`; e.currentTarget.style.boxShadow = `0 0 16px ${T.accent}18`; }}
//                   onMouseLeave={e => { e.currentTarget.style.borderColor = match.winner ? "rgba(74,222,128,.2)" : T.border; e.currentTarget.style.boxShadow = "none"; }}
//                 >
//                   <div style={{ fontSize: "0.52rem", color: T.accent, fontWeight: 700, fontFamily: T.font, letterSpacing: "0.12em", marginBottom: 10 }}>
//                     MATCH {matchNum}
//                     {match.winner && <span style={{ marginLeft: 8, color: T.green }}><CheckCircle2 size={9} style={{ display: "inline", verticalAlign: "middle" }} /> DONE</span>}
//                   </div>
//                   {[{ team: match.team1, score: match.score1, isW: match.winner?.id === match.team1?.id },
//                     { team: match.team2, score: match.score2, isW: match.winner?.id === match.team2?.id }].map(({ team, score, isW }, i) => (
//                     <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i === 0 ? `1px solid ${T.border}` : "none" }}>
//                       <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                         {match.winner && isW && <div style={{ width: 3, height: 16, background: T.green, borderRadius: 2 }} />}
//                         <span style={{ fontSize: "0.78rem", fontWeight: isW ? 700 : 400, color: isW ? T.text : T.muted }}>{team?.name || "TBD"}</span>
//                       </div>
//                       {match.winner && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isW ? T.green :  "#878787", fontFamily: "monospace" }}>{score || "—"}</span>}
//                     </div>
//                   ))}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {modalMatch && (
//           <MatchModal
//             match={modalMatch.match}
//             matchNumber={rounds.slice(0, modalMatch.roundIdx).reduce((a, r) => a + r.length, 0) + modalMatch.matchIdx + 1}
//             rlabel={roundLabel(modalMatch.roundIdx, rounds.length, format)}
//             onClose={() => setModalMatch(null)}
//             onSave={handleSaveResult}
//           />
//         )}
//       </div>
//     );
//   }

//   // Single / Double Elimination bracket
//   return (
//     <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
//       <Header />
//       <div ref={bracketRef} style={{ flex: 1, overflowX: "auto", padding: "28px 28px 40px" }}>
//         <RoundLabels rounds={rounds} format={format} />
//         <BracketView rounds={rounds} format={format} onClickMatch={handleClickMatch} />
//       </div>

//       {modalMatch && (
//         <MatchModal
//           match={modalMatch.match}
//           matchNumber={rounds.slice(0, modalMatch.roundIdx).reduce((a, r) => a + r.length, 0) + modalMatch.matchIdx + 1}
//           rlabel={roundLabel(modalMatch.roundIdx, rounds.length, format)}
//           onClose={() => setModalMatch(null)}
//           onSave={handleSaveResult}
//         />
//       )}
//     </div>
//   );
// }