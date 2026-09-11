import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import { useLeagues, getLeagueBySlug } from "./useLeagues";
import { GLOBAL_STAGE_GOLD } from "./leaguePresentation";
import { getPublicLeagueSports, type LeagueSport } from "../../../shared/api/catalog.api";

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
  font-family: 'Sarpanch', sans-serif;
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
  font-family: 'Sarpanch', sans-serif;
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
.lg-rank-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--lg-primary) 10%, #f5f0ff);
  background: #fdfcff;
}
.lg-rank-pos {
  font-weight: 800;
  font-size: 14px;
  color: #bbb;
}
.lg-rank-pos.gold { color: #f59e0b; }
.lg-rank-pos.silver { color: #94a3b8; }
.lg-rank-pos.bronze { color: #b87333; }
.lg-rank-name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.lg-rank-school { font-size: 11px; color: #999; margin-top: 2px; }
.lg-rank-pts { font-weight: 800; font-size: 16px; color: var(--lg-primary); text-align: right; }
.lg-rank-pts-label { font-size: 10px; color: #bbb; text-align: right; }

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
  font-size: 18px;
  flex-shrink: 0;
}
.lg-jtext strong { display: block; font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 3px; }
.lg-jtext span { font-size: 13px; color: #666; line-height: 1.5; }

/* Section heading */
.lg-section-heading {
  font-family: 'Sarpanch', sans-serif;
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
.lg-sport-card__label {
  position: absolute;
  left: 12px;
  bottom: 12px;
  right: 12px;
  z-index: 1;
  color: #fff;
  font-family: 'Sarpanch', sans-serif;
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
  gap: 1.5rem;
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
  min-height: 268px;
  background: color-mix(in srgb, var(--lg-primary) 75%, transparent);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: clamp(1.25rem, 3vw, 2.75rem);
}
.lg-ranking-banner__bottom {
  min-height: 162px;
  background: color-mix(in srgb, var(--lg-secondary) 35%, transparent);
  display: flex;
  align-items: center;
  padding: clamp(1.25rem, 3vw, 2.75rem);
}
.lg-ranking-banner h3 {
  font-family: 'Sarpanch', sans-serif;
  font-weight: 700;
  font-size: clamp(1.5rem, 4vw, 2.9rem);
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
  font-family: 'Sarpanch', sans-serif;
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
  font-family: 'Sarpanch', sans-serif;
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

function SportCard({ title }: { title: string }) {
  return (
    <div className="lg-sport-card">
      <span className="lg-sport-card__accent lg-sport-card__accent--tl" aria-hidden="true" />
      <span className="lg-sport-card__accent lg-sport-card__accent--br" aria-hidden="true" />
      <div className="lg-sport-card__frame">
        <Trophy size={40} strokeWidth={1.5} aria-hidden="true" />
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
  const journeySteps = [
    { icon: "🎯", title: "Register for the league", body: "Free. Takes 2 minutes. Your national profile is created instantly." },
    { icon: "📍", title: "Find a techfest near you", body: "Browse events by city, college, and sport. Pay the techfest entry fee only." },
    { icon: "🏆", title: "Compete and earn ranking points", body: "Every finish — win or lose — counts toward your national score." },
    {
      icon: "🚀",
      title: `Qualify for ${nextName}${nextLeague ? " League" : ""}`,
      body: nextLeague
        ? `Strong ${league.shortName} performance unlocks the ${nextLeague.startingAge} track.`
        : "Strong performance here is the path to the international stage.",
    },
  ];

  // Sample leaderboard — this app deliberately keeps every (sport, league,
  // weight class) as its own ranking pool (see RankingEngineService), so
  // there's no real single cross-sport "league leaderboard" to pull rows
  // from without merging incomparable pools. Placeholder until/unless a
  // real cross-pool aggregate exists; /rankings has the real per-pool
  // tables, which "View rankings" below links to.
  const sampleLeaderboard = [
    { rank: 1, name: "Arjun Mehta", school: "IIT Bombay Techfest", points: 2840 },
    { rank: 2, name: "Priya Iyer", school: "BITS Pilani", points: 2610 },
    { rank: 3, name: "Kabir Nair", school: "IIT Roorkee", points: 2390 },
    { rank: 4, name: "Ananya Rao", school: "BITS Goa", points: 2180 },
  ];
  const rankClass = (r: number) => (r === 1 ? "gold" : r === 2 ? "silver" : r === 3 ? "bronze" : "");

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
          <p className="lg-hero-note mb-0">Free to register. Techfest fees set by each techfest.</p>
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
          The league where learning and competing happen at the same time — alongside peers at your own level.
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
            <h3>National leaderboard &middot; {league.shortName} {new Date().getFullYear()}</h3>
            <button className="lg-ranking-banner__cta" onClick={() => navigate("/rankings")}>
              View rankings
            </button>
          </Reveal>
          <Reveal as="div" className="lg-ranking-banner__bottom" delay={150}>
            <p>
              Points from every affiliated fest — 1st=100, 2nd=70, 3rd=50, participation=20.
              {" "}{league.rankingScope}. Public, permanent, verifiable.
            </p>
          </Reveal>
        </div>
        {/* Sample standings — see sampleLeaderboard's own comment above:
           there's no real single cross-sport ranking to pull these from
           yet, "View rankings" above is where the real per-sport tables
           live. */}
        <div className="lg-rank-list">
          {sampleLeaderboard.map((row) => (
            <div className="lg-rank-row" key={row.rank}>
              <div className={`lg-rank-pos ${rankClass(row.rank)}`}>#{row.rank}</div>
              <div>
                <div className="lg-rank-name">{row.name}</div>
                <div className="lg-rank-school">{row.school}</div>
              </div>
              <div>
                <div className="lg-rank-pts">{row.points.toLocaleString()}</div>
                <div className="lg-rank-pts-label">points</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== From first event to national rank ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-2">{league.journeyHeadline}</h2>
        <p className="lg-sec-subhead mb-4">{league.shortName} is the beginning. Here&rsquo;s how the journey unfolds.</p>
        <div>
          {journeySteps.map((step) => (
            <Reveal as="div" className="lg-jstep" key={step.title}>
              <div className="lg-jicon" aria-hidden="true">{step.icon}</div>
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
