import { useLayoutEffect, useRef, useState } from "react";
import robot1 from "../../../assets/home/Img/robot1.png";
import robot2 from "../../../assets/home/Img/robot2.png";
import robot3 from "../../../assets/home/Img/robot3.png";
import robot4 from "../../../assets/home/Img/robot4.png";

const STAGE_ITEMS = [
  { title: "Compete At Any Affiliated Techfest", desc: "One Build. Same Rules. Compete Anywhere In India.", img: robot1 },
  { title: "National Ranking Counts", desc: "Every Match Adds To Your All-India Leaderboard.", img: robot2 },
  { title: "Verified Certificates", desc: "QR-Verified Wins Recognised At Every Affiliated Event.", img: robot3 },
  { title: "Gateway To Global", desc: "Top Performers Qualify For Battle Of Robots, Russia.", img: robot4 },
];

const ACTIVE_HEIGHT = 420;
const INACTIVE_HEIGHT = 80;

export default function RobotStage() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [msgPos, setMsgPos] = useState<{ left: number; top: number } | null>(null);

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
    <section className="py-16 md:py-20 text-center">
      <div className="max-w-[1180px] mx-auto px-6">
        <h2 className="text-[#2f3ef0] font-display text-3xl md:text-5xl tracking-wide mb-10">From first build to world stage.</h2>

        <div ref={stageRef} className="relative">
          <div className="flex items-end justify-center gap-6 md:gap-10 flex-wrap">
            {STAGE_ITEMS.map((item, i) => {
              const isActive = i === active;
              return (
                <button
                  key={item.title}
                  ref={(el) => { colRefs.current[i] = el; }}
                  type="button"
                  onClick={() => setActive(i)}
                  className="home-robot-col flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
                >
                  <div className="home-robot-figure w-[130px] md:w-[150px] flex items-end justify-center pb-2">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-auto object-contain transition-all duration-300"
                      style={{ opacity: isActive ? 1 : 0.55, transform: isActive ? "scale(1)" : "scale(0.82)" }}
                    />
                  </div>
                  <div
                    className="home-robot-bar w-[120px] md:w-[132px]"
                    style={{ height: isActive ? ACTIVE_HEIGHT : INACTIVE_HEIGHT }}
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

        <div className="flex gap-2.5 justify-center mt-9">
          {STAGE_ITEMS.map((item, i) => (
            <span
              key={item.title}
              className="w-[11px] h-[11px] rounded-full border-2 border-[#2f3ef0]"
              style={{ backgroundColor: i === active ? "#2f3ef0" : "transparent" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
