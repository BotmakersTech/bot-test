import { useRef } from "react";

const OTP_LENGTH = 4;

interface Props {
  otp: string[];
  setOtp: (otp: string[]) => void;

  password: string;
  setPassword: (val: string) => void;

  confirmPassword: string;
  setConfirmPassword: (val: string) => void;

  isLoading: boolean;

  onSubmit: (e: React.FormEvent) => void;
}

export default function ResetPasswordForm({
  otp,
  setOtp,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  onSubmit,
}: Props) {
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

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });

    setOtp(newOtp);

    const focusIndex =
      pasted.length === OTP_LENGTH ? OTP_LENGTH - 1 : pasted.length;

    otpRefs.current[focusIndex]?.focus();
  };

  return (
    <form className="cna-form" onSubmit={onSubmit}>

      {/* OTP */}
      <div className="cna-otp-group">
        <p className="cna-otp-label">Enter OTP</p>

        <div className="cna-otp-boxes" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) =>
                handleOtpChange(e.target.value, index)
              }
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => { otpRefs.current[index] = el; }}
              className="cna-otp-box"
              inputMode="numeric"
            />
          ))}
        </div>
      </div>

      {/* PASSWORD */}
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="cna-input"
      />

      {/* CONFIRM PASSWORD */}
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="cna-input"
      />

      {/* SUBMIT */}
      <button
        type="submit"
        className="cna-btn cna-btn--light cna-btn--full"
        disabled={isLoading}
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </button>

    </form>
  );
}