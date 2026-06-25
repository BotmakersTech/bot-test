import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyEventById, type OrganizerEvent } from "../api/organizer.api";
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime";

type Tab = "overview" | "sports" | "registrations";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    LIVE: "bg-green-500/10 text-green-400",
    ONGOING: "bg-green-500/10 text-green-400",
    UPCOMING: "bg-blue-500/10 text-blue-400",
    PUBLISHED: "bg-blue-500/10 text-blue-400",
    COMPLETED: "bg-white/6 text-neutral-400",
    DRAFT: "bg-yellow-500/10 text-yellow-400",
    CANCELLED: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-white/6 text-neutral-400"}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-white/5">
      <span className="w-36 shrink-0 text-xs text-neutral-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

export default function OrganizerEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent]     = useState<OrganizerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<Tab>("overview");

  useEffect(() => {
    if (!eventId) return;
    getMyEventById(eventId)
      .then(setEvent)
      .catch(() => setError("Failed to load event details."))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Real-time: merge incoming event/sport updates into local state without reload
  useEventRealtime(eventId, {
    onEventUpdated: (p) =>
      setEvent(prev => prev ? { ...prev, ...(p as Partial<OrganizerEvent>) } : prev),
    onEventStatusChanged: (p) =>
      setEvent(prev => prev ? { ...prev, ...(p as Partial<OrganizerEvent>) } : prev),
    onSportUpdated: (p: any) =>
      setEvent(prev => {
        if (!prev || !prev.sports) return prev;
        return {
          ...prev,
          sports: prev.sports.map(s => s.id === p?.id ? { ...s, ...p } : s),
        };
      }),
  });

  if (loading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;
  if (error || !event) return <div className="p-6 text-red-400">{error ?? "Event not found."}</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",      label: "Overview" },
    { key: "sports",        label: `Sports (${event.sports?.length ?? 0})` },
    { key: "registrations", label: "Registrations" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      {/* Header */}
      <button
        onClick={() => navigate("/organizer/events")}
        className="mb-4 flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        ← Back to Events
      </button>

      <div className="mb-6 flex items-start gap-4">
        {event.eventLogoUrl && (
          <img src={event.eventLogoUrl} alt={event.eventName} className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{event.eventName}</h1>
            <StatusPill status={event.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-neutral-500">{event.eventCode}</p>
          {event.venueName && (
            <p className="mt-1 text-sm text-neutral-400">{event.venueName}{event.city ? `, ${event.city}` : ""}</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => navigate(`/organizer/communication?eventId=${event.id}`)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Broadcast Announcement
        </button>
        <button
          onClick={() => navigate(`/organizer/schedule?eventId=${event.id}`)}
          className="rounded-lg bg-white/8 px-4 py-2 text-sm font-medium text-white hover:bg-white/12 transition-colors"
        >
          View Schedule
        </button>
        <button
          onClick={() => navigate(`/organizer/monitoring?eventId=${event.id}`)}
          className="rounded-lg bg-white/8 px-4 py-2 text-sm font-medium text-white hover:bg-white/12 transition-colors"
        >
          Live Monitor
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/8">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "pb-2 px-3 text-sm font-medium transition-colors",
              tab === t.key ? "border-b-2 border-red-500 text-white" : "text-neutral-400 hover:text-white",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="max-w-lg rounded-xl bg-white/4 p-5 ring-1 ring-white/8">
          <InfoRow label="Organisation"   value={event.organizationName} />
          <InfoRow label="Venue"          value={event.venueName} />
          <InfoRow label="Address"        value={event.venueAddress} />
          <InfoRow label="City"           value={[event.city, event.state, event.country].filter(Boolean).join(", ")} />
          <InfoRow label="Starts"         value={event.startDate ?? undefined} />
          <InfoRow label="Ends"           value={event.endDate ?? undefined} />
          <InfoRow label="Tier"           value={event.tier} />
          {event.eventDescription && (
            <div className="mt-4 text-sm text-neutral-300">{event.eventDescription}</div>
          )}
        </div>
      )}

      {/* Tab: Sports */}
      {tab === "sports" && (
        <div className="space-y-3">
          {(event.sports ?? []).length === 0 ? (
            <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">No sports configured for this event.</div>
          ) : (
            event.sports!.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/4 p-4 ring-1 ring-white/8">
                <div>
                  <p className="font-medium text-white">{s.sport.replace(/_/g, " ")}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {[s.ageGroup, s.weightClass].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400">
                    {s.registeredTeamsCount ?? 0}{s.maxTeams ? `/${s.maxTeams}` : ""} teams
                  </span>
                  <StatusPill status={s.status} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Registrations */}
      {tab === "registrations" && (
        <div className="rounded-xl bg-white/4 p-5 ring-1 ring-white/8 text-neutral-400 text-sm">
          Select a sport above to view registrations, or visit the{" "}
          <button
            onClick={() => navigate(`/organizer/teams?eventId=${event.id}`)}
            className="text-red-400 underline hover:text-red-300"
          >
            Teams page
          </button>
          .
        </div>
      )}
    </div>
  );
}
