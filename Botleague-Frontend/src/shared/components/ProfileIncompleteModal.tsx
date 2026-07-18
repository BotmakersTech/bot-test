import { useNavigate } from "react-router-dom";
import { X, Zap } from "lucide-react";
import "../../styles/onboarding.css";

// ── Required profile fields the user must complete ────────────────────────────
export interface MissingField {
  key:   string;
  label: string;
  icon:  string;
}

interface Props {
  missingFields: MissingField[];
  action: "create a team" | "join a team";
  onClose: () => void;
}

export default function ProfileIncompleteModal({ missingFields, action, onClose }: Props) {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <div className="onb-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="onb-card" style={{ maxWidth: 420 }}>
        <button className="onb-close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div style={{ padding: "30px 24px 8px", textAlign: "center" }}>
          <div className="onb-icon-badge" style={{ margin: "0 auto 14px" }}>
            <Zap size={26} />
          </div>
          <h2 className="onb-title" style={{ margin: 0, fontSize: "1.15rem" }}>
            Complete Your Profile First
          </h2>
          <p className="onb-subtitle" style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
            You need to fill in the following details before you can {action}.
          </p>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "0.68rem", fontWeight: 700, color: "#8C6CFF", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Poppins, sans-serif" }}>
            Missing information
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {missingFields.map((f) => (
              <div key={f.key} className="onb-field-row">
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: "0.87rem", fontWeight: 600, color: "#374151", fontFamily: "Poppins, sans-serif" }}>{f.label}</span>
                <span className="onb-field-required">REQUIRED</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={handleGoToProfile} className="onb-btn-primary">
            Complete Profile →
          </button>
          <button onClick={onClose} className="onb-btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
