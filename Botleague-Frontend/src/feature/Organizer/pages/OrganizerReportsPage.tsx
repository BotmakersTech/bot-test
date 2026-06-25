import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getMatchesForSport,
  getRegistrationsForSport,
  type OrganizerEvent,
  type OrganizerMatch,
  type OrganizerTeamRegistration,
} from "../api/organizer.api";

interface SportReport {
  sportId: string;
  sportName: string;
  totalTeams: number;
  completedMatches: number;
  totalMatches: number;
  teams: OrganizerTeamRegistration[];
  matches: OrganizerMatch[];
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/4 p-4 ring-1 ring-white/8 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export default function OrganizerReportsPage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents]           = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");
  const [reports, setReports]         = useState<SportReport[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    getMyEvents()
      .then(e => {
        setEvents(e);
        if (!preselectedEventId && e.length > 0) setSelectedEventId(e[0].id);
      })
      .finally(() => setEventsLoading(false));
  }, [preselectedEventId]);

  useEffect(() => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event?.sports?.length) { setReports([]); return; }

    setLoading(true);
    Promise.all(
      event.sports.map(async s => {
        const [teams, matches] = await Promise.all([
          getRegistrationsForSport(s.id).catch(() => [] as OrganizerTeamRegistration[]),
          getMatchesForSport(s.id).catch(() => [] as OrganizerMatch[]),
        ]);
        return {
          sportId: s.id,
          sportName: s.sport.replace(/_/g, " "),
          totalTeams: teams.length,
          completedMatches: matches.filter(m => m.status === "COMPLETED").length,
          totalMatches: matches.length,
          teams,
          matches,
        } satisfies SportReport;
      })
    )
      .then(setReports)
      .finally(() => setLoading(false));
  }, [selectedEventId, events]);

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  const event = events.find(e => e.id === selectedEventId);
  const totalTeams    = reports.reduce((n, r) => n + r.totalTeams, 0);
  const totalMatches  = reports.reduce((n, r) => n + r.totalMatches, 0);
  const totalComplete = reports.reduce((n, r) => n + r.completedMatches, 0);

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold text-red-500">Event Reports</h1>

      {/* Event selector */}
      <div className="mb-6">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-neutral-400">Building report…</div>
      ) : !selectedEventId ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">Select an event to generate a report.</div>
      ) : (
        <>
          {/* Event summary */}
          {event && (
            <div className="mb-6 rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
              <h2 className="mb-4 text-base font-semibold text-white">{event.eventName} — Summary</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Sports"          value={reports.length} />
                <StatCard label="Registered Teams" value={totalTeams} />
                <StatCard label="Total Matches"    value={totalMatches} />
                <StatCard label="Completed"        value={totalComplete} />
              </div>
            </div>
          )}

          {/* Per-sport breakdown */}
          {reports.length === 0 ? (
            <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">No sports data available.</div>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <div key={r.sportId} className="rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
                  <h3 className="mb-3 font-semibold text-white">{r.sportName}</h3>
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{r.totalTeams}</p>
                      <p className="text-xs text-neutral-500">Teams</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{r.totalMatches}</p>
                      <p className="text-xs text-neutral-500">Matches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{r.completedMatches}</p>
                      <p className="text-xs text-neutral-500">Completed</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {r.totalMatches > 0 && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs text-neutral-500">
                        <span>Match completion</span>
                        <span>{Math.round((r.completedMatches / r.totalMatches) * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${(r.completedMatches / r.totalMatches) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Team list */}
                  {r.teams.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs text-neutral-500">Registered teams</p>
                      <div className="flex flex-wrap gap-2">
                        {r.teams.map(t => (
                          <span key={t.id} className="rounded-full bg-white/6 px-3 py-0.5 text-xs text-neutral-300">
                            {t.teamName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
