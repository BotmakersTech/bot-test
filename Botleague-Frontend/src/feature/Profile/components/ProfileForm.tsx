interface Props {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  pendingEmailInput: string;
  setPendingEmailInput: (v: string) => void;
  saveEmail: () => Promise<void>;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  onSave: () => void;
  isLoading: boolean;
  saveSuccess?: boolean;
  errors: {
    global?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  };
}

function splitFullName(value: string) {
  const parts = value.trimStart().split(/\s+/);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" "),
  };
}

function OtpBoxes() {
  return (
    <div className="profile-otp-boxes" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function ProfileForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  email,
  pendingEmailInput,
  setPendingEmailInput,
  saveEmail,
  dateOfBirth,
  setDateOfBirth,
  address,
  setAddress,
  onSave,
  isLoading,
  saveSuccess = false,
  errors,
}: Props) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const emailValue = pendingEmailInput || email;

  const handleFullNameChange = (value: string) => {
    const next = splitFullName(value);
    setFirstName(next.first);
    setLastName(next.last);
  };

  return (
    <>
      <section className="profile-form-card">
        <div className="profile-form-grid">
          <div className="profile-field">
            <label>FULL NAME</label>
            <input
              type="text"
              className="profile-input"
              value={fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="Enter full name"
            />
            {(errors.firstName || errors.lastName) && (
              <p className="profile-error">{errors.firstName || errors.lastName}</p>
            )}
          </div>

          <div className="profile-field">
            <label>DATE OF BIRTH</label>
            <input
              type="date"
              className="profile-input"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.dateOfBirth && <p className="profile-error">{errors.dateOfBirth}</p>}
          </div>

          <div className="profile-field profile-contact-field">
            <label>CONTACT NUMBER</label>
            <div className="profile-input-action">
              <input
                type="tel"
                className="profile-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 -"
              />
              <button type="button">Get OTP</button>
            </div>
            {errors.phone && <p className="profile-error">{errors.phone}</p>}
          </div>

          <div className="profile-verify-cell">
            <OtpBoxes />
            <div className="profile-verify-stack">
              <button type="button">Verify OTP</button>
              <span>00:20</span>
            </div>
          </div>

          <div className="profile-field profile-contact-field">
            <label>EMAIL ADDRESS</label>
            <div className="profile-input-action">
              <input
                type="email"
                className="profile-input"
                value={emailValue}
                onChange={(e) => setPendingEmailInput(e.target.value)}
                placeholder="Enter email address"
              />
              <button type="button" onClick={() => void saveEmail()}>
                Get OTP
              </button>
            </div>
            {errors.email && <p className="profile-error">{errors.email}</p>}
          </div>

          <div className="profile-verify-cell">
            <OtpBoxes />
            <div className="profile-verify-stack">
              <button type="button">Verify OTP</button>
              <span>00:20</span>
            </div>
          </div>

          <div className="profile-field profile-address-field">
            <label>ADDRESS</label>
            <textarea
              className="profile-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full address"
              rows={4}
            />
            {errors.address && <p className="profile-error">{errors.address}</p>}
          </div>

          {errors.global && <p className="profile-error profile-global-error">{errors.global}</p>}
        </div>
      </section>

      <div className="profile-save-row">
        <button type="button" className="profile-save-btn" onClick={onSave} disabled={isLoading}>
          {isLoading ? "SAVING..." : saveSuccess ? "SAVED!" : "SAVE CHANGES"}
        </button>
      </div>
    </>
  );
}
