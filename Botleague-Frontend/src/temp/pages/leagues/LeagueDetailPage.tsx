import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Trophy, UserPlus, MapPin, Rocket, Target, Users, Wrench, TrendingUp } from "lucide-react";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import { useLeagues, getLeagueBySlug, formatAgeRange } from "./useLeagues";
import { GLOBAL_STAGE_GOLD } from "./leaguePresentation";
import { getPublicLeagueSports, type LeagueSport } from "../../../shared/api/catalog.api";
import { getTopRanked, type GlobalRankingEntry } from "../../../feature/Rankings/api/rankings.api";
import { sportKey } from "../../../feature/Event/utils/specPolicy";
import { canonicalWeightClass } from "../../../feature/Robots/constants/weightClasses";
import roboSumoImg from "../../../assets/ignite/robo_sumo.png";

/** Real per-sport artwork, keyed by the sport's catalog name (lowercased).
 *  Sports with no entry here fall back to the gradient + trophy-icon
 *  placeholder — most sports have no artwork yet. */
const SPORT_IMAGES: Record<string, string> = {
  "robo sumo": roboSumoImg,
};

const BRAND_STYLES = `
.lg-page {
  font-family: 'Poppins', system-ui, sans-serif;
  color: #0e0e0e;
  overflow-x: hidden;
}

/* Scroll reveal */
.lg-reveal {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.7s ease, transform 0.7s ease;
  will-change: opacity, transform;
}
.lg-reveal--visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .lg-reveal { opacity: 1; transform: none; transition: none; }
}

/* Hero */
.lg-hero {
  position: relative;
  min-height: 90vh;
  padding: 6rem 1rem;
  background: linear-gradient(135deg, var(--lg-primary) 0%, #0e0e0e 65%);
}
.lg-hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}
.lg-hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
}
.lg-hero-title {
  /* No explicit color — this hero has a dark background with inherited
     white text (.lg-hero's own text-white), unlike every other heading
     this pass touches; forcing the flat blue here would be illegible. */
  font-family: 'Orbitron', sans-serif;
  font-weight: 500;
  font-size: clamp(20px, 4vw, 38px);
}
.lg-hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.4rem);
  max-width: 700px;
}
.lg-hero-note {
  color: var(--lg-secondary);
  font-weight: 600;
}
.lg-pill {
  background: rgba(255, 255, 255, 0.21);
  border: 1px solid var(--lg-primary);
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-weight: 600;
}

/* Buttons */
.lg-btn-gradient {
  background: linear-gradient(180deg, var(--lg-primary) 0%, var(--lg-secondary) 100%);
  color: #fff;
  border: none;
  border-radius: 15px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}
.lg-btn-gradient:hover {
  color: #fff;
  opacity: 0.92;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--lg-primary) 35%, transparent);
}
.lg-btn-outline {
  border: 1px solid var(--lg-primary);
  border-radius: 15px;
  font-weight: 600;
  background: transparent;
  background-image: linear-gradient(110deg, var(--lg-primary) 4%, var(--lg-secondary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Stats */
.lg-stat-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 800;
  font-size: clamp(2rem, 5vw, 4.5rem);
  background: linear-gradient(180deg, var(--lg-primary), var(--lg-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.lg-stat-label {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Pain callout */
.lg-pain-title {
  font-family: 'Orbitron', sans-serif;
  color: var(--lg-primary);
  font-weight: 600;
  font-size: clamp(1.6rem, 4vw, 3.5rem);
  line-height: 1.15;
}
.lg-ticker {
  letter-spacing: 2px;
  opacity: 0.6;
}

/* Win locally card */
.lg-card-accent {
  background: #fff;
  border: 3px solid var(--lg-primary);
  border-left: 6px solid var(--lg-secondary);
}
.lg-card-gradient-text {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2.6rem);
  background: linear-gradient(180deg, var(--lg-primary), var(--lg-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.lg-card-body {
  color: #3c3c3c;
  font-size: 1.1rem;
}
.lg-card-body + .lg-card-body {
  margin-top: 0.75rem;
}

/* "About {league}" tag above the pain-point headline, and the subhead
   line under it. */
.lg-sec-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--lg-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.lg-sec-subhead {
  font-size: 1rem;
  color: #555;
  max-width: 560px;
  margin: 0.5rem auto 0;
  line-height: 1.6;
}

/* Win-locally card's own two-column layout: whyBody/whySecondaryBody +
   the callout on the left, the onboarding steps on the right. */
.lg-about-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
  text-align: left;
  margin-top: 1.5rem;
}
@media (min-width: 900px) {
  .lg-about-grid { grid-template-columns: 1fr 1fr; }
}
.lg-about-callout {
  background: color-mix(in srgb, var(--lg-primary) 8%, #fff);
  border-left: 4px solid var(--lg-primary);
  border-radius: 0 10px 10px 0;
  padding: 1.1rem 1.35rem;
  margin-top: 1.25rem;
}
.lg-about-callout p {
  font-size: 0.9rem;
  color: #3c2a63;
  margin: 0;
  font-weight: 500;
  line-height: 1.6;
}
.lg-about-closer {
  margin: 1.25rem 0 0;
  font-size: 0.95rem;
  color: #333;
  line-height: 1.6;
}
.lg-about-closer strong {
  color: var(--lg-primary);
}
.lg-steps-card {
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--lg-primary) 18%, #ede9fe);
  border-radius: 16px;
  padding: 0.5rem 1.5rem;
}
.lg-step-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lg-primary) 10%, #f5f0ff);
}
.lg-step-row:last-child { border-bottom: none; }
.lg-step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--lg-primary) 10%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--lg-primary) 30%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: var(--lg-primary);
  flex-shrink: 0;
  margin-top: 2px;
}
.lg-step-info strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 3px;
}
.lg-step-info span {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}

/* Ranking leaderboard rows */
.lg-rank-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: left;
}
/* One line — icon, sport, robot name, team name, then points pushed to
   the far right by the auto margin on .lg-rank-pts-wrap. flex-wrap so a
   narrow phone width wraps instead of squeezing everything unreadable,
   rather than trying to hold 5 pieces of info on one line no matter what. */
.lg-rank-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.6rem 0.7rem;
  padding: 0.75rem 1.1rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--lg-primary) 10%, #f5f0ff);
  background: #fdfcff;
}
/* Every row here is a sport's own #1 (see the champions effect), not a
   4th-place-through-1st ranking, so the badge is always the same "this
   is a champion" gold, not gold/silver/bronze. */
.lg-rank-pos { display: flex; align-items: center; justify-content: center; align-self: center; color: #f59e0b; flex-shrink: 0; }
.lg-rank-sport {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--lg-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.lg-rank-name { font-size: 15px; font-weight: 700; color: #1a1a2e; }
.lg-rank-school { font-size: 12px; color: #999; }
.lg-rank-school::before { content: "—"; margin-right: 0.5rem; color: #ccc; }
.lg-rank-pts-wrap { display: flex; align-items: baseline; gap: 0.3rem; margin-left: auto; flex-shrink: 0; }
.lg-rank-pts { font-weight: 800; font-size: 15px; color: var(--lg-primary); }
.lg-rank-pts-label { font-size: 10px; color: #bbb; }

/* Journey steps — replaces what used to be an empty placeholder box */
.lg-jstep {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.1rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--lg-primary) 10%, #f5f0ff);
  text-align: left;
  max-width: 640px;
  margin-inline: auto;
}
.lg-jstep:last-child { border-bottom: none; }
.lg-jicon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--lg-primary), var(--lg-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.lg-jtext strong { display: block; font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 3px; }
.lg-jtext span { font-size: 13px; color: #666; line-height: 1.5; }

/* Section heading */
.lg-section-heading {
  font-family: 'Orbitron', sans-serif;
  font-weight: 500;
  color: var(--lg-primary);
  font-size: clamp(1.8rem, 4vw, 3.5rem);
}

/* Sports cards — same dimensions and accent-frame treatment as the
   /events/:id techsport card (.event-card-wrap / .event-card-accent /
   .event-card in eventDetail.css), copied here as-is: 324px wrap with
   22px padding around a 280x360 frame, accent split at the same 58/42
   line. No hover lift/zoom/brightness though, and no box-shadow
   transition — this card only ever shows a title, there's no
   description reveal to animate toward, so it just sits at rest. */
.lg-sport-card {
  position: relative;
  width: 100%;
  max-width: 324px;
  margin-inline: auto;
  padding: 22px;
}
.lg-sport-card__accent {
  position: absolute;
  border-radius: 18px;
  background: linear-gradient(180deg, var(--lg-primary) 0%, var(--lg-secondary) 100%);
}
.lg-sport-card__accent--tl {
  top: 0; right: 58%; bottom: 42%; left: 0;
}
.lg-sport-card__accent--br {
  top: 42%; right: 0; bottom: 0; left: 58%;
}
.lg-sport-card__frame {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 280px;
  height: 360px;
  aspect-ratio: 280 / 360;
  border-radius: 20px;
  overflow: hidden;
  /* No real per-sport artwork exists yet (LeagueSport carries no image —
     Sport.iconUrl is the closest field and every sport has it unset), so
     this is an honest placeholder rather than a stand-in stock photo:
     unrelated travel/landscape pictures under a sport's name read as
     wrong, not just generic. */
  background: linear-gradient(135deg, var(--lg-primary), var(--lg-secondary));
  color: rgba(255, 255, 255, 0.85);
}
.lg-sport-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lg-sport-card__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.65) 100%);
}
.lg-sport-card__label {
  position: absolute;
  left: 12px;
  bottom: 12px;
  right: 12px;
  z-index: 1;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}
.lg-sports-empty {
  color: #8a8a8a;
  font-size: 0.95rem;
}

/* Sports grid — desktop is 3 columns across 6 tracks (each card spans 2)
   so a last row with 1 or 2 leftover cards can be shifted into the
   middle instead of sitting pinned to the left with empty columns
   beside it; same trick at the 2-column tablet tier. Mobile stays a
   single column, where "leftover" isn't a thing. */
.lg-sports-grid {
  display: grid;
  grid-template-columns: 1fr;
  /* row-gap column-gap — more breathing room between rows than between
     cards in the same row. */
  gap: 3rem 1.5rem;
}
@media (min-width: 640px) {
  .lg-sports-grid { grid-template-columns: repeat(4, 1fr); }
  .lg-sports-grid > .lg-sport-card { grid-column: span 2; }
  .lg-sports-grid > .lg-sport-card:nth-child(2n+1):nth-last-child(1) {
    grid-column: 2 / span 2;
  }
}
@media (min-width: 1024px) {
  .lg-sports-grid { grid-template-columns: repeat(6, 1fr); }
  .lg-sports-grid > .lg-sport-card:nth-child(3n+1):nth-last-child(1) {
    grid-column: 3 / span 2;
  }
  .lg-sports-grid > .lg-sport-card:nth-child(3n+1):nth-last-child(2) {
    grid-column: 2 / span 2;
  }
  .lg-sports-grid > .lg-sport-card:nth-child(3n+2):nth-last-child(1) {
    grid-column: 4 / span 2;
  }
}
.lg-see-more {
  background: linear-gradient(180deg, var(--lg-primary), var(--lg-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 600;
  border: none;
}

/* Ranking banner — two stacked boxes */
.lg-ranking-banner {
  width: 100%;
  max-width: 1140px;
  margin-inline: auto;
  border-radius: 15px;
  overflow: hidden;
  color: #fff;
  text-align: left;
}
.lg-ranking-banner__top {
  /* No fixed min-height — this box used to always be exactly the header's
     height (268px was sized for that alone), but now the champions list
     is optional content inside it too; a fixed floor left a blank gap
     under the header on a league with nothing ranked yet instead of the
     box just hugging whatever's actually in it. */
  /* Blended toward black, not transparent — blending toward transparent
     mixes in whatever's behind the box (this page's white background),
     which reads fine for a dark/saturated primary (Ignite's purple,
     Inferno's red) but for a bright one like Apex's #36A3F0 blue, 75%
     of it over white lands on a pale sky blue — too light for this
     box's white text (h3, "View rankings", the champions rows) to read
     against. Anchoring to black instead keeps the same 75%-primary hue
     but guarantees it lands dark enough for white text regardless of
     how light the league's own primary color is. */
  background: color-mix(in srgb, var(--lg-primary) 75%, #000);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1.25rem, 3vw, 2.75rem);
}
.lg-rank-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
/* The rank rows themselves live inside the banner's colored top box now
   (not on the page's white background), so they get the same
   translucent-on-color treatment the rest of this box's own text/CTA
   already use instead of the light-card styling from .lg-rank-list's
   other, page-background use. */
.lg-ranking-banner__top .lg-rank-list { margin-top: 0; gap: 0.5rem; }
.lg-ranking-banner__top .lg-rank-row {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
}
.lg-ranking-banner__top .lg-rank-sport { color: rgba(255, 255, 255, 0.75); }
.lg-ranking-banner__top .lg-rank-name { color: #fff; }
.lg-ranking-banner__top .lg-rank-school { color: rgba(255, 255, 255, 0.65); }
.lg-ranking-banner__top .lg-rank-pts { color: #fff; }
.lg-ranking-banner__top .lg-rank-pts-label { color: rgba(255, 255, 255, 0.55); }
.lg-ranking-banner__bottom {
  min-height: 162px;
  /* Deliberately the lighter of the banner's two boxes (only 35% of the
     secondary color), so it needs its own dark text instead of the
     white .lg-ranking-banner sets as its default — white was never
     readable against a tint this pale for any league, Apex (bright
     cyan secondary) just makes it obvious. */
  background: color-mix(in srgb, var(--lg-secondary) 35%, transparent);
  color: #1a1a2e;
  display: flex;
  align-items: center;
  padding: clamp(1.25rem, 3vw, 2.75rem);
}
.lg-ranking-banner h3 {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: clamp(1.5rem, 2.5vw, 2.9rem);
  margin: 0 0 0.5rem;
}
.lg-ranking-banner p {
  margin: 0;
  font-size: clamp(0.85rem, 1.6vw, 1.15rem);
  line-height: 1.4;
}
.lg-ranking-banner__cta {
  order: -1;
  flex: 0 0 auto;
  background: #fff;
  color: var(--lg-primary);
  border: none;
  border-radius: 15px;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lg-ranking-banner__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}
@media (min-width: 576px) {
  .lg-ranking-banner__cta { order: 0; }
}

/* Timeline placeholder */
.lg-timeline-box {
  max-width: 1100px;
  height: 210px;
  background: #fff;
  border: 3px solid var(--lg-primary);
}

/* Next league banner */
.lg-next {
  background: linear-gradient(100deg, color-mix(in srgb, var(--lg-next) 15%, transparent) 0%, rgba(0, 0, 0, 0.08) 100%);
  border: 1px solid color-mix(in srgb, var(--lg-next) 40%, transparent);
}
.lg-next-label {
  color: #000;
  font-size: 1.1rem;
}
.lg-next-name {
  font-family: 'Orbitron', sans-serif;
  font-weight: 800;
  color: var(--lg-next);
  font-size: 1.5rem;
}
.lg-next-link {
  border: 2px solid var(--lg-next);
  border-radius: 15px;
  color: var(--lg-next);
  font-weight: 500;
  padding: 0.75rem 1.5rem;
}

/* CTA cards */
.lg-cta-card {
  background: #fff;
  border: 3px solid var(--lg-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lg-cta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.1);
}
.lg-cta-title {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
}
`;

