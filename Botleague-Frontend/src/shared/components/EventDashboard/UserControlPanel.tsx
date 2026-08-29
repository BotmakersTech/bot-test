import { useCallback, useEffect, useState } from "react"
import { X, Check, Ban, Clock, UserPlus, Search, AlertTriangle } from "lucide-react"
import { formatWeightClass } from "../../../feature/Robots/constants/weightClasses"
import {
  getEventAssignments, assignEventHead, unassignEventHead,
  getSportAssignments, assignSportHead, unassignSportHead,
  approveSportHeadAssignment, rejectSportHeadAssignment,
  searchUsers,
  type EventAssignment, type UserSearchResult,
} from "../../../feature/Admin/api/admin.api"
import {
  getEventChangeRequests, approveSportChangeRequest, rejectSportChangeRequest,
  type SportChangeRequest,
} from "../../../feature/Organizer/api/organizer.api"
import { getPublicProfileByCode, type PublicProfileByCode } from "../../../feature/Profile/api/profile.api"
import { ChangeFieldDiff, type ChangeDiffSportLike } from "./ChangeRequestDiff"
import "./EventDashboard.css"

export interface UserControlSport extends ChangeDiffSportLike {
  id: string
  weightClass?: string | null
}

interface Props {
  eventId: string
  isAdmin: boolean
  sports: UserControlSport[]
  currentUserId?: string
  canReviewSportHeadTier: boolean
  canReviewManagerTier: boolean
  initialTab?: "assignments" | "changes"
  onClose: () => void
  onResolved?: () => void
}

function Spinner({ size = 14, color = "var(--ed-blue)" }: { size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, border: "2px solid rgba(1,98,209,0.15)", borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "ed-spin 0.7s linear infinite", flexShrink: 0 }} />
  )
}

function roleBadgeStyle(r?: string): React.CSSProperties {
  return {
    background: r === "SPORT_HEAD" ? "rgba(1,98,209,0.12)" : "rgba(31,169,82,0.12)",
    border: `1px solid ${r === "SPORT_HEAD" ? "rgba(1,98,209,0.35)" : "rgba(31,169,82,0.35)"}`,
    color: r === "SPORT_HEAD" ? "var(--ed-blue)" : "var(--ed-success)",
  }
}

function statusBadgeStyle(s?: string): React.CSSProperties {
  return {
    background: s === "PENDING_APPROVAL" ? "rgba(161,98,7,0.12)" : s === "REJECTED" ? "rgba(224,75,75,0.12)" : "rgba(31,169,82,0.12)",
    border: `1px solid ${s === "PENDING_APPROVAL" ? "rgba(161,98,7,0.35)" : s === "REJECTED" ? "rgba(224,75,75,0.35)" : "rgba(31,169,82,0.35)"}`,
    color: s === "PENDING_APPROVAL" ? "var(--ed-warning)" : s === "REJECTED" ? "var(--ed-danger)" : "var(--ed-success)",
  }
}

