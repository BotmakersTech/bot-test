// PhoneEditField.tsx
// Flow: [Display + Edit btn] → [New phone input + Send OTP] → [Enter OTP + Confirm] → [Done]
//
// Mirrors the backend's OTP-based change-phone contract:
//   POST /api/auth/send-otp      { phone }              -- send a code to the NEW number
//   POST /api/profile/change-phone { newPhone, otp }     -- confirm the change

import { useState } from "react";

type PhoneStep = "display" | "enterPhone" | "otpSent";

interface Props {
  currentPhone: string;
  onPhoneUpdated: (newPhone: string) => void;
  /** Send an OTP to the new phone number. Resolve true = sent, false = error */
  onSendOtp: (phone: string) => Promise<boolean>;
  /** Verify the OTP and confirm the phone change. Resolve true = success, false = error */
  onConfirmChange: (phone: string, otp: string) => Promise<boolean>;
}

export default function PhoneEditField({
  currentPhone,
  onPhoneUpdated,
  onSendOtp,
  onConfirmChange,
}: Props) {
  const [step, setStep] = useState<PhoneStep>("display");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const isValidPhone = (v: string) => /^[0-9]{10}$/.test(v);
  const isValidOtp = (v: string) => /^[0-9]{4}$/.test(v);

  const handleSendOtp = async () => {
    setError("");
    if (!isValidPhone(newPhone)) { setError("Enter a valid 10-digit phone number."); return; }
    setIsLoading(true);
    const sent = await onSendOtp(newPhone);
    setIsLoading(false);
    if (sent) {
      setStep("otpSent");
      setOtp("");
      setResent(false);
    } else {
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    setIsLoading(true);
    const sent = await onSendOtp(newPhone);
    setIsLoading(false);
    if (sent) setResent(true);
    else setError("Failed to resend OTP. Please try again.");
  };

  const handleConfirm = async () => {
    setError("");
    if (!isValidOtp(otp)) { setError("Enter the 4-digit OTP."); return; }
    setIsLoading(true);
    const confirmed = await onConfirmChange(newPhone, otp);
    setIsLoading(false);
    if (confirmed) {
      onPhoneUpdated(newPhone);
      setStep("display");
      setNewPhone("");
      setOtp("");
      setError("");
    } else {
      setError("Invalid or expired OTP. Please try again.");
    }
  };

  const handleCancel = () => {
    setStep("display");
    setNewPhone("");
    setOtp("");
    setError("");
    setResent(false);
  };

  // ─── Display ────────────────────────────────────────────────────
  if (step === "display") {
    return (
      <div className="pef-row">
        <div className="pef-value-wrap">
          <span className="pef-field-label">PHONE NUMBER</span>
          <span className="pef-value">{currentPhone || "Not set"}</span>
        </div>
        <button
          className="pef-edit-btn"
          onClick={() => { setStep("enterPhone"); setError(""); }}
        >
          Edit
        </button>
      </div>
    );
  }

  // ─── Enter new phone ────────────────────────────────────────────
  if (step === "enterPhone") {
    return (
      <div className="pef-column">
        <span className="pef-field-label">PHONE NUMBER</span>
        <div className="pef-input-row">
          <input
            className="pef-input"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter new 10-digit phone number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            autoFocus
          />
          <button className="pef-send-btn" onClick={handleSendOtp} disabled={isLoading}>
            {isLoading ? "Sending…" : "Send OTP"}
          </button>
          <button className="pef-cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
        {error && <p className="pef-error">{error}</p>}
      </div>
    );
  }

  // ─── OTP sent — awaiting confirmation ───────────────────────────
  return (
    <div className="pef-column">
      <span className="pef-field-label">PHONE NUMBER</span>
      <div className="pef-sent-banner">
        <span className="pef-sent-icon" aria-hidden="true">✆</span>
        <div className="pef-sent-text">
          <strong>OTP sent</strong>
          <span>Enter the code sent to <em>{newPhone}</em> to confirm.</span>
        </div>
      </div>
      <div className="pef-input-row">
        <input
          className="pef-input pef-otp-input"
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="4-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
        />
        <button className="pef-done-btn" onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? "Confirming…" : "Confirm"}
        </button>
      </div>
      {error && <p className="pef-error">{error}</p>}
      {resent && <p className="pef-success">OTP resent successfully!</p>}
      <div className="pef-action-row">
        <button className="pef-resend-btn" onClick={handleResend} disabled={isLoading}>
          {isLoading ? "Sending…" : "Resend OTP"}
        </button>
        <button className="pef-cancel-btn" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}
