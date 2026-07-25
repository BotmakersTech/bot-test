import "./home/home.css";
import HeroSection from "./home/HeroSection";
import OneSection from "./home/OneSection";
import RobotStage from "./home/RobotStage";
import LeaguesSection from "./home/LeaguesSection";
import SportsSection from "./home/SportsSection";
import FeaturesSection from "./home/FeaturesSection";
import RussiaSection from "./home/RussiaSection";
import ProvenSection from "./home/ProvenSection";
import TiersSection from "./home/TiersSection";

export default function BotLeague() {
  return (
    <div className="font-body text-[#0a0a14] bg-white antialiased">
      <HeroSection />
      <div className="max-w-[1530px] mx-auto">
        <OneSection />
        <RobotStage />
        <LeaguesSection />
        <SportsSection />
        <FeaturesSection />
        <RussiaSection />
        <ProvenSection />
        <TiersSection />
      </div>
    </div>
  );
}