/** Fades + slides an element up once it scrolls into view, then stays put. */
function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }: {
  as?: React.ElementType;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`lg-reveal ${visible ? "lg-reveal--visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Ranking pools are keyed on the canonical weight-class code, not the
 *  catalog's own label/kg number — see WeightClassKeys.of() on the backend
 *  and canonicalWeightClass() here, which mirrors it. A sport with several
 *  classes (Apex-style) has one pool per class; this picks the first as
 *  the one whose #1 this section shows, rather than trying to merge them. */
function primaryWeightClass(s: LeagueSport): string | undefined {
  if (s.weightLimitKg != null) return canonicalWeightClass(`${s.weightLimitKg}kg`);
  if (s.weightClasses.length > 0) return canonicalWeightClass(s.weightClasses[0].label);
  return undefined;
}

function SportCard({ title }: { title: string }) {
  const image = SPORT_IMAGES[title.toLowerCase()];
  return (
    <div className="lg-sport-card">
      <span className="lg-sport-card__accent lg-sport-card__accent--tl" aria-hidden="true" />
      <span className="lg-sport-card__accent lg-sport-card__accent--br" aria-hidden="true" />
      <div className="lg-sport-card__frame">
        {image ? (
          <>
            <img src={image} alt="" className="lg-sport-card__img" aria-hidden="true" />
            <span className="lg-sport-card__scrim" aria-hidden="true" />
          </>
        ) : (
          <Trophy size={40} strokeWidth={1.5} aria-hidden="true" />
        )}
        <span className="lg-sport-card__label">{title}</span>
      </div>
    </div>
  );
}

export default function LeagueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { leagues, loading } = useLeagues();
  const league = getLeagueBySlug(leagues, slug);
  const [sports, setSports] = useState<LeagueSport[]>([]);
  // Distinguishes "still loading" from "genuinely no sports yet" — sports
  // starts empty either way, so without this the empty-state message
  // would flash on screen for a moment on every load, before the real
  // list comes in.
  const [sportsLoading, setSportsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setSportsLoading(true);
    getPublicLeagueSports(slug)
      .then(setSports)
      .catch(() => setSports([]))
      .finally(() => setSportsLoading(false));
  }, [slug]);

  // One #1 per sport, not a top-4 across the whole league — every (sport,
  // league, weight class) is its own ranking pool (RankingEngineService),
  // so there's no real single "league leaderboard" to rank 1st through
  // 4th across; showing each sport's own champion is the honest version
  // of that instead of merging incomparable pools into one fake order.
  const [champions, setChampions] = useState<{ sport: LeagueSport; entry: GlobalRankingEntry }[]>([]);

  useEffect(() => {
    if (!league || sports.length === 0) {
      setChampions([]);
      return;
    }
    let cancelled = false;

    // Tries the sport's own weight class first (the correct pool for a
    // league where one sport has several — e.g. Apex RoboWar's 8/15/30/60kg
    // rows). If that comes back empty, retries with no weight class at
    // all: the ranking pool query treats an omitted weightClass as "any"
    // (see RankingRepository.findPoolOrderedByPoints's own "IS NULL OR"),
    // so this still finds a real #1 pushed under a weight-class spelling
    // that didn't fold to exactly what this page computed, instead of
    // reporting "no ranking" for a sport that actually has one.
    const fetchChampion = async (s: LeagueSport) => {
      const sport = sportKey(s.sportName);
      const ageGroup = league.ageGroupValue;
      const weightClass = primaryWeightClass(s);
      try {
        if (weightClass) {
          const exact = await getTopRanked({ sport, ageGroup, weightClass, n: 1 });
          if (exact[0]) return { sport: s, entry: exact[0] };
        }
        const any = await getTopRanked({ sport, ageGroup, n: 1 });
        return any[0] ? { sport: s, entry: any[0] } : null;
      } catch {
        return null;
      }
    };

    Promise.all(sports.map(fetchChampion)).then((results) => {
      if (cancelled) return;
      const found = results.filter((r): r is { sport: LeagueSport; entry: GlobalRankingEntry } => r != null);
      // The no-weight-class fallback above can hand back the same robot
      // for more than one of a sport's weight-class rows (e.g. Apex
      // RoboWar's 8/15/30/60kg) when the exact match keeps missing — one
      // row per distinct champion robot, not per LeagueSport row.
      const seen = new Set<string>();
      setChampions(found.filter(({ entry }) => {
        const key = entry.robotId ?? `${entry.teamId}:${entry.sport}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [league, sports]);

  if (!loading && !league) return <Navigate to="/" replace />;
  if (!league) return null;

  const ageRangeLabel = league.startingAge !== "—" ? `${league.startingAge} yrs` : "";
  const nextLeague = league.nextSlug ? getLeagueBySlug(leagues, league.nextSlug) : undefined;
  const nextColor = nextLeague?.colorPrimary ?? GLOBAL_STAGE_GOLD;
  const nextBody = nextLeague
    ? `${nextLeague.name} — Ages ${nextLeague.startingAge} · ${nextLeague.rankingScope}`
    : "Battle of Robots, Russia — where this league's top competitors go next.";

  const stats = [
    { value: String(sports.length), label: "Sports in this league" },
    { value: league.startingAge, label: "Starting age" },
    { value: "IN", label: league.rankingScope },
    { value: "→", label: nextLeague ? `Path to ${nextLeague.name}` : "Path to the global stage" },
  ];

  const nextName = nextLeague ? nextLeague.shortName : "the global stage";

  // Universal onboarding flow — true for any league, so the 4th step is
  // the only per-league part and it's real data (nextLeague), not a
  // hardcoded league name.
  const steps = [
    { title: "Register for free", body: "No upfront cost to join the league" },
    { title: "Find a techfest near you", body: "Compete at affiliated IIT / BITS events" },
    { title: "Build, compete, rank", body: "Your results feed a national leaderboard" },
    {
      title: `Level up to ${nextName}`,
      body: nextLeague ? "Qualify by performance — no applications" : "Compete for a spot on the international stage",
    },
  ];
  const sportNames = sports.map((s) => s.sportName).join(", ");
  const journeySteps = [
    {
      icon: UserPlus,
      title: "Create your profile",
      body: "Set up your national profile — your teams, results, and rankings, all in one place.",
    },
    {
      icon: Users,
      title: "Create or join a team",
      body: "Build your own crew or join friends who are already signed up, then pick your roles.",
    },
    {
      icon: Target,
      title: "Choose your sport",
      body: sportNames ? `Pick what excites you — ${sportNames} — and build a strategy around it.` : "Pick what excites you and build a strategy around it.",
    },
    {
      icon: Wrench,
      title: "Build your machine",
      body: "Design, code, test, and tune your machine until it's arena-ready.",
    },
    {
      icon: MapPin,
      title: "Register for an event",
      body: "Find an affiliated IIT, BITS, or other techfest near you and lock in your spot.",
    },
    {
      icon: Trophy,
      title: "Enter the arena",
      body: "Race. Battle. Solve. Score. Go head-to-head with other teams and fight for the win.",
    },
    {
      icon: TrendingUp,
      title: "Earn your rank",
      body: "Every result adds to your national ranking — win more, climb higher.",
    },
    {
      icon: Rocket,
      title: `Level up to ${nextName}${nextLeague ? " League" : ""}`,
      body: nextLeague
        ? `Strong ${league.shortName} results unlock your path to the ${nextName} League.`
        : "Strong results here are the path to the international stage.",
    },
  ];

  const scrollToSports = () => {
    document.getElementById("sports")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="lg-page" style={{ "--lg-primary": league.colorPrimary, "--lg-secondary": league.colorSecondary } as React.CSSProperties}>
      <style>{BRAND_STYLES}</style>
      <PublicNavbar showLeagues />

      {/* ===== Hero ===== */}
      <section className="lg-hero flex flex-col items-center justify-center text-center text-white px-3">
        <div className="lg-hero-overlay" />
        <div className="lg-hero-content">
          <span className="lg-pill inline-block mb-3">
            {ageRangeLabel || league.startingAge} &nbsp;·&nbsp; Free to register
          </span>
          <h1 className="lg-hero-title mb-3">{league.name}</h1>
          <p className="lg-hero-subtitle mx-auto mb-4">{league.tagline}</p>
          <div className="flex flex-wrap justify-center gap-3 mb-3">
            <button className="lg-btn-gradient px-8 py-4 text-lg" onClick={() => navigate("/register")}>
              Start competing
            </button>
            <button className="lg-btn-outline px-8 py-4 text-lg" onClick={scrollToSports}>
              See the sports
            </button>
          </div>
          <p className="lg-hero-note mb-0">Free to register. Botleague Platform</p>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="lg-stat-value">{s.value}</div>
              <div className="lg-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Pain point callout ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-8 text-center">
        <div className="lg-sec-tag">About {league.shortName}</div>
        <h2 className="lg-pain-title mb-2">{league.whyHeadline}</h2>
        <p className="lg-sec-subhead mb-4">
          {formatAgeRange(league.minAge, league.maxAge)
            ? `For young builders aged ${formatAgeRange(league.minAge, league.maxAge)} — `
            : ""}
          the league where learning and competing happen at the same time, alongside peers at your own level.
        </p>
        <p className="lg-ticker text-[#666] text-sm uppercase mb-0">
          IIT Bombay Techfest &middot; BITS Pilani &middot; IIT Roorkee &middot; IIT Bombay Techfest &middot; BITS Pilani
        </p>
      </section>

      {/* ===== Win locally card ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="lg-card-accent p-6 md:p-10 rounded-2xl relative">
          <div className="lg-about-grid">
            <div>
              <p className="lg-card-body">{league.whyBody}</p>
              <p className="lg-card-body">{league.whySecondaryBody}</p>
              <div className="lg-about-callout">
                <p>
                  Competing in {league.shortName} earns you a national ranking. Finish strong and you&rsquo;re on the
                  path to {nextName}
                  {nextLeague ? ` League — ages ${nextLeague.startingAge} with higher stakes and national championships.` : "."}
                </p>
              </div>
              <p className="lg-about-closer">
                <strong>{league.closerHeadline}</strong> {league.closerBody}
              </p>
            </div>
            <div className="lg-steps-card">
              {steps.map((step, i) => (
                <div className="lg-step-row" key={step.title}>
                  <div className="lg-step-badge">{i + 1}</div>
                  <div className="lg-step-info">
                    <strong>{step.title}</strong>
                    <span>{step.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sports & skills ===== */}
      <section id="sports" className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-2">The sports. And the skills behind them.</h2>
        <p className="text-[#515151] mb-10">
          Every event builds real technical depth. Here&rsquo;s what you&rsquo;ll actually learn — and what you&rsquo;ll be building with.
        </p>
        {!sportsLoading && sports.length === 0 ? (
          <p className="lg-sports-empty">Sports for this league haven&rsquo;t been published yet — check back soon.</p>
        ) : (
          <div className="lg-sports-grid">
            {sports.map((s) => (
              <SportCard key={s.sportId} title={s.sportName} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Compete. Rank. Prove it. ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-6">Compete. Rank. Prove it.</h2>
        <div className="lg-ranking-banner">
          <Reveal as="div" className="lg-ranking-banner__top">
            <div className="lg-rank-header">
              <h3>National leaderboard &middot; {league.shortName} {new Date().getFullYear()}</h3>
              <button className="lg-ranking-banner__cta" onClick={() => navigate("/rankings")}>
                View rankings
              </button>
            </div>
            {/* One #1 robot per sport in this league — see the champions
               effect's own comment above for why it's per-sport instead
               of a single top-4 across the whole league. Nothing renders
               here until at least one sport actually has a finalized
               ranking. */}
            {champions.length > 0 && (
              <div className="lg-rank-list">
                {champions.map(({ sport, entry }) => (
                  <div className="lg-rank-row" key={sport.sportId}>
                    <span className="lg-rank-pos" aria-hidden="true">
                      <Trophy size={16} strokeWidth={2} />
                    </span>
                    <span className="lg-rank-sport"> #1 &middot; {sport.sportName} </span>
                    <span className="lg-rank-name">{entry.robotName || "Unnamed robot"}</span>
                    <span className="lg-rank-school">{entry.teamName}</span>
                    <span className="lg-rank-pts-wrap">
                      <span className="lg-rank-pts">{entry.totalPoints.toLocaleString()}</span>
                      <span className="lg-rank-pts-label">points</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
          <Reveal as="div" className="lg-ranking-banner__bottom" delay={150}>
            <p>
              Points from every affiliated fest — 1st=100, 2nd=70, 3rd=50, participation=20.
              {" "}{league.rankingScope}. Public, permanent, verifiable.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== From first event to national rank ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-2">{league.journeyHeadline}</h2>
        <p className="lg-sec-subhead mb-4">{league.shortName} is where your journey begins — from your first profile to your first win.</p>
        <div>
          {journeySteps.map((step) => (
            <Reveal as="div" className="lg-jstep" key={step.title}>
              <div className="lg-jicon" aria-hidden="true">
                <step.icon size={18} strokeWidth={2} />
              </div>
              <div className="lg-jtext">
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Next league banner ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-4">
        <div
          className="lg-next flex flex-col md:flex-row items-center justify-between rounded-2xl p-6 gap-4"
          style={{ "--lg-next": nextColor } as React.CSSProperties}
        >
          <div>
            <div className="lg-next-label">{league.nextLabel}</div>
            <div className="lg-next-name">{nextBody}</div>
          </div>
          {nextLeague ? (
            <button onClick={() => navigate(`/leagues/${nextLeague.slug}`)} className="lg-next-link flex items-center gap-2">
              Explore {nextLeague.name.split(" ")[0]} <ArrowRight size={16} />
            </button>
          ) : (
            <span className="lg-next-link inline-block">Battle of Robots, Russia</span>
          )}
        </div>
      </section>

      {/* ===== CTA cards ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="lg-cta-card h-full rounded-2xl p-6 md:p-8">
              <h4 className="lg-cta-title mb-3">Ready to compete in {league.name.replace(" LEAGUE", "")} League?</h4>
              <p className="text-[#393939] mb-6">
                Your national ranking starts at your first affiliated event. Free to register.
              </p>
              <button className="lg-btn-gradient w-full md:w-auto px-8 py-3" onClick={() => navigate("/register")}>
                Register now
              </button>
            </div>
          </div>
          <div className="flex-1">
            <div className="lg-cta-card h-full rounded-2xl p-6 md:p-8">
              <h4 className="lg-cta-title mb-3">Find a techfest near you.</h4>
              <p className="text-[#393939] mb-6">
                Browse all affiliated techfests filtered by city, sport, and date.
              </p>
              <button className="lg-btn-gradient w-full md:w-auto px-8 py-3" onClick={() => navigate("/events")}>
                Browse events
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
