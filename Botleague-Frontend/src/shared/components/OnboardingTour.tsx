import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Users, Bot, CalendarDays, ArrowRight, ArrowLeft } from "lucide-react";
import "../../styles/onboarding.css";

export const TOUR_DONE_FLAG = "botleague_tour_done";

type Placement = "right" | "bottom-end";

interface Step {
  /** CSS selector for the real nav element to spotlight — see the
   * data-tour attributes on Sidebar.tsx / Navbar.tsx. */
  target: string;
  placement: Placement;
  icon: React.ReactNode;
  title: string;
  desc: string;
  ctaLabel: string;
  ctaPath: string;
}

const STEPS: Step[] = [
  {
    target: '[data-tour="navbar-profile"]',
    placement: "bottom-end",
    icon: <User size={22} />,
    title: "Complete Your Profile",
    desc: "Click here to add your name, username, date of birth and photo.",
    ctaLabel: "Go to Profile",
    ctaPath: "/profile",
  },
  {
    target: '[data-tour="sidebar-c-team"]',
    placement: "right",
    icon: <Users size={22} />,
    title: "Create or Join a Team",
    desc: "This is where you start your own squad or accept an invite. Username and date of birth must be set first.",
    ctaLabel: "Go to My Team",
    ctaPath: "/my-team",
  },
  {
    target: '[data-tour="sidebar-c-robots"]',
    placement: "right",
    icon: <Bot size={22} />,
    title: "Add Your Robot",
    desc: "Register your build here — pick its category and get it competition-ready.",
    ctaLabel: "Go to My Robots",
    ctaPath: "/robots",
  },
  {
    target: '[data-tour="sidebar-c-events"]',
    placement: "right",
    icon: <CalendarDays size={22} />,
    title: "Find Events",
    desc: "Browse upcoming tournaments here and register your team to compete.",
    ctaLabel: "Go to Events",
    ctaPath: "/browse-events",
  },
];

const POPOVER_WIDTH = 320;
const GAP = 14;
const HIGHLIGHT_PAD = 6;
const VIEWPORT_MARGIN = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Tracks the target element's live position via rAF — the sidebar's width
 * changes on hover (112px collapsed / 248px expanded), so a one-time
 * measurement would go stale the moment the user's cursor drifts near it. */
function useLiveTargetRect(selector: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const frame = useRef<number>(0);

  useEffect(() => {
    // Resets the previous step's stale rect while this rAF loop's first
    // tick resolves the new selector's real position — a genuine
    // subscribe-to-an-external-system effect (the DOM layout), not a pure
    // derivation from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRect(null);

    const tick = () => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        );
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame.current);
  }, [selector]);

  return rect;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface Props {
  onClose: () => void;
}

export default function OnboardingTour({ onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const rect = useLiveTargetRect(current.target);

  const finish = () => {
    localStorage.setItem(TOUR_DONE_FLAG, "1");
    onClose();
  };

  const goToStepPage = () => {
    navigate(current.ctaPath);
    finish();
  };

  if (!rect) return null; // target not mounted on this page (e.g. still loading) — wait for it

  const highlightStyle: React.CSSProperties = {
    top: rect.top - HIGHLIGHT_PAD,
    left: rect.left - HIGHLIGHT_PAD,
    width: rect.width + HIGHLIGHT_PAD * 2,
    height: rect.height + HIGHLIGHT_PAD * 2,
  };

  const rectRight = rect.left + rect.width;
  const rectBottom = rect.top + rect.height;

  let popoverTop: number;
  let popoverLeft: number;
  if (current.placement === "right") {
    popoverTop = rect.top;
    popoverLeft = rectRight + GAP;
  } else {
    popoverTop = rectBottom + GAP;
    popoverLeft = rectRight - POPOVER_WIDTH;
  }
  popoverTop = clamp(popoverTop, VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN - 40);
  popoverLeft = clamp(popoverLeft, VIEWPORT_MARGIN, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN);

  return (
    <>
      <div className="onb-spotlight-highlight" style={highlightStyle} />

      <div className="onb-spotlight-popover" style={{ top: popoverTop, left: popoverLeft }}>
        <span
          className={
            current.placement === "right" ? "onb-spotlight-arrow onb-spotlight-arrow--left" : "onb-spotlight-arrow onb-spotlight-arrow--top"
          }
        />

        <button className="onb-close-btn" onClick={finish} aria-label="Close tour" style={{ top: 10, right: 10 }}>
          <X size={14} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="onb-icon-badge" style={{ width: 40, height: 40, flexShrink: 0 }}>
            {current.icon}
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#8C6CFF",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="onb-title" style={{ fontSize: "0.98rem", margin: 0 }}>
              {current.title}
            </h3>
          </div>
        </div>

        <p className="onb-subtitle" style={{ fontSize: "0.83rem", margin: "0 0 14px" }}>
          {current.desc}
        </p>

        <button onClick={goToStepPage} className="onb-btn-primary" style={{ width: "100%", padding: "9px", fontSize: "0.83rem", marginBottom: 12 }}>
          {current.ctaLabel}
          <ArrowRight size={14} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 6 }} />
        </button>

        <div className="onb-tour-progress" style={{ marginBottom: 12 }}>
          {STEPS.map((s, i) => (
            <span
              key={s.target}
              className={"onb-tour-dot" + (i === step ? " onb-tour-dot--active" : i < step ? " onb-tour-dot--done" : "")}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="onb-tour-skip" onClick={finish}>
            Skip tour
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button className="onb-tour-nav-btn onb-tour-nav-btn--back" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={13} style={{ marginRight: 4 }} /> Back
              </button>
            )}
            <button
              className="onb-tour-nav-btn onb-tour-nav-btn--next"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
