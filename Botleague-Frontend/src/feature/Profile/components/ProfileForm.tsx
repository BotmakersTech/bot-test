// ProfileForm.tsx
import { COUNTRIES, getStatesForCountry, getCitiesForState } from "../../../shared/data/locationData"

interface Props {
  firstName: string;
  setFirstName: (v: string) => void;

  lastName: string;
  setLastName: (v: string) => void;

  teamName: string;

  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;

  city: string;
  setCity: (v: string) => void;

  state: string;
  setState: (v: string) => void;

  country: string;
  setCountry: (v: string) => void;

  address: string;
  setAddress: (v: string) => void;

  onSave: () => void;
  isLoading: boolean;
  saveSuccess?: boolean;

  errors: {
    global?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    country?: string;
    dateOfBirth?: string;
    address?: string;
  };
  clearError: (field?: any) => void;
}

export default function ProfileForm({
  firstName, setFirstName,
  lastName, setLastName,
  teamName,
  dateOfBirth, setDateOfBirth,
  city, setCity,
  state, setState,
  country, setCountry,
  address, setAddress,
  onSave,
  isLoading,
  saveSuccess = false,
  errors,
}: Props) {

  return (
    <>
      <div className="profile-container">

        {/* Basic Info */}
        <section className="form-section">
          <h3 className="section-label">Basic Info</h3>
          <div className="input-row">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                type="text"
                placeholder="First Name"
                className="profile-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && (
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#f87171" }}>{errors.firstName}</p>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <input
                type="text"
                placeholder="Last Name"
                className="profile-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && (
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#f87171" }}>{errors.lastName}</p>
              )}
            </div>
          </div>
          <div className="section-divider" />
        </section>

        {/* Team Info */}
        <section className="form-section">
          <h3 className="section-label">Team Info</h3>
          <input
            type="text"
            className="profile-input profile-input--full"
            value={teamName || "No team joined yet"}
            disabled
          />
          <div className="section-divider" />
        </section>

        {/* Date of Birth */}
        <section className="form-section">
          <h3 className="section-label">Date of Birth</h3>
          <div className="date-wrapper">
            <input
              type="date"
              className="profile-input profile-input--full profile-input--date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              style={{ colorScheme: "dark" }}
            />
            {errors.dateOfBirth && (
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#f87171" }}>{errors.dateOfBirth}</p>
            )}
          </div>
          <div className="section-divider" />
        </section>

        {/* Address */}
        <section className="form-section">
          <h3 className="section-label">Address</h3>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            {/* Country */}
            <select
              className="profile-input"
              value={country}
              onChange={e => { setCountry(e.target.value); setState(""); setCity("") }}
              style={{ flex: "1 1 120px", margin: 0 }}
            >
              <option value="">Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* State */}
            {getStatesForCountry(country).length > 0 ? (
              <select
                className="profile-input"
                value={state}
                onChange={e => { setState(e.target.value); setCity("") }}
                style={{ flex: "1 1 120px", margin: 0 }}
              >
                <option value="">State</option>
                {getStatesForCountry(country).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="State / Province"
                className="profile-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{ flex: "1 1 120px", margin: 0 }}
              />
            )}
            {/* City */}
            {getCitiesForState(country, state).length > 0 ? (
              <select
                className="profile-input"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ flex: "1 1 120px", margin: 0 }}
              >
                <option value="">City</option>
                {getCitiesForState(country, state).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="City"
                className="profile-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ flex: "1 1 120px", margin: 0 }}
              />
            )}
          </div>
          <textarea
            placeholder="Street Address"
            className="profile-textarea"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        {/* Global Error */}
        {errors.global && (
          <p style={{
            margin: 0,
            padding: "10px 14px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "8px",
            fontSize: "0.8rem",
            color: "#f87171",
          }}>
            {errors.global}
          </p>
        )}

      </div>

      {/* Save Button */}
      <div className="save-row">
        <button
          className={`save-btn${saveSuccess ? " save-btn--saved" : ""}`}
          onClick={onSave}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : saveSuccess ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>
    </>
  );
}