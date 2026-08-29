import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySports, type OrganizerSport } from "../../Organizer/api/organizer.api";
import { formatWeightClass } from "../../Robots/constants/weightClasses";
import "../../../styles/organizerTheme.css";

export default function SubOrganizerSportsPage() {
  const [sports, setSports] = useState<OrganizerSport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMySports()
      .then(setSports)
      .catch(() => setError("Failed to load your sports."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">Loading…</div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="org-page-bg p-8">
      <h1 className="font-display mb-6 text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">My Sports</h1>

      {sports.length === 0 ? (
        <div className="rounded-xl bg-white border p-8 text-center text-gray-400" style={{ borderColor: "rgba(75,134,232,0.2)" }}>
          No sports have been assigned to you yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((s) => (
            <div
              key={s.id}
              className="cursor-pointer rounded-xl bg-white p-5 border shadow-sm hover:shadow-md hover:border-[#4b86e8] transition-all"
              style={{ borderColor: "rgba(75,134,232,0.2)" }}
              onClick={() => navigate(`/admin/events/${s.eventId}/sports/${s.id}`)}
            >
              <h2 className="font-semibold text-[#374151]">{s.sport}</h2>
              {s.ageGroup && (
                <p className="mt-1 text-xs text-gray-400">Age group: {s.ageGroup}</p>
              )}
              {s.weightClass && (
                <p className="mt-0.5 text-xs text-gray-400">Weight: {formatWeightClass(s.weightClass)}</p>
              )}
              <div className="mt-3">
                <span className={[
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  s.status === "REGISTRATION_OPEN" ? "bg-green-50 text-green-600" :
                  s.status === "COMPLETED" ? "bg-gray-100 text-gray-500" :
                  "bg-blue-50 text-blue-600",
                ].join(" ")}>
                  {s.status?.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
