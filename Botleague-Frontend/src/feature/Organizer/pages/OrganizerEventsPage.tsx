import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyEvents, type OrganizerEvent } from "../api/organizer.api";

type Tab = "UPCOMING" | "ACTIVE" | "PAST";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    LIVE:      "bg-green-500/10 text-green-400",
    PUBLISHED: "bg-blue-500/10 text-blue-400",
    COMPLETED: "bg-white/6 text-neutral-400",
    DRAFT:     "bg-yellow-500/10 text-yellow-400",
    ARCHIVED:  "bg-slate-500/10 text-slate-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-white/[0.06] text-neutral-400"}`}>
      {status}
    </span>
  );
}

function categorise(events: OrganizerEvent[]): Record<Tab, OrganizerEvent[]> {
  return {
    ACTIVE:   events.filter(e => e.status === "LIVE"),
    UPCOMING: events.filter(e => e.status === "DRAFT" || e.status === "PUBLISHED"),
    PAST:     events.filter(e => e.status === "COMPLETED" || e.status === "ARCHIVED"),
  };
}

export default function OrganizerEventsPage() {
  const [events, setEvents]   = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>("UPCOMING");
  const navigate = useNavigate();

  useEffect(() => {
    getMyEvents()
      .then(setEvents)
      .catch(() => setError("Failed to load your events."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">{error}</div>;

  const grouped = categorise(events);
  const tabs: { key: Tab; label: string }[] = [
    { key: "ACTIVE",   label: `Active (${grouped.ACTIVE.length})` },
    { key: "UPCOMING", label: `Upcoming (${grouped.UPCOMING.length})` },
    { key: "PAST",     label: `Past (${grouped.PAST.length})` },
  ];
  const list = grouped[tab];

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold text-red-500">My Events</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/8">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "pb-2 px-3 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-b-2 border-red-500 text-white"
                : "text-neutral-400 hover:text-white",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">
          No {tab.toLowerCase()} events.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(e => (
            <div
              key={e.id}
              className="cursor-pointer rounded-xl bg-white/4 p-5 ring-1 ring-white/8 hover:ring-red-500/40 transition-all"
              onClick={() => navigate(`/organizer/events/${e.id}`)}
            >
              {e.eventLogoUrl && (
                <img src={e.eventLogoUrl} alt={e.eventName} className="mb-3 h-12 w-12 rounded-lg object-cover" />
              )}
              <h2 className="font-semibold text-white">{e.eventName}</h2>
              <p className="mt-1 text-xs font-mono text-neutral-500">{e.eventCode}</p>
              {e.venueName && (
                <p className="mt-2 text-xs text-neutral-400">{e.venueName}{e.city ? `, ${e.city}` : ""}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <StatusPill status={e.status} />
                {e.startDate && <span className="text-xs text-neutral-500">{e.startDate}</span>}
              </div>
              {e.sports && (
                <p className="mt-2 text-xs text-neutral-500">{e.sports.length} sport{e.sports.length !== 1 ? "s" : ""}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
