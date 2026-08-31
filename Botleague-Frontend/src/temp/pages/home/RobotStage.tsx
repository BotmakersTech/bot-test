import { useEffect, useLayoutEffect, useRef, useState } from "react";
import robot1 from "../../../assets/home/Img/robot1.png";
import robot2 from "../../../assets/home/Img/robot2.png";
import robot3 from "../../../assets/home/Img/robot3.png";
import robot4 from "../../../assets/home/Img/robot4.png";

const STAGE_ITEMS = [
  { title: "Compete At Any Affiliated Techfest", desc: "One Build. Same Rules. Compete Anywhere In India.", img: robot1 },
  { title: "National Ranking Counts", desc: "Every Match Adds To Your All-India Leaderboard.", img: robot2 },
  { title: "Verified Certificates", desc: "QR-Verified Wins Recognised At Every Affiliated Techfect.", img: robot3 },
  { title: "Gateway To Global", desc: "Top Performers Qualify For Battle Of Robots, Russia.", img: robot4 },
];

/**
 * Same pinned-scroll pattern as OneSection/LeaguesSection — a tall wrapper
 * keeps the inner viewport stuck while the user scrolls through it, and the
 * active bar advances a step per scroll increment. Clicking a column still
 * works too: it smooth-scrolls to that step's position in the wrapper
 * (rather than just setting state), so a click and a subsequent scroll
 * never fight each other — the scroll position is the single source of
 * truth for which bar is active either way.
 */
export default function RobotStage() {
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [msgPos, setMsgPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = scrolled / total;
      const nextStep = Math.min(STAGE_ITEMS.length - 1, Math.max(0, Math.floor(progress * STAGE_ITEMS.length)));
      setActive(nextStep);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollToStep = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    if (total <= 0) { setActive(i); return; }
    // Middle of that step's scroll range, not the very start of it — lands
    // solidly inside the range instead of right on its boundary edge.
    const progress = (i + 0.5) / STAGE_ITEMS.length;
    window.scrollTo({ top: wrap.offsetTop + progress * total, behavior: "smooth" });
  };

  useLayoutEffect(() => {
    const position = () => {
      const stage = stageRef.current;
      const col = colRefs.current[active];
      const msg = msgRef.current;
      if (window.innerWidth < 768 || !stage || !col || !msg) {
        setMsgPos(null); // mobile: static stacked layout instead of absolute positioning
        return;
      }

      const colRect = col.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const gap = 28;
      const msgWidth = msg.offsetWidth;

      let left = active === 0
        ? (colRect.right - stageRect.left) + gap
        : (colRect.left - stageRect.left) - gap - msgWidth;
      left = Math.max(0, Math.min(left, stageRect.width - msgWidth));

      setMsgPos({ left, top: 0 });
    };

    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [active]);

  return (
    <section ref={wrapRef} className="relative h-[400vh]">
      <div className="home-pinned-sticky sticky w-full flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 w-full">
          <h2 className="text-[#2f3ef0] font-display text-3xl md:text-5xl tracking-wide mb-[clamp(12px,4dvh,40px)]">From first build to world stage.</h2>

          <div ref={stageRef} className="relative">
            <div className="flex items-end justify-center gap-6 md:gap-10 flex-wrap">
              {STAGE_ITEMS.map((item, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={item.title}
                    ref={(el) => { colRefs.current[i] = el; }}
                    type="button"
                    onClick={() => scrollToStep(i)}
                    className="home-robot-col flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="home-robot-figure w-[130px] md:w-[150px]"
                    />
                    <div
                      data-active={isActive}
                      className="home-robot-bar w-[120px] md:w-[132px]"
                    />
                  </button>
                );
              })}
            </div>

            <div
              ref={msgRef}
              className="home-robot-message w-[320px] max-w-[80vw] text-left bg-linear-to-r from-[#8C6CFF]/75 to-[#0162D1]/75 text-white p-5 rounded-2xl shadow-[0_12px_30px_rgba(80,90,240,.35)] md:absolute mt-8 md:mt-0 mx-auto md:mx-0"
              style={msgPos ? { left: msgPos.left, top: msgPos.top } : undefined}
            >
              <b className="block text-sm mb-1">{STAGE_ITEMS[active].title}</b>
              <span className="text-[13px] opacity-90">{STAGE_ITEMS[active].desc}</span>
            </div>
          </div>

          <div className="flex gap-2.5 justify-center mt-[clamp(12px,3dvh,36px)]">
            {STAGE_ITEMS.map((item, i) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Go to ${item.title}`}
                onClick={() => scrollToStep(i)}
                className="w-[11px] h-[11px] rounded-full border-2 border-[#2f3ef0] cursor-pointer p-0"
                style={{ backgroundColor: i === active ? "#2f3ef0" : "transparent" }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
