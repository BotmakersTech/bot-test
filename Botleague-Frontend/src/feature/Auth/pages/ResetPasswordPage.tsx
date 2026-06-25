import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import { resetPasswordWithToken } from "../api/auth.api";

const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "0.5rem",
  color: "#fff",
  fontSize: "0.9rem",
  padding: "0.7rem 1rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
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

export default function ResetPasswordPage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);

  // Invalid / missing token
  if (!token) {
    return (
      <AuthLayout>
        <AuthCard title="Invalid Link" subtitle="This reset link is missing or malformed">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "2.5rem" }}>⚠️</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              The password reset link is invalid or has expired.
              Please request a new one.
            </p>
            <a href="/forgot-password"
               style={{ color: "#fa4715", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
              Request new link →
            </a>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPw) { setError("Passwords do not match"); return; }
    try {
      setLoading(true);
      await resetPasswordWithToken({ token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        "Reset failed. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <AuthCard title="Password Reset" subtitle="Your password has been updated">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "2.5rem" }}>✅</div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#4ade80", fontWeight: 600 }}>
              Password reset successful! Redirecting to login…
            </p>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard title="Set New Password" subtitle="Enter and confirm your new password">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              style={{
                ...inp,
                borderColor: confirmPw && confirmPw !== password
                  ? "#f87171"
                  : confirmPw && confirmPw === password
                    ? "#4ade80"
                    : "rgba(255,255,255,0.15)",
              }}
            />
            {confirmPw && confirmPw !== password && (
              <span style={{ fontSize: "0.75rem", color: "#f87171" }}>Passwords do not match</span>
            )}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#f87171" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 8 || password !== confirmPw}
            style={primaryBtn(loading || password.length < 8 || password !== confirmPw)}
          >
            {loading ? "Resetting…" : "Set New Password ✓"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#6b7280", margin: 0 }}>
            <a href="/forgot-password" style={{ color: "#fa4715", fontWeight: 700, textDecoration: "none" }}>
              ← Request a new link
            </a>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
