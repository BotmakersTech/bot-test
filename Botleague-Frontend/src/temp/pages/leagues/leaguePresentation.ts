/**
 * Presentation-only per-league details that CANNOT come from the backend
 * catalog: Tailwind gradient/border classes (Tailwind's JIT compiler only
 * picks up class names that appear as literal source text — a class built
 * from a runtime/API string like `from-[${apiColor}]` is invisible to it,
 * so these stay hardcoded here) and narrative marketing copy (the "why"
 * pain-point headline, the journey section heading, ...) that was never
 * part of the admin-editable League entity (see the catalog plan's
 * "branding fields" scope — tagline/description/whatYouGet are the
 * editable ones; this file is the deliberate presentation-only remainder).
 *
 * Keyed by League.ageGroupCode (the stable key), with a generic fallback
 * so a 4th league an admin adds still renders a coherent page immediately,
 * just without bespoke copy until someone adds an entry here.
 */

import { UserPlus, Users, Target, Wrench, MapPin, Trophy, TrendingUp, Rocket, type LucideIcon } from "lucide-react";

/** Values a journey step's title/body can reference — computed per-render
 *  in the component (real sport names, the actual next league), not data
 *  this static file can know on its own. */
export interface JourneyCtx {
  shortName: string;
  nextName: string;
  hasNext: boolean;
  sportNames: string;
}

export interface JourneyStep {
  icon: LucideIcon;
  title: string | ((ctx: JourneyCtx) => string);
  body: string | ((ctx: JourneyCtx) => string);
}

export interface LeaguePresentation {
  imgGradient: string;
  textGradient: string;
  border: string;
  /** Fallback colors — only used when the catalog's own primaryColor/secondaryColor is unset. */
  colorPrimary: string;
  colorSecondary: string;
  desc: string;
  cta: string;
  whyHeadline: string;
  /** The pain-point subhead, parameterized by the already-formatted age
   *  range (e.g. "8–11") so each league can phrase its own lead-in — "For
   *  young builders aged X — ..." vs "For builders aged X who are ready
   *  to..." — while the age computation itself stays in the component. */
  subhead: (ageRange: string) => string;
  whyBody: string;
  /** A second "why" paragraph, shown right under whyBody — same
   *  presentation-only reasoning as the rest of this file: per-league
   *  narrative copy the admin-editable League entity has no field for. */
  whySecondaryBody: string;
  /** An optional third block ("The Competition Gets Real.") — only some
   *  leagues have this extra beat yet, so it's optional rather than
   *  forcing every league to have filler text here. */
  competitionHeadline?: string;
  competitionBody?: string;
  /** A short closing tagline shown at the end of the "why" card — same
   *  presentation-only reasoning as the rest of this file. */
  closerHeadline: string;
  closerBody: string;
  journeyHeadline: string;
  /** Optional per-league journey steps — optional because not every
   *  league has bespoke step copy yet; leagues without it simply don't
   *  render a journey section rather than showing generic filler. */
  journeySteps?: JourneyStep[];
  nextLabel: string;
}

