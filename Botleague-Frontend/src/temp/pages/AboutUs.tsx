import { useEffect, useRef, useState, type CSSProperties } from "react";
import PublicNavbar from "../../shared/components/PublicNavbar";
import "../../styles/aboutUs.css";
import mohitImg from "../../assets/Avatar-model/Mohit.png";
import akshayImg from "../../assets/Avatar-model/Akshay.png";
import rahulImg from "../../assets/Avatar-model/Rahul.png";

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
    body: "A regional qualifier should feel like a dress rehearsal for the world championship. Same rigor, same fairness, same respect for the competitor — wherever the techfest is held.",
  },
  {
    n: "04.",
    title: "Proof, Not Promises",
    color: "#3983DC",
    body: "We publish our numbers — matches run, disputes resolved, teams returning. If we can't show the proof, we don't get to make the claim.",
  },
];

// Only Results (commented out below) reads this — kept alongside it.
// const RESULTS = [
//   { value: "120+", label: "Techfests Hosted" },
//   { value: "48K+", label: "Competitors" },
//   { value: "9", label: "Countries" },
//   { value: "1,300+", label: "Bots Battled" },
//   { value: "99.2%", label: "Disputes Resolved" },
//   { value: "10 yrs", label: "Running Since" },
//   { value: "72", label: "Campus Chapters" },
//   { value: "4.8/5", label: "Competitor Rating" },
//   { value: "0", label: "Rules Bent" },
// ];

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  quote: string;
  img: string | null;
}

const TEAM: TeamMember[] = [
  {
    name: "Mohit Chaudhari",
    role: "CFO",
    initials: "MC",
    quote: "Every rupee we spend traces back to a better arena for you.",
    img: mohitImg,
  },
  {
    name: "Akshay Joshi",
    // NOTE: akshayImg's own nameplate reads "COO", not "CEO" — flagging
    // rather than silently picking one, since it conflicts with the role
    // already recorded here (and with rahulImg's nameplate, which is also
    // "COO"). Kept the existing "CEO" until that's confirmed one way or
    // the other; the model image itself can't be edited from here.
    role: "CEO",
    initials: "AJ",
    quote: "Hello, I am Akshay — I've judged more matches than I can count, and I still show up early.",
    img: akshayImg,
  },
  {
    name: "Rahul Ishi",
    role: "COO",
    initials: "RI",
    quote: "I make sure the schedule survives contact with reality on techfest day.",
    img: rahulImg,
  },
];

