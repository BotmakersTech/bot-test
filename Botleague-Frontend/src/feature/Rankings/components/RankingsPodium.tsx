import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import robotFallback from "../../../assets/robot.png";
import { getPublicRobotProfile } from "../../Robots/api/robotPublic.api";
import type { GlobalRankingEntry } from "../api/rankings.api";

interface RankingsPodiumProps {
  /** Top-of-pool entries, already sorted by rank (1, 2, 3, ...) — only the
   *  first 3 are rendered. Fewer than 3 is fine (a brand-new pool might
   *  only have 1 or 2 ranked robots yet); the podium just shows what's
   *  there instead of waiting for a full field. */
  entries: GlobalRankingEntry[];
  onOpen: (entry: GlobalRankingEntry) => void;
}

// Pixel-perfect port of the supplied podium-final-correct.html — same
// 1728x768 fixed canvas, same absolute coordinates for every element, same
// clip-path panel shape (chamfered top corners, no border-radius), same
// star/badge/name/rank styling and colors. Scaled to fit the real
// container width via ResizeObserver + CSS transform (the reference's own
// `scale(100vw / 1728)` assumes the podium spans the raw viewport, which
// isn't true once it's embedded inside this page's padded, non-full-width
// container) instead of reflowing the layout responsively.
const CANVAS_W = 1728;
const CANVAS_H = 768;

const STARS = [
  { left: -155, top: -155, size: 270 },
  { left: 1510, top: 190, size: 270 },
  { left: 175, top: 535, size: 115 },
  { left: 720, top: -65, size: 65 },
];

interface SlotSpec {
  panel: { left: number; top: number; width: number; height: number };
  avatar: { left: number; top: number; size: number };
  name: { left: number; top: number };
  badge: { left: number; top: number; size: number; gradient: string };
  rank: { left: number; top: number; fontSize: number };
}

const SLOTS: Record<1 | 2 | 3, SlotSpec> = {
  1: {
    panel: { left: 698, top: 355, width: 332, height: 395 },   // top: 399→355 (shares bottom=750 with 2/3)
    avatar: { left: 774, top: 156, size: 180 },                 // top: 200→156
    name: { left: 864, top: 401 },                              // top: 445→401
    badge: { left: 805, top: 469, size: 118, gradient: "linear-gradient(#ffd365eb, #997f3d)" }, // top: 513→469
    rank: { left: 844, top: 596, fontSize: 96 },                // top: 640→596
  },
  2: {
    panel: { left: 338, top: 420, width: 277, height: 330 },    // top: 320→420 (bottom=750, matches slot 1)
    avatar: { left: 411, top: 274, size: 131 },                 // top: 174→274
    name: { left: 476.5, top: 468 },                            // top: 368→468
    badge: { left: 429, top: 532, size: 96, gradient: "linear-gradient(#ccccebea, #868173)" }, // top: 432→532
    rank: { left: 448, top: 630, fontSize: 86 },                // top: 530→630
  },
  3: {
    panel: { left: 1113, top: 420, width: 277, height: 330 },   // top: 320→420
    avatar: { left: 1186, top: 274, size: 131 },                // top: 174→274
    name: { left: 1251.5, top: 468 },                           // top: 368→468
    badge: { left: 1204, top: 532, size: 96, gradient: "linear-gradient(#b28181eb, #82450cb3)" }, // top: 432→532
    rank: { left: 1222, top: 630, fontSize: 86 },                // top: 530→630
  },
};

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

/** Measures the wrapper's real rendered width and returns width / 1728 —
 *  the exact scale factor to shrink the fixed-size canvas down to fit. */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.getBoundingClientRect().width / CANVAS_W);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, scale };
}

export default function RankingsPodium({ entries, onOpen }: RankingsPodiumProps) {
  const top3 = entries.slice(0, 3);
  const images = usePodiumImages(top3);
  const { ref, scale } = useFitScale();

  if (top3.length === 0) return null;

  return (
    <div ref={ref} className="rank-podium-viewport" style={{ height: CANVAS_H * scale }}>
      <div className="rank-podium" style={{ transform: `scale(${scale})` }}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="rank-podium-star"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
            aria-hidden="true"
          />
        ))}

        {top3.map((entry) => {
          const slot = SLOTS[entry.rank as 1 | 2 | 3];
          if (!slot) return null;
          const displayName = entry.robotName || entry.teamName;
          const imageUrl = entry.robotId ? images[entry.robotId] : null;

          return (
            <div key={entry.robotId ?? entry.teamId}>
              <div
                className="rank-podium-panel"
                style={{ left: slot.panel.left, top: slot.panel.top, width: slot.panel.width, height: slot.panel.height }}
              />
              <div
                className="rank-podium-avatar"
                style={{ left: slot.avatar.left, top: slot.avatar.top, width: slot.avatar.size, height: slot.avatar.size }}
              >
                <img
                  src={imageUrl || robotFallback}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.src = robotFallback;
                  }}
                />
              </div>
              <p className="rank-podium-name" style={{ left: slot.name.left, top: slot.name.top }}>
                {displayName}
              </p>
              <div
                className="rank-podium-badge"
                style={{ left: slot.badge.left, top: slot.badge.top, width: slot.badge.size, height: slot.badge.size, background: slot.badge.gradient }}
              >
                <Trophy size={slot.badge.size * 0.62} strokeWidth={1.75} color="#fff" />
              </div>
              <p className="rank-podium-rank" style={{ left: slot.rank.left, top: slot.rank.top, fontSize: slot.rank.fontSize }}>
                {entry.rank}
              </p>

              {/* Invisible click target over this rank's whole column —
                  the reference has no interactive affordance of its own,
                  this just makes "open this robot" reachable without
                  altering anything visually. */}
              <button
                type="button"
                className="rank-podium-hit"
                style={{ left: slot.panel.left, width: slot.panel.width }}
                onClick={() => onOpen(entry)}
                aria-label={displayName}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
