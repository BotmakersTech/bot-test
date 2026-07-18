import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Users, Bot, CalendarDays, ArrowRight, ArrowLeft } from "lucide-react";
import "../../styles/onboarding.css";

export const TOUR_DONE_FLAG = "botleague_tour_done";

interface Step {
  icon: ReactNode;
  title: string;
  desc: string;
  ctaLabel: string;
  ctaPath: string;
}

const STEPS: Step[] = [
  {
    icon: <User size={26} />,
    title: "Complete Your Profile",
    desc: "Add your name, username, date of birth and photo — the essentials every teammate and organiser will see.",
    ctaLabel: "Go to Profile",
    ctaPath: "/profile",
  },
  {
    icon: <Users size={26} />,
    title: "Create or Join a Team",
    desc: "Start your own squad or accept an invite. Username and date of birth must be set first.",
    ctaLabel: "Create a Team",
    ctaPath: "/create-team",
  },
  {
    icon: <Bot size={26} />,
    title: "Add Your Robot",
    desc: "Register your build — pick its category and get it competition-ready.",
    ctaLabel: "Add a Robot",
    ctaPath: "/robots",
  },
  {
    icon: <CalendarDays size={26} />,
    title: "Find Events",
    desc: "Browse upcoming tournaments and register your team to compete.",
    ctaLabel: "Browse Events",
    ctaPath: "/browse-events",
  },
];

interface Props {
  onClose: () => void;
}

export default function OnboardingTour({ onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => {
    localStorage.setItem(TOUR_DONE_FLAG, "1");
    onClose();
  };

  const goToStepPage = () => {
    navigate(current.ctaPath);
    finish();
  };

  return (
    <div className="onb-overlay" onClick={(e) => { if (e.target === e.currentTarget) finish(); }}>
      <div className="onb-card onb-tour-card">
        <button className="onb-close-btn" onClick={finish} aria-label="Close tour">
          <X size={16} />
        </button>

        <div style={{ padding: "32px 28px 6px", textAlign: "center" }}>
          <div className="onb-icon-badge" style={{ margin: "0 auto 16px" }}>
            {current.icon}
          </div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#8C6CFF",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="onb-title" style={{ fontSize: "1.2rem", margin: 0 }}>
            {current.title}
          </h2>
          <p className="onb-subtitle" style={{ margin: "10px 0 0", fontSize: "0.87rem" }}>
            {current.desc}
          </p>
        </div>

        <div style={{ padding: "22px 28px 0" }}>
          <div className="onb-tour-progress">
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={
                  "onb-tour-dot" +
                  (i === step ? " onb-tour-dot--active" : i < step ? " onb-tour-dot--done" : "")
                }
              />
            ))}
          </div>
        </div>

        <div style={{ padding: "18px 28px 6px" }}>
          <button onClick={goToStepPage} className="onb-btn-primary" style={{ width: "100%" }}>
            {current.ctaLabel}
            <ArrowRight size={15} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 6 }} />
          </button>
        </div>

        <div style={{ padding: "10px 28px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="onb-tour-skip" onClick={finish}>
            Skip tour
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button className="onb-tour-nav-btn onb-tour-nav-btn--back" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={14} style={{ marginRight: 4 }} /> Back
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
    </div>
  );
}
