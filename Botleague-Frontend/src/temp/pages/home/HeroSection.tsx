import heroVideo from "../../../assets/home/hero.mp4";
import PublicNavbar from "../../../shared/components/PublicNavbar";

export default function HeroSection() {
  return (
    <>
      <PublicNavbar overlapHero showLeagues />

      <section className="relative h-[640px] md:h-[720px] overflow-hidden">
        <div className="home-hero-anim home-bg-video absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-display text-white/10 text-[2.2rem] md:text-[4rem] whitespace-nowrap">ENTER ROBOTS</span>
        </div>
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
      </section>
    </>
  );
}
