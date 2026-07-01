import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { hasRole, MANAGER_AND_UP, AppRole } from "../../../shared/constants/roles";
import {
  getMyEventById,
  submitSportForApproval,
  toggleSportRegistration,
  changeEventStatus,
  adminApproveSport,
  adminRejectSport,
  type OrganizerEvent,
  type OrganizerSport,
} from "../api/organizer.api";
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime";

// ── Constants ─────────────────────────────────────────────────────────────────

const SPORT_STEPS = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
] as const;

const SPORT_STEP_LABELS: Record<string, string> = {
  DRAFT:               "Draft",
  PENDING_APPROVAL:    "Pending",
  APPROVED:            "Approved",
  REGISTRATION_OPEN:   "Reg Open",
  REGISTRATION_CLOSED: "Reg Closed",
};

const EVENT_STEPS = ["DRAFT", "PUBLISHED", "LIVE", "COMPLETED", "ARCHIVED"] as const;

const EVENT_STEP_LABELS: Record<string, string> = {
  DRAFT:     "Draft",
  PUBLISHED: "Published",
  LIVE:      "Live",
  COMPLETED: "Completed",
  ARCHIVED:  "Archived",
};

const NEXT_EVENT_STATUS: Record<string, string> = {
  DRAFT:     "PUBLISHED",
  PUBLISHED: "LIVE",
  LIVE:      "COMPLETED",
  COMPLETED: "ARCHIVED",
};

