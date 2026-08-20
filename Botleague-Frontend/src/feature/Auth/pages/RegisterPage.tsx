import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import useRegister, { APPROVAL_REQUIRED_ROLES } from "../hooks/useRegister";
import "../../../styles/createAccount.css";
import paperPlane from "../../../assets/Auth/plane.svg";
import LOGO_URL from "../../../assets/BrandLogo/BotLeagu-black.png";

const ROLES = [
  {
    key: "participant",
    title: "Participant",
    desc: "Compete. Innovate. Become a Champion",
    hoverDesc: "Register your robot, compete in matches, and climb the leaderboard against builders from around the world.",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path d="M12 2a2 2 0 0 1 2 2v1h2a3 3 0 0 1 3 3v2h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v2a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-2H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a3 3 0 0 1 3-3h2V4a2 2 0 0 1 2-2Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      </svg>
    ),
  },
  {
    key: "volunteer",
    title: "Volunteer",
    desc: "Learn. Contribute. Grow",
    hoverDesc: "Help run the show — check-ins, logistics, and keeping matches on schedule at live events.",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path d="M12 21s-7.5-4.6-10-9.1C.5 8.6 2 5 5.4 5c1.9 0 3.3 1 4.1 2.3C10.3 6 11.7 5 13.6 5 17 5 18.5 8.6 22 11.9 14.5 16.4 12 21 12 21Z" />
      </svg>
    ),
  },
  {
    key: "organiser",
    title: "Organiser",
    desc: "Host World-Class Robotics Competitions.",
    hoverDesc: "Create and manage your own events — registrations, schedules, judging, and live results, all in one place.",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-2 8h4a2 2 0 0 0-4 0Zm8-6h6v-1h-6Zm0 3h6v-1h-6Z" />
      </svg>
    ),
  },
  {
    key: "judge",
    title: "Judge",
    desc: "Share your Expertise. Shape the Future of Robotics",
    hoverDesc: "Score matches fairly using each sport's rubric and help decide who takes the win.",
    icon: (
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path d="m14.5 2.5 7 7-2 2-1-1-4 4a3 3 0 0 1-4 4l-5-5a3 3 0 0 1 4-4l4-4-1-1Zm-8 14 1.5 1.5L3 23H0v-3Z" />
      </svg>
    ),
  },
];

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...register.otp];
    next[i] = val;
    register.setOtp(next);
    if (val && i < register.otp.length - 1) otpRefs.current[i + 1]?.focus();
  };

  const resendLabel =
    register.resendTimer > 0
      ? `Resend in 0:${String(register.resendTimer).padStart(2, "0")}`
      : "Resend OTP";

  return (
    <div className="cba-page">
      <div className="cba-shape cba-shape-tl" />
      <div className="cba-shape cba-shape-tr" />
      <div className="cba-shape cba-shape-bl" />
      <div className="cba-shape cba-shape-br" />

      <div className="cba-container">
        <header className="cba-header">
          <img src={paperPlane} alt="" className="cba-plane" />
          <img src={LOGO_URL} alt="BotLeague" className="cba-logo-img" />
          <p className="cba-tagline">Join the Bot League Community</p>
        </header>

        <div className="cba-row">
          {/* LEFT: role selection */}
          <div className="cba-panel">
            <div className="cba-panel-inner w-full">
              <p className="cba-role-label">*Select your role to get started</p>

              {ROLES.map((role) => (
                <button
                  type="button"
                  key={role.key}
                  className={"cba-role-card" + (register.role === role.key ? " cba-role-card--active" : "")}
                  onClick={() => register.setRole(role.key)}
                >
                  <span className="cba-role-icon">{role.icon}</span>
                  <span className="cba-role-text">
                    <span className="cba-role-title">
                      {role.title}
                      {APPROVAL_REQUIRED_ROLES.has(role.key) && (
                        <span className="cba-role-badge">Needs admin approval</span>
                      )}
                    </span>
                    <span className="cba-role-desc">{role.desc}</span>
                    <span className="cba-role-desc-hover">{role.hoverDesc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: form card */}
          <div className="cba-panel">
            <div className="cba-form-border w-full">
              <div className="cba-form-card">
                {register.pendingMessage ? (
                  <div className="cba-pending-state">
                    <h2 className="cba-form-title">Account created</h2>
                    <p className="cba-form-subtitle">Awaiting admin approval</p>
                    <p className="cba-pending-message">{register.pendingMessage}</p>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="cba-btn-gradient cba-submit-btn w-full"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                <>
                <h2 className="cba-form-title">Create New Account</h2>
                <p className="cba-form-subtitle">Start your journey</p>

                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="cba-field-row">
                    <input
                      type="tel"
                      className="cba-input"
                      placeholder="Mobile Number"
                      value={register.mobile}
                      maxLength={10}
                      onChange={(e) => register.setMobile(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      type="button"
                      className="cba-btn-gradient cba-btn-otp"
                      onClick={register.handleSendOtp}
                      disabled={register.isLoading}
                    >
                      {register.otpSent ? "Sent" : "Get OTP"}
                    </button>
                  </div>

                  <div className="cba-field-row cba-otp-row">
                    {register.otp.map((val, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="cba-otp-box"
                        value={val}
                        disabled={!register.otpSent}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                      />
                    ))}
                    <button
                      type="button"
                      className="cba-btn-gradient cba-btn-verify"
                      onClick={register.handleVerifyOtp}
                      disabled={!register.otpSent || register.otpVerified}
                    >
                      {register.otpVerified ? "Verified" : "Verify"}
                    </button>
                  </div>

                  <p className="cba-resend">
                    {register.otpSent && (
                      register.resendTimer > 0 ? (
                        resendLabel
                      ) : (
                        <button type="button" onClick={register.handleResendOtp} className="underline">
                          {resendLabel}
                        </button>
                      )
                    )}
                  </p>

                  <input
                    type="password"
                    className="cba-input-full"
                    placeholder="Password"
                    value={register.password}
                    disabled={!register.otpVerified}
                    onChange={(e) => register.setPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="cba-input-full"
                    placeholder="Confirm Password"
                    value={register.confirmPassword}
                    disabled={!register.otpVerified}
                    onChange={(e) => register.setConfirmPassword(e.target.value)}
                  />

                  <div className="cba-terms">
                    <input
                      type="checkbox"
                      id="cba-terms-check"
                      className="form-check-input"
                      checked={register.agreed}
                      onChange={(e) => register.setAgreed(e.target.checked)}
                    />
                    <label htmlFor="cba-terms-check">
                      By deploying your profile, you agree to the{" "}
                      <a href="#terms">Terms of Engagement</a> and{" "}
                      <a href="#privacy">Privacy Protocol</a>
                    </label>
                  </div>

                  {register.error && <p className="cba-field-error">{register.error}</p>}

                  <button
                    type="submit"
                    onClick={register.handleRegister}
                    disabled={register.isLoading}
                    className="cba-btn-gradient cba-submit-btn w-full"
                  >
                    {register.isLoading ? "Loading..." : "Create account"}
                  </button>

                  <p className="cba-or">OR</p>

                  <button type="button" onClick={() => navigate("/login")} className="cba-login-btn w-full">
                    Login
                  </button>
                </form>
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
