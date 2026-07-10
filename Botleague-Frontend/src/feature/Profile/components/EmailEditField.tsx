// EmailEditField.tsx
// Flow: [Display + Edit btn] → [New email input + Send Link] → [Check inbox banner] → [Done / auto-verified]

import { useState } from "react";

type EmailStep = "display" | "enterEmail" | "linkSent";

interface Props {
  currentEmail: string;
  onEmailUpdated: (newEmail: string) => void;
  /** Send verification link to the new email. Resolve true = sent, false = error */
  onSendVerificationLink: (email: string) => Promise<boolean>;
  /**
   * Optional: poll / listen for verification status.
   * Parent can call onEmailUpdated directly when the backend confirms the change.
   */
}

export default function EmailEditField({
  currentEmail,
  onEmailUpdated,
  onSendVerificationLink,
}: Props) {
  const [step, setStep] = useState<EmailStep>("display");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSendLink = async () => {
    setError("");
    if (!isValidEmail(newEmail)) { setError("Enter a valid email address."); return; }
    setIsLoading(true);
    const sent = await onSendVerificationLink(newEmail.trim());
    setIsLoading(false);
    if (sent) {
      setStep("linkSent");
      setResent(false);
    } else {
      setError("Failed to send link. Please try again.");
    }
  };

  const handleResend = async () => {
    setError("");
    setIsLoading(true);
    const sent = await onSendVerificationLink(newEmail.trim());
    setIsLoading(false);
    if (sent) setResent(true);
    else setError("Failed to resend. Please try again.");
  };

  const handleCancel = () => {
    setStep("display");
    setNewEmail("");
    setError("");
    setResent(false);
  };

  /** Called when the user confirms they've clicked the link (or parent triggers it) */
  const handleDone = () => {
    onEmailUpdated(newEmail.trim());
    setStep("display");
    setNewEmail("");
    setError("");
  };

  // ─── Display ────────────────────────────────────────────────────
  if (step === "display") {
    return (
      <div className="eef-row">
        <div className="eef-value-wrap">
          <span className="eef-field-label">EMAIL ADDRESS</span>
          <span className="eef-value">{currentEmail || "Not set"}</span>
        </div>
        <button
          className="eef-edit-btn"
          onClick={() => { setStep("enterEmail"); setError(""); }}
        >
          Edit
        </button>
      </div>
    );
  }

  // ─── Enter new email ────────────────────────────────────────────
  if (step === "enterEmail") {
    return (
      <div className="eef-column">
        <span className="eef-field-label">EMAIL ADDRESS</span>
        <div className="eef-input-row">
          <input
            className="eef-input"
            type="email"
            placeholder="Enter new email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
            autoFocus
          />
          <button className="eef-send-btn" onClick={handleSendLink} disabled={isLoading}>
            {isLoading ? "Sending…" : "Send Link"}
          </button>
          <button className="eef-cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
        {error && <p className="eef-error">{error}</p>}
      </div>
    );
  }

  // ─── Link sent — awaiting verification ─────────────────────────
  return (
    <div className="eef-column">
      <span className="eef-field-label">EMAIL ADDRESS</span>
      <div className="eef-sent-banner">
        <span className="eef-sent-icon" aria-hidden="true">✉</span>
        <div className="eef-sent-text">
          <strong>Verification link sent</strong>
          <span>Check your inbox at <em>{newEmail}</em> and click the link to confirm.</span>
        </div>
      </div>
      {error && <p className="eef-error">{error}</p>}
      {resent && <p className="eef-success">Link resent successfully!</p>}
      <div className="eef-action-row">
        <button className="eef-resend-btn" onClick={handleResend} disabled={isLoading}>
          {isLoading ? "Sending…" : "Resend link"}
        </button>
        <button className="eef-done-btn" onClick={handleDone}>
          Done — I've verified
        </button>
        <button className="eef-cancel-btn" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}
