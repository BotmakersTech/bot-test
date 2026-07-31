import heroVideo from "../../../assets/home/hero.mp4";
import PublicNavbar from "../../../shared/components/PublicNavbar";

export default function HeroSection() {
  return (
    <>
      <PublicNavbar overlapHero showLeagues />

      <section className="relative h-[640px] md:h-[720px] overflow-hidden [clip-path:polygon(100%_1%,100%_93%,93%_100%,0_100%,0_0)]">
        <div className="home-hero-anim absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-display text-white/10 text-[2.2rem] md:text-[4rem] whitespace-nowrap">ENTER ROBOTS</span>
        </div>
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/40 pointer-events-none" />
      </section>
    </>
  );
}
