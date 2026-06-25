import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getMatchesForSport,
  type OrganizerEvent,
  type OrganizerMatch,
} from "../api/organizer.api";

interface ClosureStatus {
  allMatchesDone: boolean;
  liveCount: number;
  scheduledCount: number;
  totalMatches: number;
  completedMatches: number;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 ${ok ? "bg-green-500/8" : "bg-white/4"}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${ok ? "bg-green-500/20 text-green-400" : "bg-white/10 text-neutral-500"}`}>
        {ok ? "✓" : "○"}
      </span>
      <span className={`text-sm ${ok ? "text-green-300" : "text-neutral-400"}`}>{label}</span>
    </div>
  );
}

export default function OrganizerClosurePage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents]           = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId ?? "");
  const [status, setStatus]           = useState<ClosureStatus | null>(null);
  const [notes, setNotes]             = useState("");
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);

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
    if (!event?.sports?.length) { setStatus(null); return; }

    setLoading(true);
    setStatus(null);

    Promise.all(
      event.sports.map(s =>
        getMatchesForSport(s.id).catch(() => [] as OrganizerMatch[])
      )
    )
      .then(results => {
        const all = results.flat();
        const live = all.filter(m => m.status === "LIVE").length;
        const sched = all.filter(m => m.status === "SCHEDULED").length;
        const done = all.filter(m => m.status === "COMPLETED").length;
        setStatus({
          allMatchesDone: live === 0 && sched === 0,
          liveCount: live,
          scheduledCount: sched,
          totalMatches: all.length,
          completedMatches: done,
        });
      })
      .finally(() => setLoading(false));
  }, [selectedEventId, events]);

  const event = events.find(e => e.id === selectedEventId);
  const eventCompleted = event?.status === "COMPLETED";
  const canClose = status?.allMatchesDone && !eventCompleted;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-2 text-2xl font-bold text-red-500">Event Closure</h1>
      <p className="mb-6 text-sm text-neutral-400">Complete pre-closure checks and submit the event summary report.</p>

      {/* Event selector */}
      <div className="mb-6">
        <select
          value={selectedEventId}
          onChange={e => { setSelectedEventId(e.target.value); setSubmitted(false); }}
          className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      {loading && <div className="flex h-32 items-center justify-center text-neutral-400">Checking status…</div>}

      {!loading && selectedEventId && status && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pre-closure checklist */}
          <div className="rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
            <h2 className="mb-4 font-semibold text-white">Pre-Closure Checklist</h2>
            <div className="space-y-2">
              <Check ok={status.totalMatches > 0}   label={`Matches created (${status.totalMatches} total)`} />
              <Check ok={status.liveCount === 0}     label="No live matches in progress" />
              <Check ok={status.scheduledCount === 0} label="No scheduled matches remaining" />
              <Check ok={status.completedMatches > 0} label={`Completed matches: ${status.completedMatches}`} />
              <Check ok={!eventCompleted}            label={eventCompleted ? "Event already marked COMPLETED" : "Event not yet closed"} />
            </div>

            {status.allMatchesDone && !eventCompleted ? (
              <div className="mt-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
                All checks passed — ready for closure.
              </div>
            ) : eventCompleted ? (
              <div className="mt-4 rounded-lg bg-white/6 px-4 py-3 text-sm text-neutral-400">
                This event has already been closed.
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
                {status.liveCount > 0 && <p>{status.liveCount} match{status.liveCount !== 1 ? "es" : ""} still live.</p>}
                {status.scheduledCount > 0 && <p>{status.scheduledCount} match{status.scheduledCount !== 1 ? "es" : ""} not yet played.</p>}
              </div>
            )}
          </div>

          {/* Closure form */}
          <div className="rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
            <h2 className="mb-4 font-semibold text-white">Closure Report</h2>

            {submitted ? (
              <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-400">
                Closure report submitted. An administrator will review and officially close this event.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Organiser summary notes</label>
                  <textarea
                    rows={5}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Event highlights, issues encountered, team performance notes…"
                    className="w-full rounded-lg bg-white/6 px-3 py-2 text-sm text-white placeholder-neutral-600 ring-1 ring-white/10 focus:outline-none focus:ring-red-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canClose}
                  className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Submit Closure Report
                </button>
                {!canClose && !eventCompleted && (
                  <p className="text-center text-xs text-neutral-600">
                    All matches must be completed before closing the event.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {!loading && !selectedEventId && (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">Select an event to begin closure process.</div>
      )}
    </div>
  );
}
