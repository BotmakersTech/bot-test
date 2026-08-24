import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../app/store";
import { AppRole, hasRole } from "../../../../shared/constants/roles";
import {
  applyToVolunteer,
  getMyVolunteerApplication,
  type VolunteerApplication,
} from "../../api/volunteerApplication.api";

const SHIFTS = [
  { value: "", label: "No preference" },
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
  { value: "FULL_DAY", label: "Full day" },
];

interface VolunteerCTAProps {
  eventId: string;
  eventName: string;
  volunteersNeeded?: boolean;
}

export default function VolunteerCTA({ eventId, eventName, volunteersNeeded }: VolunteerCTAProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  const isVolunteerEligible = hasRole(userRoles, [AppRole.VOLUNTEER]);

  const [application, setApplication] = useState<VolunteerApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [shift, setShift] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // loaded only gates the branches below where isAuthenticated &&
    // isVolunteerEligible — those render paths return before consulting it
    // otherwise, so skipping the fetch here needs no setState at all.
    if (!volunteersNeeded || !isAuthenticated || !isVolunteerEligible) return;
    getMyVolunteerApplication(eventId)
      .then(setApplication)
      .finally(() => setLoaded(true));
  }, [eventId, volunteersNeeded, isAuthenticated, isVolunteerEligible]);

  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setShowForm(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showForm]);

  if (!volunteersNeeded) return null;

  const handleApply = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await applyToVolunteer(eventId, { shift: shift || undefined, notes: notes || undefined });
      setApplication(result);
      setShowForm(false);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to submit application";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="volunteer-cta">
      <div className="volunteer-cta-inner">
        <div className="volunteer-cta-text">
          <h3>Volunteers Needed</h3>
          <p>{renderMessage()}</p>
        </div>
        {renderAction()}
      </div>

      {showForm && (
        <div className="volunteer-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="volunteer-modal" role="dialog" aria-modal="true" aria-labelledby="volunteer-modal-title">
            <h4 id="volunteer-modal-title">Apply to volunteer</h4>
            <p className="volunteer-modal-sub">{eventName}</p>

            <label className="volunteer-field">
              <span>Shift preference</span>
              <select value={shift} onChange={(e) => setShift(e.target.value)}>
                {SHIFTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label className="volunteer-field">
              <span>Notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Anything the organiser should know…" />
            </label>

            {error && <div className="volunteer-modal-error">{error}</div>}

            <div className="volunteer-modal-actions">
              <button type="button" className="volunteer-modal-cancel" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="volunteer-modal-submit" onClick={handleApply} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  function renderMessage() {
    if (!isAuthenticated) {
      return "This event is looking for volunteers. Sign in with a Volunteer account to apply.";
    }
    if (!isVolunteerEligible) {
      return "This event is looking for volunteers. Only accounts registered as a Volunteer can apply.";
    }
    if (!loaded) return "Checking your application status…";
    if (!application) return "Help make this event happen — apply to volunteer today.";
    if (application.status === "PENDING") return "Your application is submitted and waiting for organiser review.";
    if (application.status === "APPROVED") return "You're confirmed as a volunteer for this event. Check your volunteer dashboard for your duty station and shift.";
    return "Your previous application wasn't approved, but you're welcome to apply again.";
  }

  function renderAction() {
    if (!isAuthenticated) {
      return (
        <button type="button" className="volunteer-cta-btn" onClick={() => navigate("/login")}>
          Sign In to Apply
        </button>
      );
    }
    if (!isVolunteerEligible || !loaded) return null;
    if (application?.status === "PENDING") {
      return <span className="volunteer-status-pill pending">Pending Review</span>;
    }
    if (application?.status === "APPROVED") {
      return <span className="volunteer-status-pill approved">Confirmed</span>;
    }
    return (
      <button type="button" className="volunteer-cta-btn" onClick={() => setShowForm(true)}>
        {application?.status === "REJECTED" ? "Apply Again" : "Apply for Volunteer"}
      </button>
    );
  }
}
