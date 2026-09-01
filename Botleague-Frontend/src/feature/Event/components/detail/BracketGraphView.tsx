import { useEffect, useRef, useState } from "react";
import { RefreshCw, Trophy, Medal, Printer, Maximize2 } from "lucide-react";
import type { PublicMatchView } from "../../../Matches/api/matches.api";

// Read-only rendering of the same connected-bracket graph the admin
// Organizer Bracket page uses (see OrganizerBracketPage.tsx) — same layout
// math (round columns), traditional straight right-angle connectors,
// winners/losers tracks for double elimination (the losers bracket stands
// as its own tree — no loser-routing lines crossing the winners side).
// No click-to-score popup or mutation handlers; pan/zoom kept as a viewing aid.

const T = {
  border: "rgba(75,134,232,0.22)",
  surface: "#ffffff",
  brand: "#0162d1",
  brandDim: "rgba(1,98,209,0.08)",
  accent: "#e04b4b",
  gold: "#a16207",
  green: "#1fa952",
  blue: "#4b86e8",
  purple: "#8c6cff",
  text: "#111111",
  textMuted: "#7c7c7c",
  textSub: "#5d5d5d",
  label: "#4f46e5",       // round-label indigo (matches the reference)
  winTint: "#fff6e9",     // warm cream behind the advancing competitor
  line: "#c9d4ec",        // idle connector
};

const BOX_W_1V1 = 200;
const BOX_W_MULTI = 220;
const BOX_H_1V1 = 72;
const BOX_H_TRIPLE = 100;
const BOX_H_FATAL = 126;
const H_GAP = 92;
// Each box also paints a round tag ~15px above it and a date line ~16px below
// it — the vertical gap has to clear both so stacked matches never touch.
const V_GAP = 44;

function getBoxDimensions(matchType?: PublicMatchView["matchType"]) {
  if (matchType === "FATAL_FOUR") return { w: BOX_W_MULTI, h: BOX_H_FATAL };
  if (matchType === "TRIPLE_THREAT") return { w: BOX_W_MULTI, h: BOX_H_TRIPLE };
  return { w: BOX_W_1V1, h: BOX_H_1V1 };
}

function resolveWinnerName(m: PublicMatchView): string | null {
  if (!m.winnerRegistrationId) return null;
  if (m.winnerRegistrationId === m.teamARegistrationId) return m.teamARobotName ?? m.teamAName ?? null;
  if (m.winnerRegistrationId === m.teamBRegistrationId) return m.teamBRobotName ?? m.teamBName ?? null;
  if (m.winnerRegistrationId === m.teamCRegistrationId) return m.teamCRobotName ?? m.teamCName ?? null;
  if (m.winnerRegistrationId === m.teamDRegistrationId) return m.teamDRobotName ?? m.teamDName ?? null;
  return null;
}

function getTeams(m: PublicMatchView) {
  const teams: { id: string | undefined; name: string | undefined; score: number | undefined; slot: 1 | 2 | 3 | 4 }[] = [
    { id: m.teamARegistrationId, name: m.teamARobotName || m.teamAName, score: m.teamAScore, slot: 1 },
    { id: m.teamBRegistrationId, name: m.teamBRobotName || m.teamBName, score: m.teamBScore, slot: 2 },
  ];
  if (m.matchType === "TRIPLE_THREAT" || m.matchType === "FATAL_FOUR") {
    teams.push({ id: m.teamCRegistrationId, name: m.teamCRobotName || m.teamCName, score: m.teamCScore, slot: 3 });
  }
  if (m.matchType === "FATAL_FOUR") {
    teams.push({ id: m.teamDRegistrationId, name: m.teamDRobotName || m.teamDName, score: m.teamDScore, slot: 4 });
  }
  return teams;
}

function statusColor(status?: string) {
  if (status === "COMPLETED") return T.green;
  if (status === "LIVE") return T.accent;
  if (status === "PENDING_APPROVAL") return T.gold;
  if (status === "CANCELLED") return T.textMuted;
  return T.blue;
}

function roundLabel(ri: number, total: number) {
  if (ri === total - 1) return "Final";
  if (ri === total - 2 && total > 2) return "Semifinal";
  if (ri === total - 3 && total > 3) return "Quarterfinal";
  return `Round ${ri + 1}`;
}

