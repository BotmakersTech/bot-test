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
  whyBody: string;
  /** A second "why" paragraph, shown right under whyBody — same
   *  presentation-only reasoning as the rest of this file: per-league
   *  narrative copy the admin-editable League entity has no field for. */
  whySecondaryBody: string;
  journeyHeadline: string;
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
    whyHeadline: "Every builder starts somewhere.",
    whyBody:
      "Ignite is where you learn to wire, code, and compete for the first time — alongside other beginners doing exactly the same thing, at your own techfest.",
    whySecondaryBody:
      "No prior experience needed. Every sport in Ignite is designed to teach you a real technical skill while you compete — so you leave with more than just a trophy.",
    journeyHeadline: "From your first bot to your first win.",
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
    whyHeadline: "You're winning at your college fest. Nobody outside your campus knows.",
    whyBody:
      "Inferno turns local wins into a national ranking — every affiliated techfest you enter counts toward the same all-India table.",
    whySecondaryBody:
      "The rules get sharper and the arenas get tougher. Every sport in Inferno is judged at a higher standard than Ignite — you're not repeating a beginner event, you're being tested at the next level.",
    journeyHeadline: "From first techfest to national rank.",
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
    whyBody: "Apex is the open circuit — where national champions get scouted for the international stage, Battle of Robots, Russia.",
    whySecondaryBody:
      "Every sport in Apex is judged at national-championship standard. This isn't about climbing a ranking anymore — it's where builders get scouted.",
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
  whyBody: "Every match here counts toward your ranking.",
  whySecondaryBody: "No prior experience needed — every sport here is designed to teach you a real technical skill while you compete.",
  journeyHeadline: "Your competitive journey.",
  nextLabel: "Next league",
};

export function getLeaguePresentation(ageGroupCode: string, fallbackName: string): LeaguePresentation {
  return (
    LEAGUE_PRESENTATION[ageGroupCode] ?? { ...FALLBACK_GRADIENT, cta: `Enter ${fallbackName}` }
  );
}
