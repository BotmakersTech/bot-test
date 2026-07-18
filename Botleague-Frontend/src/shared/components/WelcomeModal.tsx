import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import type { RootState } from "../../app/store";
import "../../styles/onboarding.css";

const WELCOME_FLAG = "botleague_welcome_pending";

interface Props {
  onTakeTour: () => void;
}

// Shown once right after a first-time registration lands the user on
// their (still empty) profile — see the flag set in useRegister.ts.
export default function WelcomeModal({ onTakeTour }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => localStorage.getItem(WELCOME_FLAG) === "1");

  if (!visible || !user) return null;

  const dismiss = () => {
    localStorage.removeItem(WELCOME_FLAG);
    setVisible(false);
  };

  const goToProfile = () => {
    dismiss();
    navigate("/profile");
  };

  const startTour = () => {
    dismiss();
    onTakeTour();
  };

  return (
    <div className="onb-overlay" onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="onb-card" style={{ maxWidth: 440 }}>
        <button className="onb-close-btn" onClick={dismiss} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ padding: "36px 28px 10px", textAlign: "center" }}>
          <div className="onb-icon-badge" style={{ margin: "0 auto 16px", width: 68, height: 68 }}>
            <Sparkles size={30} />
          </div>
          <h2 className="onb-title" style={{ fontSize: "1.3rem", margin: 0 }}>
            You made it, {user.firstName || user.userName || "Champion"}! 🎉
          </h2>
          <p className="onb-subtitle" style={{ margin: "10px 0 0", fontSize: "0.9rem" }}>
            Welcome to BotLeague.{" "}
            <span className="onb-text-gradient" style={{ fontWeight: 700 }}>
              Complete your profile
            </span>{" "}
            to unlock team creation, robot registration, and event entries.
          </p>
        </div>

        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={goToProfile} className="onb-btn-primary">
            Complete Your Profile →
          </button>
          <button onClick={startTour} className="onb-btn-secondary">
            Take a Quick Tour Instead
          </button>
        </div>
      </div>
    </div>
  );
}
