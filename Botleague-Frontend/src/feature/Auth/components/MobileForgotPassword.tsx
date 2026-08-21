import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import LOGO_URL from "../../../assets/BrandLogo/BotLeagu-black.png";
import PasswordSection from "./PasswordSection";
import type useForgotPassword from "../hooks/useForgotPassword";
import "../../../styles/forgotPasswordMobile.css";

const OTP_LENGTH = 4;

// Mobile web view of /forgot-password, matching the pasted reference
// screenshot: mobile number + OTP + new password all on one continuous
// screen (gated by `disabled`, not by hiding sections) rather than the
// desktop AuthCard's step-swapping layout. Desktop keeps the existing
// AuthLayout/AuthCard rendering — this is swapped in purely via the
// view-mobile-only/view-desktop-only CSS toggle (see responsiveView.css) so
// both share the same useForgotPassword() state/handlers instead of a
// second copy of the flow's logic.
export default function MobileForgotPassword(fp: ReturnType<typeof useForgotPassword>) {
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...fp.otp];
    next[index] = value;
    fp.setOtp(next);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !fp.otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    if (!digits.length) return;
    fp.setOtp(Array(OTP_LENGTH).fill("").map((_, i) => digits[i] ?? ""));
    otpRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div className="fpw-mobile">
      <button type="button" className="fpw-back" aria-label="Go back" onClick={() => navigate(-1)}>
        <ArrowLeft size={19} />
      </button>

      <img className="fpw-logo" src={LOGO_URL} alt="BotLeague" />

      <h1 className="fpw-heading">
        Forget <span>Password</span>
      </h1>

      <div className="fpw-toggle">
        <button
          type="button"
          className={fp.mode === "mobile" ? "active" : ""}
          onClick={() => fp.setMode("mobile")}
        >
          Mobile Number
        </button>
        <button
          type="button"
          className={fp.mode === "email" ? "active" : ""}
          onClick={() => fp.setMode("email")}
        >
          Mail ID
        </button>
      </div>

      {fp.mode === "email" ? (
        <div className="fpw-body">
          <div className="fpw-field">
            <label>Email</label>
            <div className="fpw-input-box">
              <input
                type="email"
                autoComplete="email"
                placeholder="Example@email.com"
                value={fp.email}
                onChange={(e) => fp.setEmail(e.target.value)}
              />
            </div>
          </div>

          <p className="fpw-hint">
            Enter your email for the verification process, we will send reset your password link
            to your email.
          </p>

          {fp.error && <p className="fpw-error">{fp.error}</p>}
          {fp.success && <p className="fpw-success">{fp.success}</p>}

          <button
            type="button"
            className="fpw-primary-btn"
            onClick={fp.handleSendEmailReset}
            disabled={fp.isSendingEmail}
          >
            {fp.isSendingEmail ? "Sending…" : "Verify"}
          </button>

          <p className="fpw-resend">
            If you didn't receive any mail!{" "}
            <button type="button" onClick={fp.handleSendEmailReset} disabled={fp.isSendingEmail}>
              Resend
            </button>
          </p>
        </div>
      ) : (
        <div className="fpw-body">
          {/* MOBILE NUMBER — single pill: input + arrow send/resend button */}
          <div className="fpw-field">
            <label>Mobile number</label>
            <div className="fpw-pill-row">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Enter registered mobile number here"
                value={fp.mobile}
                onChange={(e) => fp.setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={fp.otpVerified}
              />
              <button
                type="button"
                className="fpw-arrow-btn"
                aria-label={fp.otpSent ? "Resend OTP" : "Send OTP"}
                onClick={fp.otpSent ? fp.handleResendOtp : fp.handleSendOtp}
                disabled={fp.isOtpBusy || fp.otpVerified || (fp.otpSent && fp.resendTimer > 0)}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* OTP — 4 boxes + Verify, one row */}
          <div className="fpw-field">
            <div className="fpw-otp-row">
              {fp.otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  className="fpw-otp-box"
                  value={digit}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  onPaste={handleOtpPaste}
                  onFocus={(e) => e.target.select()}
                  disabled={!fp.otpSent || fp.otpVerified}
                />
              ))}
              <button
                type="button"
                className="fpw-verify-btn"
                onClick={fp.handleVerifyOtp}
                disabled={fp.isOtpBusy || !fp.otpSent || fp.otpVerified}
              >
                {fp.otpVerified ? "Verified ✔" : "Verify"}
              </button>
            </div>

            <div className="fpw-otp-footer">
              <span>Enter your 4 digits OTP that you received on your number.</span>
              {fp.otpSent && fp.resendTimer > 0 && (
                <span className="fpw-resend-timer">Resend in 0:{String(fp.resendTimer).padStart(2, "0")}</span>
              )}
            </div>
          </div>

          <p className="fpw-hint">
            Set the new password for your account so you can login and access all features.
          </p>

          <PasswordSection
            password={fp.password}
            setPassword={fp.setPassword}
            confirmPassword={fp.confirmPassword}
            setConfirmPassword={fp.setConfirmPassword}
            disabled={!fp.otpVerified}
            labels={{ password: "Enter new password", confirm: "Confirm password" }}
            hideHint
          />

          {fp.error && <p className="fpw-error">{fp.error}</p>}
          {fp.success && <p className="fpw-success">{fp.success}</p>}

          <button
            type="button"
            className="fpw-primary-btn"
            onClick={fp.handleUpdatePassword}
            disabled={fp.isUpdatingPassword || !fp.otpVerified}
          >
            {fp.isUpdatingPassword ? "Updating…" : "Update password"}
          </button>
        </div>
      )}
    </div>
  );
}