/** Compact per-box tag, e.g. "QF · Game 2", "Final". */
function boxLabel(columnLabel: string, gameNo: number, isFinalCol: boolean): string {
  const l = columnLabel.toLowerCase();
  let prefix: string;
  if (l.includes("grand final")) prefix = "Grand Final";
  else if (l.includes("final")) prefix = "Final";
  else if (l.includes("semifinal")) prefix = "SF";
  else if (l.includes("quarterfinal")) prefix = "QF";
  else {
    const m = columnLabel.match(/round\s*(\d+)/i);
    const n = m ? m[1] : "1";
    prefix = /losers/i.test(columnLabel) ? `LB ${n}` : /winners/i.test(columnLabel) ? `WB ${n}` : `R${n}`;
  }
  if (isFinalCol) return prefix;
  return `${prefix} · Game ${gameNo}`;
}

function fmtDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** Lays out one bracket track (a flat list of same-bracketSide rounds) as round-columns. */
function layoutTrack(matches: PublicMatchView[], yOffset: number, labelPrefix: string) {
  const roundMap: Record<number, PublicMatchView[]> = {};
  matches.forEach((m) => {
    if (m.leaderboardPosition === 3) return;
    const r = m.roundNumber ?? 0;
    if (!roundMap[r]) roundMap[r] = [];
    roundMap[r].push(m);
  });

  const roundNums = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
  const rounds = roundNums.map((r) => [...roundMap[r]].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)));

  const maxMatchesR1 = rounds[0]?.length || 1;
  const roundBoxH = rounds.map((round) => round.reduce((acc, m) => Math.max(acc, getBoxDimensions(m.matchType).h), BOX_H_1V1));
  const roundBoxW = rounds.map((round) => round.reduce((acc, m) => Math.max(acc, getBoxDimensions(m.matchType).w), BOX_W_1V1));

  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
  const xOffsets: number[] = [];
  let xCursor = 0;
  rounds.forEach((_, ri) => {
    xOffsets.push(xCursor);
    xCursor += roundBoxW[ri] + H_GAP;
  });

  rounds.forEach((round, ri) => {
    const x = xOffsets[ri];
    const boxH = roundBoxH[ri];
    const spacingFactor = Math.pow(2, ri);
    const slotH = boxH + V_GAP;
    const firstOffset = ((spacingFactor - 1) * slotH) / 2;

    round.forEach((match, mi) => {
      const y = yOffset + firstOffset + mi * spacingFactor * slotH;
      const { w, h } = getBoxDimensions(match.matchType);
      positions[match.matchId] = { x, y, w, h };
    });
  });

  const svgW = Math.max(0, xCursor - H_GAP);
  const svgH = maxMatchesR1 * ((roundBoxH[0] || BOX_H_1V1) + V_GAP);
  const roundLabels = rounds.map((_, ri) => (labelPrefix ? `${labelPrefix} ${roundLabel(ri, rounds.length)}` : roundLabel(ri, rounds.length)));

  return { rounds, positions, svgW, svgH, roundLabels };
}

function getBracketLayout(matches: PublicMatchView[]) {
  if (!matches.length) {
    return { rounds: [] as PublicMatchView[][], positions: {} as Record<string, { x: number; y: number; w: number; h: number }>, svgW: 0, svgH: 0, roundLabels: [] as string[] };
  }

  const isDoubleElim = matches.some((m) => m.bracketSide === "LOSERS");

  if (!isDoubleElim) {
    const t = layoutTrack(matches, 0, "");
    return { rounds: t.rounds, positions: t.positions, svgW: t.svgW + 40, svgH: t.svgH + 20, roundLabels: t.roundLabels };
  }

  const winners = matches.filter((m) => m.bracketSide === "WINNERS");
  const losers = matches.filter((m) => m.bracketSide === "LOSERS");
  const grandFinals = [...matches.filter((m) => m.bracketSide === "GRAND_FINAL")].sort(
    (a, b) => (a.isBracketReset ? 1 : 0) - (b.isBracketReset ? 1 : 0)
  );

  const w = layoutTrack(winners, 0, "Winners");
  const gapY = 70;
  const l = layoutTrack(losers, w.svgH + gapY, "Losers");

  const positions = { ...w.positions, ...l.positions };
  const rounds = [...w.rounds, ...l.rounds];
  const roundLabels = [...w.roundLabels, ...l.roundLabels];

  const gfX = Math.max(w.svgW, l.svgW) + H_GAP;
  const gfY = (w.svgH + gapY + l.svgH) / 2 - BOX_H_1V1 / 2;
  grandFinals.forEach((m, i) => {
    const { w: bw, h: bh } = getBoxDimensions(m.matchType);
    positions[m.matchId] = { x: gfX + i * (bw + H_GAP), y: gfY, w: bw, h: bh };
  });
  if (grandFinals.length) {
    rounds.push(grandFinals);
    roundLabels.push(grandFinals.length > 1 || grandFinals[0]?.isBracketReset ? "Grand Final · Bracket Reset" : "Grand Final");
  }

  const svgW = gfX + grandFinals.length * (BOX_W_1V1 + H_GAP) + 40;
  const svgH = w.svgH + gapY + l.svgH + 20;

  return { rounds, positions, svgW, svgH, roundLabels };
}

