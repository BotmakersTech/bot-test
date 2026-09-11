import { useEffect, useRef, useState } from "react";
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

const SLOT_CLASS = ["cc-slot-left", "cc-slot-center", "cc-slot-right"];

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
