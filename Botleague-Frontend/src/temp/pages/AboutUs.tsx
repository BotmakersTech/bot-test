import { useCallback, useEffect, useRef, useState, Fragment, type RefObject } from "react";
import PublicNavbar from "../../shared/components/PublicNavbar";
import "../../styles/aboutUs.css";

interface StoryStep {
  n: string;
  year: string;
  title: string;
  text: string;
}

const STORY_STEPS: StoryStep[] = [
  {
    n: "01",
    year: "2014",
    title: "The First Arena",
    text: "A handful of engineering students at IIT Bombay build a plywood arena in a hostel courtyard. No sponsors, no rulebook — just a stopwatch and a dream to see robots fight fair.",
  },
  {
    n: "02",
    year: "2018",
    title: "The Rulebook Gets Real",
    text: "After four seasons of Techfest, BITS Pilani and IIT Roorkee, the crew starts writing down every judging call. What began as house rules becomes the standard other campuses start borrowing.",
  },
  {
    n: "03",
    year: "2024",
    title: "BotLeague Goes National",
    text: "Ten years of arena scars later, the rulebook, the scoring stack and the people behind it become BotLeague — built by the competitors who never left the pit.",
  },
];

interface Principle {
  n: string;
  title: string;
  color: string;
  body: string;
}

const PRINCIPLES: Principle[] = [
  {
    n: "01.",
    title: "Standards Before Scale",
    color: "#0162D1",
    body: "A BotLeague badge means something because we never compromise on the rulebook. Growth only matters when the standard stays intact.",
  },
  {
    n: "02.",
    title: "Competitors Come First",
    color: "#8C6CFF",
    body: "Every arena spec, every scoring rule and every deadline is written by people who have stood in the pit at 2am fixing a burnt ESC. We build for the builder, not the spreadsheet.",
  },
  {
    n: "03.",
    title: "Built for the World Stage",
    color: "#3983DC",
    body: "A regional qualifier should feel like a dress rehearsal for the world championship. Same rigor, same fairness, same respect for the competitor — wherever the techfect is held.",
  },
  {
    n: "04.",
    title: "Proof, Not Promises",
    color: "#3983DC",
    body: "We publish our numbers — matches run, disputes resolved, teams returning. If we can't show the proof, we don't get to make the claim.",
  },
];

const RESULTS = [
  { value: "120+", label: "Techfects Hosted" },
  { value: "48K+", label: "Competitors" },
  { value: "9", label: "Countries" },
  { value: "1,300+", label: "Bots Battled" },
  { value: "99.2%", label: "Disputes Resolved" },
  { value: "10 yrs", label: "Running Since" },
  { value: "72", label: "Campus Chapters" },
  { value: "4.8/5", label: "Competitor Rating" },
  { value: "0", label: "Rules Bent" },
];

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  quote: string;
  img: string | null;
}

// No portrait assets exist for the team yet — everyone renders through the
// initials-placeholder card until real photos are added.
const TEAM: TeamMember[] = [
  {
    name: "Mohit Chaudhari",
    role: "CFO",
    initials: "MC",
    quote: "Every rupee we spend traces back to a better arena for you.",
    img: null,
  },
  {
    name: "Akshay Joshi",
    role: "CEO",
    initials: "AJ",
    quote: "Hello, I am Akshay — I've judged more matches than I can count, and I still show up early.",
    img: null,
  },
  {
    name: "Rahul Ishi",
    role: "COO",
    initials: "RI",
    quote: "I make sure the schedule survives contact with reality on techfect day.",
    img: null,
  },
];

const SLOT_CLASS = ["cc-slot-left", "cc-slot-center", "cc-slot-right"];

function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  const handle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const total = rect.height + vh * 0.6;
    const covered = vh * 0.85 - rect.top;
    let p = covered / total;
    p = Math.max(0, Math.min(1, p));
    setProgress(p);
  }, [ref]);

  useEffect(() => {
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [handle]);

  return progress;
}

function Hero() {
  return (
    <header className="bl-hero text-center px-4">
      <div className="mx-auto max-w-[900px] py-16 md:py-20">
        <h1 className="bl-hero-title">
          Built by competitors.
          <br />
          For competitors.
        </h1>
        <p className="bl-hero-sub mx-auto">
          BotLeague was built by the people who spent more than 10 years running robotics
          competitions at IIT Bombay Techfest, BITS Pilani, IIT Roorkee, and more. Every rule,
          arena spec, and tool comes from what actually happens at real events with real
          competitors.
        </p>
      </div>
    </header>
  );
}

function OurStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const n = STORY_STEPS.length;
  const pos = Math.max(0, Math.min(n - 1, progress * (n - 1) * 1.15));
  const clampedActive = Math.max(1, Math.min(n, Math.floor(pos + 0.001) + 1));

  return (
    <section ref={sectionRef} className="py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-4">
        <h2 className="bl-section-title text-center mb-10">Our Story</h2>

        <div className="bl-story-track">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-center">
            {STORY_STEPS.map((step, i) => {
              const visible = i < clampedActive;
              return (
                <div
                  key={step.n}
                  className={`bl-story-card ${visible ? "bl-story-card-visible" : ""}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="bl-story-n">{step.n}</div>
                  <div className="bl-story-year">{step.year}</div>
                  <h3 className="bl-story-card-title">{step.title}</h3>
                  <p className="bl-story-card-text">{step.text}</p>
                </div>
              );
            })}
          </div>

          <div className="bl-story-connector hidden md:block">
            {STORY_STEPS.map((step, i) => {
              const nodeReached = pos >= i - 0.001;
              const leftPct = ((2 * i + 1) / (n * 2)) * 100;
              const segFill = i < n - 1 ? Math.max(0, Math.min(1, pos - i)) * 100 : 0;
              return (
                <Fragment key={step.n}>
                  <span
                    className={`bl-story-node ${nodeReached ? "bl-story-node-active" : ""}`}
                    style={{ left: `${leftPct}%` }}
                  />
                  {i < n - 1 && (
                    <span className="bl-story-segment" style={{ left: `${leftPct}%`, width: `${100 / n}%` }}>
                      <span className="bl-story-segment-fill" style={{ width: `${segFill}%` }} />
                    </span>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Principles() {
  const [active, setActive] = useState(0);
  const current = PRINCIPLES[active];

  return (
    <section className="bl-principles py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-4">
        <h2 className="bl-section-title text-center mb-10">The Principles We Compete By.</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-4">
            <div className="bl-principle-tabs">
              {PRINCIPLES.map((p, i) => (
                <button
                  key={p.n}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`bl-principle-tab ${active === i ? "bl-principle-tab-active" : ""}`}
                  style={active === i ? { background: p.color } : undefined}
                >
                  <span className="bl-principle-tab-n">{p.n}</span>
                  <span className="bl-principle-tab-title">{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bl-principle-panel">
              <span className="bl-principle-ghost">B</span>
              <div key={active} className="bl-principle-content">
                <span className="bl-principle-big-n" style={{ color: current.color }}>
                  {current.n}
                </span>
                <h3 className="bl-principle-title">{current.title}</h3>
                <p className="bl-principle-body">{current.body}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Results() {
  return (
    <section className="bl-results py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-4">
        <h2 className="bl-section-title text-center mb-10">Built On Results.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESULTS.map((r) => (
            <div className="bl-result-card" key={r.label}>
              <div className="bl-result-value">{r.value}</div>
              <div className="bl-result-label">{r.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- "Built By The Competitors" — image-based sliding carousel ----
function Competitors() {
  const sectionRef = useRef<HTMLElement>(null);
  const [order, setOrder] = useState([0, 1, 2]); // indices into TEAM
  const [bubbleOn, setBubbleOn] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const transitioning = useRef(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setBubbleOn(false);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubbleOn(true), 550);
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, [order]);

  const rotateNext = () => {
    if (transitioning.current) return;
    transitioning.current = true;
    setOrder((o) => [o[1], o[2], o[0]]);
    setTimeout(() => (transitioning.current = false), 1000);
  };

  const rotatePrev = () => {
    if (transitioning.current) return;
    transitioning.current = true;
    setOrder((o) => [o[2], o[0], o[1]]);
    setTimeout(() => (transitioning.current = false), 1000);
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayRef.current = setInterval(rotateNext, 4200);
  };
  const stopAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const centerMember = TEAM[order[1]];

  return (
    <section ref={sectionRef} className="bl-team py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-4 text-center">
        <h2 className="bl-section-title mb-10">Built By The Competitors.</h2>

        <div
          className={`cc-stage mx-auto ${revealed ? "cc-stage-in" : ""}`}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
        >
          <div
            className="cc-arrow cc-arrow-left"
            onClick={() => {
              rotatePrev();
              startAutoplay();
            }}
            role="button"
            aria-label="Previous team member"
          >
            &#10094;
          </div>
          <div
            className="cc-arrow cc-arrow-right"
            onClick={() => {
              rotateNext();
              startAutoplay();
            }}
            role="button"
            aria-label="Next team member"
          >
            &#10095;
          </div>

          {order.map((memberIdx, slot) => {
            const member = TEAM[memberIdx];
            return (
              <div
                key={member.name}
                className={`cc-character ${SLOT_CLASS[slot]}`}
                onClick={() => {
                  if (slot === 0) rotatePrev();
                  if (slot === 2) rotateNext();
                }}
              >
                <div className="cc-glow" />
                {member.img ? (
                  <img src={member.img} alt={member.name} />
                ) : (
                  <div className="cc-placeholder">{member.initials}</div>
                )}
                <div className="cc-shadow-ellipse" />
              </div>
            );
          })}

          <div className={`cc-bubble ${bubbleOn ? "cc-bubble-show" : ""}`}>
            <strong>{centerMember.name}</strong>
            <span className="cc-bubble-role">{centerMember.role}</span>
            <p>{centerMember.quote}</p>
          </div>

          <div className="cc-dots">
            {TEAM.map((m, i) => (
              <button
                type="button"
                key={m.name}
                className={`cc-dot ${order[1] === i ? "cc-dot-active" : ""}`}
                onClick={() => setOrder([(i + 2) % 3, i, (i + 1) % 3])}
                aria-label={`Show ${m.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="bl-newsletter">
      <div className="mx-auto max-w-[1180px] px-4 flex flex-col md:flex-row items-center justify-between gap-3 py-8">
        <span className="bl-newsletter-title">Let&apos;s find harmony together.</span>
        <form className="bl-newsletter-form flex" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email id"
            className="bl-newsletter-input"
          />
          <button type="submit" className="bl-newsletter-btn">
            Submit
          </button>
        </form>
      </div>
    </section>
  );
}

export default function AboutUs() {
  return (
    <div className="bl-about">
      <PublicNavbar showLeagues />
      <Hero />
      <OurStory />
      <Principles />
      <Results />
      <Competitors />
      <Newsletter />
    </div>
  );
}
