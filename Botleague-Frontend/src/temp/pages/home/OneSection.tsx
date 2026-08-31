import { useEffect, useRef, useState } from "react";
import oneImg from "../../../assets/home/Img/one.png";

const FEATURES = [
  { title: "Unified Rulebook", desc: "One rulebook, every arena. No confusion, no disputes, no re-learning the rules at every fest." },
  { title: "National Ranking", desc: "Every fest score adds to your national ranking. Rise with your fest, wherever you compete." },
  { title: "Verified Certificates", desc: "QR-verified achievements, recognised across every affiliated techfect in the country." },
  { title: "Global Gateway", desc: "Qualify for Battle of Robots and represent India on the world stage." },
];

type Phase = "below" | "in" | "above";

/**
 * Pinned-scroll section: the container is 480vh tall so the inner sticky
 * viewport stays fixed while the user scrolls through it, and the "1" +
 * feature copy advance based on how far through that tall container the
 * scroll position sits — not on a fixed timer.
 */
export default function OneSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const oneImgRef = useRef<HTMLImageElement>(null);
  const centerOffsetRef = useRef(0);

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("below");

  useEffect(() => {
    const measureCenterOffset = () => {
      if (!rowRef.current || !oneImgRef.current) return;
      // At rest the row is pushed right by half the (gap + text width) so
      // the "1" alone sits dead-center; scrolling snaps it to translateX(0),
      // which is what visually reads as the "1" sliding left to make room.
      centerOffsetRef.current = Math.max(0, (rowRef.current.scrollWidth - oneImgRef.current.offsetWidth) / 2);
    };

    const update = () => {
      const wrap = wrapRef.current;
      const row = rowRef.current;
      if (!wrap || !row) return;

      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;

      // Keep the "1" centered until scrolling actually begins.
      if (progress <= 0.03) {
        setPhase("below");
        row.style.transform = `translateX(${centerOffsetRef.current}px)`;
        return;
      }

      // Slides left and locks in place once scrolling starts.
      row.style.transform = "translateX(0px)";

      const n = FEATURES.length;
      const raw = progress * n;
      const nextStep = Math.min(n - 1, Math.floor(raw));
      const local = raw - nextStep;

      setStep(nextStep);

      const isLast = nextStep === n - 1;
      setPhase(isLast || local < 0.7 ? "in" : "above");
    };

    measureCenterOffset();
    update();

    const onResize = () => { measureCenterOffset(); update(); };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section ref={wrapRef} className="relative h-[480vh] bg-white">
      <div className="home-pinned-sticky sticky w-full overflow-hidden flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 -z-10 opacity-70 [background:repeating-linear-gradient(115deg,transparent_0_120px,rgba(130,120,255,.08)_120px_122px)]" />

        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <svg className="home-doodle left-[8%] top-[16%] w-20 md:w-28" viewBox="0 0 120 70" fill="none" stroke="currentColor" strokeWidth={3}>
            <rect x="42" y="30" width="36" height="20" rx="8" />
            <line x1="42" y1="34" x2="16" y2="20" /><line x1="78" y1="34" x2="104" y2="20" />
            <ellipse cx="14" cy="17" rx="13" ry="4" /><ellipse cx="106" cy="17" rx="13" ry="4" />
            <line x1="50" y1="50" x2="46" y2="60" /><line x1="70" y1="50" x2="74" y2="60" />
          </svg>
          <svg className="home-doodle left-[4%] bottom-[14%] w-16 md:w-24" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M50 4 L60 40 L96 50 L60 60 L50 96 L40 60 L4 50 L40 40 Z" />
          </svg>
          <svg className="home-doodle right-[10%] top-[22%] w-12 md:w-16" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={4}>
            <path d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z" />
          </svg>
          <svg className="home-doodle right-[6%] bottom-[26%] w-20 md:w-28" viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M6 44 L112 8 L74 84 L52 56 Z" /><path d="M52 56 L112 8" /><path d="M52 56 L50 78" />
          </svg>
          <svg className="home-doodle right-[2%] top-[52%] w-8 md:w-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={5}>
            <path d="M50 8 L58 42 L92 50 L58 58 L50 92 L42 58 L8 50 L42 42 Z" />
          </svg>
        </div>

        <div className="max-w-[1530px]">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-5xl leading-tight">
            India Has Thousands Of Robotiers.<br />No One Knows Who's Actually The Best.
          </h2>
          <p className="mt-[clamp(6px,1.5dvh,16px)] text-xs md:text-base font-medium text-[#333]">Different Rules. Different Arenas. No National Ranking. No Global Pathway.</p>
          <div className="mt-[clamp(8px,2dvh,20px)] flex items-center justify-center gap-2 text-base md:text-xl font-bold">
            <span className="font-display italic border-b-[3px] border-[#2f3ef0] pb-0.5">
              <span className="text-[#b22222]">BOT</span>
              <span className="bg-linear-to-r from-[#8C6CFF] to-[#0162D1] bg-clip-text text-transparent">LEAGUE</span>
            </span>
            <span>Fixes This!</span>
          </div>
        </div>

        <div className="w-full max-w-[1180px] mx-auto flex justify-center overflow-visible mt-[clamp(10px,2.5dvh,32px)] md:mt-[clamp(10px,3dvh,48px)]">
          <div ref={rowRef} className="home-one-row relative flex flex-col md:flex-row items-center gap-4 md:gap-10">
            <img
              ref={oneImgRef}
              src={oneImg}
              alt="1"
              className="home-one-img w-auto select-none"
            />
            <div className="home-feature-box text-center md:text-left" data-anim={phase}>
              <h3 className="font-display font-extrabold text-5xl md:text-7xl bg-linear-to-r from-[#4f5ff5] to-[#8b5cf6] bg-clip-text text-transparent mb-2 md:mb-3">
                {FEATURES[step].title}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#333] leading-relaxed">
                {FEATURES[step].desc}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 md:bottom-12 flex gap-3">
          {FEATURES.map((f, i) => (
            <span
              key={f.title}
              className="w-2.5 h-2.5 rounded-full border-2 border-[#2f3ef0]"
              style={{ backgroundColor: i === step ? "#2f3ef0" : "transparent" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
