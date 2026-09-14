import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import igniteImg from "../../../assets/home/Img/ignite.png";
import { useLeagues, formatAgeRange } from "../leagues/useLeagues";

const STAGE_META = [
  {
    tag: "ENTRY",
    blurb: "Creativity, logic, and fun learning — first builds, first wins.",
  },
  {
    tag: "GROWTH",
    blurb: "Engineering, automation, and strategy — building toward real competition.",
  },
  {
    tag: "ELITE",
    blurb: "Professional robotics and advanced sports — the gateway to global.",
  },
];

export default function LeaguesSection() {
  const navigate = useNavigate();
  const { leagues: rawLeagues } = useLeagues();

  const LEAGUES = useMemo(
    () =>
      [...rawLeagues].sort(
        (a, b) => (a.minAge ?? 0) - (b.minAge ?? 0)
      ),
    [rawLeagues]
  );

  return (
    <section
      id="leagues"
      className="w-full bg-linear-to-br from-[#dcd6fb] via-[#efe9ff] to-[#e4defc] px-6 py-16 md:py-20"
    >
      {/* HEADER */}
      <div className="max-w-[1180px] mx-auto text-center mb-10">
        <h2 className="font-display text-3xl md:text-5xl mb-2 bg-linear-to-r from-[#7b3ff2] to-[#e05fa8] bg-clip-text text-transparent">
          Compete at your level. Grow through the ranks.
        </h2>

        <p className="text-sm md:text-base text-[#333]">
          Age-wise progression, from first build to elite competition.
        </p>
      </div>

      {/* CARDS */}
      <div className="w-full max-w-[1024px] mx-auto flex flex-col gap-6">
        {LEAGUES.map((league, idx) => {
          const meta =
            STAGE_META[idx] ??
            STAGE_META[STAGE_META.length - 1];

          const ageRange = formatAgeRange(
            league.minAge,
            league.maxAge
          );

          return (
            <div
              key={league.name}
              className="w-full h-[280px] md:h-[280px] bg-white rounded-2xl overflow-hidden border-2 shadow-[0_20px_50px_rgba(60,40,140,.18)] grid md:grid-cols-2"
              style={{ borderColor: league.border }}
            >
              {/* IMAGE */}
              <div
                className={`relative overflow-hidden bg-linear-to-br ${league.imgGradient} [clip-path:polygon(75%_0,100%_100%,0_100%,0_0)]`}
              >
                <img
                  src={igniteImg}
                  alt={league.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* CONTENT */}
              <div className="p-7 md:p-10 flex flex-col justify-center">
                <div
                  className="font-sans text-xs font-bold tracking-[2px] uppercase mb-2"
                  style={{ color: league.border }}
                >
                  {String(idx + 1).padStart(2, "0")} / {meta.tag}
                  {ageRange ? ` · Age ${ageRange}` : ""}
                </div>

                <h3
                  className={`font-display font-extrabold tracking-widest text-3xl md:text-3xl w-max bg-linear-to-r ${league.textGradient} bg-clip-text text-transparent border-b-[3px] pb-1.5`}
                  style={{ borderColor: league.border }}
                >
                  {league.name}
                </h3>

                <p className="text-base md:text-[20px] text-[#222] leading-relaxed mt-4 max-w-[470px]">
                  {meta.blurb}
                </p>

                <button
                  onClick={() =>
                    navigate(`/leagues/${league.slug}`)
                  }
                  className={`font-sans mt-5 w-fit bg-linear-to-r ${league.textGradient} text-white font-semibold text-base px-6 py-2.5 rounded-xl`}
                >
                  {league.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}