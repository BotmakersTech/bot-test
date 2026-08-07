import { AGE_GROUP_CATALOGUE, type AgeGroupConfig } from "../../../shared/constants/sportCatalogue";

export type LeagueSlug = "ignite" | "inferno" | "apex";

export interface LeagueConfig {
  slug: LeagueSlug;
  name: string;
  ageGroupValue: string;
  startingAge: string;
  border: string;
  imgGradient: string;
  textGradient: string;
  tagline: string;
  desc: string;
  cta: string;
  whyHeadline: string;
  whyBody: string;
  whatYouGet: { title: string; body: string }[];
  journeyHeadline: string;
  nextSlug: LeagueSlug | null;
  nextLabel: string;
  nextBody: string;
}

/** Single source of truth for the 3 league pages' color/copy — consumed by
 *  both the Home page's LeaguesSection teaser cards and the full
 *  /leagues/:slug detail page, so the two can never drift out of sync. */
export const LEAGUES: LeagueConfig[] = [
  {
    slug: "ignite",
    name: "IGNITE LEAGUE",
    ageGroupValue: "JUNIOR_INNOVATORS",
    startingAge: "8+",
    border: "#e05fa8",
    imgGradient: "from-[#1a1035] via-[#3b1d6e] to-[#6d28d9]",
    textGradient: "from-[#8b5cf6] to-[#e05fa8]",
    tagline: "Your first step into robotics. Learn the basics, build your first bot, and compete with confidence.",
    desc: "Perfect for beginners. Learn robotics, compete in your first events, and build confidence.",
    cta: "Enter Ignite",
    whyHeadline: "Every builder starts somewhere.",
    whyBody: "Ignite is where you learn to wire, code, and compete for the first time — alongside other beginners doing exactly the same thing, at your own techfest.",
    whatYouGet: [
      { title: "Verified certificate", body: "A BotLeague certificate for every event you complete, generated automatically and QR-verifiable." },
      { title: "Junior ranking", body: "Your results start building a ranking history from your very first match." },
      { title: "Recognition at your fest", body: "Results and standings are visible to your own techfest's organisers and judges." },
      { title: "Path to Inferno League", body: "Age out of Ignite and your ranking carries forward into Inferno's national circuit." },
    ],
    journeyHeadline: "From your first bot to your first win.",
    nextSlug: "inferno",
    nextLabel: "Next league",
    nextBody: "Inferno League — Ages 12–18 · National ranking begins",
  },
  {
    slug: "inferno",
    name: "INFERNO LEAGUE",
    ageGroupValue: "YOUNG_ENGINEERS",
    startingAge: "12+",
    border: "#f2994a",
    imgGradient: "from-[#3a0f0f] via-[#7a1f1f] to-[#f2994a]",
    textGradient: "from-[#f2994a] to-[#ef4444]",
    tagline: "National ranking. Serious competition. Build something that wins.",
    desc: "For rising builders. Sharper rules, tougher arenas, and matches that count toward your national ranking.",
    cta: "Enter Inferno",
    whyHeadline: "You're winning at your college fest. Nobody outside your campus knows.",
    whyBody: "Inferno turns local wins into a national ranking — every affiliated event you enter counts toward the same all-India table.",
    whatYouGet: [
      { title: "Verified certificate", body: "A BotLeague certificate for every event you complete, generated automatically and QR-verifiable." },
      { title: "National ranking", body: "Every affiliated event you enter counts toward the same all-India table." },
      { title: "Visible to sponsors", body: "Your ranking badge is visible to sponsors and companies recruiting for robotics roles — a credential, not just a score." },
      { title: "Path to Apex League", body: "Age out of Inferno and your ranking carries forward into Apex's open circuit." },
    ],
    journeyHeadline: "From first event to national rank.",
    nextSlug: "apex",
    nextLabel: "Next league",
    nextBody: "Apex League — Ages 18+ · Gateway to global",
  },
  {
    slug: "apex",
    name: "APEX LEAGUE",
    ageGroupValue: "ROBO_MINDS",
    startingAge: "18+",
    border: "#22c55e",
    imgGradient: "from-[#07230f] via-[#0f5c33] to-[#22c55e]",
    textGradient: "from-[#22c55e] to-[#16a34a]",
    tagline: "The top tier. Elite arenas, national spotlight, and a straight line to Battle of Robots, Russia.",
    desc: "The top tier. Elite arenas, national spotlight, and a straight line to Battle of Robots, Russia.",
    cta: "Enter Apex",
    whyHeadline: "You've outgrown your college fest.",
    whyBody: "Apex is the open circuit — where national champions get scouted for the international stage, Battle of Robots, Russia.",
    whatYouGet: [
      { title: "Verified certificate", body: "A BotLeague certificate for every event you complete, generated automatically and QR-verifiable." },
      { title: "Open national ranking", body: "Compete in the top tier — elite arenas, no age ceiling, national spotlight." },
      { title: "Visible to recruiters", body: "Your ranking badge is visible to sponsors, recruiters, and international scouts." },
      { title: "Path to the global stage", body: "The highest-ranked Apex competitors get a straight line to Battle of Robots, Russia." },
    ],
    journeyHeadline: "From national rank to the global stage.",
    nextSlug: null,
    nextLabel: "The global stage",
    nextBody: "Battle of Robots, Russia — where Apex's top competitors go next.",
  },
];

export function getLeagueConfig(slug?: string): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.slug === slug);
}

export function getAgeGroupCatalogue(ageGroupValue: string): AgeGroupConfig | undefined {
  return AGE_GROUP_CATALOGUE.find((g) => g.value === ageGroupValue);
}
