import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { forgotPassword, resendOTP, resetPassword, verifyOtp } from "../api/auth.api";

const OTP_LENGTH = 4;

const err = (e: unknown): string => {
  if (axios.isAxiosError(e))
    return e.response?.data?.message ?? e.response?.data?.error ?? "Request failed";
  return "Something went wrong";
};

/**
 * Forgot-password flow — two modes, matching the mockup:
 *
 * "mobile" (default): mobile number -> Get OTP -> Verify (real backend check,
 *   same otpService.verifyOtp() call register() itself re-checks at final
 *   submission, so verifying here and again inside resetPassword's OTP
 *   branch is the same proven double-verify pattern register already uses
 *   in production) -> new password + confirm -> Update password.
 * "email": enter email -> forgotPassword(email) sends a reset-link email
 *   (silent on non-existent accounts, same as the mobile branch).
 */
export default function useForgotPassword() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"mobile" | "email">("mobile");

  // ── mobile + OTP ──────────────────────────────────────────────────────
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── new password ──────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── email mode ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Separate loading flags per action — sharing one flag across independent
  // buttons (send/resend/verify OTP vs. update password vs. email-mode send)
  // made unrelated buttons flash each other's "loading" label/disabled state.
  const [isOtpBusy, setIsOtpBusy] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ⏱ OTP resend timer — same pattern as useRegister.ts
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // ── SEND OTP ──────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError(null);
    setSuccess(null);

    if (mobile.length !== 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    try {
      setIsOtpBusy(true);
      // forgotPassword() is deliberately silent on whether the number is
      // registered — it still returns 200 either way and only actually
      // dispatches an OTP (via the same MSG91-backed otpService.sendOtp()
      // used by registration) when the account exists.
      await forgotPassword(mobile);

      setOtpSent(true);
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpVerified(false);
    } catch (e) {
      setError(err(e));
    } finally {
      setIsOtpBusy(false);
    }
  };

  // ── RESEND OTP ────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError(null);

    if (mobile.length !== 10) {
      setError("Enter valid mobile number");
      return;
    }
    if (resendTimer > 0) return;

    try {
      setIsOtpBusy(true);
      await resendOTP(mobile);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpVerified(false);
      setResendTimer(30);
    } catch (e) {
      setError(err(e));
    } finally {
      setIsOtpBusy(false);
    }
  };

  // ── VERIFY OTP ────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError(null);

    const fullOtp = otp.join("");
    if (fullOtp.length !== OTP_LENGTH) {
      setError("Enter complete OTP");
      return;
    }

    try {
      setIsOtpBusy(true);
      await verifyOtp(mobile, fullOtp);
      setOtpVerified(true);
    } catch (e) {
      setOtpVerified(false);
      setError(err(e));
    } finally {
      setIsOtpBusy(false);
    }
  };

  // ── UPDATE PASSWORD ───────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!otpVerified) {
      setError("Verify your OTP first");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await resetPassword({ phone: mobile, otp: otp.join(""), newPassword: password });
      setSuccess("Password updated — redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setError(err(e));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ── EMAIL MODE ────────────────────────────────────────────────────────
  // Same handler for the initial "Verify" click and the "Resend" link below
  // it — both just (re)send the reset-link email. Kept as one persistent
  // form (not swapped for a separate "check your inbox" screen) to match
  // the mockup, which shows the Resend line alongside the form itself.
  const handleSendEmailReset = async () => {
    setError(null);
    setSuccess(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    try {
      setIsSendingEmail(true);
      await forgotPassword(email);
      setEmailSent(true);
      setSuccess("Reset link sent — check your inbox.");
    } catch (e) {
      setError(err(e));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const switchMode = (next: "mobile" | "email") => {
    setMode(next);
    setError(null);
    setSuccess(null);
  };

  return {
    mode,
    setMode: switchMode,

    // mobile + OTP
    mobile,
    setMobile,
    otp,
    setOtp,
    otpSent,
    otpVerified,
    resendTimer,

    // password
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,

    // email
    email,
    setEmail,
    emailSent,

    isOtpBusy,
    isUpdatingPassword,
    isSendingEmail,
    error,
    success,

    handleSendOtp,
    handleResendOtp,
    handleVerifyOtp,
    handleUpdatePassword,
    handleSendEmailReset,
  };
}
