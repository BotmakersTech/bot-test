import type { CSSProperties } from "react";
import TeamLogo from "../../../shared/components/TeamLogo";
import LaurelWreath from "./LaurelWreath";
import type { GlobalRankingEntry } from "../api/rankings.api";

const RANK_STYLES: Partial<Record<number, { border: string; wreath: string }>> = {
  1: { border: "#FFDE04", wreath: "#FFDD00" },
  2: { border: "#A7A7A7", wreath: "#A7A7A7" },
  3: { border: "#7E5353", wreath: "#7A3030" },
};

const CELL_FONT: CSSProperties = { fontSize: "clamp(14px, 1.4vw, 20px)" };

interface RankingRowProps {
  entry: GlobalRankingEntry;
  onOpen: () => void;
}

export default function RankingRow({ entry, onOpen }: RankingRowProps) {
  const isTop1 = entry.rank === 1;
  const medal = RANK_STYLES[entry.rank];
  const displayName = entry.robotName || entry.teamName;

  const rowBg: CSSProperties = isTop1
    ? { background: "linear-gradient(90deg, #8C6CFF 0%, #3995FF 64.91%, #CFCFCF 100%)" }
    : { background: "#F2F2F2" };

  const rowBorder: CSSProperties = isTop1
    ? { border: "1px solid transparent", borderLeft: "6px solid #FFDD00" }
    : medal
    ? { border: "1px solid #CFCFCF", borderLeft: `6px solid ${medal.border}` }
    : { border: "1px solid rgba(207,207,207,.8)", borderLeft: "6px solid transparent" };

  const textColor = isTop1 ? "rgba(255,255,255,0.94)" : "rgba(56,19,190,0.85)";
  const weight = isTop1 ? 600 : 500;
  const cellStyle: CSSProperties = { ...CELL_FONT, color: textColor, fontWeight: weight };
  const dividerColor = isTop1 ? "rgba(255,255,255,0.3)" : "rgba(56,19,190,0.2)";

  const rankBadge = medal ? (
    <div className="rank-wreath-badge">
      <LaurelWreath color={medal.wreath} />
      <span style={{ color: isTop1 ? "#fff" : medal.border }}>{entry.rank}</span>
    </div>
  ) : (
    <span style={{ ...cellStyle, marginLeft: 4 }}>{entry.rank}</span>
  );

  return (
    <>
      {/* ── Table row (md+) ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpen}
        className="rank-row h-[56px] sm:h-[64px] rounded-[12px] p-0 text-left cursor-pointer"
        style={{ ...rowBg, ...rowBorder }}
      >
        <div className="rank-col-rank flex items-center">{rankBadge}</div>

        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <TeamLogo
            src={entry.avatarUrl}
            className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] rounded-lg bg-[#D9D9D9] object-cover flex-shrink-0"
          />
          <span style={cellStyle} className="truncate">{displayName}</span>
        </div>

        <span style={cellStyle}>{entry.totalPoints}</span>
        <span style={cellStyle}>{entry.eventsPlayed}</span>
        <span style={cellStyle}>{entry.matchesPlayed}</span>
      </button>

      {/* ── Mobile card (<md) ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpen}
        className="rank-card flex-col gap-2 rounded-[12px] p-3 w-full text-left cursor-pointer"
        style={{ ...rowBg, border: "1px solid #CFCFCF", borderLeft: `5px solid ${medal ? medal.border : "transparent"}` }}
      >
        <div className="flex items-center gap-3">
          {medal ? (
            <div className="rank-wreath-badge">
              <LaurelWreath color={medal.wreath} />
              <span style={{ color: isTop1 ? "#fff" : medal.border }}>{entry.rank}</span>
            </div>
          ) : (
            <span style={{ color: textColor, fontWeight: weight, fontSize: 18, minWidth: 28, textAlign: "center" }}>
              {entry.rank}
            </span>
          )}
          <TeamLogo src={entry.avatarUrl} className="w-[36px] h-[36px] rounded-lg bg-[#D9D9D9] object-cover" />
          <span style={{ color: textColor, fontWeight: 600, fontSize: 16 }}>{displayName}</span>
        </div>

        <div className="flex items-center gap-4 pl-1 pt-1">
          <div className="flex flex-col items-center gap-0.5">
            <span style={{ color: textColor, fontSize: 11, opacity: 0.75 }}>Points</span>
            <span style={{ color: textColor, fontWeight: weight, fontSize: 15 }}>{entry.totalPoints}</span>
          </div>
          <div style={{ width: 1, height: 28, background: dividerColor }} />
          <div className="flex flex-col items-center gap-0.5">
            <span style={{ color: textColor, fontSize: 11, opacity: 0.75 }}>Events</span>
            <span style={{ color: textColor, fontWeight: weight, fontSize: 15 }}>{entry.eventsPlayed}</span>
          </div>
          <div style={{ width: 1, height: 28, background: dividerColor }} />
          <div className="flex flex-col items-center gap-0.5">
            <span style={{ color: textColor, fontSize: 11, opacity: 0.75 }}>Matches</span>
            <span style={{ color: textColor, fontWeight: weight, fontSize: 15 }}>{entry.matchesPlayed}</span>
          </div>
        </div>
      </button>
    </>
  );
}
