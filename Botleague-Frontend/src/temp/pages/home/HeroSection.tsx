import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import hero from "../../../assets/Hero.mp4";
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
          onError={(e) => {
            (e.target as HTMLVideoElement).style.display = "none";
          }}
        >
          <source src={hero} type="video/mp4" />
        </video>

        {/* Readability overlay */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/50" />

        <div className="relative z-10 w-full max-w-[1050px] mx-auto px-6 py-28 md:py-32 text-center text-white">

          {/* Badge */}
          <span className="inline-block font-sans text-[10px] md:text-[11px] font-semibold tracking-[2.5px] uppercase text-white/75 border border-white/25 bg-white/5 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            India&rsquo;s  Tech-Sports Platform
          </span>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-[42px] leading-[1.12] tracking-[-0.8px] max-w-[820px] mx-auto">
            India has thousands of robotiers.
            <br className="hidden md:block" />
            Now, every one of them has a place to prove it.
          </h1>

          {/* Supporting copy */}
          <p className="mt-5 text-sm md:text-base text-white/70 max-w-[560px] mx-auto leading-relaxed">
            Built for participants who want to prove themselves
            <br/>
            and techfests who want to run it right.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-sans inline-flex items-center justify-center gap-2 bg-linear-to-r from-[#0162D1] to-[#8C6CFF] text-white font-semibold text-sm px-7 py-3.5 rounded-xl shadow-[0_12px_28px_rgba(80,90,240,.28)] transition hover:brightness-110"
            >
              Enter The League
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/contact-us")}
              className="font-sans inline-flex items-center justify-center bg-white/8 border border-white/25 text-white font-semibold text-sm px-7 py-3.5 rounded-xl backdrop-blur-sm transition hover:bg-white/15"
            >
              Partner Your Techfest
            </button>
          </div>

        </div>
      </section>
    </>
  );
}