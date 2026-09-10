import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import mascot from "../../assets/mascote.png";
import "../../styles/onboarding.css";

export const TOUR_DONE_FLAG = "botleague_tour_done";

interface Step {
  title: string;
  desc: string;
  ctaLabel: string;
  ctaPath: string;
}

const STEPS: Step[] = [
  {
    title: "Complete Your Profile",
    desc: "Click here to add your name, username, date of birth and photo.",
    ctaLabel: "Go to Profile",
    ctaPath: "/profile",
  },
  {
    title: "Create or Join a Team",
    desc: "This is where you start your own squad or accept an invite. Username and date of birth must be set first.",
    ctaLabel: "Go to My Team",
    ctaPath: "/my-team",
  },
  {
    title: "Add Your Robot",
    desc: "Register your build here — pick its category and get it competition-ready.",
    ctaLabel: "Go to My Robots",
    ctaPath: "/robots",
  },
  {
    title: "Find Techfests",
    desc: "Browse upcoming tournaments here and register your team to compete.",
    ctaLabel: "Go to Techfests",
    ctaPath: "/browse-events",
  },
];

/** Splits a step title into its lead words + last word, so the last word can
 * be picked out in the accent color the same way every step. */
function splitHeading(title: string): [string, string] {
  const words = title.trim().split(" ");
  const last = words.pop() as string;
  return [words.join(" "), last];
}

interface Props {
  onClose: () => void;
}

export default function OnboardingTour({ onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const [headingLead, headingAccent] = splitHeading(current.title);

  const finish = () => {
    localStorage.setItem(TOUR_DONE_FLAG, "1");
    onClose();
  };

  const goToStepPage = () => {
    navigate(current.ctaPath);
    finish();
  };

  return (
    <div className="onb-overlay" onClick={finish}>
      <div className="onb-stepcard" onClick={(e) => e.stopPropagation()}>
        <span className="onb-stepcard-dot onb-stepcard-dot--tl" />
        <span className="onb-stepcard-dot onb-stepcard-dot--tr" />
        <span className="onb-stepcard-dot onb-stepcard-dot--bl" />
        <span className="onb-stepcard-dot onb-stepcard-dot--br" />

        <svg className="onb-stepcard-star onb-stepcard-star--1" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,3 61,37 97,37 68,58 79,92 50,71 21,92 32,58 3,37 39,37" />
        </svg>
        <svg className="onb-stepcard-star onb-stepcard-star--2" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,3 61,37 97,37 68,58 79,92 50,71 21,92 32,58 3,37 39,37" />
        </svg>
        <svg className="onb-stepcard-star onb-stepcard-star--3" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="50,3 61,37 97,37 68,58 79,92 50,71 21,92 32,58 3,37 39,37" />
        </svg>
        <svg className="onb-stepcard-plane" viewBox="0 0 220 140" aria-hidden="true">
          <path d="M4 130 L200 30" strokeDasharray="2 10" />
          <path d="M120 60 L200 30 L165 95 Z" />
        </svg>

        <button className="onb-close-btn" onClick={finish} aria-label="Close tour">
          <X size={14} />
        </button>

        <div className="onb-stepcard-row">
          <div className="onb-stepcard-left">
            <span className="onb-stepcard-badge">
              Step {step + 1} of {STEPS.length}
            </span>

            <h2 className="onb-stepcard-heading">
              {headingLead} <span className="onb-stepcard-heading-accent">{headingAccent}</span>
            </h2>

            <p className="onb-stepcard-body">{current.desc}</p>

            <div className="onb-stepcard-cta-row">
              <button type="button" className="onb-btn-primary" onClick={goToStepPage}>
                {current.ctaLabel} <span className="onb-stepcard-arrow">&rarr;</span>
              </button>

              <button type="button" className="onb-tour-skip" onClick={finish}>
                Skip tour
              </button>
            </div>
          </div>

          <div className="onb-stepcard-right">
            <img src={mascot} alt="" className="onb-stepcard-mascot" />

            <div style={{ display: "flex", gap: 8 }}>
              {step > 0 && (
                <button type="button" className="onb-tour-nav-btn onb-tour-nav-btn--back" onClick={() => setStep((s) => s - 1)}>
                  Back
                </button>
              )}
              <button
                type="button"
                className="onb-stepcard-next-btn"
                onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>

        <div className="onb-tour-progress onb-stepcard-progress">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={"onb-tour-dot" + (i === step ? " onb-tour-dot--active" : i < step ? " onb-tour-dot--done" : "")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
