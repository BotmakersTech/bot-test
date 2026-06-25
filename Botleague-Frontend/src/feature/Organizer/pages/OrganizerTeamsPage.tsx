import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getRegistrationsForSport,
  type OrganizerEvent,
  type OrganizerTeamRegistration,
} from "../api/organizer.api";

interface Row {
  sport: string;
  sportId: string;
  team: OrganizerTeamRegistration;
}

export default function OrganizerTeamsPage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents]       = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");
  const [rows, setRows]           = useState<Row[]>([]);
  const [filter, setFilter]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    getMyEvents()
      .then(e => {
        setEvents(e);
        if (!preselectedEventId && e.length > 0) setSelectedEventId(e[0].id);
      })
      .catch(() => setError("Failed to load events."))
      .finally(() => setEventsLoading(false));
  }, [preselectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const event = events.find(e => e.id === selectedEventId);
    if (!event?.sports?.length) { setRows([]); return; }

    setLoading(true);
    setError(null);

    Promise.all(
      event.sports.map(s =>
        getRegistrationsForSport(s.id)
          .then(teams => teams.map(t => ({ sport: s.sport, sportId: s.id, team: t })))
          .catch(() => [] as Row[])
      )
    )
      .then(results => setRows(results.flat()))
      .finally(() => setLoading(false));
  }, [selectedEventId, events]);

  const visible = filter
    ? rows.filter(r => r.team.teamName.toLowerCase().includes(filter.toLowerCase()) || r.sport.toLowerCase().includes(filter.toLowerCase()))
    : rows;

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold text-red-500">Registered Teams</h1>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search team or sport…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        />
      </div>

      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-neutral-400">Loading teams…</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">
          {selectedEventId ? "No registered teams found." : "Select an event to see teams."}
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-neutral-500">
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Sport</th>
                <th className="px-4 py-3">Lineup</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr key={`${r.sportId}-${r.team.id}-${i}`} className="border-b border-white/5 hover:bg-white/4 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.team.teamLogoUrl && (
                        <img src={r.team.teamLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                      )}
                      <span className="font-medium text-white">{r.team.teamName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{r.sport.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {r.team.lineup?.length
                      ? r.team.lineup.map(m => m.fullName).join(", ")
                      : <span className="text-neutral-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-neutral-600">{visible.length} registration{visible.length !== 1 ? "s" : ""} shown</p>
    </div>
  );
}
