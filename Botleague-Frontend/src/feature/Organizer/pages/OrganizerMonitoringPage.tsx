import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getMatchesForSport,
  type OrganizerEvent,
  type OrganizerMatch,
} from "../api/organizer.api";

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
      LIVE
    </span>
  );
}

function MatchCard({ m }: { m: OrganizerMatch }) {
  const isLive = m.status === "LIVE";
  return (
    <div className={`rounded-xl p-4 ring-1 transition-all ${isLive ? "bg-green-500/5 ring-green-500/30" : "bg-white/4 ring-white/8"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-mono text-neutral-500">Match #{m.matchNumber ?? "—"} · R{m.roundNumber ?? "—"}</span>
        {isLive ? <LiveBadge /> : <span className="text-xs text-neutral-500">{m.status}</span>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <p className="font-semibold text-white">{m.teamAName ?? "TBD"}</p>
          <p className={`mt-1 text-2xl font-bold ${isLive ? "text-green-300" : "text-white"}`}>
            {m.teamAScore ?? 0}
          </p>
        </div>
        <div className="text-neutral-500 font-medium">vs</div>
        <div className="flex-1 text-center">
          <p className="font-semibold text-white">{m.teamBName ?? "TBD"}</p>
          <p className={`mt-1 text-2xl font-bold ${isLive ? "text-green-300" : "text-white"}`}>
            {m.teamBScore ?? 0}
          </p>
        </div>
      </div>
      {m.arenaName && <p className="mt-3 text-center text-xs text-neutral-500">Arena: {m.arenaName}</p>}
    </div>
  );
}

export default function OrganizerMonitoringPage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents]           = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");
  const [selectedSportId, setSelectedSportId] = useState("");
  const [matches, setMatches]         = useState<OrganizerMatch[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function fetchMatches(sportId: string) {
    if (!sportId) return;
    setRefreshing(true);
    try {
      const data = await getMatchesForSport(sportId);
      setMatches(data);
      setLastRefresh(new Date());
    } catch { /* silent — keep stale data */ }
    finally { setRefreshing(false); }
  }

  useEffect(() => {
    if (!selectedSportId) return;
    fetchMatches(selectedSportId);
    intervalRef.current = setInterval(() => fetchMatches(selectedSportId), 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedSportId]);

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  const live      = matches.filter(m => m.status === "LIVE");
  const scheduled = matches.filter(m => m.status === "SCHEDULED");
  const done      = matches.filter(m => m.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-500">Event Monitoring</h1>
          <p className="mt-1 text-sm text-neutral-400">Live match status — auto-refreshes every 15 s</p>
        </div>
        {lastRefresh && (
          <span className="text-xs text-neutral-600">Last updated {lastRefresh.toLocaleTimeString()}</span>
        )}
      </div>

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

        {selectedSportId && (
          <button
            onClick={() => fetchMatches(selectedSportId)}
            disabled={refreshing}
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white hover:bg-white/12 transition-colors disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>

      {/* Stats strip */}
      {selectedSportId && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-3">
          {[
            { label: "Live",      count: live.length,      color: "text-green-400" },
            { label: "Scheduled", count: scheduled.length, color: "text-blue-400" },
            { label: "Completed", count: done.length,      color: "text-neutral-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/4 p-4 text-center ring-1 ring-white/8">
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="mt-1 text-xs text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {!selectedSportId ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">Select an event and sport to monitor.</div>
      ) : live.length === 0 && scheduled.length === 0 && done.length === 0 ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">No matches found for this sport.</div>
      ) : (
        <>
          {live.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Live Matches
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {live.map(m => <MatchCard key={m.matchId} m={m} />)}
              </div>
            </section>
          )}
          {scheduled.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-semibold text-neutral-400">Scheduled</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scheduled.map(m => <MatchCard key={m.matchId} m={m} />)}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-400">Completed</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {done.map(m => <MatchCard key={m.matchId} m={m} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
