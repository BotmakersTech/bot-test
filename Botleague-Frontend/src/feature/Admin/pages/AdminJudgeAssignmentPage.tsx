import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { getUserDetail, type UserSummary } from "../../SuperAdmin/api/userManagement.api"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import {
  getJudgeAssignments,
  assignJudgeToEvent,
  removeJudgeFromEvent,
  getEventMatchesForAssignment,
  assignMatchToJudge,
  unassignMatchFromJudge,
  type JudgeEventAssignment,
  type SportMatches,
} from "../api/adminJudgeAssignments.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import "../../../styles/organizerTheme.css"

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  const bg =
    s === "PENDING_APPROVAL" ? "#a16207" :
    s === "LIVE"             ? "#1fa952" :
    s === "COMPLETED"        ? ORG.blue :
    s === "CANCELLED"        ? ORG.danger :
    "#9ca3af"
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ background: bg }}>
      {s.replace(/_/g, " ") || "SCHEDULED"}
    </span>
  )
}

function avatarInitials(firstName?: string, lastName?: string, fallback?: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()
  return initials || fallback?.charAt(0).toUpperCase() || "?"
}

function MatchPickerPanel({
  userId, assignment, onChanged,
}: { userId: string; assignment: JudgeEventAssignment; onChanged: () => void }) {
  const [sports, setSports] = useState<SportMatches[]>([])
  const [loading, setLoading] = useState(true)
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getEventMatchesForAssignment(assignment.eventId)
      .then(setSports)
      .catch(() => setSports([]))
      .finally(() => setLoading(false))
  }, [assignment.eventId])

  const toggle = async (matchId: string, currentlyAssigned: boolean) => {
    setBusyMatchId(matchId)
    try {
      if (currentlyAssigned) {
        await unassignMatchFromJudge(userId, assignment.eventJudgeId, matchId)
      } else {
        await assignMatchToJudge(userId, assignment.eventJudgeId, matchId)
      }
      onChanged()
    } finally {
      setBusyMatchId(null)
    }
  }

  if (loading) {
    return <p className="px-6 py-4 text-sm text-gray-400">Loading matches…</p>
  }

  const totalMatches = sports.reduce((n, s) => n + s.matches.length, 0)
  if (totalMatches === 0) {
    return <p className="px-6 py-4 text-sm text-gray-400">No matches generated for this event yet.</p>
  }

  return (
    <div className="space-y-4 border-t px-6 py-4" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
      {sports.filter(s => s.matches.length > 0).map(sport => (
        <div key={sport.eventSportId}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: ORG.muted }}>{sport.sportName}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sport.matches.map(m => {
              const isAssigned = assignment.assignedMatchIds.includes(m.matchId)
              return (
                <label
                  key={m.matchId}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                  style={{ borderColor: isAssigned ? ORG.blue : "rgba(75,134,232,0.2)", background: isAssigned ? "rgba(75,134,232,0.06)" : "#fff" }}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      disabled={busyMatchId === m.matchId}
                      onChange={() => toggle(m.matchId, isAssigned)}
                      style={{ accentColor: ORG.violet }}
                    />
                    <span className="font-medium" style={{ color: ORG.text }}>R{m.roundNumber} · M{m.matchNumber}</span>
                  </span>
                  <StatusBadge status={m.status} />
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function EventAssignmentRow({
  userId, assignment, onRemoved, onChanged,
}: { userId: string; assignment: JudgeEventAssignment; onRemoved: () => void; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!window.confirm(`Remove this judge from "${assignment.eventName}"? This also unassigns all their matches for this event.`)) return
    setRemoving(true)
    try {
      await removeJudgeFromEvent(userId, assignment.eventJudgeId)
      onRemoved()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div>
          <p className="font-medium" style={{ color: ORG.text }}>{assignment.eventName}</p>
          <p className="text-xs" style={{ color: ORG.muted }}>
            {assignment.assignedMatchIds.length} match{assignment.assignedMatchIds.length !== 1 ? "es" : ""} assigned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ color: ORG.blueHeading, background: "rgba(75,134,232,0.1)" }}
          >
            Manage matches {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            aria-label="Remove assignment"
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {expanded && <MatchPickerPanel userId={userId} assignment={assignment} onChanged={onChanged} />}
    </div>
  )
}

export default function AdminJudgeAssignmentPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [judge, setJudge] = useState<UserSummary | null>(null)
  const [assignments, setAssignments] = useState<JudgeEventAssignment[]>([])
  const [events, setEvents] = useState<AdminEventResponse[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!userId) return
    return getJudgeAssignments(userId).then(setAssignments).catch(() => setAssignments([]))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    Promise.all([getUserDetail(userId), getJudgeAssignments(userId), getAllEvents()])
      .then(([u, a, ev]) => {
        setJudge(u)
        setAssignments(a)
        setEvents(ev)
      })
      .catch(() => setError("Failed to load judge details"))
      .finally(() => setLoading(false))
  }, [userId])

  const assignedEventIds = new Set(assignments.map(a => a.eventId))
  const availableEvents = events.filter(e => !assignedEventIds.has(e.id))

  const handleAssign = async () => {
    if (!userId || !selectedEventId) return
    setAssigning(true)
    setError(null)
    try {
      await assignJudgeToEvent(userId, selectedEventId)
      setSelectedEventId("")
      await reload()
    } catch {
      setError("Failed to assign event")
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return <div className="org-page-bg p-8"><p className="text-sm text-gray-400">Loading…</p></div>
  }

  if (!judge) {
    return <div className="org-page-bg p-8"><p className="text-sm text-gray-400">Judge not found.</p></div>
  }

  return (
    <div className="org-page-bg p-8">
      <div style={{ position: "relative", zIndex: 1 }}>
        <button
          onClick={() => navigate("/admin/judges")}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: ORG.muted }}
        >
          <ArrowLeft size={15} /> Back to Judge Ecosystem
        </button>

        <div className="mb-8 flex items-center gap-4">
          {judge.profilePhotoUrl ? (
            <img src={judge.profilePhotoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ background: ORG.gradientCta }}
            >
              {avatarInitials(judge.firstName, judge.lastName, judge.email)}
            </span>
          )}
          <div>
            <h1 className="font-display text-[32px] font-medium text-[#0162d1] tracking-wide">
              {[judge.firstName, judge.lastName].filter(Boolean).join(" ") || judge.username}
            </h1>
            <p className="text-sm" style={{ color: ORG.muted }}>{judge.email || judge.phone}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-6 rounded-2xl border p-6" style={{ borderColor: "rgba(75,134,232,0.25)", background: "#fff" }}>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: ORG.blueHeading, fontFamily: ORG.fontHeading }}>Assign to Event</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="min-w-[280px] flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid rgba(75,134,232,0.3)`, color: ORG.text }}
            >
              <option value="">Select an event…</option>
              {availableEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.eventName}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedEventId || assigning}
              className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: ORG.gradientCta }}
            >
              {assigning ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold" style={{ color: ORG.blueHeading, fontFamily: ORG.fontHeading }}>
          Event Assignments
        </h2>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm" style={{ borderColor: "rgba(75,134,232,0.3)", color: ORG.muted }}>
            Not assigned to any events yet.
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => (
              <EventAssignmentRow key={a.eventJudgeId} userId={userId!} assignment={a} onRemoved={reload} onChanged={reload} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
