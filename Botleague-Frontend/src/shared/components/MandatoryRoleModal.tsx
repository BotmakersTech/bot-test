import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Trophy, Users, Megaphone, Scale } from "lucide-react";
import type { RootState } from "../../app/store";
import { selectRole, getCurrentUser, clearLocalSession } from "../../feature/Auth/api/auth.api";
import { getProfile } from "../../feature/Profile/api/profile.api";
import { loginSuccess, clearUser } from "../../feature/Auth/store/authSlice";
import { ROLE_MAP, APPROVAL_REQUIRED_ROLES } from "../../feature/Auth/hooks/useRegister";
import "../../styles/onboarding.css";

const ROLES = [
  { key: "participant", title: "Participant", desc: "Compete. Innovate. Become a Champion.", icon: Trophy },
  { key: "volunteer", title: "Volunteer", desc: "Learn. Contribute. Grow.", icon: Users },
  { key: "organiser", title: "Organiser", desc: "Host world-class robotics competitions.", icon: Megaphone },
  { key: "judge", title: "Judge", desc: "Share your expertise. Shape the future of robotics.", icon: Scale },
];

/**
 * Mandatory, non-dismissible: shows for an authenticated account with no
 * role yet (allRoles empty — a fresh Google signup, see
 * AuthService.getCurrentUser). Picking Organiser/Judge revokes the session
 * server-side (same PENDING-must-have-no-live-session invariant register()
 * relies on), so that branch mirrors it locally and shows the same
 * awaiting-approval messaging the password registration flow uses.
 */
export default function MandatoryRoleModal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const shouldShow = !!user && (!user.allRoles || user.allRoles.length === 0);

  if (!shouldShow) return null;

  const handleSubmit = async () => {
    if (!role) {
      setError("Pick a role to continue");
      return;
    }
    setError(null);
    try {
      setIsLoading(true);
      const res = await selectRole(ROLE_MAP[role]);

      if (res.pendingApproval) {
        clearLocalSession();
        dispatch(clearUser());
        setPendingMessage(res.message ?? "Your account has been created and is awaiting admin approval.");
        return;
      }

      const [profile, me] = await Promise.all([getProfile(), getCurrentUser()]);
      dispatch(loginSuccess({
        ...profile,
        role: me.role,
        allRoles: me.allRoles,
        assignedEventIds: me.assignedEventIds,
        assignedSportIds: me.assignedSportIds,
      }));
    } catch (err: unknown) {
      const isResponseError = typeof err === "object" && err !== null && "response" in err;
      const responseData = isResponseError
        ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
        : undefined;
      setError(responseData?.message || responseData?.error || "Couldn't set your role — try again");
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingMessage) {
    return (
      <div className="onb-overlay">
        <div className="onb-card" style={{ maxWidth: 440 }}>
          <div style={{ padding: "32px 28px 8px", textAlign: "center" }}>
            <h2 className="onb-title" style={{ margin: 0, fontSize: "1.2rem" }}>
              Account created
            </h2>
            <p className="onb-subtitle" style={{ margin: "8px 0 0", fontSize: "0.87rem" }}>
              Awaiting admin approval
            </p>
            <p className="onb-subtitle" style={{ margin: "10px 0 0", fontSize: "0.87rem" }}>
              {pendingMessage}
            </p>
          </div>
          <div style={{ padding: "24px 28px 28px" }}>
            <button onClick={() => navigate("/login", { replace: true })} className="onb-btn-primary">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onb-overlay">
      <div className="onb-card" style={{ maxWidth: 480 }}>
        <div style={{ padding: "32px 28px 8px", textAlign: "center" }}>
          <h2 className="onb-title" style={{ margin: 0, fontSize: "1.2rem" }}>
            One more step — choose your role
          </h2>
          <p className="onb-subtitle" style={{ margin: "8px 0 0", fontSize: "0.87rem" }}>
            This decides what you'll see on BotLeague.
          </p>
        </div>

        <div style={{ padding: "20px 28px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
          {ROLES.map((r) => {
            const Icon = r.icon;
            const active = role === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: active ? "1.5px solid #8C6CFF" : "1.5px solid #E5E7F5",
                  background: active ? "rgba(140, 108, 255, 0.08)" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                <span className="onb-icon-badge" style={{ width: 40, height: 40, flexShrink: 0 }}>
                  <Icon size={18} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      color: "#1a1a2e",
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    {r.title}
                    {APPROVAL_REQUIRED_ROLES.has(r.key) && (
                      <span className="onb-field-required" style={{ fontSize: "0.6rem" }}>
                        Needs approval
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", fontFamily: "Poppins, sans-serif" }}>
                    {r.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p
            style={{
              margin: "10px 28px 0",
              color: "#dc2626",
              fontSize: "0.82rem",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ padding: "20px 28px 28px" }}>
          <button onClick={handleSubmit} disabled={isLoading || !role} className="onb-btn-primary">
            {isLoading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
