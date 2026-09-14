import { useEffect, useState } from "react";
import IITB from "../../../assets/Logo/IITB.png";
import BITSPilani from "../../../assets/Logo/BITS-Pilani.png";
import BITSGoa from "../../../assets/Logo/BITS-Goa.png";

const TECHFESTS = [
  {
    name: "IIT Bombay",
    event: "TechFest",
    logo: IITB,
  },
  {
    name: "BITS Pilani",
    event: "Apogee",
    logo: BITSPilani,
  },
  {
    name: "REC Chennai",
    event: "Titanium",
    logo: BITSGoa,
  },
  {
    name: "IIT Roorkee",
    event: "Cognizance",
    logo: IITB,
  },
];

const Techfest = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="mx-auto mt-16 mb-10 w-full max-w-6xl px-4 text-center">
      {/* Eyebrow */}
      <div className="mb-3 flex items-center justify-center gap-4">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#8C6CFF]" />

        <span className="font-[Orbitron] text-[10px] font-medium uppercase tracking-[4px] text-slate-400 md:text-xs">
          Trusted by India&apos;s top techfests
        </span>

        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#0162D1]" />
      </div>

      {/* Heading */}
      <h2 className="bg-gradient-to-r from-[#8C6CFF] to-[#0162D1] bg-clip-text font-[Orbitron] text-3xl font-bold uppercase tracking-[2px] text-transparent md:text-4xl">
        5+ Years. Proven.
      </h2>

      {/* Subtitle */}
      <p className="mt-3 font-[Inter] text-[10px] uppercase tracking-[3px] text-slate-400 md:text-xs">
        Powering robotics at India&apos;s biggest campuses
      </p>

      {/* Logo Strip */}
      {/* Logo Strip */}
<div className="relative mx-auto mt-10 max-w-5xl">
  <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#8C6CFF]/10 via-transparent to-[#0162D1]/10 blur-2xl" />

  <div
    className={`overflow-hidden rounded-[32px] border border-[#0162D1]/15 bg-white/80 shadow-[0_10px_40px_rgba(1,98,209,0.08)] backdrop-blur-xl transition-all duration-500 ease-out ${
      scrolled
        ? "px-5 py-3 md:px-8 md:py-3"
        : "px-5 py-8 md:px-8 md:py-9"
    }`}
  >
    {/* Institutes — ONE ROW */}
    <div className="grid grid-cols-2 divide-x divide-y divide-[#0162D1]/10 md:grid-cols-4 md:divide-y-0">
      {TECHFESTS.map((fest) => (
        <div
          key={fest.name}
          className={`flex items-center justify-center gap-4 px-4 transition-all duration-500 ease-out md:px-6 ${
            scrolled
              ? "min-h-[75px] py-2"
              : "min-h-[125px] py-5"
          }`}
        >
          <img
            src={fest.logo}
            alt={`${fest.name} ${fest.event} logo`}
            width={80}
            height={60}
            className={`w-[80px] shrink-0 object-contain transition-all duration-500 ${
              scrolled ? "h-[50px]" : "h-[60px]"
            }`}
          />

          <div className="min-w-0 text-left">
            <div className="whitespace-nowrap font-[Poppins] text-sm font-semibold uppercase tracking-wide text-slate-800 md:text-base">
              {fest.name}
            </div>

            <div className="mt-1 whitespace-nowrap font-[Inter] text-[9px] font-medium uppercase tracking-[2px] text-[#0162D1]/70 md:text-[10px]">
              {fest.event}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* MANY MORE — SEPARATE ROW */}
   <div
  className={`flex items-center justify-center gap-4 transition-all duration-500 ${
    scrolled ? "mt-2 pt-3" : "mt-3 pt-5"
  }`}
>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#8C6CFF]" />

      <span className="whitespace-nowrap font-[Inter] text-[9px] font-semibold uppercase tracking-[3px] text-slate-400 md:text-[10px]">
        + Many More
      </span>

      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#0162D1]" />
    </div>
  </div>
</div>

      {/* Bottom tagline */}
      {/* <div className="mt-7 flex items-center justify-center gap-4">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#8C6CFF]" />

        <span className="font-[Inter] text-[9px] uppercase tracking-[3px] text-slate-400 md:text-[10px]">
          Same passion. A bigger playground.
        </span>

        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#0162D1]" />
      </div> */}
    </section>
  );
};

export default Techfest;