function Hero() {
  return (
    <header className="bl-hero text-center px-4">
      <div className="mx-auto max-w-[900px] py-16 md:py-20">
        <h1 className="bl-hero-title">Built by Roboteers, for Roboteers.</h1>
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
  return (
    <section className="bl-story-wrap">
      <div className="mx-auto max-w-[860px] px-4 w-full text-center">
        <h2 className="bl-section-title mb-6">From the podium to the platform.</h2>
        <p className="bl-story-text">
          It started with three engineering students already winning podiums across
          India&rsquo;s biggest college techfests — IIT Bombay Techfest, BITS Pilani, IIT
          Roorkee, and more. They decided the scene deserved more than scattered rules and
          one-off arenas built for a single weekend. So the same three took their bots
          international, competing on the world stage and representing India — and came back
          knowing exactly what a real competitive ecosystem needed to look like. Five years on,
          the rulebook, the scoring stack, and the ecosystem they built have become BotLeague —
          with one clear goal ahead: get more Indian roboteers competing internationally.
        </p>
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

// Not currently rendered (see the commented-out <Results /> in AboutUs
// below) — commented out along with its call site instead of deleted,
// since TS flags an unused, unexported function declaration as an error
// and this one's kept around for whenever the section comes back.
// function Results() {
//   return (
//     <section className="bl-results py-16 md:py-20">
//       <div className="mx-auto max-w-[1180px] px-4">
//         <h2 className="bl-section-title text-center mb-10">Built On Results.</h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {RESULTS.map((r) => (
//             <div className="bl-result-card" key={r.label}>
//               <div className="bl-result-value">{r.value}</div>
//               <div className="bl-result-label">{r.label}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// ---- "Built By The Competitors" — 3D ring carousel ----
//
// Each member sits at one of 3 fixed angular slots on a circle — rotateY
// + translateZ is the standard way to place items around a Y-axis ring so
// perspective alone produces the correct horizontal projection and depth
// (no separate translateX ever needed). The angle stays shallow (well
// under 90deg) deliberately: these are flat photo cards, and rotating a
// flat plane much past 90deg starts showing its *back* — since a plain
// <img> has no back texture, the browser just renders a mirrored version
// of the front (confirmed live: a 120deg-per-slot version, tried first,
// rendered team members' nameplates backwards).
//
// The real, confirmed bug in the old version wasn't the angle — it was
// that members were rendered by mapping over an `order` array, so
// clicking next/prev actually REORDERED the keyed DOM elements (moved
// them to different positions in the child list) in the same commit that
// changed their slot className. Reordering a keyed list item and changing
// its transform at the same time is exactly the case where a CSS
// transition can get silently skipped instead of interpolating — verified
// live by tracking each named member's computed transform frame-by-frame:
// the member that got moved in the DOM jumped straight to its resting
// transform within one frame while the untouched-position members
// animated normally, which is what read as "just replacing images."
//
// Fixed by rendering every member in the SAME fixed DOM position always
// (TEAM.map in its own unchanging order) and deriving each one's slot
// purely from state — nothing ever reorders, so the transition always has
// a stable element to animate.
const SIDE_ANGLE_DEG = 42;
const SIDE_DEPTH_PX = -260;
const SIDE_SCALE = 0.64;
const CENTER_DEPTH_PX = 90;

function ringStyle(pos: number) {
  // 0 = front/center, 1 = one step in the "next" direction (right), 2 =
  // one step in the "prev" direction (left) — matches rotateNext/
  // rotatePrev's sign below. Reduced from the raw, unbounded per-member
  // step count, which still only ever moves by exactly +-1 per click (see
  // rotateBy) — that's what keeps every click's motion consistent and
  // avoids two members ever appearing to trade places.
  const normalized = ((Math.round(pos) % 3) + 3) % 3;
  const front = normalized === 0;
  const angle = normalized === 1 ? -SIDE_ANGLE_DEG : normalized === 2 ? SIDE_ANGLE_DEG : 0;
  const style: CSSProperties = {
    transform: `translate(-50%, 0) rotateY(${angle}deg) translateZ(${front ? CENTER_DEPTH_PX : SIDE_DEPTH_PX}px) scale(${front ? 1 : SIDE_SCALE})`,
    opacity: front ? 1 : 0.55,
    filter: front ? "none" : "grayscale(.15) brightness(.85)",
    zIndex: front ? 5 : 2,
    cursor: front ? "default" : "pointer",
  };
  return { style, front, normalized };
}

function Competitors() {
  const sectionRef = useRef<HTMLElement>(null);
  // One ring-step count per TEAM member (by index) — starts at [-1, 0, 1]
  // so Mohit(0) opens on the left, Akshay(1) front-center, Rahul(2) right.
  const [positions, setPositions] = useState([-1, 0, 1]);
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

  const centerIndex = positions.findIndex((p) => ((Math.round(p) % 3) + 3) % 3 === 0);

  useEffect(() => {
    setBubbleOn(false);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubbleOn(true), 550);
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, [centerIndex]);

  // Every member steps together by the same delta — the ring turns as one
  // piece, it never singles a member out for a different-length hop.
  const rotateBy = (delta: number) => {
    if (transitioning.current) return;
    transitioning.current = true;
    setPositions((prev) => prev.map((p) => p + delta));
    setTimeout(() => (transitioning.current = false), 1000);
  };

  const rotateNext = () => rotateBy(-1);
  const rotatePrev = () => rotateBy(1);

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

  const centerMember = TEAM[centerIndex] ?? TEAM[0];

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

          {TEAM.map((member, i) => {
            const { style, front, normalized } = ringStyle(positions[i]);
            return (
              <div
                key={member.name}
                className={`cc-character ${front ? "cc-character-front" : ""}`}
                style={style}
                onClick={() => {
                  if (normalized === 2) rotatePrev();
                  if (normalized === 1) rotateNext();
                }}
              >
                <div className="cc-glow" style={{ opacity: front ? 1 : 0 }} />
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
                className={`cc-dot ${centerIndex === i ? "cc-dot-active" : ""}`}
                onClick={() => {
                  const normalized = ((Math.round(positions[i]) % 3) + 3) % 3;
                  const delta = normalized === 1 ? -1 : normalized === 2 ? 1 : 0;
                  if (delta !== 0) rotateBy(delta);
                }}
                aria-label={`Show ${m.name}`}
              />
            ))}
          </div>
        </div>
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
      {/* <Results /> */}
      <Competitors />
      
    </div>
  );
}