export default function UserControlPanel({
  eventId, isAdmin, sports, currentUserId,
  canReviewSportHeadTier, canReviewManagerTier,
  initialTab = "assignments", onClose, onResolved,
}: Props) {
  const [tab, setTab] = useState<"assignments" | "changes">(initialTab)

  return (
    <div className="ed-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ed-modal">
        <div className="ed-modal-head">
          <h2 className="ed-modal-title">USER CONTROL</h2>
          <button type="button" className="ed-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="ed-modal-tabs">
          <button type="button" className={"ed-modal-tab" + (tab === "assignments" ? " ed-modal-tab--active" : "")} onClick={() => setTab("assignments")}>
            <UserPlus size={13} /> Assignments
          </button>
          <button type="button" className={"ed-modal-tab" + (tab === "changes" ? " ed-modal-tab--active" : "")} onClick={() => setTab("changes")}>
            <Clock size={13} /> Pending Sport Changes
          </button>
        </div>
        <div className="ed-modal-body">
          {tab === "assignments" ? (
            <AssignmentsTab eventId={eventId} isAdmin={isAdmin} sports={sports} onResolved={onResolved} />
          ) : (
            <ChangesTab
              eventId={eventId}
              sports={sports}
              currentUserId={currentUserId}
              canReviewSportHeadTier={canReviewSportHeadTier}
              canReviewManagerTier={canReviewManagerTier}
              onResolved={onResolved}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ASSIGNMENTS TAB — grant SPORT_HEAD/EVENT_HEAD access, approve/reject
// pending sport-head assignments, remove existing ones. Search-by-name is
// Admin-only (GET /admin/users); Organiser/Event Head instead fetch a
// specific user by their public BotLeague ID (no directory browse needed).
// ─────────────────────────────────────────────────────────────

function AssignmentsTab({ eventId, isAdmin, sports, onResolved }: {
  eventId: string; isAdmin: boolean; sports: UserControlSport[]; onResolved?: () => void
}) {
  const [assignments, setAssignments] = useState<EventAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [roleType, setRoleType] = useState<"EVENT_HEAD" | "SPORT_HEAD">("EVENT_HEAD")
  const [sportId, setSportId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [deciding, setDeciding] = useState<string | null>(null)

  // admin: live search
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // organiser/event head: fetch-by-code
  const [code, setCode] = useState("")
  const [fetchedUser, setFetchedUser] = useState<PublicProfileByCode | null>(null)
  const [fetchingCode, setFetchingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const loadAssignments = useCallback(() => {
    setLoading(true)
    Promise.all([
      getEventAssignments(eventId),
      Promise.all(sports.map(s => getSportAssignments(s.id))),
    ])
      .then(([eventAssignments, sportAssignmentLists]) => setAssignments([...eventAssignments, ...sportAssignmentLists.flat()]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId, sports])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  useEffect(() => {
    if (!isAdmin) return
    if (query.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const timeout = setTimeout(() => {
      searchUsers(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, isAdmin])

  const doAssign = async (userId: string) => {
    if (roleType === "SPORT_HEAD" && !sportId) {
      setError("Choose a sport before assigning a sport head.")
      return
    }
    setAssigning(userId)
    setError(null)
    try {
      if (roleType === "EVENT_HEAD") {
        await assignEventHead(userId, eventId)
      } else {
        await assignSportHead(userId, sportId)
      }
      setQuery(""); setResults([])
      setCode(""); setFetchedUser(null)
      loadAssignments()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign.")
    } finally {
      setAssigning(null)
    }
  }

  const handleFetchByCode = async () => {
    if (!code.trim()) return
    setFetchingCode(true)
    setCodeError(null)
    setFetchedUser(null)
    try {
      const profile = await getPublicProfileByCode(code.trim())
      setFetchedUser(profile)
    } catch (err: any) {
      setCodeError(err?.response?.data?.message || "No user found with that BotLeague ID.")
    } finally {
      setFetchingCode(false)
    }
  }

  const handleRemove = async (a: EventAssignment) => {
    setRemoving(a.id)
    setError(null)
    try {
      if (a.roleType === "SPORT_HEAD" && a.eventSportId) {
        await unassignSportHead(a.userId, a.eventSportId)
      } else {
        await unassignEventHead(a.userId, eventId)
      }
      loadAssignments()
      onResolved?.()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove.")
    } finally {
      setRemoving(null)
    }
  }

  const handleApprove = async (assignmentId: string) => {
    setDeciding(assignmentId)
    setError(null)
    try {
      await approveSportHeadAssignment(assignmentId)
      loadAssignments()
      onResolved?.()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve.")
    } finally {
      setDeciding(null)
    }
  }

  const handleReject = async (assignmentId: string) => {
    const reason = window.prompt("Reason for rejecting this sport-head assignment (optional):") || undefined
    setDeciding(assignmentId)
    setError(null)
    try {
      await rejectSportHeadAssignment(assignmentId, reason)
      loadAssignments()
      onResolved?.()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject.")
    } finally {
      setDeciding(null)
    }
  }

  const assignedUserIds = new Set(
    assignments
      .filter(a => a.status !== "REJECTED" && (roleType === "EVENT_HEAD" ? a.roleType !== "SPORT_HEAD" : a.eventSportId === sportId))
      .map(a => a.userId)
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="ed-uc-assign-form">
        <div className="ed-uc-role-toggle">
          {(["EVENT_HEAD", "SPORT_HEAD"] as const).map(rt => (
            <button key={rt} type="button" className={"ed-uc-role-toggle" + (roleType === rt ? "--active" : "")} onClick={() => setRoleType(rt)}>
              {rt === "EVENT_HEAD" ? "Event Head (whole event)" : "Sport Head (one sport)"}
            </button>
          ))}
        </div>

        {roleType === "SPORT_HEAD" && (
          <select className="ed-input" value={sportId} onChange={e => setSportId(e.target.value)}>
            <option value="">Select a sport…</option>
            {sports.map(s => (
              <option key={s.id} value={s.id}>{s.sport}{s.weightClass ? ` (${formatWeightClass(s.weightClass)})` : ""}</option>
            ))}
          </select>
        )}

        {isAdmin ? (
          <div style={{ position: "relative" }}>
            <input className="ed-input" placeholder="Search users by name, phone, or BotLeague ID…" value={query} onChange={e => setQuery(e.target.value)} />
            {query.trim().length >= 2 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 5, background: "#fff", border: "1px solid var(--ed-border-light)", borderRadius: "10px", maxHeight: "220px", overflowY: "auto", boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}>
                {searching ? (
                  <div style={{ padding: "12px", color: "var(--ed-ink-mute)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}><Spinner />Searching…</div>
                ) : results.length === 0 ? (
                  <div style={{ padding: "12px", color: "var(--ed-ink-mute)", fontSize: "0.8rem" }}>No users found.</div>
                ) : (
                  results.map(u => {
                    const already = assignedUserIds.has(u.id)
                    return (
                      <button key={u.id} type="button" onClick={() => !already && doAssign(u.id)} disabled={already || assigning === u.id}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid var(--ed-border-light)", color: "var(--ed-ink)", textAlign: "left", cursor: already ? "default" : "pointer" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.83rem" }}>{u.firstName} {u.lastName} <span style={{ color: "var(--ed-ink-mute)", fontWeight: 500 }}>· {u.botleagueId}</span></div>
                          <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.7rem" }}>{u.phone || u.email}</div>
                        </div>
                        {already ? <span style={{ color: "var(--ed-success)", fontSize: "0.7rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}><Check size={11} /> Assigned</span>
                          : assigning === u.id ? <Spinner /> : <span style={{ color: "var(--ed-purple)", fontSize: "0.7rem", fontWeight: 700 }}>+ Assign</span>}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input className="ed-input" placeholder="User's BotLeague ID…" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && handleFetchByCode()} />
              <button type="button" className="ed-btn-outline" onClick={handleFetchByCode} disabled={fetchingCode || !code.trim()}>
                {fetchingCode ? <Spinner /> : <Search size={14} />} Fetch
              </button>
            </div>
            {codeError && <div style={{ color: "var(--ed-danger)", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} /> {codeError}</div>}
            {fetchedUser && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "#fff", border: "1px solid var(--ed-border-light)", borderRadius: "9px", padding: "10px 14px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.83rem" }}>
                    {[fetchedUser.firstName, fetchedUser.lastName].filter(Boolean).join(" ") || fetchedUser.username || fetchedUser.botleagueId}
                    <span style={{ color: "var(--ed-ink-mute)", fontWeight: 500 }}> · {fetchedUser.botleagueId}</span>
                  </div>
                  <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.7rem" }}>{fetchedUser.city || fetchedUser.country || ""}</div>
                </div>
                {assignedUserIds.has(fetchedUser.userId) ? (
                  <span style={{ color: "var(--ed-success)", fontSize: "0.7rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}><Check size={11} /> Assigned</span>
                ) : (
                  <button type="button" className="ed-btn-primary-sm" onClick={() => doAssign(fetchedUser.userId)} disabled={assigning === fetchedUser.userId}>
                    {assigning === fetchedUser.userId ? <Spinner color="#fff" /> : "+ Assign"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div style={{ color: "var(--ed-danger)", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} /> {error}</div>}

      {loading ? (
        <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}><Spinner />Loading…</div>
      ) : assignments.length === 0 ? (
        <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.82rem" }}>No event/sport heads assigned yet.</div>
      ) : (
        <div className="ed-uc-list">
          {assignments.map(a => (
            <div key={a.id} className="ed-uc-row">
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.83rem", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {a.userDisplayName || a.username}
                  <span className="ed-uc-role-badge" style={roleBadgeStyle(a.roleType)}>{a.roleType === "SPORT_HEAD" ? `SPORT HEAD${a.sportName ? " · " + a.sportName : ""}` : "EVENT HEAD"}</span>
                  {a.status && a.status !== "APPROVED" && <span className="ed-uc-status-badge" style={statusBadgeStyle(a.status)}>{a.status.replace("_", " ")}</span>}
                </div>
                <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.7rem" }}>{a.userEmail}</div>
                {a.status === "REJECTED" && a.rejectionReason && (
                  <div style={{ color: "var(--ed-danger)", fontSize: "0.68rem", marginTop: "2px" }}>Rejected: {a.rejectionReason}</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {a.status === "PENDING_APPROVAL" && (
                  <>
                    <button type="button" className="ed-btn-approve" style={{ padding: "6px 10px" }} onClick={() => handleApprove(a.id)} disabled={deciding === a.id}>
                      {deciding === a.id ? <Spinner color="var(--ed-success)" /> : <Check size={12} />} Approve
                    </button>
                    <button type="button" className="ed-btn-reject" style={{ padding: "6px 10px" }} onClick={() => handleReject(a.id)} disabled={deciding === a.id}>
                      <Ban size={12} /> Reject
                    </button>
                  </>
                )}
                <button type="button" className="ed-btn-reject" style={{ padding: "6px 10px" }} onClick={() => handleRemove(a)} disabled={removing === a.id}>
                  {removing === a.id ? <Spinner color="var(--ed-danger)" /> : <X size={12} />} Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PENDING SPORT CHANGES TAB — edits to an already-APPROVED sport, aggregated
// across every sport in this event. Reuses the same diff + approve/reject UX
// as the per-sport page (ChangeFieldDiff), tier-gated identically.
// ─────────────────────────────────────────────────────────────

function ChangesTab({ eventId, sports, currentUserId, canReviewSportHeadTier, canReviewManagerTier, onResolved }: {
  eventId: string
  sports: UserControlSport[]
  currentUserId?: string
  canReviewSportHeadTier: boolean
  canReviewManagerTier: boolean
  onResolved?: () => void
}) {
  const [requests, setRequests] = useState<SportChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getEventChangeRequests(eventId, "PENDING")
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    setBusyId(id); setError(null)
    try {
      await approveSportChangeRequest(eventId, id)
      await load()
      onResolved?.()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to approve change request")
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    setBusyId(id); setError(null)
    try {
      await rejectSportChangeRequest(eventId, id, reason || undefined)
      setRejectingId(null); setReason("")
      await load()
      onResolved?.()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to reject change request")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}><Spinner />Loading…</div>
  }

  if (requests.length === 0) {
    return <div style={{ color: "var(--ed-ink-mute)", fontSize: "0.82rem" }}>No pending sport changes right now.</div>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error && <div style={{ color: "var(--ed-danger)", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={13} /> {error}</div>}
      {requests.map(req => {
        const sport = sports.find(s => s.id === req.eventSportId)
        const isOwn = currentUserId != null && req.requestedBy === currentUserId
        const canReview = !isOwn && (
          (req.requesterTier === "SPORT_HEAD" && canReviewSportHeadTier) ||
          (req.requesterTier === "EVENT_HEAD_OR_ORGANISER" && canReviewManagerTier)
        )
        const busy = busyId === req.id

        return (
          <div key={req.id} className="ed-uc-change-card">
            <div className="ed-uc-change-head">
              <Clock size={14} />
              {isOwn ? "Your edit is awaiting approval" : `${req.requestedByName || "Someone"} proposed a change to ${req.sportName} awaiting your approval`}
            </div>

            {sport && <ChangeFieldDiff request={req} sport={sport} />}

            {canReview && (
              <div style={{ marginTop: "12px" }}>
                {rejectingId !== req.id ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className="ed-btn-approve" style={{ flex: "0 0 auto", padding: "7px 14px" }} onClick={() => handleApprove(req.id)} disabled={busy}>
                      {busy ? <Spinner color="var(--ed-success)" /> : <Check size={13} />} Approve
                    </button>
                    <button type="button" className="ed-btn-reject" style={{ flex: "0 0 auto", padding: "7px 14px" }} onClick={() => setRejectingId(req.id)} disabled={busy}>
                      <Ban size={13} /> Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input autoFocus placeholder="Reason for rejection (optional)…" value={reason} onChange={e => setReason(e.target.value)} className="ed-input" />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="button" onClick={() => { setRejectingId(null); setReason("") }} disabled={busy}
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid var(--ed-border-light)", color: "var(--ed-ink-mute)", borderRadius: "7px", padding: "7px 12px", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <button type="button" className="ed-btn-reject" style={{ flex: "0 0 auto", padding: "7px 12px" }} onClick={() => handleReject(req.id)} disabled={busy}>
                        {busy ? <Spinner color="var(--ed-danger)" /> : <Ban size={13} />} Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
