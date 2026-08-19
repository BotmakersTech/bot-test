import { useNavigate } from "react-router-dom";
import { Scale, ShieldCheck, BookOpen, Trophy, TrendingUp, Sprout } from "lucide-react";
import PublicNavbar from "../../shared/components/PublicNavbar";

const heroImg = "/home-img/about.png";
const arenaImg = "/home-img/about-us.png";
const representImg = "/home-img/what.png";
const representImgMobile = "/home-img/about-mob.png";

const VALUES = [
  { icon: Scale, label: "Fair & Transparent Events" },
  { icon: ShieldCheck, label: "Safety-First Standards" },
  { icon: BookOpen, label: "Learning Through Competition" },
  { icon: Trophy, label: "National Recognition" },
  { icon: TrendingUp, label: "League Rankings" },
  { icon: Sprout, label: "Sustainable Growth" },
];

function ValueCard({ icon: Icon, label }: { icon: typeof Scale; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[15px] border border-black/5 bg-white p-7 text-center shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[#0162D1] to-[#8C6CFF]">
        <Icon size={24} color="#fff" />
      </span>
      <p className="font-display text-[16px] font-bold text-[#161616]">{label}</p>
    </div>
  );
}

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <PublicNavbar showLeagues />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a14] px-6 py-24 text-center md:py-32">
        <img
          src={heroImg}
          alt="BotLeague team celebrating a win at Techfest"
          className="absolute inset-x-0 bottom-0 top-6 w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0a14]/15 via-[#0a0a14]/55 to-[#0a0a14]" />

        <div className="relative">
          <span className="font-body inline-block rounded-[10px] border border-white/20 bg-white/[0.06] px-6 py-1.5 text-[12px] font-semibold text-white/80 md:text-[15px]">
            Our Story
          </span>

          <h1 className="font-display mx-auto mt-5 max-w-[900px] text-[clamp(20px,4vw,38px)] font-medium leading-[0.95] text-[#0162D1]">
            ABOUT US
          </h1>

          <p className="font-body mx-auto mt-4 max-w-[680px] text-[16px] font-semibold leading-snug text-white/70 md:text-[20px]">
            One national rulebook. One ranking. One league — built for every robotics builder in India.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="relative z-10 px-4 py-16 md:py-20">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-5 text-left">
            <p className="font-body text-[15px] leading-relaxed text-[#3C3C3C] md:text-[17px]">
              India has always had strong technical talent and passion for robotics. However, competitions have
              remained fragmented — with different rules, inconsistent judging standards, safety gaps, and no
              clear progression path for participants. BotLeague was built to solve this.
            </p>
            <p className="font-body text-[15px] leading-relaxed text-[#3C3C3C] md:text-[17px]">
              By introducing a single national rulebook, league-based competition structure, and professionally
              managed arenas, BotLeague ensures that every participant competes on a transparent, safe, and equal
              platform, regardless of location.
            </p>
          </div>

          <div className="overflow-hidden rounded-[15px] shadow-[0_20px_50px_rgba(1,98,209,0.15)]">
            <img src={arenaImg} alt="Robotics competition arena" className="h-[320px] w-full object-cover md:h-[400px]" />
          </div>
        </div>

        <p className="font-display mx-auto mt-14 max-w-[900px] bg-linear-to-r from-[#0162D1] to-[#8C6CFF] bg-clip-text text-center text-[26px] font-bold leading-tight text-transparent md:text-[42px]">
          This is not just an event platform. This is a league.
        </p>
      </section>

      {/* Vision & Mission */}
      <section className="relative z-10 overflow-hidden bg-linear-to-br from-[#1a1035] via-[#2b1760] to-[#0f3f9e] px-4 py-16 text-center md:py-20">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-10">
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-[26px] font-extrabold uppercase tracking-wide text-white md:text-[32px]">Vision</h3>
            <p className="font-body mx-auto max-w-[420px] text-[14px] leading-relaxed text-white/70 md:text-[16px]">
              To build India's most trusted and unified robotics competition ecosystem, enabling innovation, skill
              development, and global exposure through structured competitive pathways.
            </p>
          </div>

          <div className="mx-auto h-px w-32 bg-linear-to-r from-transparent via-white/30 to-transparent md:h-32 md:w-px md:bg-linear-to-b" />

          <div className="flex flex-col gap-3">
            <h3 className="font-display text-[26px] font-extrabold uppercase tracking-wide text-white md:text-[32px]">Mission</h3>
            <p className="font-body mx-auto max-w-[420px] text-[14px] leading-relaxed text-white/70 md:text-[16px]">
              To create age-wise and skill-wise competition categories, ensure fair play, safety, and transparent
              judging, and connect Indian robotics talent with national and global opportunities.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="font-body mt-12 rounded-[15px] bg-white px-10 py-4 text-[15px] font-semibold text-[#0a0a14] transition hover:brightness-95 md:text-[17px]"
        >
          Explore More
        </button>
      </section>

      {/* What BotLeague Represents */}
      <section className="relative z-10 bg-[#faf9fb] px-4 py-16 text-center md:py-20">
        <h3 className="font-body text-[16px] font-semibold uppercase tracking-wide text-[#161616] md:text-[20px]">
          Our Values
        </h3>
        <p className="font-display mx-auto mt-2 bg-linear-to-r from-[#0162D1] to-[#8C6CFF] bg-clip-text text-[28px] font-bold text-transparent md:text-[50px]">
          What BotLeague Represents
        </p>

        <div className="mx-auto mt-10 grid max-w-[1180px] grid-cols-1 items-center gap-10 md:grid-cols-[400px_1fr] md:gap-14">
          <div className="overflow-hidden rounded-[15px] shadow-[0_20px_50px_rgba(1,98,209,0.12)]">
            <img src={representImg} alt="Students building robots" className="hidden h-[360px] w-full object-cover md:block" />
            <img src={representImgMobile} alt="Students building robots" className="h-[280px] w-full object-cover md:hidden" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {VALUES.map((v) => (
              <ValueCard key={v.label} icon={v.icon} label={v.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA cards */}
      <section className="relative z-10 flex flex-col gap-6 px-4 py-16 md:mx-auto md:max-w-[1180px] md:flex-row md:gap-8">
        <div className="flex-1 rounded-[15px] bg-[#f3f3f5] p-8 md:p-10">
          <p className="font-display text-[22px] font-semibold text-black md:text-[28px]">Ready to compete?</p>
          <p className="font-body mt-2 text-[14px] text-[#393939] md:text-[17px]">
            Your ranking starts at your first affiliated event. Free to register.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="font-body mt-8 flex w-full items-center justify-center rounded-[15px] bg-linear-to-r from-[#0162D1] to-[#8C6CFF] px-6 py-4 text-[15px] font-semibold text-white transition hover:brightness-110 md:w-auto md:px-10"
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
