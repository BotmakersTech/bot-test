import sport1 from "../../../assets/home/Img/sports-img/sport1.png";
import sport2 from "../../../assets/home/Img/sports-img/sport2.png";
import sport3 from "../../../assets/home/Img/sports-img/sport3.png";
import sport4 from "../../../assets/home/Img/sports-img/sport4.png";

const SPORTS = [
  { src: sport1, alt: "LED combat performance" },
  { src: sport2, alt: "Battle of Robots presenter" },
  { src: sport3, alt: "Team entrance celebration" },
  { src: sport4, alt: "Combat robot build" },
];

export default function SportsSection() {
  return (
    <section className="py-16 md:py-[70px]">
      <div className="max-w-[1180px] mx-auto px-6">
        <h2 className="text-center text-[#7b3ff2] font-display text-3xl md:text-5xl mb-9">12+ tech sports. Not just RoboWar.</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {SPORTS.map((sport) => (
            <div key={sport.alt} className="h-[550px] rounded-2xl overflow-hidden">
              <img className="w-full h-full object-cover" src={sport.src} alt={sport.alt} />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 justify-center mt-9">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[11px] h-[11px] rounded-full border-2 border-[#2f3ef0]" style={{ backgroundColor: i === 0 ? "#2f3ef0" : "transparent" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