export const LEAGUE_PRESENTATION: Record<string, LeaguePresentation> = {
  JUNIOR_INNOVATORS: {
    imgGradient: "from-[#1a1035] via-[#3b1d6e] to-[#6d28d9]",
    textGradient: "from-[#8b5cf6] to-[#e05fa8]",
    border: "#e05fa8",
    colorPrimary: "#8c6cff",
    colorSecondary: "#e05fa8",
    desc: "Perfect for beginners. Learn robotics, compete in your first techfests, and build confidence.",
    cta: "Enter Ignite",
    whyHeadline: "Where young builders start competing.",
    subhead: (age) =>
      (age ? `For young builders aged ${age} — ` : "") +
      "the league where learning and competing happen at the same time, alongside peers at your own level.",
    whyBody:
      "Ignite is the entry level technology competition league for young builders. From robotics and RC racing to drones, autonomous challenges, and more, Ignite gives beginners a place to learn, build, compete, and grow alongside others at their level.",
    whySecondaryBody:
      "No prior experience required. Every sport is designed to develop a real technical skill while giving you the excitement of real competition.",
    closerHeadline: "Start Small. Compete Big.",
    closerBody: "Your first competition is just the beginning.",
    journeyHeadline: "From Your First Build to Your First Win.",
    journeySteps: [
      { icon: UserPlus, title: "Create your profile", body: "Your teams, results, and rankings — all in one place." },
      { icon: Users, title: "Create or join a team", body: "Build your own crew, or join friends already signed up." },
      {
        icon: Target,
        title: "Choose your sport",
        body: (ctx) => (ctx.sportNames ? `Pick what excites you — ${ctx.sportNames}.` : "Pick what excites you."),
      },
      { icon: Wrench, title: "Build your machine", body: "Design, code, and tune it until it's arena ready." },
      { icon: MapPin, title: "Register for an event", body: "Find a techfest near you and lock in your spot." },
      { icon: Trophy, title: "Enter the arena", body: "Race. Battle. Score. Fight for the win." },
      { icon: TrendingUp, title: "Earn your rank", body: "Every result climbs your national ranking." },
      {
        icon: Rocket,
        title: (ctx) => `Level up to ${ctx.nextName}${ctx.hasNext ? " League" : ""}`,
        body: (ctx) =>
          ctx.hasNext
            ? `Strong ${ctx.shortName} results unlock your path to ${ctx.nextName}.`
            : "Strong results here are the path to the international stage.",
      },
    ],
    nextLabel: "Next league",
  },
  YOUNG_ENGINEERS: {
    imgGradient: "from-[#3a0f0f] via-[#7a1f1f] to-[#f2994a]",
    textGradient: "from-[#f2994a] to-[#ef4444]",
    border: "#f2994a",
    colorPrimary: "#ff4c4c",
    colorSecondary: "#ffdd55",
    desc: "For rising builders. Sharper rules, tougher arenas, and matches that count toward your national ranking.",
    cta: "Enter Inferno",
    whyHeadline: "Your Techfest Win Shouldn't End at Your Techfest.",
    subhead: (age) => (age ? `For builders aged ${age} ` : "") + "who are ready to compete at the next level.",
    whyBody:
      "You've built it. You've competed. Maybe you've even won — but how do you know where you stand beyond your campus? Inferno turns your local results into a national ranking.",
    whySecondaryBody:
      "Compete at affiliated IIT, BITS, and other techfests across India and build your position on one national leaderboard — alongside the best competitors in your age group.",
    competitionHeadline: "The Competition Gets Real.",
    competitionBody:
      "Inferno moves you beyond beginner level challenges — tighter rules, tougher arenas, and sports tested against deeper technical skill, smarter strategy, and performance under pressure. You're not just participating. You're proving where you stand.",
    closerHeadline: "Win Local. Rank National.",
    closerBody: "Compete, earn points, climb the leaderboard, get noticed. Trophies stay at the event — your ranking follows you everywhere.",
    journeyHeadline: "From First Techfest to National Rank.",
    journeySteps: [
      {
        icon: UserPlus,
        title: "Create your profile",
        body: "Your teams, competitions, results, and rankings — all in one place.",
      },
      {
        icon: Users,
        title: "Create or join a team",
        body: "Build your squad — bring together the builders, coders, and strategists you need.",
      },
      {
        icon: Target,
        title: "Choose your sport",
        body: (ctx) => (ctx.sportNames ? `Pick your arena — ${ctx.sportNames}.` : "Pick your arena."),
      },
      {
        icon: MapPin,
        title: "Register for a techfest",
        body: "Find an affiliated techfest and take your team to the arena.",
      },
      { icon: Trophy, title: "Compete & win", body: "Race. Battle. Build. Solve. Score. Fight for the top spot." },
      {
        icon: TrendingUp,
        title: "Earn your rank",
        body: "Every result adds to your national ranking — win more, rank higher.",
      },
      {
        icon: Rocket,
        title: (ctx) => `Level up to ${ctx.nextName}${ctx.hasNext ? " League" : ""}`,
        body: (ctx) =>
          ctx.hasNext
            ? `Finish strong in ${ctx.shortName} and earn your path to ${ctx.nextName}.`
            : "Finish strong here and you're on the path to the international stage.",
      },
    ],
    nextLabel: "Next league",
  },
  ROBO_MINDS: {
    // Apex's brand blue — matches the accent already used for Apex
    // elsewhere (event-detail techsport cards, eventDetail.css). Was
    // green (#00d31c); every field below that carried that green
    // (imgGradient/textGradient/border, not just colorPrimary/Secondary)
    // is updated together so the league reads consistently everywhere
    // it shows up, not just on its own detail page.
    imgGradient: "from-[#041b2e] via-[#0d5c8c] to-[#36A3F0]",
    textGradient: "from-[#36A3F0] to-[#54E4EC]",
    border: "#54E4EC",
    colorPrimary: "#36A3F0",
    colorSecondary: "#54E4EC",
    desc: "The top tier. Elite arenas, national spotlight, and a straight line to Battle of Robots, Russia.",
    cta: "Enter Apex",
    whyHeadline: "You've outgrown your college fest.",
    subhead: (age) =>
      (age ? `For young builders aged ${age} — ` : "") +
      "the league where learning and competing happen at the same time, alongside peers at your own level.",
    whyBody: "Apex is the open circuit — where national champions get scouted for the international stage, Battle of Robots, Russia.",
    whySecondaryBody:
      "Every sport in Apex is judged at national championship standard. This isn't about climbing a ranking anymore — it's where builders get scouted.",
    closerHeadline: "Compete National. Get Scouted Global.",
    closerBody: "Your next match could be the one that gets you noticed.",
    journeyHeadline: "From national rank to the global stage.",
    nextLabel: "Next league",
  },
};

/** Gold — used when a league has no destination league to borrow a color from (Apex's terminal "next" banner). */
export const GLOBAL_STAGE_GOLD = "#d4a72c";

const FALLBACK_GRADIENT: LeaguePresentation = {
  imgGradient: "from-[#1a1035] via-[#3b1d6e] to-[#4b86e8]",
  textGradient: "from-[#4b86e8] to-[#8c6cff]",
  border: "#4b86e8",
  colorPrimary: "#4b86e8",
  colorSecondary: "#8c6cff",
  desc: "Compete, rank, and prove it.",
  cta: "Enter league",
  whyHeadline: "A new stage to compete on.",
  subhead: (age) =>
    (age ? `For young builders aged ${age} — ` : "") +
    "the league where learning and competing happen at the same time, alongside peers at your own level.",
  whyBody: "Every match here counts toward your ranking.",
  whySecondaryBody: "No prior experience needed — every sport here is designed to teach you a real technical skill while you compete.",
  closerHeadline: "Compete. Rank. Repeat.",
  closerBody: "Every match here counts.",
  journeyHeadline: "Your competitive journey.",
  nextLabel: "Next league",
};

export function getLeaguePresentation(ageGroupCode: string, fallbackName: string): LeaguePresentation {
  return (
    LEAGUE_PRESENTATION[ageGroupCode] ?? { ...FALLBACK_GRADIENT, cta: `Enter ${fallbackName}` }
  );
}
