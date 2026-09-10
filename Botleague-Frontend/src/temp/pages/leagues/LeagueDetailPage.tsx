import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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

/* Section heading */
.lg-section-heading {
  font-family: 'Sarpanch', sans-serif;
  font-weight: 500;
  color: var(--lg-primary);
  font-size: clamp(1.8rem, 4vw, 3.5rem);
}

/* Sports cards */
.lg-sport-card {
  position: relative;
  width: 100%;
  max-width: 361px;
  aspect-ratio: 361 / 446;
  margin-inline: auto;
  transition: transform 0.25s ease;
}
.lg-sport-card:hover {
  transform: translateY(-8px);
}
.lg-sport-card__accent {
  position: absolute;
  border-radius: 13px;
  background: linear-gradient(180deg, var(--lg-primary) 0%, var(--lg-secondary) 100%);
  transition: filter 0.25s ease, transform 0.25s ease;
}
.lg-sport-card:hover .lg-sport-card__accent {
  filter: brightness(1.15) saturate(1.1);
}
.lg-sport-card__accent--tl {
  top: 4.48%; right: 60.11%; bottom: 45.07%; left: -5.82%;
}
.lg-sport-card:hover .lg-sport-card__accent--tl {
  transform: translate(-4px, -4px);
}
.lg-sport-card__accent--br {
  top: 46.19%; right: -6.09%; bottom: 3.36%; left: 60.39%;
}
.lg-sport-card:hover .lg-sport-card__accent--br {
  transform: translate(4px, 4px);
}
.lg-sport-card__frame {
  position: absolute;
  top: 8.52%; right: 0; bottom: 7.85%; left: 0;
  border-radius: 13px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 0 rgba(0, 0, 0, 0);
  transition: box-shadow 0.25s ease;
}
.lg-sport-card:hover .lg-sport-card__frame {
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.35);
}
.lg-sport-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.lg-sport-card:hover .lg-sport-card__img {
  transform: scale(1.06);
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

function SportCard({ title, image, delay }: { title: string; image: string; delay: number }) {
  return (
    <Reveal as="div" delay={delay}>
      <div className="lg-sport-card">
        <span className="lg-sport-card__accent lg-sport-card__accent--tl" aria-hidden="true" />
        <span className="lg-sport-card__accent lg-sport-card__accent--br" aria-hidden="true" />
        <div className="lg-sport-card__frame">
          <img src={image} alt={title} className="lg-sport-card__img" loading="lazy" />
          <span className="lg-sport-card__label">{title}</span>
        </div>
      </div>
    </Reveal>
  );
}

export default function LeagueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { leagues, loading } = useLeagues();
  const league = getLeagueBySlug(leagues, slug);
  const [sports, setSports] = useState<LeagueSport[]>([]);

  useEffect(() => {
    if (!slug) return;
    getPublicLeagueSports(slug)
      .then(setSports)
      .catch(() => setSports([]));
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
        <h2 className="lg-pain-title mb-4">{league.whyHeadline}</h2>
        <p className="lg-ticker text-[#666] text-sm uppercase mb-0">
          IIT Bombay Techfest &middot; BITS Pilani &middot; IIT Roorkee &middot; IIT Bombay Techfest &middot; BITS Pilani
        </p>
      </section>

      {/* ===== Win locally card ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="lg-card-accent p-6 md:p-10 rounded-2xl relative">
          <h3 className="lg-card-gradient-text mb-3">{league.whatYouGet[0] ?? league.whyHeadline}</h3>
          <p className="lg-card-body mb-0">{league.whyBody}</p>
        </div>
      </section>

      {/* ===== Sports & skills ===== */}
      <section id="sports" className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-2">The sports. And the skills behind them.</h2>
        <p className="text-[#515151] mb-10">
          Every event builds real technical depth. Here&rsquo;s what you&rsquo;ll actually learn — and what you&rsquo;ll be building with.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((s, i) => (
            <SportCard key={s.sportId} title={s.sportName} image={`https://picsum.photos/seed/${s.sportSlug}/361/446`} delay={i * 90} />
          ))}
        </div>
      </section>

      {/* ===== Compete. Rank. Prove it. ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-6">Compete. Rank. Prove it.</h2>
        <div className="lg-ranking-banner">
          <Reveal as="div" className="lg-ranking-banner__top">
            <h3>National ranking</h3>
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
      </section>

      {/* ===== From first event to national rank ===== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12 text-center">
        <h2 className="lg-section-heading mb-6">{league.journeyHeadline}</h2>
        <Reveal as="div" className="lg-timeline-box rounded-2xl mx-auto" />
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
              <button className="btn lg-btn-gradient w-40" onClick={() => navigate("/events")}>
                Browse events
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
