import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import robotFallback from "../../../assets/robot.png";
import { getPublicRobotProfile } from "../../Robots/api/robotPublic.api";
import LaurelWreath from "./LaurelWreath";
import { RANK_STYLES } from "./RankingRow";
import type { GlobalRankingEntry } from "../api/rankings.api";

interface RankingsPodiumProps {
  /** Top-of-pool entries, already sorted by rank (1, 2, 3, ...) — only the
   *  first 3 are rendered. Fewer than 3 is fine (a brand-new pool might
   *  only have 1 or 2 ranked robots yet); the podium just shows what's
   *  there instead of waiting for a full field. */
  entries: GlobalRankingEntry[];
  onOpen: (entry: GlobalRankingEntry) => void;
}

/**
 * Robot photos aren't on GlobalRankingEntry (the ranking pool row has no
 * image field) — only PublicRobotProfile carries imageUrl, so the top-3's
 * photos are fetched here by robotId, once per podium (never for the
 * other ~97 rows in the table below, which don't need it).
 */
function usePodiumImages(entries: GlobalRankingEntry[]) {
  const [images, setImages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const ids = entries.map((e) => e.robotId).filter((id): id is string => !!id);
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        getPublicRobotProfile(id)
          .then((profile) => [id, profile.imageUrl] as const)
          .catch(() => [id, null] as const),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      setImages(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // entries.map(...).join used as the dep key — re-fetch only when the
    // actual set of top-3 robotIds changes (a new filter/pool), not on
    // every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.map((e) => e.robotId).join(",")]);

  return images;
}

export default function RankingsPodium({ entries, onOpen }: RankingsPodiumProps) {
  const top3 = entries.slice(0, 3);
  const images = usePodiumImages(top3);

  if (top3.length === 0) return null;

  return (
    <section className="rank-podium" aria-label="Top ranked robots">
      <span className="rank-podium-star rank-podium-star-a" aria-hidden="true" />
      <span className="rank-podium-star rank-podium-star-b" aria-hidden="true" />
      <h2 className="rank-podium-title">Top Robots</h2>

      <div className="rank-podium-row">
        {top3.map((entry) => {
          const medal = RANK_STYLES[entry.rank];
          const displayName = entry.robotName || entry.teamName;
          const imageUrl = entry.robotId ? images[entry.robotId] : null;

          return (
            <button
              type="button"
              key={entry.robotId ?? entry.teamId}
              className={`rank-podium-slot rank-podium-slot-${entry.rank}`}
              onClick={() => onOpen(entry)}
            >
              <div className="rank-podium-avatar-wrap">
                <img
                  className="rank-podium-avatar"
                  src={imageUrl || robotFallback}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.src = robotFallback;
                  }}
                />
                <span className="rank-podium-badge">
                  <LaurelWreath color={medal?.wreath ?? "#8C6CFF"} size={56} />
                  <Trophy size={16} className="rank-podium-badge-icon" style={{ color: medal?.border ?? "#8C6CFF" }} />
                </span>
              </div>

              <p className="rank-podium-name">{displayName}</p>
              {entry.robotName && entry.teamName && entry.robotName !== entry.teamName && (
                <p className="rank-podium-team">{entry.teamName}</p>
              )}

              <div className="rank-podium-riser">
                <span className="rank-podium-rank-n">{entry.rank}</span>
                <span className="rank-podium-pts">{entry.totalPoints.toLocaleString()} pts</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
