import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useContactInfo from "../hooks/useContactInfo";
import { sendOtp, changePhoneWithOtp, changePassword } from "../../Auth/api/auth.api";

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

// ── Security / change-password tab ─────────────────────────────────────
function SecurityTab() {
  const [old,     setOld]     = useState("");
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [ok,      setOk]      = useState(false);

  const secInp: React.CSSProperties = {
    flex: 1,
    background: "#48484a",
    border: "1px solid rgba(107,107,107,1)",
    borderRadius: "0.5rem",
    color: "#cdcdcd",
    fontSize: "0.875rem",
    padding: "0.65rem 0.9rem",
    outline: "none",
    minWidth: 0,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!old) { setErr("Enter your current password"); return; }
    if (pw.length < 8) { setErr("New password must be at least 8 characters"); return; }
    if (pw !== confirm) { setErr("Passwords do not match"); return; }
    try {
      setBusy(true);
      await changePassword({ oldPassword: old, newPassword: pw });
      setOk(true);
      setOld(""); setPw(""); setConfirm("");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.response?.data?.error ?? "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "#404040", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "1.2rem" }}>🔒</span>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Change Password</h2>
      </div>
      {ok ? (
        <div style={{ padding: "14px 16px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)", borderRadius: "8px", color: "#4ade80", fontSize: "0.85rem", fontWeight: 600 }}>
          ✓ Password changed successfully! All other sessions have been logged out.
        </div>
      ) : (
        <form onSubmit={handleChange} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Current Password</label>
            <input type="password" placeholder="Your current password" value={old} onChange={e => setOld(e.target.value)} style={secInp} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>New Password</label>
            <input type="password" placeholder="At least 8 characters" value={pw} onChange={e => setPw(e.target.value)} style={secInp} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ ...secInp, borderColor: confirm && confirm !== pw ? "#f87171" : confirm && confirm === pw ? "#4ade80" : "rgba(107,107,107,1)" }}
            />
            {confirm && confirm !== pw && <span style={{ fontSize: "0.75rem", color: "#f87171" }}>Passwords do not match</span>}
          </div>
          {err && (
            <div style={{ padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "8px", fontSize: "0.82rem", color: "#f87171" }}>⚠️ {err}</div>
          )}
          <button
            type="submit"
            disabled={busy || !old || pw.length < 8 || pw !== confirm}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: busy || !old || pw.length < 8 || pw !== confirm ? "not-allowed" : "pointer",
              opacity: busy || !old || pw.length < 8 || pw !== confirm ? 0.5 : 1,
              border: "none",
              background: "linear-gradient(135deg,#f87171,#ef4444)",
              color: "#fff",
              fontFamily: "inherit",
              alignSelf: "flex-start",
            }}
          >
            {busy ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

type PhoneStep = "idle" | "enter" | "otp" | "done";
const OTP_LEN = 4;

export default function SettingsPage() {
  const navigate = useNavigate();
  const ci = useContactInfo();
  const [activeTab, setActiveTab] = useState<"contact" | "security">("contact");

  // ── Phone change state ───────────────────────────────────────────────
  const [phoneStep,    setPhoneStep]    = useState<PhoneStep>("idle");
  const [newPhone,     setNewPhone]     = useState("");
  const [phoneOtp,     setPhoneOtp]     = useState<string[]>(Array(OTP_LEN).fill(""));
  const [phoneBusy,    setPhoneBusy]    = useState(false);
  const [phoneError,   setPhoneError]   = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resetPhone = () => {
    setPhoneStep("idle");
    setNewPhone("");
    setPhoneOtp(Array(OTP_LEN).fill(""));
    setPhoneError(null);
    setPhoneSuccess(null);
  };

  const handleSendPhoneOtp = async () => {
    setPhoneError(null);
    if (!/^[0-9]{10}$/.test(newPhone)) { setPhoneError("Enter a valid 10-digit phone number"); return; }
    try {
      setPhoneBusy(true);
      await sendOtp(newPhone);
      setPhoneStep("otp");
    } catch (e: any) {
      setPhoneError(e?.response?.data?.message ?? "Failed to send OTP");
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setPhoneError(null);
    const otp = phoneOtp.join("");
    if (otp.length < OTP_LEN) { setPhoneError("Enter complete OTP"); return; }
    try {
      setPhoneBusy(true);
      await changePhoneWithOtp({ newPhone, otp });
      setPhoneSuccess("Phone number updated successfully!");
      setPhoneStep("done");
    } catch (e: any) {
      setPhoneError(e?.response?.data?.message ?? "Invalid OTP");
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleOtpChange = (value: string, i: number) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...phoneOtp];
    next[i] = value;
    setPhoneOtp(next);
    if (value && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Backspace" && !phoneOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  useEffect(() => {
    ci.loadContactInfo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: "#48484a",
    border: "1px solid rgba(107,107,107,1)",
    borderRadius: "0.5rem",
    color: "#cdcdcd",
    fontSize: "0.875rem",
    padding: "0.65rem 0.9rem",
    outline: "none",
    minWidth: 0,
    fontFamily: "inherit",
  };

  const disabledInputStyle: React.CSSProperties = {
    ...inputStyle,
    opacity: 0.6,
    cursor: "not-allowed",
  };

  const outlineBtn = (disabled?: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    flexShrink: 0,
    whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
  });

  const primaryBtn = (disabled?: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    border: "none",
    background: "linear-gradient(135deg,#f87171,#ef4444)",
    color: "#fff",
    flexShrink: 0,
    whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#2c2c2e",
      color: "#fff",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>

      {/* Header */}
      <div style={{
        background: "#404040",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "8px 12px",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            fontFamily: "inherit",
          }}
        >
          ← Back
        </button>
        <h1 style={{
          margin: 0,
          fontSize: "1.2rem",
          fontWeight: 700,
          fontFamily: "Sarpanch, sans-serif",
        }}>
          Settings
        </h1>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
          background: "#404040",
          borderRadius: "10px",
          padding: "4px",
        }}>
          {(["contact", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.15s",
                background: activeTab === tab ? "rgba(248,113,113,0.18)" : "transparent",
                color: activeTab === tab ? "#f87171" : "#9ca3af",
                fontFamily: "inherit",
              }}
            >
              {tab === "contact" ? "Contact Info" : "Security"}
            </button>
          ))}
        </div>

        {/* Contact Info Tab */}
        {activeTab === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Phone */}
            <div style={{
              background: "#404040",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ color: "#f87171" }}><PhoneIcon /></span>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Phone Number</h2>
              </div>

              {/* idle: show current phone */}
              {phoneStep === "idle" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="tel" value={ci.phone} disabled placeholder="Phone number" style={disabledInputStyle} />
                  <button onClick={() => { setNewPhone(""); setPhoneStep("enter"); }} style={outlineBtn()}>Change</button>
                </div>
              )}

              {/* enter: new phone input */}
              {phoneStep === "enter" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="New 10-digit phone number"
                      autoFocus
                      style={{ ...inputStyle, borderColor: "#f87171", flex: 1 }}
                      disabled={phoneBusy}
                    />
                    <button onClick={handleSendPhoneOtp} disabled={phoneBusy || newPhone.length < 10} style={primaryBtn(phoneBusy || newPhone.length < 10)}>
                      {phoneBusy ? "Sending…" : "Send OTP"}
                    </button>
                    <button onClick={resetPhone} style={outlineBtn(phoneBusy)} disabled={phoneBusy}>Cancel</button>
                  </div>
                </div>
              )}

              {/* otp: verify OTP */}
              {phoneStep === "otp" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
                    Enter the OTP sent to <strong style={{ color: "#fff" }}>{newPhone}</strong>
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {phoneOtp.map((digit, i) => (
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
                          width: "48px", height: "52px",
                          background: "#2c2c2e",
                          border: `1.5px solid ${digit ? "#fa4715" : "rgba(255,255,255,0.15)"}`,
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          textAlign: "center",
                          outline: "none",
                          fontFamily: "Sarpanch, sans-serif",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={handleVerifyPhoneOtp} disabled={phoneBusy || phoneOtp.join("").length < OTP_LEN} style={primaryBtn(phoneBusy || phoneOtp.join("").length < OTP_LEN)}>
                      {phoneBusy ? "Verifying…" : "Verify & Update"}
                    </button>
                    <button onClick={() => setPhoneStep("enter")} style={outlineBtn(phoneBusy)} disabled={phoneBusy}>← Back</button>
                  </div>
                </div>
              )}

              {/* done */}
              {phoneStep === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="tel" value={newPhone} disabled style={disabledInputStyle} />
                  <button onClick={resetPhone} style={outlineBtn()}>Change again</button>
                </div>
              )}

              {phoneError && <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#f87171" }}>⚠️ {phoneError}</p>}
              {phoneSuccess && <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#4ade80" }}>✓ {phoneSuccess}</p>}
            </div>

            {/* Email */}
            <div style={{
              background: "#404040",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ color: "#f87171" }}><EmailIcon /></span>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Email Address</h2>
              </div>

              {!ci.isEditingEmail ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="email"
                    value={ci.email}
                    disabled
                    placeholder="Email address"
                    style={disabledInputStyle}
                  />
                  <button
                    onClick={() => {
                      ci.setPendingEmailInput(ci.email);
                      ci.setIsEditingEmail(true);
                    }}
                    style={outlineBtn()}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <input
                      type="email"
                      value={ci.pendingEmailInput}
                      onChange={(e) => ci.setPendingEmailInput(e.target.value)}
                      placeholder="Enter new email"
                      autoFocus
                      style={{ ...inputStyle, borderColor: "#f87171" }}
                      disabled={ci.isLoading}
                    />
                    <button
                      onClick={ci.handleSaveEmail}
                      disabled={ci.isLoading || !ci.pendingEmailInput.trim()}
                      style={primaryBtn(ci.isLoading)}
                    >
                      {ci.isLoading ? "Sending…" : "Send Verification"}
                    </button>
                    <button
                      onClick={() => ci.setIsEditingEmail(false)}
                      style={outlineBtn(ci.isLoading)}
                      disabled={ci.isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {ci.pendingEmail && !ci.isEditingEmail && (
                <div style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background: "rgba(234,179,8,0.1)",
                  border: "1px solid rgba(234,179,8,0.25)",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  color: "#fbbf24",
                }}>
                  ✉️ Verification link sent to <strong>{ci.pendingEmail}</strong>. Click it to confirm.
                </div>
              )}

              {ci.error && (
                <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#f87171" }}>{ci.error}</p>
              )}

              {ci.success && (
                <div style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  color: "#4ade80",
                }}>
                  ✓ Verification email sent successfully!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <SecurityTab />
        )}
      </div>
    </div>
  );
}