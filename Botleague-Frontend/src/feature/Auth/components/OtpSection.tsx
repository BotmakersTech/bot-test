import { useRef } from "react";

const OTP_LENGTH = 4;

interface OtpSectionProps {
  mobile: string;
  setMobile: (value: string) => void;
  otp: string[];
  setOtp: (value: string[]) => void;
  otpSent: boolean;
  otpVerified: boolean;
  resendTimer: number;
  isLoading: boolean;

  onSendOtp: () => void;
  onResendOtp: () => void;
  onVerifyOtp: () => void;
}

export default function OtpSection({
  mobile,
  setMobile,
  otp,
  setOtp,
  otpSent,
  otpVerified,
  resendTimer,
  isLoading,
  onSendOtp,
  onResendOtp,
  onVerifyOtp,
}: OtpSectionProps) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    if (!digits.length) return;

    const newOtp = Array(OTP_LENGTH)
      .fill("")
      .map((_, i) => digits[i] ?? "");

    setOtp(newOtp);

    otpRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div
      className="flex flex-col w-full"
      style={{ gap: "clamp(6px, 1.5dvh, 16px)" }}
    >
      {/* ---------- ROW 1 ---------- */}
      <div className="cna-form-row">
        <div className="cna-row-left">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            disabled={otpVerified}
            className="cna-register-field-input disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div className="cna-row-right">
          <button
            type="button"
            onClick={otpSent ? onResendOtp : onSendOtp}
            disabled={isLoading || otpVerified || (otpSent && resendTimer > 0)}
            className="cna-register-row-btn"
          >
            {otpSent && resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : otpSent
              ? "Resend OTP"
              : "Get OTP"}
          </button>
        </div>
      </div>

      {/* ---------- ROW 2 ---------- */}
      <div className="cna-form-row">
        <div className="cna-row-left">
          <div className="cna-otp-group">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                onPaste={handleOtpPaste}
                onFocus={(e) => e.target.select()}
                disabled={!otpSent || otpVerified}
                className="cna-register-otp-box disabled:opacity-60 disabled:cursor-not-allowed"
              />
            ))}
          </div>
        </div>

        <div className="cna-row-right">
          <button
            type="button"
            onClick={onVerifyOtp}
            disabled={isLoading || !otpSent || otpVerified}
            className="cna-register-row-btn"
          >
            {otpVerified ? "Verified ✔" : "Verify"}
          </button>
        </div>
      </div>

      {/* ---------- RESEND TIMER (Always reserves space) ---------- */}
      <div
        className="flex items-center"
        style={{
          minHeight: "clamp(18px, 2.2dvh, 24px)",
        }}
      >
        <span
          className="text-[#8C6CFF] text-[12px] md:text-[14px] lg:text-[16px] xl:text-[18px] font-semibold transition-opacity duration-300"
          style={{
            visibility: otpSent && resendTimer > 0 ? "visible" : "hidden",
            opacity: otpSent && resendTimer > 0 ? 1 : 0,
          }}
        >
          Resend in 0:{String(resendTimer).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}