import "./home/home.css";
import HeroSection from "./home/HeroSection";
import AudienceSection from "./home/AudienceSection";
import LeaguesSection from "./home/LeaguesSection";
import SportsSection from "./home/SportsSection";
import DifferentiatorsSection from "./home/DifferentiatorsSection";
import RussiaSection from "./home/RussiaSection";
import ProvenSection from "./home/ProvenSection";
import FinalCtaSection from "./home/FinalCtaSection";

export default function BotLeague() {
  return (
    <div className="font-body text-[#0a0a14] bg-white antialiased">
      <HeroSection />
      <div className="max-w-[1530px] mx-auto">
        <AudienceSection />
        <LeaguesSection />
        <SportsSection />
        <DifferentiatorsSection />
        <RussiaSection />
        <ProvenSection />
        <FinalCtaSection />
      </div>
    </div>
  );
}
