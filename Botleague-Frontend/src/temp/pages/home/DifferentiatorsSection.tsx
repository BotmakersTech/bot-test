import { HeartHandshake, ShieldCheck, Compass, type LucideIcon } from "lucide-react";

const POINTS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: HeartHandshake,
    title: "Built By The Community",
    desc: "We didn't start as event promoters. We built bots, competed in arenas, and lived the same scene every participant lives today.",
  },
  {
    icon: ShieldCheck,
    title: "Professional Setup",
    desc: "Standardized arenas, technical operations, and trained judging — every event run to a professional tournament standard, not an improvised one.",
  },
  {
    icon: Compass,
    title: "We Know Every Scene",
    desc: "Competitor, organizer, judge — we've played every role in this ecosystem, so we know exactly what a fest and a fighter each actually need.",
  },
];

export default function DifferentiatorsSection() {
  return (
    <section className="py-16 md:py-[70px]">
      <div className="max-w-[1180px] mx-auto px-6 text-center">
        <h2 className="text-[#2f3ef0] font-display text-3xl md:text-5xl mb-3">Not outsiders. Part of the scene.</h2>
        <p className="text-sm md:text-base text-[#333] mb-10 md:mb-12">What Makes Us Different</p>

        <div className="grid md:grid-cols-3 gap-6">
          {POINTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="text-left bg-white rounded-2xl border border-[#cfc7f7] p-7 md:p-8 flex flex-col gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-[#0162D1]/10 to-[#8C6CFF]/15 flex items-center justify-center">
                <Icon size={26} className="text-[#5b4fa8]" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-lg font-semibold text-[#2f3ef0]">{title}</h3>
              <p className="text-sm text-[#333] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