interface BracketGraphViewProps {
  matches: PublicMatchView[];
  loading: boolean;
  error: string | null;
}

export default function BracketGraphView({ matches, loading, error }: BracketGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const ZOOM_MIN = 0.25;
  const ZOOM_MAX = 2.5;
  const ZOOM_STEP = 0.1;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStateRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
  const zoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP));

  // Wheel pans the canvas now; zoom is the +/− buttons only. It used to zoom,
  // which meant an ordinary scroll over the graph kept yanking the view. Bound
  // natively with { passive: false } so the page behind doesn't scroll too.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [loading, error, matches.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    setPan({ x: dragStateRef.current.panX + dx, y: dragStateRef.current.panY + dy });
  };
  const handleMouseUp = () => setIsPanning(false);
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  if (loading) return <p style={{ textAlign: "center", padding: "40px 0" }}>Loading schedule…</p>;
  if (error) return <p style={{ textAlign: "center", padding: "40px 0", color: "#dc2626" }}>{error}</p>;
  if (matches.length === 0) {
    return <p style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>No matches have been scheduled for this sport yet.</p>;
  }

  const { rounds, positions, svgW, svgH, roundLabels } = getBracketLayout(matches);

  // Scale the whole bracket down to fit the visible canvas, then centre it.
  const fitToView = () => {
    const el = canvasRef.current;
    if (!el) return;
    const contentW = svgW + 60;
    const contentH = svgH + 110;
    if (contentW <= 0 || contentH <= 0) return;
    const next = clampZoom(Math.min((el.clientWidth - 48) / contentW, (el.clientHeight - 48) / contentH, 1));
    setZoom(next);
    setPan({
      x: Math.max(16, (el.clientWidth - contentW * next) / 2),
      y: Math.max(16, (el.clientHeight - contentH * next) / 2),
    });
  };

  const printBracket = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("style");
    clone.setAttribute("width", String(svgW + 60));
    clone.setAttribute("height", String(svgH + 110));
    const markup = new XMLSerializer().serializeToString(clone);
    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Tournament Bracket</title>` +
      `<style>@page{size:landscape;margin:12mm}` +
      `body{margin:0;padding:24px;font-family:'Inter',system-ui,sans-serif;color:#111}` +
      `h1{font-size:16px;margin:0 0 16px}svg{max-width:100%;height:auto}</style></head>` +
      `<body><h1>Tournament Bracket</h1>${markup}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  // Winners feed forward only. Loser-routing (double elimination) lines are
  // deliberately not drawn — the losers bracket reads as its own tree, the
  // traditional way, instead of spaghetti crossing the winners side.
  const lines: { x1: number; y1: number; x2: number; y2: number; hot: boolean }[] = [];
  matches.forEach((m) => {
    if (m.nextMatchId && positions[m.matchId] && positions[m.nextMatchId]) {
      const from = positions[m.matchId];
      const to = positions[m.nextMatchId];
      lines.push({
        x1: from.x + from.w, y1: from.y + from.h / 2, x2: to.x, y2: to.y + to.h / 2,
        hot: m.status === "COMPLETED" && !!m.winnerRegistrationId,
      });
    }
  });

  const grandFinalResults = matches.filter(
    (m) => !m.nextMatchId && m.leaderboardPosition !== 3 && m.status === "COMPLETED" && m.winnerRegistrationId
  );
  const champion = grandFinalResults.find((m) => m.isBracketReset) ?? grandFinalResults[0];
  const thirdPlaceMatch = matches.find((m) => m.leaderboardPosition === 3) ?? null;

  return (
    <div className="bracket-graph">
      <div className="bracket-graph-header">
        <div className="bracket-graph-legend">
          {[{ color: T.blue, label: "Scheduled" }, { color: T.accent, label: "Live" }, { color: T.green, label: "Completed" }].map((l) => (
            <span key={l.label}>
              <i style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {champion && (
            <div className="bracket-graph-champion">
              <Trophy size={16} color={T.gold} />
              Champion: {resolveWinnerName(champion) ?? "—"}
            </div>
          )}
          <button
            type="button"
            className="bracket-graph-print"
            onClick={printBracket}
            title="Print / save as PDF"
          >
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="bracket-graph-canvas"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={svgW + 60}
          height={svgH + 110}
          style={{ display: "block", overflow: "visible", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", transition: isPanning ? "none" : "transform 0.16s ease-out", willChange: "transform" }}
        >
          <g transform="translate(24, 46)">
            {/* Straight right-angle connectors — solid, winners only. */}
            {lines.map((l, i) => {
              const midX = Math.round((l.x1 + l.x2) / 2);
              return (
                <path
                  key={i}
                  d={`M ${l.x1} ${l.y1} H ${midX} V ${l.y2} H ${l.x2}`}
                  fill="none"
                  stroke={l.hot ? T.brand : T.line}
                  strokeWidth={l.hot ? 2 : 1.5}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  shapeRendering="crispEdges"
                />
              );
            })}

            {rounds.map((round, ri) => {
              const isFinalCol = ri === rounds.length - 1;
              const colLabel = roundLabels[ri] ?? roundLabel(ri, rounds.length);
              return <g key={`col-${ri}`}>{round.map((match, mi) => {
                const pos = positions[match.matchId];
                if (!pos) return null;
                const { x, y, w, h } = pos;
                const sc = statusColor(match.status);
                const isCompleted = match.status === "COMPLETED";
                const isLive = match.status === "LIVE";
                const isBye = match.isBye;
                const scored = isCompleted || isLive;
                const teams = getTeams(match);
                const rowH = h / teams.length;
                const gameNo = match.matchNumber ?? mi + 1;
                const dateText = fmtDateTime(match.scheduledAt);
                const byeW = 24;

                return (
                  <g key={match.matchId}>
                    {/* per-box round tag */}
                    <text
                      x={x + 2} y={y - 7}
                      fontSize={10.5} fontWeight={700} letterSpacing={0.6}
                      fill={isFinalCol ? T.brand : T.label}
                      fontFamily="'Inter', sans-serif"
                    >
                      {boxLabel(colLabel, gameNo, isFinalCol)}
                    </text>

                    <rect
                      x={x} y={y} width={w} height={h} rx={9} ry={9}
                      fill={T.surface}
                      stroke={isLive ? "rgba(224,75,75,0.55)" : "rgba(17,17,17,0.12)"}
                      strokeWidth={1}
                    />
                    <rect x={x} y={y} width={3} height={h} fill={sc} opacity={isBye ? 0.25 : 0.85} />

                    {teams.map((team, ti) => {
                      const rowY = y + ti * rowH;
                      const isWinner = !!match.winnerRegistrationId && match.winnerRegistrationId === team.id;
                      const nameColor = isBye ? T.textMuted : isWinner ? T.text : team.name ? T.text : T.textMuted;
                      const nameEndX = isBye && ti === 0 ? x + w - byeW - 8 : x + w - (scored ? 22 : 14);
                      return (
                        <g key={ti}>
                          {isWinner && !isBye && (
                            <rect x={x + 3} y={rowY + 1} width={w - 4} height={rowH - 2} fill={T.winTint} />
                          )}
                          {ti > 0 && <line x1={x + 8} y1={rowY} x2={x + w - 8} y2={rowY} stroke="rgba(17,17,17,0.09)" strokeWidth={1} />}
                          <text
                            x={x + 14} y={rowY + rowH / 2 + 4}
                            fontSize={11} fontWeight={isWinner ? 700 : 500}
                            fill={nameColor} fontFamily="'Inter', sans-serif"
                          >
                            {(() => {
                              const label = team.name || (team.id ? "…" : "TBD");
                              const maxChars = Math.max(6, Math.floor((nameEndX - (x + 14)) / 6.4));
                              return label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
                            })()}
                          </text>
                          {scored && (
                            <text
                              x={x + w - 12} y={rowY + rowH / 2 + 4}
                              fontSize={12} fontWeight={700}
                              fill={isWinner ? T.brand : T.textSub}
                              fontFamily="'Inter', sans-serif" textAnchor="end"
                            >
                              {team.score ?? 0}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* "vs" badge — shown until the match has a score */}
                    {!scored && !isBye && teams.length === 2 && (
                      <g>
                        <circle cx={x + w} cy={y + h / 2} r={11} fill="#eef1fb" stroke="rgba(17,17,17,0.12)" strokeWidth={1} />
                        <text x={x + w} y={y + h / 2 + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill={T.textSub} fontFamily="'Inter', sans-serif">vs</text>
                      </g>
                    )}

                    {/* BYE — dark cap on the right edge */}
                    {isBye && (
                      <g>
                        <path d={`M ${x + w - byeW} ${y} H ${x + w - 9} A 9 9 0 0 1 ${x + w} ${y + 9} V ${y + h - 9} A 9 9 0 0 1 ${x + w - 9} ${y + h} H ${x + w - byeW} Z`} fill="#2b3245" />
                        <text x={x + w - byeW / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize={8.5} fontWeight={800} letterSpacing={1} fill="#fff" fontFamily="'Inter', sans-serif">BYE</text>
                      </g>
                    )}

                    {isLive && (
                      <circle cx={x + w - 9} cy={y + 9} r={3.5} fill={T.accent}>
                        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* scheduled date/time — shown only once it's set (this is a
                        read-only view, so no "set date" call-to-action here) */}
                    {dateText && (
                      <text
                        x={x + 2} y={y + h + 14}
                        fontSize={10} fontWeight={500}
                        fill={T.textSub}
                        fontFamily="'Inter', sans-serif"
                      >
                        {dateText}
                      </text>
                    )}

                    {champion?.matchId === match.matchId && (
                      <foreignObject x={x + w / 2 - 8} y={y - 40} width={16} height={16} style={{ overflow: "visible", pointerEvents: "none" }}>
                        <Trophy size={16} color={T.gold} />
                      </foreignObject>
                    )}
                  </g>
                );
              })}</g>;
            })}
          </g>
        </svg>

        <div className="bracket-graph-zoom">
          <button type="button" aria-label="Zoom out" disabled={zoom <= ZOOM_MIN} onClick={zoomOut}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" disabled={zoom >= ZOOM_MAX} onClick={zoomIn}>+</button>
          <button type="button" onClick={fitToView} title="Fit to screen" aria-label="Fit to screen"><Maximize2 size={12} /></button>
          <button type="button" onClick={resetView} title="Reset to 100%" aria-label="Reset to 100%"><RefreshCw size={12} /></button>
        </div>
      </div>

      {thirdPlaceMatch && (
        <div className="bracket-graph-third">
          <div className="bracket-graph-third-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Medal size={14} /> 3rd Place Match
          </div>
          <div className="bracket-graph-third-card">
            {getTeams(thirdPlaceMatch).map((team, i, arr) => {
              const isWinner = !!thirdPlaceMatch.winnerRegistrationId && thirdPlaceMatch.winnerRegistrationId === team.id;
              const showScore = thirdPlaceMatch.status === "LIVE" || thirdPlaceMatch.status === "COMPLETED";
              return (
                <div key={i} className="bracket-graph-third-row" style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(17,17,17,0.07)" : "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: isWinner ? T.green : team.name ? T.text : T.textMuted, fontWeight: isWinner ? 700 : 400 }}>
                    {isWinner && <Medal size={13} />}{team.name || "TBD"}
                  </span>
                  {showScore && <strong style={{ color: isWinner ? T.green : T.textSub }}>{team.score ?? 0}</strong>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
