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
  onResendOtp: () => void; // ✅ added
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

  return (
    <>
      {/* MOBILE + OTP BUTTON */}
      <div className="cna-row">
        <input
          type="tel"
          className="cna-input cna-input--flex"
          placeholder="Mobile No"
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          disabled={otpVerified}
        />

        <button
          type="button"
          className="cna-btn cna-btn--light"
          onClick={otpSent ? onResendOtp : onSendOtp}
          disabled={isLoading || otpVerified || (otpSent && resendTimer > 0)}
        >
          {otpSent && resendTimer > 0
            ? `Resend in ${resendTimer}s`
            : otpSent
            ? "Resend OTP"
            : "Get OTP"}
        </button>
      </div>

      {/* OTP INPUTS */}
      <div className="cna-otp-group">
        <div className="cna-otp-boxes">
          {otp.map((digit: string, index: number) => (
            <input
              key={index}
              ref={(el) => {
                otpRefs.current[index] = el;
              }}
              className="cna-otp-box"
              value={digit}
              maxLength={1}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              disabled={!otpSent || otpVerified}
              inputMode="numeric"
              autoComplete="off"
            />
          ))}
        </div>

        <div className="cna-otp-actions">
          <button
            type="button"
            className="cna-btn cna-btn--light"
            onClick={onVerifyOtp}
            disabled={isLoading || !otpSent || otpVerified}
          >
            {otpVerified ? "Verified ✔" : "Verify"}
          </button>
        </div>
      </div>
    </>
  );
}