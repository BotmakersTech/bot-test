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

  // Backspace on an empty box jumps to the previous one
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

  // Pasting "1234" fills all boxes at once
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
    <div>
      {/* ---------- MOBILE + GET OTP ---------- */}
      <div className="flex items-stretch gap-3 md:gap-4">
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="Mobile No"
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          disabled={otpVerified}
          className="w-full font-inter text-[14px] md:text-[16px] text-[#5c5c5c]
            placeholder:text-[#999797] bg-[#bdbdbd2b] rounded-xl
            border border-[#BDBDBD] px-4 py-3 md:px-5 md:py-4
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] focus:shadow-none
            focus:outline-none focus:border-[#BDBDBD]
            transition-shadow duration-150 ease-in
            disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={otpSent ? onResendOtp : onSendOtp}
          disabled={isLoading || otpVerified || (otpSent && resendTimer > 0)}
          className="shrink-0 whitespace-nowrap font-poppins font-semibold tracking-wide
            text-white text-[14px] md:text-[16px]
            bg-gradient-to-b from-[#3B82F6] to-[#8B7CF6]
            rounded-xl px-4 py-3 md:px-6 md:py-4
            cursor-pointer transition-transform duration-150 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {otpSent && resendTimer > 0
            ? `Resend in ${resendTimer}s`
            : otpSent
            ? "Resend OTP"
            : "Get OTP"}
        </button>
      </div>

      {/* ---------- OTP BOXES ---------- */}
      <div className="flex justify-center items-center gap-5 md:gap-8 mt-6 mb-4 md:mt-8 md:mb-5">
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
            className="w-11 h-11 md:w-14 md:h-14 text-center font-inter
              text-[16px] md:text-[18px] text-[#5c5c5c]
              bg-[#bdbdbd2b] rounded-lg border border-[#BDBDBD]
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] focus:shadow-none
              focus:outline-none focus:border-[#BDBDBD]
              transition-shadow duration-150 ease-in
              disabled:opacity-60 disabled:cursor-not-allowed"
          />
        ))}
      </div>

      {/* ---------- RESEND TIMER + VERIFY ---------- */}
      <div className="flex justify-between items-center px-1 md:px-4 pb-2 md:pb-4">
        <span className="text-[#8C6CFF] text-[12px] md:text-[14px] font-inter font-medium">
          {otpSent && resendTimer > 0
            ? `Resend in 0:${String(resendTimer).padStart(2, "0")}`
            : ""}
        </span>

        <button
          type="button"
          onClick={onVerifyOtp}
          disabled={isLoading || !otpSent || otpVerified}
          className="text-[13px] md:text-[15px] font-semibold font-inter text-black
            cursor-pointer pr-1 md:pr-4
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {otpVerified ? "Verified ✔" : "Verify"}
        </button>
      </div>
    </div>
  );
}