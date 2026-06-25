import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getMatchesForSport,
  type OrganizerEvent,
  type OrganizerMatch,
} from "../api/organizer.api";

function MatchStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-500/10 text-blue-400",
    LIVE:      "bg-green-500/10 text-green-400",
    COMPLETED: "bg-white/6 text-neutral-400",
    CANCELLED: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-white/6 text-neutral-400"}`}>
      {status}
    </span>
  );
}

function fmt(dt?: string) {
  if (!dt) return "—";
  try { return new Date(dt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }); }
  catch { return dt; }
}

export default function OrganizerSchedulePage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents]           = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");
  const [selectedSportId, setSelectedSportId] = useState("");
  const [matches, setMatches]         = useState<OrganizerMatch[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    getMyEvents()
      .then(e => {
        setEvents(e);
        if (!preselectedEventId && e.length > 0) setSelectedEventId(e[0].id);
      })
      .finally(() => setEventsLoading(false));
  }, [preselectedEventId]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const sports = selectedEvent?.sports ?? [];

  useEffect(() => {
    if (selectedEvent && sports.length > 0 && !selectedSportId) {
      setSelectedSportId(sports[0].id);
    }
  }, [selectedEvent, sports, selectedSportId]);

  useEffect(() => {
    if (!selectedSportId) return;
    setMatchesLoading(true);
    setError(null);
    getMatchesForSport(selectedSportId)
      .then(setMatches)
      .catch(() => setError("Failed to load matches."))
      .finally(() => setMatchesLoading(false));
  }, [selectedSportId]);

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold text-red-500">Event Schedule</h1>

      {/* Selectors */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={selectedEventId}
          onChange={e => { setSelectedEventId(e.target.value); setSelectedSportId(""); setMatches([]); }}
          className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>

        {sports.length > 0 && (
          <select
            value={selectedSportId}
            onChange={e => setSelectedSportId(e.target.value)}
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
          >
            <option value="" disabled>Select sport…</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.sport.replace(/_/g, " ")}</option>)}
          </select>
        )}
      </div>

      {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

      {matchesLoading ? (
        <div className="flex h-32 items-center justify-center text-neutral-400">Loading matches…</div>
      ) : !selectedSportId ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">Select an event and sport to view the schedule.</div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">No matches scheduled yet.</div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-neutral-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Arena</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={m.matchId} className="border-b border-white/5 hover:bg-white/4 transition-colors">
                  <td className="px-4 py-3 text-neutral-500">{m.matchNumber ?? i + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {m.teamAName ?? "TBD"} <span className="text-neutral-500">vs</span> {m.teamBName ?? "TBD"}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{m.roundNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{fmt(m.scheduledAt)}</td>
                  <td className="px-4 py-3 text-neutral-400">{m.arenaName ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {m.teamAScore != null ? `${m.teamAScore} – ${m.teamBScore ?? 0}` : "—"}
                  </td>
                  <td className="px-4 py-3"><MatchStatusPill status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