const NEXT_EVENT_LABEL: Record<string, string> = {
  DRAFT:     "Publish Event",
  PUBLISHED: "Go Live",
  LIVE:      "Mark Completed",
  COMPLETED: "Archive Event",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sportLabel(s: OrganizerSport): string {
  return [s.sport.replace(/_/g, " "), s.weightClass, s.ageGroup]
    .filter(Boolean)
    .join(" · ");
}

function isPublishReady(sport: OrganizerSport): boolean {
  return sport.status === "REGISTRATION_CLOSED" && sport.bracketGenerated;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  const colours: Record<string, string> = {
    LIVE:                "bg-green-500/15 text-green-400",
    PUBLISHED:           "bg-blue-500/15 text-blue-400",
    DRAFT:               "bg-yellow-500/15 text-yellow-400",
    PENDING_APPROVAL:    "bg-orange-500/15 text-orange-400",
    APPROVED:            "bg-teal-500/15 text-teal-400",
    REGISTRATION_OPEN:   "bg-sky-500/15 text-sky-400",
    REGISTRATION_CLOSED: "bg-white/8 text-neutral-400",
    COMPLETED:           "bg-white/8 text-neutral-400",
    ARCHIVED:            "bg-white/5 text-neutral-600",
  };
  const label = (SPORT_STEP_LABELS[status] ?? EVENT_STEP_LABELS[status] ?? status).replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[status] ?? "bg-white/8 text-neutral-400"} ${className}`}>
      {label}
    </span>
  );
}

function MiniStepper({
  steps,
  labels,
  current,
}: {
  steps: readonly string[];
  labels: Record<string, string>;
  current: string;
}) {
  const idx = steps.indexOf(current as typeof steps[number]);
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {steps.map((step, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={step} className="flex items-center gap-0.5">
            <div className={[
              "h-1.5 w-1.5 rounded-full shrink-0",
              done   ? "bg-green-500"    :
              active ? "bg-red-500"      : "bg-white/15",
            ].join(" ")} />
            <span className={[
              "text-[10px] leading-none",
              done   ? "text-green-500"   :
              active ? "text-red-400"     : "text-neutral-600",
            ].join(" ")}>
              {labels[step]}
            </span>
            {i < steps.length - 1 && (
              <span className="text-neutral-700 text-[10px] mx-0.5">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionBtn({
  onClick,
  loading,
  label,
  variant = "primary",
  disabled = false,
  disabledReason,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const colours = {
    primary: "bg-red-600 hover:bg-red-700 text-white",
    ghost:   "bg-white/8 hover:bg-white/12 text-white",
    danger:  "bg-red-900/40 hover:bg-red-900/60 text-red-300",
  };
  const btn = (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        colours[variant],
        (disabled || loading) ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {loading ? "…" : label}
    </button>
  );
  if (disabled && disabledReason) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        {btn}
        <span className="text-[10px] text-neutral-500">{disabledReason}</span>
      </div>
    );
  }
  return btn;
}

// ── Sport card ────────────────────────────────────────────────────────────────

function SportCard({
  sport,
  eventId,
  isManager,
  onRefresh,
}: {
  sport: OrganizerSport;
  eventId: string;
  isManager: boolean;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function act(fn: () => Promise<unknown>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Action failed");
    } finally {
      setLoading(false);
    }
  }

  const prereqOk = isPublishReady(sport);

  return (
    <div className="rounded-xl bg-white/4 p-4 ring-1 ring-white/8 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white text-sm">{sportLabel(sport)}</p>
          <div className="mt-1.5">
            <MiniStepper steps={SPORT_STEPS} labels={SPORT_STEP_LABELS} current={sport.status} />
          </div>
        </div>
        <StatusPill status={sport.status} className="shrink-0 mt-0.5" />
      </div>

      {/* Readiness row */}
      <div className="flex items-center gap-4 text-xs">
        <span className={sport.bracketGenerated ? "text-green-400" : "text-neutral-500"}>
          {sport.bracketGenerated ? "✓ Bracket" : "✗ No bracket"}
        </span>
        <span className={prereqOk ? "text-green-400" : "text-neutral-500"}>
          {prereqOk ? "✓ Ready to publish" : ""}
        </span>
        {sport.registeredTeamsCount !== undefined && (
          <span className="text-neutral-500 ml-auto">
            {sport.registeredTeamsCount}{sport.maxTeams ? `/${sport.maxTeams}` : ""} teams
          </span>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          {sport.status === "DRAFT" && (
            <>
              <ActionBtn
                label="Submit for Approval"
                loading={loading}
                onClick={() => act(() => submitSportForApproval(eventId, sport.id))}
              />
              {sport.rejectionReason && (
                <span className="text-xs text-red-400 italic">Rejected: {sport.rejectionReason}</span>
              )}
            </>
          )}
          {sport.status === "PENDING_APPROVAL" && !isManager && (
            <span className="text-xs text-orange-400 italic">Awaiting admin approval…</span>
          )}
          {sport.status === "PENDING_APPROVAL" && isManager && (
            <>
              <ActionBtn
                label="Approve"
                variant="primary"
                loading={loading}
                onClick={() => act(() => adminApproveSport(sport.id))}
              />
              <ActionBtn
                label="Reject"
                variant="danger"
                loading={loading}
                onClick={() => setRejectOpen(true)}
              />
            </>
          )}
          {sport.status === "APPROVED" && (
            <ActionBtn
              label="Open Registration"
              loading={loading}
              onClick={() => act(() => toggleSportRegistration(eventId, sport.id))}
            />
          )}
          {sport.status === "REGISTRATION_OPEN" && (
            <ActionBtn
              label="Close Registration"
              variant="ghost"
              loading={loading}
              onClick={() => act(() => toggleSportRegistration(eventId, sport.id))}
            />
          )}
          {sport.status === "REGISTRATION_CLOSED" && !sport.bracketGenerated && (
            <ActionBtn
              label="Generate Brackets →"
              variant="primary"
              loading={false}
              onClick={() => navigate(`/organizer/schedule?eventId=${eventId}&sportId=${sport.id}&action=generate`)}
            />
          )}
          {sport.status === "REGISTRATION_CLOSED" && sport.bracketGenerated && (
            <ActionBtn
              label="Schedule Matches →"
              variant="ghost"
              loading={false}
              onClick={() => navigate(`/organizer/schedule?eventId=${eventId}&sportId=${sport.id}`)}
            />
          )}
        </div>
      </div>

      {/* Reject modal (inline) */}
      {rejectOpen && (
        <div className="mt-2 rounded-lg bg-white/5 p-3 space-y-2">
          <p className="text-xs text-neutral-300">Rejection reason (optional)</p>
          <input
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Missing weight class details"
            className="w-full rounded bg-white/8 px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <ActionBtn
              label="Confirm Reject"
              variant="danger"
              loading={loading}
              onClick={() => {
                setRejectOpen(false);
                act(() => adminRejectSport(sport.id, rejectReason || undefined));
              }}
            />
            <ActionBtn
              label="Cancel"
              variant="ghost"
              loading={false}
              onClick={() => setRejectOpen(false)}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OrganizerEventDetailPage() {
  const { eventId }   = useParams<{ eventId: string }>();
  const navigate      = useNavigate();
  const { user }      = useSelector((state: RootState) => state.auth);
  const userRoles     = user?.allRoles ?? (user?.role ? [user.role] : []);
  const isManager     = hasRole(userRoles, MANAGER_AND_UP);
  const isAdminOrUp   = hasRole(userRoles, [AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR]);

  const [event,   setEvent]   = useState<OrganizerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [statusWorking, setStatusWorking] = useState(false);
  const [statusError,   setStatusError]   = useState<string | null>(null);

  const load = useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    getMyEventById(eventId)
      .then(setEvent)
      .catch(() => setError("Failed to load event details."))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  useEventRealtime(eventId, {
    onEventUpdated:       (p) => setEvent(prev => prev ? { ...prev, ...(p as Partial<OrganizerEvent>) } : prev),
    onEventStatusChanged: (p) => setEvent(prev => prev ? { ...prev, ...(p as Partial<OrganizerEvent>) } : prev),
    onSportUpdated:       (p: any) => setEvent(prev => {
      if (!prev?.sports) return prev;
      return { ...prev, sports: prev.sports.map(s => s.id === p?.id ? { ...s, ...p } : s) };
    }),
  });

  async function handleEventStatusChange(nextStatus: string) {
    if (!eventId || !event) return;
    setStatusWorking(true);
    setStatusError(null);
    try {
      const updated = await changeEventStatus(eventId, nextStatus);
      setEvent(prev => prev ? { ...prev, status: updated.status } : prev);
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? e?.message ?? "Failed to change status";
      setStatusError(msg);
    } finally {
      setStatusWorking(false);
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;
  if (error || !event) return <div className="p-6 text-red-400">{error ?? "Event not found."}</div>;

  const nextStatus = NEXT_EVENT_STATUS[event.status];
  const nextLabel  = NEXT_EVENT_LABEL[event.status];
  const sports     = event.sports ?? [];
  const publishReady = sports.length > 0 && sports.every(isPublishReady);

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/organizer/events")}
        className="mb-5 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        ← Back to Events
      </button>

      {/* Event header */}
      <div className="mb-6 flex items-start gap-4">
        {event.eventLogoUrl && (
          <img src={event.eventLogoUrl} alt={event.eventName} className="h-14 w-14 rounded-xl object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white truncate">{event.eventName}</h1>
            <StatusPill status={event.status} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-neutral-500">{event.eventCode}</p>
          {event.venueName && (
            <p className="mt-0.5 text-sm text-neutral-400">
              {event.venueName}{event.city ? `, ${event.city}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Event lifecycle stepper + status action */}
      <div className="mb-6 rounded-xl bg-white/4 p-4 ring-1 ring-white/8 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-neutral-500 mb-1.5">Event Lifecycle</p>
            <MiniStepper steps={EVENT_STEPS} labels={EVENT_STEP_LABELS} current={event.status} />
          </div>

          {nextStatus && (isManager || isAdminOrUp) && (
            <ActionBtn
              label={nextLabel}
              loading={statusWorking}
              disabled={event.status === "DRAFT" && !publishReady && sports.length > 0}
              disabledReason={event.status === "DRAFT" && !publishReady && sports.length > 0
                ? "Not all sports are publish-ready"
                : undefined}
              onClick={() => handleEventStatusChange(nextStatus)}
            />
          )}
        </div>

        {statusError && (
          <div className="rounded-lg bg-red-900/20 border border-red-700/40 p-3">
            <p className="text-xs text-red-300 whitespace-pre-line">{statusError}</p>
          </div>
        )}
      </div>

      {/* Quick nav */}
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

      {/* Sports section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            Sports <span className="text-neutral-500 font-normal">({sports.length})</span>
          </h2>
          {event.status === "DRAFT" && sports.length > 0 && (
            <span className={`text-xs ${publishReady ? "text-green-400" : "text-neutral-500"}`}>
              {sports.filter(isPublishReady).length}/{sports.length} publish-ready
            </span>
          )}
        </div>

        {sports.length === 0 ? (
          <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500 text-sm">
            No sports configured for this event.
          </div>
        ) : (
          <div className="space-y-3">
            {sports.map(s => (
              <SportCard
                key={s.id}
                sport={s}
                eventId={event.id}
                isManager={isManager}
                onRefresh={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
