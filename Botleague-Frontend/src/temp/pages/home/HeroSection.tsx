import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroVideo from "../../../assets/home/hero.mp4";
import PublicNavbar from "../../../shared/components/PublicNavbar";

const TECHFESTS = ["IIT Bombay TechFest", "BITS Pilani", "BITS Goa", "IIT Roorkee"];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <>
      <PublicNavbar overlapHero showLeagues />

      <section className="relative min-h-[720px] md:min-h-[800px] overflow-hidden flex items-center">
        <div className="home-hero-anim home-bg-video absolute inset-0 w-full h-full" />
        <video
          className="home-bg-video absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Readability scrim — the video/gradient behind this is decorative
            motion, not something the (now much larger) text content should
            have to compete with for contrast. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />

        <div className="relative z-10 w-full max-w-[1180px] mx-auto px-6 py-28 md:py-32 text-center text-white">
          <span className="inline-block font-sans text-[11px] md:text-xs font-semibold tracking-[3px] uppercase text-white/80 border border-white/30 rounded-full px-4 py-1.5 mb-6">
            India&rsquo;s Recognized Tech-Sports Platform
          </span>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-6xl leading-[1.15] max-w-[920px] mx-auto">
            India has thousands of robotiers. Now, every one of them has a place to prove it.
          </h1>

          <p className="mt-5 md:mt-6 font-display text-lg md:text-2xl tracking-wide bg-linear-to-r from-[#8C6CFF] to-[#0162D1] bg-clip-text text-transparent">
            One Rulebook. One Ranking. One Global Pathway.
          </p>

          <p className="mt-3 text-sm md:text-base text-white/75 max-w-[640px] mx-auto leading-relaxed">
            Built for participants who want to prove themselves — and techfests who want to run it right.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-sans inline-flex items-center gap-2 bg-linear-to-r from-[#0162D1] to-[#8C6CFF] text-white font-semibold text-sm md:text-base px-7 py-3.5 rounded-xl shadow-[0_14px_30px_rgba(80,90,240,.35)] transition hover:brightness-110"
            >
              Enter The League <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact-us")}
              className="font-sans bg-white/10 border border-white/40 text-white font-semibold text-sm md:text-base px-7 py-3.5 rounded-xl backdrop-blur-sm transition hover:bg-white/20"
            >
              Partner Your Techfest
            </button>
          </div>

          <div className="mt-14 flex flex-col items-center gap-4">
            <span className="font-display text-xs md:text-sm tracking-[2px] uppercase text-white/60">5+ Years. Proven.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {TECHFESTS.map((name) => (
                <span key={name} className="font-sans text-sm md:text-base font-medium text-white/70">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
