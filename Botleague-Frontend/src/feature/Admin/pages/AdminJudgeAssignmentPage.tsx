import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Trash2, Gavel } from "lucide-react"
import { getUserDetail, type UserSummary } from "../../SuperAdmin/api/userManagement.api"
import { getAllEvents, type AdminEventResponse } from "../api/admin.api"
import {
  getJudgeAssignments,
  assignJudgeToEvent,
  removeJudgeFromEvent,
  getEventSportsForAssignment,
  assignSportToJudge,
  unassignSportFromJudge,
  type JudgeEventAssignment,
  type EventSportOption,
} from "../api/adminJudgeAssignments.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import { resolveAvatarSrc } from "../../Profile/constants/avatars"
import "../../../styles/organizerTheme.css"

function avatarInitials(firstName?: string, lastName?: string, fallback?: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()
  return initials || fallback?.charAt(0).toUpperCase() || "?"
}

/**
 * Sport-wide grant: pick one sport in this event and the judge can score
 * every match in it (including matches generated later) — no per-match
 * picking. Assigning a different sport replaces the previous grant.
 */
function SportAssignmentPanel({
  userId, assignment, onChanged,
}: { userId: string; assignment: JudgeEventAssignment; onChanged: () => void }) {
  const [sports, setSports] = useState<EventSportOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSportId, setSelectedSportId] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    getEventSportsForAssignment(assignment.eventId)
      .then(setSports)
      .catch(() => setSports([]))
      .finally(() => setLoading(false))
  }, [assignment.eventId])

  const handleAssign = async () => {
    if (!selectedSportId) return
    setBusy(true)
    try {
      await assignSportToJudge(userId, assignment.eventJudgeId, selectedSportId)
      setSelectedSportId("")
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const handleUnassign = async () => {
    setBusy(true)
    try {
      await unassignSportFromJudge(userId, assignment.eventJudgeId)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="px-6 py-4 text-sm text-gray-400">Loading sports…</p>
  }

  if (sports.length === 0) {
    return <p className="px-6 py-4 text-sm text-gray-400">No sports set up for this techfest yet.</p>
  }

  return (
    <div className="space-y-3 border-t px-6 py-4" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
      {assignment.assignedSportId ? (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: ORG.blue, background: "rgba(75,134,232,0.06)" }}
        >
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: ORG.text }}>
            <Gavel size={14} style={{ color: ORG.blueHeading }} />
            Scoring every match in <strong>{assignment.assignedSportName ?? "this sport"}</strong>
          </span>
          <button
            onClick={handleUnassign}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Unassign
          </button>
        </div>
      ) : (
        <p className="text-sm" style={{ color: ORG.muted }}>Not assigned to a sport yet — no scoring rights for this event.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedSportId}
          onChange={e => setSelectedSportId(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: `1px solid rgba(75,134,232,0.3)`, color: ORG.text }}
        >
          <option value="">
            {assignment.assignedSportId ? "Change sport…" : "Select a sport…"}
          </option>
          {sports.map(s => (
            <option key={s.eventSportId} value={s.eventSportId} disabled={s.eventSportId === assignment.assignedSportId}>
              {s.sportName} ({s.matchCount} match{s.matchCount !== 1 ? "es" : ""})
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={!selectedSportId || busy}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: ORG.gradientCta }}
        >
          {busy ? "Saving…" : assignment.assignedSportId ? "Change" : "Assign"}
        </button>
      </div>
    </div>
  )
}

function EventAssignmentRow({
  userId, assignment, onRemoved, onChanged,
}: { userId: string; assignment: JudgeEventAssignment; onRemoved: () => void; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!window.confirm(`Remove this judge from "${assignment.eventName}"? This also revokes their sport scoring rights for this event.`)) return
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
            {assignment.assignedSportName ? `Assigned to ${assignment.assignedSportName}` : "No sport assigned"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ color: ORG.blueHeading, background: "rgba(75,134,232,0.1)" }}
          >
            Manage sport
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
      {expanded && <SportAssignmentPanel userId={userId} assignment={assignment} onChanged={onChanged} />}
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
      setError("Failed to assign techfest")
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
          {resolveAvatarSrc(judge.profilePhotoUrl) ? (
            <img src={resolveAvatarSrc(judge.profilePhotoUrl)!} alt="" className="h-16 w-16 rounded-full object-cover" />
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
          <h2 className="mb-4 text-lg font-semibold" style={{ color: ORG.blueHeading, fontFamily: ORG.fontHeading }}>Assign to Techfest</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="min-w-[280px] flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ border: `1px solid rgba(75,134,232,0.3)`, color: ORG.text }}
            >
              <option value="">Select a techfest…</option>
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
        <p className="mb-4 -mt-2 text-xs" style={{ color: ORG.muted }}>
          Assigning a judge to a sport grants scoring rights on every match in that sport, including matches generated later.
        </p>

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
