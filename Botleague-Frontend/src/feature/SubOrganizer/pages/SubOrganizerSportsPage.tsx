import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySports, type OrganizerSport } from "../../Organizer/api/organizer.api";

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
      <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold text-red-500">My Sports</h1>

      {sports.length === 0 ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">
          No sports have been assigned to you yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((s) => (
            <div
              key={s.id}
              className="cursor-pointer rounded-xl bg-white/4 p-5 ring-1 ring-white/8 hover:ring-red-500/40 transition-all"
              onClick={() => navigate(`/admin/events/${s.eventId}/sports/${s.id}`)}
            >
              <h2 className="font-semibold text-white">{s.sport}</h2>
              {s.ageGroup && (
                <p className="mt-1 text-xs text-neutral-400">Age group: {s.ageGroup}</p>
              )}
              {s.weightClass && (
                <p className="mt-0.5 text-xs text-neutral-400">Weight: {s.weightClass}</p>
              )}
              <div className="mt-3">
                <span className={[
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  s.status === "REGISTRATION_OPEN" ? "bg-green-500/10 text-green-400" :
                  s.status === "COMPLETED" ? "bg-neutral-500/10 text-neutral-400" :
                  "bg-blue-500/10 text-blue-400",
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
