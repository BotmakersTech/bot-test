import { useRef, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import type { PublicMatchView } from "../../../Matches/api/matches.api";

// Read-only rendering of the same connected-bracket graph the admin
// Organizer Bracket page uses (see OrganizerBracketPage.tsx) — same layout
// math (round columns + curved connector lines, winners/losers tracks for
// double elimination), just without any of that page's click-to-score
// popup or mutation handlers. Pan/zoom is kept since it's purely a viewing
// aid, not an edit action.

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
};

const BOX_W_1V1 = 200;
const BOX_W_MULTI = 220;
const BOX_H_1V1 = 72;
const BOX_H_TRIPLE = 100;
const BOX_H_FATAL = 126;
const H_GAP = 80;
const V_GAP = 20;

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

function matchTypeLabel(t?: PublicMatchView["matchType"]): string {
  if (t === "TRIPLE_THREAT") return "Triple Threat";
  if (t === "FATAL_FOUR") return "Fatal Four";
  return "1v1";
}

function roundLabel(ri: number, total: number) {
  if (ri === total - 1) return "Final";
  if (ri === total - 2 && total > 2) return "Semifinal";
  return `Round ${ri + 1}`;
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
  const svgH = maxMatchesR1 * (roundBoxH[0] || BOX_H_1V1 + V_GAP);
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

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStateRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(2.5, Math.max(0.25, Math.round((z + delta) * 100) / 100)));
  };
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

  const lines: { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean }[] = [];
  matches.forEach((m) => {
    if (m.nextMatchId && positions[m.matchId] && positions[m.nextMatchId]) {
      const from = positions[m.matchId];
      const to = positions[m.nextMatchId];
      lines.push({
        x1: from.x + from.w, y1: from.y + from.h / 2, x2: to.x, y2: to.y + to.h / 2,
        color: m.status === "COMPLETED" && m.winnerRegistrationId ? T.brand : "#c3d2ee",
      });
    }
    if (m.loserNextMatchId && positions[m.matchId] && positions[m.loserNextMatchId]) {
      const from = positions[m.matchId];
      const to = positions[m.loserNextMatchId];
      lines.push({
        x1: from.x + from.w, y1: from.y + from.h / 2, x2: to.x, y2: to.y + to.h / 2,
        color: m.status === "COMPLETED" && m.winnerRegistrationId ? T.blue : "#c3d2ee",
        dashed: true,
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
        {champion && (
          <div className="bracket-graph-champion">
            <Trophy size={16} color={T.gold} />
            Champion: {resolveWinnerName(champion) ?? "—"}
          </div>
        )}
      </div>

      <div
        className="bracket-graph-canvas"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={svgW + 40}
          height={svgH + 60}
          style={{ display: "block", overflow: "visible", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        >
          {rounds.map((round, ri) => {
            const pos0 = positions[round[0]?.matchId];
            return (
              <text
                key={ri}
                x={(pos0?.x ?? 0) + (pos0?.w ?? BOX_W_1V1) / 2 + 20}
                y={(pos0?.y ?? 0) + 18}
                textAnchor="middle"
                fill={ri === rounds.length - 1 ? T.brand : T.textMuted}
                fontSize={11}
                fontWeight={700}
                fontFamily="'Inter', sans-serif"
                letterSpacing={1.5}
              >
                {(roundLabels[ri] ?? roundLabel(ri, rounds.length)).toUpperCase()}
              </text>
            );
          })}

          <g transform="translate(20, 28)">
            {lines.map((l, i) => {
              const mx = l.x1 + H_GAP / 2;
              const isHot = l.color === T.brand || l.color === T.blue;
              return (
                <path
                  key={i}
                  d={`M${l.x1},${l.y1} C${mx},${l.y1} ${mx},${l.y2} ${l.x2},${l.y2}`}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={isHot ? 1.5 : 1}
                  strokeDasharray={l.dashed ? "4 3" : undefined}
                  opacity={isHot ? 0.9 : 1}
                />
              );
            })}

            {matches.map((match) => {
              const pos = positions[match.matchId];
              if (!pos) return null;
              const { x, y, w, h } = pos;
              const sc = statusColor(match.status);
              const isCompleted = match.status === "COMPLETED";
              const isLive = match.status === "LIVE";
              const isBye = match.isBye;
              const teams = getTeams(match);
              const rowH = h / teams.length;

              return (
                <g key={match.matchId}>
                  <rect
                    x={x} y={y} width={w} height={h} rx={13} ry={13}
                    fill={isBye ? "#f6f8fd" : T.surface}
                    stroke={isLive ? "rgba(224,75,75,0.5)" : "rgba(75,134,232,0.18)"}
                    strokeWidth={1}
                  />
                  <rect x={x} y={y} width={3} height={h} rx={2} ry={2} fill={sc} opacity={isBye ? 0.2 : 0.8} />

                  {match.matchType && match.matchType !== "ONE_VS_ONE" && (
                    <text
                      x={x + w - 8} y={y + 13}
                      fontSize={8} fontWeight={700}
                      fill={match.matchType === "FATAL_FOUR" ? T.purple : T.gold}
                      fontFamily="'Inter', sans-serif"
                      textAnchor="end" letterSpacing={0.5}
                    >
                      {matchTypeLabel(match.matchType).toUpperCase()}
                    </text>
                  )}

                  {teams.map((team, ti) => {
                    const rowY = y + ti * rowH;
                    const isWinner = !!match.winnerRegistrationId && match.winnerRegistrationId === team.id;
                    const nameColor = isBye ? T.textMuted : isWinner ? T.green : team.name ? T.text : T.textMuted;

                    return (
                      <g key={ti}>
                        {ti > 0 && <line x1={x + 10} y1={rowY} x2={x + w - 10} y2={rowY} stroke="rgba(17,17,17,0.08)" strokeWidth={1} />}
                        <text x={x + 16} y={rowY + rowH / 2 + 5} fontSize={11} fontWeight={isWinner ? 700 : 400} fill={nameColor} fontFamily="'Inter', sans-serif">
                          {team.name || (team.id ? "…" : "TBD")}
                        </text>
                        {(isCompleted || isLive) && (
                          <text x={x + w - 14} y={rowY + rowH / 2 + 5} fontSize={12} fontWeight={700} fill={isWinner ? T.green : T.textSub} fontFamily="'Inter', sans-serif" textAnchor="end">
                            {team.score ?? 0}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {isBye && (
                    <text x={x + w - 10} y={y + h / 2 + 4} fontSize={9} fontWeight={700} fill={T.textMuted} fontFamily="'Inter', sans-serif" textAnchor="end" letterSpacing={1}>
                      BYE
                    </text>
                  )}

                  {isLive && (
                    <circle cx={x + w - 10} cy={y + 10} r={4} fill={T.accent} opacity={0.9}>
                      <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {champion?.matchId === match.matchId && (
                    <text x={x + w / 2} y={y - 8} textAnchor="middle" fontSize={14}>🏆</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="bracket-graph-zoom">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 100) / 100))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 100) / 100))}>+</button>
          <button type="button" onClick={resetView} title="Reset view"><RefreshCw size={12} /></button>
        </div>
      </div>

      {thirdPlaceMatch && (
        <div className="bracket-graph-third">
          <div className="bracket-graph-third-label">🥉 3rd Place Match</div>
          <div className="bracket-graph-third-card">
            {getTeams(thirdPlaceMatch).map((team, i, arr) => {
              const isWinner = !!thirdPlaceMatch.winnerRegistrationId && thirdPlaceMatch.winnerRegistrationId === team.id;
              const showScore = thirdPlaceMatch.status === "LIVE" || thirdPlaceMatch.status === "COMPLETED";
              return (
                <div key={i} className="bracket-graph-third-row" style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(17,17,17,0.07)" : "none" }}>
                  <span style={{ color: isWinner ? T.green : team.name ? T.text : T.textMuted, fontWeight: isWinner ? 700 : 400 }}>
                    {isWinner ? "🥉 " : ""}{team.name || "TBD"}
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
