import { useRef } from "react";
import useForgotPassword from "../hooks/useForgotPassword";

const OTP_LENGTH = 4;

const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: "0.5rem",
  color: "#000",
  fontSize: "0.9rem",
  padding: "0.7rem 1rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const otpBoxStyle: React.CSSProperties = {
  width: "52px",
  height: "56px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: "0.5rem",
  color: "#000",
  fontSize: "1.4rem",
  fontWeight: 700,
  textAlign: "center",
  outline: "none",
  fontFamily: "Orbitron, sans-serif",
};

const primaryBtn = (disabled?: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "0.75rem",
  border: "none",
  borderRadius: "0.5rem",
  background: disabled ? "rgba(250,71,21,0.4)" : "linear-gradient(135deg,#ff4d4d,#fa4715)",
  color: "#fff",
  fontSize: "0.9rem",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
  transition: "opacity 0.15s",
});

const ghostBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#9ca3af",
  fontSize: "0.82rem",
  cursor: "pointer",
  fontFamily: "inherit",
  padding: 0,
  textDecoration: "underline",
};

function StepIndicator({ step }: { step: 1 | 2 | 3 | "email_sent" }) {
  const phoneSteps = [
    { n: 1, label: "Identify" },
    { n: 2, label: "Verify OTP" },
    { n: 3, label: "New Password" },
  ];
  const current = step === "email_sent" ? 1 : (step as number);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "24px" }}>
      {phoneSteps.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: s.n <= current ? "#fa4715" : "rgba(255,255,255,0.1)",
            border: `2px solid ${s.n <= current ? "#fa4715" : "rgba(255,255,255,0.15)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.72rem", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {s.n < current ? "✓" : s.n}
          </div>
          <span style={{ fontSize: "0.7rem", color: s.n <= current ? "#fa4715" : "#6b7280", whiteSpace: "nowrap" }}>
            {s.label}
          </span>
          {i < phoneSteps.length - 1 && (
            <div style={{ width: "20px", height: "1px", background: s.n < current ? "#fa4715" : "rgba(255,255,255,0.12)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ForgotPasswordForm() {
  const fp = useForgotPassword();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Backspace" && !fp.otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpChange = (value: string, i: number) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...fp.otp];
    next[i] = value;
    fp.setOtp(next);
    if (value && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Step indicator — phone steps only */}
      {fp.step !== "email_sent" && <StepIndicator step={fp.step} />}

      {/* ── STEP 1: Enter phone or email ── */}
      {fp.step === 1 && (
        <>
          <div style={{ textAlign: "center", marginBottom: "4px" }}>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
              Enter your phone number to receive an OTP, or email to get a reset link.
            </p>
          </div>
          <input
            type="text"
            placeholder="Phone (10 digits) or Email"
            value={fp.identifier}
            onChange={e => fp.setIdentifier(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fp.handleSend()}
            style={inp}
            autoFocus
          />
          <button
            onClick={fp.handleSend}
            disabled={fp.loading}
            style={primaryBtn(fp.loading)}
          >
            {fp.loading ? "Sending…" : "Continue →"}
          </button>
        </>
      )}

      {/* ── EMAIL SENT: link dispatched ── */}
      {fp.step === "email_sent" && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "2.5rem" }}>✉️</div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
              Check your inbox
            </p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.6 }}>
              A password reset link has been sent to{" "}
              <strong style={{ color: "#fa4715" }}>{fp.identifier}</strong>.
              Click the link in that email to set a new password.
            </p>
          </div>
          <div style={{
            padding: "12px 16px",
            background: "rgba(250,71,21,0.07)",
            border: "1px solid rgba(250,71,21,0.2)",
            borderRadius: "8px",
            fontSize: "0.78rem",
            color: "#9ca3af",
          }}>
            The link expires in <strong style={{ color: "#fff" }}>15 minutes</strong>.
            Check your spam folder if you don't see it.
          </div>
          <button onClick={fp.reset} style={ghostBtn}>
            ← Try a different email
          </button>
        </div>
      )}

      {/* ── STEP 2: Enter OTP (phone flow) ── */}
      {fp.step === 2 && (
        <>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af", textAlign: "center" }}>
            Enter the 4-digit OTP sent to <strong style={{ color: "#fff" }}>{fp.identifier}</strong>
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {fp.otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoComplete="off"
                autoFocus={i === 0}
                onChange={e => handleOtpChange(e.target.value, i)}
                onKeyDown={e => handleOtpKey(e, i)}
                style={{
                  ...otpBoxStyle,
                  borderColor: digit ? "#fa4715" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
          <button
            onClick={fp.handleVerifyOtp}
            disabled={fp.loading || fp.otp.join("").length < OTP_LENGTH}
            style={primaryBtn(fp.loading || fp.otp.join("").length < OTP_LENGTH)}
          >
            {fp.loading ? "Verifying…" : "Verify OTP →"}
          </button>
          <button onClick={fp.reset} style={ghostBtn}>← Change phone number</button>
        </>
      )}

      {/* ── STEP 3: Set new password (phone flow) ── */}
      {fp.step === 3 && (
        <form onSubmit={fp.handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af", textAlign: "center" }}>
            OTP verified. Create a new password for <strong style={{ color: "#fff" }}>{fp.identifier}</strong>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={fp.password}
              onChange={e => fp.setPassword(e.target.value)}
              style={inp}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Repeat password"
              value={fp.confirmPw}
              onChange={e => fp.setConfirmPw(e.target.value)}
              style={{
                ...inp,
                borderColor: fp.confirmPw && fp.confirmPw !== fp.password
                  ? "#f87171"
                  : fp.confirmPw && fp.confirmPw === fp.password
                    ? "#4ade80"
                    : "rgba(255,255,255,0.15)",
              }}
            />
            {fp.confirmPw && fp.confirmPw !== fp.password && (
              <span style={{ fontSize: "0.75rem", color: "#f87171" }}>Passwords do not match</span>
            )}
          </div>
          <button
            type="submit"
            disabled={fp.loading || fp.password.length < 8 || fp.password !== fp.confirmPw}
            style={primaryBtn(fp.loading || fp.password.length < 8 || fp.password !== fp.confirmPw)}
          >
            {fp.loading ? "Resetting…" : "Reset Password ✓"}
          </button>
        </form>
      )}

      {/* Feedback */}
      {fp.error && (
        <div style={{ padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#f87171" }}>
          ⚠️ {fp.error}
        </div>
      )}
      {fp.success && (
        <div style={{ padding: "10px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)", borderRadius: "8px", fontSize: "0.82rem", color: "#4ade80" }}>
          ✓ {fp.success}
        </div>
      )}

      {/* Back to login */}
      {fp.step === 1 && (
        <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#6b7280", margin: 0 }}>
          Remember your password?{" "}
          <a href="/login" style={{ color: "#fa4715", fontWeight: 700, textDecoration: "none" }}>Login</a>
        </p>
      )}
    </div>
  );
}
