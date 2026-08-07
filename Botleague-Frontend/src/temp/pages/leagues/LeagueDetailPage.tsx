import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Wifi, Scale, ShieldCheck, Trophy, Users, Sparkles } from "lucide-react";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import { getLeagueConfig, getAgeGroupCatalogue, type LeagueConfig } from "./leagueData";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2 text-center">
      <span className="font-body text-[44px] md:text-[72px] font-extrabold leading-none text-white">{value}</span>
      <span className="font-body text-[13px] md:text-[18px] font-semibold text-[#111]">{label}</span>
    </div>
  );
}

function SportCard({ label, hint, weightClasses, league }: { label: string; hint?: string; weightClasses: { label: string }[]; league: LeagueConfig }) {
  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-black/5 bg-white p-6 text-left shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
      <h4 className={`font-display bg-linear-to-r ${league.textGradient} bg-clip-text text-transparent text-[20px] md:text-[24px] font-bold`}>
        {label}
      </h4>
      {hint && <p className="font-body text-[14px] text-[#515151]">{hint}</p>}
      {weightClasses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {weightClasses.map((w) => (
            <span key={w.label} className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-[#333]">
              {w.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeagueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const league = getLeagueConfig(slug);

  if (!league) return <Navigate to="/" replace />;

  const ageGroup = getAgeGroupCatalogue(league.ageGroupValue);
  const sports = ageGroup?.sports ?? [];
  const nextLeague = league.nextSlug ? getLeagueConfig(league.nextSlug) : undefined;
  const recognitionBullet = league.whatYouGet[2];

  const connectivitySummary = ageGroup?.connectivity ?? "Wireless";
  const allWeightClasses = Array.from(
    new Map(sports.flatMap((s) => s.weightClasses).map((w) => [w.value, w])).values()
  );

  const scrollToSports = () => {
    document.getElementById("sports")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white">
      <PublicNavbar showLeagues />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a14] px-6 pb-16 pt-14 text-center md:pb-24 md:pt-20">
        <button
          onClick={() => navigate("/")}
          className="font-body mx-auto mb-8 flex items-center gap-1.5 text-[13px] font-semibold text-white/50 transition hover:text-white/80"
        >
          <ArrowLeft size={15} /> All leagues
        </button>

        <span className="font-body inline-block rounded-[10px] border border-white/20 bg-white/[0.06] px-6 py-1.5 text-[12px] font-semibold text-white/80 md:text-[15px]">
          {ageGroup?.subLabel ?? ""} &nbsp;·&nbsp; Free to register
        </span>

        <h1
          className={`font-display mx-auto mt-5 max-w-[900px] bg-linear-to-r ${league.textGradient} bg-clip-text text-[52px] font-bold leading-[0.95] text-transparent sm:text-[76px] md:text-[110px]`}
        >
          {league.name}
        </h1>

        <p className="font-body mx-auto mt-4 max-w-[720px] text-[16px] font-semibold leading-snug text-white/70 md:text-[22px]">
          {league.tagline}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={() => navigate("/register")}
            className={`font-body rounded-[15px] bg-linear-to-r ${league.textGradient} px-8 py-4 text-[15px] font-semibold text-white transition hover:brightness-110 md:text-[18px]`}
          >
            Start competing
          </button>
          <button
            onClick={scrollToSports}
            className="font-body rounded-[15px] border border-white/30 px-8 py-4 text-[15px] font-semibold text-white transition hover:bg-white/10 md:text-[18px]"
          >
            See the sports
          </button>
        </div>

        <p className="font-body mt-4 text-[12px] font-medium text-white/40 md:text-[13px]">
          Free to register. Event fees set by each techfest.
        </p>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 mx-4 -mt-8 md:mx-auto md:max-w-[1180px]">
        <div
          className="grid grid-cols-2 gap-y-6 rounded-[15px] py-8 shadow-[0_20px_40px_rgba(0,0,0,0.15)] md:grid-cols-4 md:gap-y-0"
          style={{ background: league.border }}
        >
          <StatCard value={String(sports.length)} label="Sports in this league" />
          <StatCard value={league.startingAge} label="Starting age" />
          <StatCard value="IN" label="National ranking — all India" />
          <StatCard value="→" label={league.nextSlug ? `Path to ${nextLeague?.name ?? ""}` : "Path to the global stage"} />
        </div>
      </section>

      {/* Why this league exists */}
      <section className={`relative z-10 mt-10 overflow-hidden bg-linear-to-br ${league.imgGradient} px-6 py-16 text-center md:py-24`}>
        <h3 className="font-body text-[16px] font-semibold uppercase tracking-wide text-white/60 md:text-[20px]">
          Why this league exists
        </h3>
        <p className="font-display mx-auto mt-6 max-w-[1000px] text-[30px] font-bold leading-tight text-white md:text-[56px] md:leading-[1.1]">
          {league.whyHeadline}
        </p>
        <p className="font-body mx-auto mt-6 max-w-[720px] text-[15px] leading-relaxed text-white/75 md:text-[19px]">
          {league.whyBody}
        </p>

        <div className="mx-auto mt-12 max-w-[1180px]">
          <p className="font-body mx-auto max-w-[560px] text-[13px] font-medium text-white/60 md:text-[16px]">
            Part of BotLeague — proven at
            <br className="hidden md:block" /> IIT Bombay Techfest &nbsp;·&nbsp; BITS Pilani &nbsp;·&nbsp; IIT Roorkee
          </p>

          {recognitionBullet && (
            <div className="mx-auto mt-8 flex max-w-[1000px] items-center gap-4 rounded-[15px] bg-white px-6 py-6 text-left shadow-xl md:px-10 md:py-8">
              <div className="h-[54px] w-[5px] shrink-0 rounded-full" style={{ background: league.border }} />
              <div>
                <p className={`font-display bg-linear-to-r ${league.textGradient} bg-clip-text text-[18px] font-extrabold text-transparent md:text-[26px]`}>
                  {recognitionBullet.title}
                </p>
                <p className="font-body mt-1 text-[13px] font-medium text-[#3C3C3C] md:text-[17px]">
                  {recognitionBullet.body}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sports & what you learn */}
      <section id="sports" className="relative z-10 px-4 py-16 text-center md:py-20">
        <h3 className="font-body text-[16px] font-semibold uppercase tracking-wide text-[#161616] md:text-[20px]">
          Sports & what you learn
        </h3>
        <p className={`font-display mx-auto mt-2 bg-linear-to-r ${league.textGradient} bg-clip-text text-[30px] font-bold text-transparent md:text-[54px]`}>
          The sports. And the skills behind them.
        </p>
        <p className="font-body mx-auto mt-4 max-w-[760px] text-[14px] text-[#161616]/70 md:text-[20px]">
          Every event builds real technical depth. Here's what you'll actually be building with.
        </p>

        <div className="mx-auto mt-10 grid max-w-[1180px] grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {sports.map((sport) => (
            <SportCard key={sport.value} label={sport.label} hint={sport.hint} weightClasses={sport.weightClasses} league={league} />
          ))}
        </div>
      </section>

      {/* The rulebook */}
      <section className="relative z-10 bg-[#faf9fb] px-4 py-16 text-center md:py-20">
        <h3 className="font-body text-[16px] font-semibold uppercase tracking-wide text-[#161616] md:text-[20px]">
          The rulebook
        </h3>
        <p className={`font-display mx-auto mt-2 bg-linear-to-r ${league.textGradient} bg-clip-text text-[28px] font-bold text-transparent md:text-[50px]`}>
          One standard. No surprises.
        </p>
        <p className="font-body mx-auto mt-4 max-w-[720px] text-[14px] text-[#161616]/70 md:text-[20px]">
          Build to the BotLeague rulebook once — compete at any affiliated techfest in India without rebuilding for different standards.
        </p>

        <div className="mx-auto mt-10 grid max-w-[1180px] grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-[15px] bg-white p-8 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
            <Wifi size={28} color={league.border} />
            <p className="font-display text-[17px] font-bold text-[#161616]">Connectivity</p>
            <p className="font-body text-[13px] text-[#515151]">{connectivitySummary}</p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-[15px] bg-white p-8 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
            <Scale size={28} color={league.border} />
            <p className="font-display text-[17px] font-bold text-[#161616]">Weight classes</p>
            <p className="font-body text-[13px] text-[#515151]">
              {allWeightClasses.length ? allWeightClasses.map((w) => w.label).join(" · ") : "Open"}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-[15px] bg-white p-8 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
            <ShieldCheck size={28} color={league.border} />
            <p className="font-display text-[17px] font-bold text-[#161616]">One national standard</p>
            <p className="font-body text-[13px] text-[#515151]">Same rulebook, every affiliated techfest in India.</p>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="relative z-10 px-4 py-16 text-center md:py-20">
        <h3 className="font-body text-[16px] font-semibold uppercase tracking-wide text-[#161616] md:text-[20px]">
          What you get
        </h3>
        <p className={`font-display mx-auto mt-2 bg-linear-to-r ${league.textGradient} bg-clip-text text-[28px] font-bold text-transparent md:text-[50px]`}>
          Compete. Rank. Get noticed.
        </p>

        <div className="mx-auto mt-10 grid max-w-[1180px] grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {league.whatYouGet.map((item, i) => {
            const Icon = [ShieldCheck, Trophy, Users, Sparkles][i] ?? Sparkles;
            return (
              <div key={item.title} className="flex flex-col items-center gap-3 rounded-[15px] border border-black/5 bg-white p-7 text-center shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
                <Icon size={26} color={league.border} />
                <p className="font-display text-[16px] font-bold text-[#161616]">{item.title}</p>
                <p className="font-body text-[13px] text-[#515151]">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Your journey */}
      <section className={`relative z-10 mt-4 overflow-hidden bg-linear-to-br ${league.imgGradient} px-4 py-16 text-center md:py-20`}>
        <h3 className="font-body text-[16px] font-semibold uppercase tracking-wide text-white/60 md:text-[20px]">
          Your journey
        </h3>
        <p className="font-display mt-3 text-[26px] font-bold text-white md:text-[46px]">{league.journeyHeadline}</p>

        {nextLeague ? (
          <button
            onClick={() => navigate(`/leagues/${nextLeague.slug}`)}
            className="mx-auto mt-10 flex w-full max-w-[1000px] flex-col items-center justify-between gap-4 rounded-[15px] bg-white px-6 py-6 text-left shadow-xl transition hover:-translate-y-0.5 sm:flex-row md:px-10 md:py-7"
          >
            <div>
              <p className="font-body text-[15px] text-black/60 md:text-[18px]">{league.nextLabel}</p>
              <p className={`font-display mt-1 bg-linear-to-r ${nextLeague.textGradient} bg-clip-text text-[18px] font-extrabold text-transparent md:text-[26px]`}>
                {league.nextBody}
              </p>
            </div>
            <span
              className="flex shrink-0 items-center gap-2 rounded-[15px] border-2 px-5 py-3 text-[14px] font-semibold md:px-6 md:text-[17px]"
              style={{ borderColor: nextLeague.border, color: nextLeague.border }}
            >
              Explore {nextLeague.name.split(" ")[0]} <ArrowRight size={18} />
            </span>
          </button>
        ) : (
          <div className="mx-auto mt-10 flex w-full max-w-[1000px] flex-col items-center justify-center gap-2 rounded-[15px] bg-white px-6 py-8 shadow-xl md:px-10">
            <p className="font-display text-[18px] font-extrabold text-[#161616] md:text-[26px]">{league.nextLabel}</p>
            <p className="font-body text-[13px] text-[#515151] md:text-[16px]">{league.nextBody}</p>
          </div>
        )}
      </section>

      {/* Two CTA cards */}
      <section className="relative z-10 flex flex-col gap-6 px-4 py-16 md:mx-auto md:max-w-[1180px] md:flex-row md:gap-8">
        <div className="flex-1 rounded-[15px] bg-[#f3f3f5] p-8 md:p-10">
          <p className="font-display text-[22px] font-semibold text-black md:text-[28px]">
            Ready to compete in {league.name.replace(" LEAGUE", "")} League?
          </p>
          <p className="font-body mt-2 text-[14px] text-[#393939] md:text-[17px]">
            Your ranking starts at your first affiliated event. Free to register.
          </p>
          <button
            onClick={() => navigate("/register")}
            className={`font-body mt-8 flex w-full items-center justify-center rounded-[15px] bg-linear-to-r ${league.textGradient} px-6 py-4 text-[15px] font-semibold text-white transition hover:brightness-110 md:w-auto md:px-10`}
          >
            Start competing — free
          </button>
        </div>
        <div className="flex-1 rounded-[15px] bg-[#f3f3f5] p-8 md:p-10">
          <p className="font-display text-[22px] font-semibold text-black md:text-[28px]">Find an event near you.</p>
          <p className="font-body mt-2 text-[14px] text-[#393939] md:text-[17px]">
            Browse all affiliated techfests filtered by city, sport, and date.
          </p>
          <button
            onClick={() => navigate("/events")}
            className="font-body mt-8 flex w-full items-center justify-center rounded-[15px] border-2 border-black px-6 py-4 text-[15px] font-semibold text-black transition hover:bg-black/5 md:w-auto md:px-10"
          >
            Browse events
          </button>
        </div>
      </section>
    </div>
  );
}
