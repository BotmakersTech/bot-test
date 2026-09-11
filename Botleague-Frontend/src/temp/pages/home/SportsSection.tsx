import { Disc3, Flag, CircleDot, Drone, Route, Swords, Car, type LucideIcon } from "lucide-react";

const SPORTS: { icon: LucideIcon; name: string }[] = [
  { icon: Disc3, name: "Robo Sumo" },
  { icon: Flag, name: "Robo Race" },
  { icon: CircleDot, name: "Robo Soccer" },
  { icon: Drone, name: "Drone Soccer" },
  { icon: Route, name: "Line Follower" },
  { icon: Swords, name: "RoboWar" },
  { icon: Car, name: "RC Racing" },
];

export default function SportsSection() {
  return (
    <section className="py-16 md:py-[70px]">
      <div className="max-w-[1180px] mx-auto px-6 text-center">
        <h2 className="text-[#7b3ff2] font-display text-3xl md:text-5xl mb-3">7 tech sports. One standardized rulebook.</h2>
        <p className="text-sm md:text-base text-[#333] mb-10 md:mb-12">Same rules, same fairness, every city across India.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-5">
          {SPORTS.map(({ icon: Icon, name }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-3 bg-white rounded-2xl border border-[#e4defc] px-4 py-7 shadow-[0_10px_26px_rgba(60,40,140,.08)] transition hover:shadow-[0_14px_32px_rgba(60,40,140,.16)] hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#0162D1]/10 to-[#8C6CFF]/15 flex items-center justify-center">
                <Icon size={30} className="text-[#5b4fa8]" strokeWidth={1.75} />
              </div>
              <span className="font-display text-sm md:text-[15px] text-[#222]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
