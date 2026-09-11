import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FinalCtaSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20 px-6">
      <div className="max-w-[1024px] mx-auto rounded-[28px] bg-linear-to-br from-[#0d0630] via-[#241155] to-[#3d1f8f] px-6 py-14 md:py-16 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:repeating-linear-gradient(115deg,transparent_0_120px,rgba(200,170,255,.08)_120px_122px)]" />

        <h2 className="relative font-display font-extrabold text-white text-3xl md:text-5xl mb-4">
          Ready To Enter The League?
        </h2>
        <p className="relative text-white/75 text-sm md:text-base max-w-[560px] mx-auto mb-9">
          Compete. Host. Partner. Be part of India&rsquo;s official tech-sports movement.
        </p>

        <div className="relative flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-sans inline-flex items-center gap-2 bg-linear-to-r from-[#0162D1] to-[#8C6CFF] text-white font-semibold text-sm md:text-base px-7 py-3.5 rounded-xl shadow-[0_14px_30px_rgba(80,90,240,.4)] transition hover:brightness-110"
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
      </div>
    </section>
  );
}
