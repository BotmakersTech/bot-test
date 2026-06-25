import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { forgotPassword, resetPassword } from "../api/auth.api";

const OTP_LENGTH = 4;

const err = (e: unknown): string => {
  if (axios.isAxiosError(e))
    return e.response?.data?.message ?? e.response?.data?.error ?? "Request failed";
  return "Something went wrong";
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v: string) => /^[0-9]{10}$/.test(v);

/**
 * Forgot-password flow — two paths:
 *
 * EMAIL path:  step 1 → "link sent" (user clicks email link → /reset-password page)
 * PHONE path:  step 1 → step 2 (enter OTP) → step 3 (set new password)
 */
export default function useForgotPassword() {
  const navigate = useNavigate();

  // 1 = enter identifier, 2 = enter OTP (phone), 3 = set password (phone)
  // "email_sent" = email link dispatched
  const [step, setStep] = useState<1 | 2 | 3 | "email_sent">(1);

  const [identifier, setIdentifier]       = useState("");
  const [otp,        setOtp]              = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [password,   setPassword]         = useState("");
  const [confirmPw,  setConfirmPw]        = useState("");
  const [loading,    setLoading]          = useState(false);
  const [error,      setError]            = useState<string | null>(null);
  const [success,    setSuccess]          = useState<string | null>(null);

  // ── step 1: send OTP or email link ──────────────────────────────────────
  const handleSend = async () => {
    setError(null);
    setSuccess(null);
    if (!identifier.trim()) { setError("Enter phone or email"); return; }
    if (!isPhone(identifier) && !isEmail(identifier)) {
      setError("Enter a valid 10-digit phone or email address");
      return;
    }
    try {
      setLoading(true);
      await forgotPassword(identifier.trim());
      if (isPhone(identifier)) {
        setSuccess("OTP sent to your phone");
        setStep(2);
      } else {
        setStep("email_sent");
      }
    } catch (e) {
      setError(err(e));
    } finally {
      setLoading(false);
    }
  };

  // ── step 2 (phone): verify OTP only — don't set password yet ─────────
  const handleVerifyOtp = async () => {
    setError(null);
    const fullOtp = otp.join("");
    if (fullOtp.length !== OTP_LENGTH) { setError("Enter complete OTP"); return; }
    // We don't have a standalone "verify OTP" endpoint for password reset —
    // the backend verifies it atomically with the new password in step 3.
    // We just advance the UI here after basic client-side validation.
    setSuccess("OTP accepted — set your new password");
    setStep(3);
  };

  // ── step 3 (phone): submit new password ──────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPw) { setError("Passwords do not match"); return; }
    try {
      setLoading(true);
      await resetPassword({ phone: identifier, otp: otp.join(""), newPassword: password });
      setSuccess("Password reset successful! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setError(err(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setIdentifier("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setPassword("");
    setConfirmPw("");
    setError(null);
    setSuccess(null);
  };

  return {
    step, setStep,
    identifier, setIdentifier,
    otp, setOtp,
    password, setPassword,
    confirmPw, setConfirmPw,
    loading, error, success,
    handleSend,
    handleVerifyOtp,
    handleSetPassword,
    reset,
    isEmail: isEmail(identifier),
    isPhone: isPhone(identifier),
  };
}
