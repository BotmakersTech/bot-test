import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, LayoutDashboard, BookOpen, Globe, Wrench,
  Shapes, Headset, Hammer, Scale, ClipboardList,
  type LucideIcon,
} from "lucide-react";

interface AudienceCard {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface AudienceTab {
  key: string;
  label: string;
  headline: string;
  subhead: string;
  cards: AudienceCard[];
  cta: string;
  ctaPath: string;
}

const TABS: AudienceTab[] = [
  {
    key: "participants",
    label: "For Participants",
    headline: "Prove where you stand.",
    subhead: "One national leaderboard. Every event counts.",
    cta: "Enter The League",
    ctaPath: "/register",
    cards: [
      { icon: TrendingUp, title: "National Ranking", desc: "One leaderboard, every affiliated event counts toward it." },
      { icon: LayoutDashboard, title: "Dashboard", desc: "Personal, team, and robot profiles — all in one place." },
      { icon: BookOpen, title: "Standard Rule Set", desc: "One rulebook, same format and fairness, every city — every event score is trustworthy." },
      { icon: Globe, title: "Gateway To Global", desc: "Top performers qualify for Battle of Robots, Russia." },
      { icon: Wrench, title: "Tool Set Help On Event", desc: "On-ground repair and rebuild support during competition." },
    ],
  },
  {
    key: "techfests",
    label: "For Techfests",
    headline: "Your fest. BotLeague's infrastructure.",
    subhead: "Everything it takes to run tech sports right — provided end to end.",
    cta: "Partner Your Techfest",
    ctaPath: "/contact-us",
    cards: [
      { icon: Shapes, title: "Standardized Arena", desc: "Built to spec, safety-certified rental arenas." },
      { icon: Headset, title: "Technical Ops Support", desc: "On-site coordination for every event on your schedule." },
      { icon: Hammer, title: "Tool Room", desc: "Repair and rebuild equipment on-site — drill, grinder, welder." },
      { icon: Scale, title: "Judging & Officials", desc: "Trained judges, transparent scoring, fair results." },
      { icon: ClipboardList, title: "Registration & Hosting Platform", desc: "Full event management tooling — registration, scheduling, and results, run for your fest." },
    ],
  },
];

export default function AudienceSection() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState(TABS[0].key);
  const active = TABS.find((t) => t.key === activeKey) ?? TABS[0];

  return (
    <section className="py-16 md:py-20 bg-linear-to-br from-[#f5f2ff] via-[#efe9ff] to-[#f8f6ff]">
      <div className="max-w-[1180px] mx-auto px-6">
        {/* Tab switcher */}
        <div className="flex justify-center mb-10 md:mb-12">
          <div className="inline-flex bg-white rounded-full p-1.5 shadow-[0_8px_24px_rgba(60,40,140,.12)] border border-[#e4defc]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveKey(tab.key)}
                aria-pressed={tab.key === activeKey}
                className={`font-sans text-sm md:text-base font-semibold px-6 md:px-8 py-2.5 rounded-full transition-colors ${
                  tab.key === activeKey
                    ? "bg-linear-to-r from-[#0162D1] to-[#8C6CFF] text-white shadow-[0_8px_18px_rgba(80,90,240,.35)]"
                    : "text-[#5b4fa8] hover:text-[#2f3ef0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-display text-3xl md:text-5xl bg-linear-to-r from-[#7b3ff2] to-[#e05fa8] bg-clip-text text-transparent">
            {active.headline}
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#333]">{active.subhead}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
          {active.cards.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-5 pt-7 text-center flex flex-col shadow-[0_14px_30px_rgba(20,10,60,.10)] [clip-path:polygon(19%_0,100%_0,100%_82%,88%_100%,0_100%,0_17%)]"
            >
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-linear-to-br from-[#0162D1]/10 to-[#8C6CFF]/15 flex items-center justify-center">
                <Icon size={26} className="text-[#5b4fa8]" strokeWidth={1.75} />
              </div>
              <h4 className="text-base font-display font-semibold text-[#7b3ff2] mb-1.5">{title}</h4>
              <p className="text-[12px] text-[#333] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <button
            type="button"
            onClick={() => navigate(active.ctaPath)}
            className="font-sans bg-linear-to-r from-[#0162D1] to-[#8C6CFF] text-white font-bold text-sm px-8 py-3 rounded-[10px] shadow-[0_10px_24px_rgba(80,90,240,.3)] transition hover:brightness-110"
          >
            {active.cta}
          </button>
        </div>
      </div>
    </section>
  );
}
