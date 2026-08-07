import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import igniteImg from "../../../assets/home/Img/ignite.png";
import { LEAGUES } from "../leagues/leagueData";

type CardState = "hidden" | "collapsed" | "expanded";

/** Cards stack and reveal one at a time as the tall wrapper scrolls past, matching OneSection's pinned-scroll pattern. */
export default function LeaguesSection() {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const update = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = scrolled / total;
      const nextStep = Math.min(LEAGUES.length - 1, Math.max(0, Math.floor(progress * LEAGUES.length)));
      setStep(nextStep);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section id="leagues" ref={wrapRef} className="relative h-[340vh] bg-linear-to-br from-[#dcd6fb] via-[#efe9ff] to-[#e4defc]">
      <div className="home-pinned-sticky sticky w-full flex flex-col justify-center px-6 pt-6 overflow-hidden">
        <div className="max-w-[1180px] mx-auto w-full px-0">
          <h2 className="text-center font-display text-3xl md:text-5xl mb-6 md:mb-8 bg-linear-to-r from-[#7b3ff2] to-[#e05fa8] bg-clip-text text-transparent">
            Compete at your level. Grow through the ranks.
          </h2>
        </div>
        <div className="w-full max-w-[1024px] mx-auto flex flex-col">
          {LEAGUES.map((league, idx) => {
            const state: CardState = idx < step ? "collapsed" : idx === step ? "expanded" : "hidden";
            return (
              <div key={league.name} className="home-league-card-wrap" data-state={state}>
                <div
                  className="h-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(60,40,140,.18)] grid md:grid-cols-2 overflow-hidden border-2"
                  style={{ borderColor: league.border }}
                >
                  <div className={`home-league-img relative overflow-hidden bg-linear-to-br ${league.imgGradient} [clip-path:polygon(75%_0,100%_100%,0_100%,0_0)]`}>
                    <img src={igniteImg} alt={league.name} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="p-6 md:p-9 flex flex-col justify-center gap-2">
                    <h3
                      className={`font-display font-extrabold tracking-widest text-4xl w-max bg-linear-to-r ${league.textGradient} bg-clip-text text-transparent border-b-[3px] pb-1.5`}
                      style={{ borderColor: league.border }}
                    >
                      {league.name}
                    </h3>
                    <div className="home-league-desc-wrap">
                      <p className="text-[24px] text-[#222] leading-relaxed pt-1">{league.desc}</p>
                      <button
                        onClick={() => navigate(`/leagues/${league.slug}`)}
                        className={`font-sans mt-3 bg-linear-to-r ${league.textGradient} text-white font-semibold text-base px-6 py-2.5 rounded-xl`}
                      >
                        {league.cta}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
