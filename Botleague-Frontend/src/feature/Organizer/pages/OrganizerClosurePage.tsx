import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getMatchesForSport,
  changeEventStatus,
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
    <div className={`flex items-center gap-3 rounded-lg p-3 ${ok ? "bg-[#1fa952]/8" : "bg-[#4b86e8]/5"}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${ok ? "bg-[#1fa952]/20 text-[#1fa952]" : "bg-[#4b86e8]/10 text-[#7c7c7c]"}`}>
        {ok ? "✓" : "○"}
      </span>
      <span className={`text-sm ${ok ? "text-[#1fa952]" : "text-[#5d5d5d]"}`}>{label}</span>
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
  const [closing, setClosing]         = useState(false);
  const [closeError, setCloseError]   = useState<string | null>(null);

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
    if (!event) { setStatus(null); return; }

    // An event with no sports (or no matches yet) has nothing to block
    // closure — fall through to the empty-array Promise.all case below
    // rather than treating "no sports" as "status not computed yet".
    const sports = event.sports ?? [];

    setLoading(true);
    setStatus(null);

    Promise.all(
      sports.map(s =>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId) return;
    setClosing(true);
    setCloseError(null);
    try {
      const updated = await changeEventStatus(selectedEventId, "COMPLETED", notes.trim() || undefined);
      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
      setSubmitted(true);
    } catch (err: any) {
      setCloseError(err?.response?.data?.message || "Failed to close event.");
    } finally {
      setClosing(false);
    }
  }

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-[#5d5d5d]">Loading…</div>;

  return (
    <div className="min-h-screen p-6 text-[#111111]">
      <h1 className="mb-2 text-2xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Event Closure</h1>
      <p className="mb-6 text-sm text-[#5d5d5d]">Complete pre-closure checks and submit the event summary report.</p>

      {/* Event selector */}
      <div className="mb-6">
        <select
          value={selectedEventId}
          onChange={e => { setSelectedEventId(e.target.value); setSubmitted(false); setCloseError(null); }}
          className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
        >
          <option value="" disabled>Select event…</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
        </select>
      </div>

      {loading && <div className="flex h-32 items-center justify-center text-[#5d5d5d]">Checking status…</div>}

      {!loading && selectedEventId && status && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pre-closure checklist */}
          <div className="rounded-xl bg-white/90 p-5 ring-1 ring-[#4b86e8]/25 border border-[#4b86e8]/25">
            <h2 className="mb-4 font-semibold text-[#111111]">Pre-Closure Checklist</h2>
            <div className="space-y-2">
              <Check ok={status.totalMatches > 0}   label={`Matches created (${status.totalMatches} total)`} />
              <Check ok={status.liveCount === 0}     label="No live matches in progress" />
              <Check ok={status.scheduledCount === 0} label="No scheduled matches remaining" />
              <Check ok={status.completedMatches > 0} label={`Completed matches: ${status.completedMatches}`} />
              <Check ok={!eventCompleted}            label={eventCompleted ? "Event already marked COMPLETED" : "Event not yet closed"} />
            </div>

            {status.allMatchesDone && !eventCompleted ? (
              <div className="mt-4 rounded-lg bg-[#1fa952]/10 px-4 py-3 text-sm text-[#1fa952]">
                All checks passed — ready for closure.
              </div>
            ) : eventCompleted ? (
              <div className="mt-4 rounded-lg bg-[#4b86e8]/8 px-4 py-3 text-sm text-[#5d5d5d]">
                This event has already been closed.
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[#eab308]/10 px-4 py-3 text-sm text-[#a16207]">
                {status.liveCount > 0 && <p>{status.liveCount} match{status.liveCount !== 1 ? "es" : ""} still live.</p>}
                {status.scheduledCount > 0 && <p>{status.scheduledCount} match{status.scheduledCount !== 1 ? "es" : ""} not yet played.</p>}
              </div>
            )}
          </div>

          {/* Closure form */}
          <div className="rounded-xl bg-white/90 p-5 ring-1 ring-[#4b86e8]/25 border border-[#4b86e8]/25">
            <h2 className="mb-4 font-semibold text-[#111111]">Closure Report</h2>

            {submitted || eventCompleted ? (
              <div className="rounded-lg bg-[#1fa952]/10 p-4 text-sm text-[#1fa952]">
                Event marked Completed.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-[#5d5d5d] font-semibold">Organiser summary notes</label>
                  <textarea
                    rows={5}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Event highlights, issues encountered, team performance notes…"
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] placeholder-[#9a9a9a] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff] resize-none"
                  />
                </div>
                {closeError && (
                  <div className="rounded-lg bg-[#e04b4b]/10 px-4 py-3 text-sm text-[#e04b4b] whitespace-pre-line">
                    {closeError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!canClose || closing}
                  className="w-full rounded-lg bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {closing ? "Closing event…" : "Submit Closure Report"}
                </button>
                {!canClose && !eventCompleted && (
                  <p className="text-center text-xs text-[#9a9a9a]">
                    All matches must be completed before closing the event.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {!loading && !selectedEventId && (
        <div className="rounded-xl bg-[#4b86e8]/5 p-8 text-center text-[#5d5d5d]">Select an event to begin closure process.</div>
      )}
    </div>
  );
}
