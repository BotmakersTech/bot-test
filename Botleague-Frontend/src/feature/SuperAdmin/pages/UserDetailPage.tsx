import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../app/store"
import {
  fetchUserDetail,
  fetchAvailableEvents,
  fetchAvailableSports,
  assignUserRole,
  removeUserRole,
  updateUserStatus,
  updateUserProfile,
  assignUserEvent,
  removeUserEventAssignment,
  assignUserSport,
  removeUserSportAssignment,
  clearSelectedUser,
  clearAvailableSports,
  selectSelectedUser,
  selectUserMgmtDetailLoading,
  selectUserMgmtError,
  selectAvailableEvents,
  selectAvailableSports,
} from "../store/userManagementSlice"
import { AppRole } from "../../../shared/constants/roles"
import { formatWeightClass } from "../../Robots/constants/weightClasses"
import { ageGroupLabel } from "../../../shared/utils/ageGroup"
import "../../../shared/styles/adminDetailPage.css"

const ALL_ROLES = Object.values(AppRole)
const ALL_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING", "DEACTIVATED"]

function statusClass(status: string) {
  return `adp-status adp-status-${status.toLowerCase()}`
}

function StatusBadge({ status }: { status: string }) {
  return <span className={statusClass(status)}>{status}</span>
}

function RoleBadge({ role, onRemove }: { role: string; onRemove?: () => void }) {
  return (
    <span className="adp-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {role}
      {onRemove && (
        <button onClick={onRemove} title="Remove role" className="adp-link-remove" style={{ fontSize: 13 }}>
          ×
        </button>
      )}
    </span>
  )
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const user = useSelector(selectSelectedUser)
  const loading = useSelector(selectUserMgmtDetailLoading)
  const error = useSelector(selectUserMgmtError)
  const availableEvents = useSelector(selectAvailableEvents)
  const availableSports = useSelector(selectAvailableSports)

  const [tab, setTab] = useState<"profile" | "roles" | "status" | "events" | "sports">("profile")
  const [selectedEventId, setSelectedEventId] = useState("")
  const [selectedSportId, setSelectedSportId] = useState("")

  // Profile form state — populated once user loads
  const [profileForm, setProfileForm] = useState({
    username: "", firstName: "", lastName: "", email: "", phone: "",
    gender: "", dateOfBirth: "", city: "", state: "", country: "", address: "",
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserDetail(userId))
      dispatch(fetchAvailableEvents())
    }
    return () => { dispatch(clearSelectedUser()) }
  }, [userId, dispatch])

  // Sync profile form whenever user data arrives / refreshes
  useEffect(() => {
    if (user) {
      setProfileForm({
        username:    user.username    ?? "",
        firstName:   user.firstName   ?? "",
        lastName:    user.lastName    ?? "",
        email:       user.email       ?? "",
        phone:       user.phone       ?? "",
        gender:      user.gender      ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
        city:        user.city        ?? "",
        state:       user.state       ?? "",
        country:     user.country     ?? "",
        address:     user.address     ?? "",
      })
    }
  }, [user?.id]) // only reset when a different user loads

  useEffect(() => {
    if (selectedEventId) {
      dispatch(clearAvailableSports())
      dispatch(fetchAvailableSports(selectedEventId))
    }
  }, [selectedEventId, dispatch])

  const handleSaveProfile = useCallback(async () => {
    if (!userId) return
    setProfileSaving(true)
    setProfileSuccess(false)
    // Only send non-empty fields
    const payload: Record<string, string> = {}
    Object.entries(profileForm).forEach(([k, v]) => {
      if (v.trim() !== "") payload[k] = v.trim()
    })
    await dispatch(updateUserProfile({ userId, request: payload }))
    setProfileSaving(false)
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3000)
  }, [userId, profileForm, dispatch])

  const handleAssignRole = useCallback(
    (role: string) => {
      if (!userId) return
      dispatch(assignUserRole({ userId, role }))
    },
    [userId, dispatch]
  )

  const handleRemoveRole = useCallback(
    (role: string) => {
      if (!userId) return
      dispatch(removeUserRole({ userId, role }))
    },
    [userId, dispatch]
  )

  const handleStatusChange = useCallback(
    (status: string) => {
      if (!userId) return
      dispatch(updateUserStatus({ userId, status }))
    },
    [userId, dispatch]
  )

  const handleAssignEvent = useCallback(() => {
    if (!userId || !selectedEventId) return
    dispatch(assignUserEvent({ userId, eventId: selectedEventId }))
    setSelectedEventId("")
  }, [userId, selectedEventId, dispatch])

  const handleRemoveEvent = useCallback(
    (eventId: string) => {
      if (!userId) return
      dispatch(removeUserEventAssignment({ userId, eventId }))
    },
    [userId, dispatch]
  )

  const handleAssignSport = useCallback(() => {
    if (!userId || !selectedSportId || !selectedEventId) return
    dispatch(assignUserSport({ userId, eventSportId: selectedSportId, eventId: selectedEventId }))
    setSelectedSportId("")
    setSelectedEventId("")
  }, [userId, selectedSportId, selectedEventId, dispatch])

  const handleRemoveSport = useCallback(
    (sportId: string) => {
      if (!userId) return
      dispatch(removeUserSportAssignment({ userId, sportId }))
    },
    [userId, dispatch]
  )

  const unassignedRoles = ALL_ROLES.filter((r) => !user?.allRoles.includes(r))

  return (
    <div className="adp-page">
      <div className="adp-topbar">
        <button onClick={() => navigate("/admin/users")} className="adp-back-link">
          ← Back to User Management
        </button>
      </div>

      {error && <div className="adp-banner adp-banner-error" style={{ margin: "16px 40px 0" }}>{error}</div>}

      {!user && loading && (
        <div className="adp-center">Loading user…</div>
      )}

      {user && (
        <div className="adp-content">
          {/* User card */}
          <section className="adp-card">
            <div className="adp-card-left">
              <div className="adp-avatar">
                {(user.firstName?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
              </div>
              <div>
                <div className="adp-title-row">
                  <h2 className="adp-entity-name">{user.firstName} {user.lastName}</h2>
                  <StatusBadge status={user.accountStatus} />
                </div>
                <p className="adp-entity-meta">
                  {user.email}{user.email && user.phone ? " · " : ""}{user.phone}
                </p>
                <p className="adp-entity-code">{user.botleagueId}</p>
                <div className="adp-role-chips">
                  {user.allRoles.map((r) => <span key={r} className="adp-chip">{r}</span>)}
                </div>
              </div>
            </div>
            <div className="adp-card-right">
              <div className="adp-stat">
                <h4>Joined</h4>
                <span style={{ fontSize: 15 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
              </div>
              {user.lastLoginAt && (
                <div className="adp-stat">
                  <h4>Last Login</h4>
                  <span style={{ fontSize: 15 }}>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </section>

          {/* Tabs */}
          <div className="adp-tabs">
            {(["profile", "roles", "status", "events", "sports"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={"adp-tab" + (tab === t ? " adp-tab-active" : "")}
              >
                {t === "events"
                  ? `Techfect Access (${user.assignedEvents?.length ?? 0})`
                  : t === "sports"
                  ? `Techsport Access (${user.assignedSports?.length ?? 0})`
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {loading && <div className="adp-empty-note">Updating…</div>}

          {/* ── Profile tab ── */}
          {!loading && tab === "profile" && (
            <div className="adp-form-card">
              {profileSuccess && <div className="adp-banner adp-banner-success" style={{ marginBottom: 20 }}>Profile saved successfully.</div>}
              <div className="adp-form-grid">
                <ProfileField label="First Name" value={profileForm.firstName}
                  onChange={(v) => setProfileForm((f) => ({ ...f, firstName: v }))} />
                <ProfileField label="Last Name" value={profileForm.lastName}
                  onChange={(v) => setProfileForm((f) => ({ ...f, lastName: v }))} />
                <ProfileField label="Username" value={profileForm.username}
                  onChange={(v) => setProfileForm((f) => ({ ...f, username: v }))} />
                <ProfileField label="Phone" value={profileForm.phone}
                  onChange={(v) => setProfileForm((f) => ({ ...f, phone: v }))} />
                <ProfileField label="Email" value={profileForm.email} type="email"
                  onChange={(v) => setProfileForm((f) => ({ ...f, email: v }))} />
                <div className="adp-field">
                  <label>Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <ProfileField label="Date Of Birth" value={profileForm.dateOfBirth} type="date"
                  onChange={(v) => setProfileForm((f) => ({ ...f, dateOfBirth: v }))} />
                <ProfileField label="Country" value={profileForm.country}
                  onChange={(v) => setProfileForm((f) => ({ ...f, country: v }))} />
                <ProfileField label="City" value={profileForm.city}
                  onChange={(v) => setProfileForm((f) => ({ ...f, city: v }))} />
                <ProfileField label="State" value={profileForm.state}
                  onChange={(v) => setProfileForm((f) => ({ ...f, state: v }))} />
                <div className="adp-field adp-full-width">
                  <label>Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="adp-buttons">
                <button
                  className="adp-btn-cancel"
                  type="button"
                  onClick={() => user && setProfileForm({
                    username: user.username ?? "", firstName: user.firstName ?? "", lastName: user.lastName ?? "",
                    email: user.email ?? "", phone: user.phone ?? "", gender: user.gender ?? "",
                    dateOfBirth: user.dateOfBirth ?? "", city: user.city ?? "", state: user.state ?? "",
                    country: user.country ?? "", address: user.address ?? "",
                  })}
                >
                  Cancel
                </button>
                <button className="adp-btn-save" onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* ── Roles tab ── */}
          {!loading && tab === "roles" && (
            <div className="adp-form-card">
              <p className="adp-section-label">Current Roles</p>
              <div className="adp-role-chips" style={{ marginBottom: 28 }}>
                {user.allRoles.length === 0 ? (
                  <p className="adp-empty-note">No roles assigned.</p>
                ) : (
                  user.allRoles.map((r) => <RoleBadge key={r} role={r} onRemove={() => handleRemoveRole(r)} />)
                )}
              </div>
              {unassignedRoles.length > 0 && (
                <div>
                  <p className="adp-section-label">Add Role</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {unassignedRoles.map((r) => (
                      <button key={r} onClick={() => handleAssignRole(r)} className="adp-btn-ghost">
                        + {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Status tab ── */}
          {!loading && tab === "status" && (
            <div className="adp-form-card">
              <p className="adp-section-label">Account Status</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={"adp-btn-ghost" + (user.accountStatus === s ? " adp-btn-active" : "")}
                    style={{ padding: "10px 20px", fontSize: 14 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 18, fontFamily: "Inter, sans-serif", fontSize: 14, color: "#555" }}>
                Current status: <strong style={{ color: "var(--adp-text)" }}>{user.accountStatus}</strong>
              </p>
            </div>
          )}

          {/* ── Events tab ── */}
          {!loading && tab === "events" && (
            <div className="adp-form-card">
              <p className="adp-section-label">Assign Techfect</p>
              <div className="adp-assign-row" style={{ marginBottom: 28 }}>
                <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                  <option value="">Select a techfect…</option>
                  {availableEvents
                    .filter((ev) => !user.assignedEvents?.some((a) => a.eventId === ev.id))
                    .map((ev) => <option key={ev.id} value={ev.id}>{ev.eventName} ({ev.eventCode})</option>)}
                </select>
                <button onClick={handleAssignEvent} disabled={!selectedEventId} className="adp-btn-save" style={{ minWidth: 110 }}>
                  Assign
                </button>
              </div>

              <p className="adp-section-label">Assigned Techfects ({user.assignedEvents?.length ?? 0})</p>
              {!user.assignedEvents?.length ? (
                <p className="adp-empty-note">No techfects assigned.</p>
              ) : (
                <div className="adp-row-list">
                  {user.assignedEvents.map((e) => (
                    <div key={e.eventId} className="adp-row">
                      <div>
                        <span className="adp-row-name">{e.eventName}</span>
                        <span className="adp-row-sub" style={{ marginLeft: 8 }}>{e.eventCode}</span>
                      </div>
                      <button onClick={() => handleRemoveEvent(e.eventId)} className="adp-link-remove">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Sports tab ── */}
          {!loading && tab === "sports" && (
            <div className="adp-form-card">
              <p className="adp-section-label">Assign Techsport</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                <select
                  value={selectedEventId}
                  onChange={(e) => { setSelectedEventId(e.target.value); setSelectedSportId("") }}
                >
                  <option value="">1. Select techfect…</option>
                  {availableEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.eventName} ({ev.eventCode})</option>)}
                </select>

                {selectedEventId && (
                  <div className="adp-assign-row">
                    <select value={selectedSportId} onChange={(e) => setSelectedSportId(e.target.value)}>
                      <option value="">2. Select sport…</option>
                      {availableSports
                        .filter((s) => !user.assignedSports?.some((a) => a.eventSportId === s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.sport}{s.ageGroup ? ` · ${ageGroupLabel(s.ageGroup)}` : ""}{s.weightClass ? ` (${formatWeightClass(s.weightClass)})` : ""}
                          </option>
                        ))}
                    </select>
                    <button onClick={handleAssignSport} disabled={!selectedSportId} className="adp-btn-save" style={{ minWidth: 110 }}>
                      Assign
                    </button>
                  </div>
                )}
              </div>

              <p className="adp-section-label">Assigned Sports ({user.assignedSports?.length ?? 0})</p>
              {!user.assignedSports?.length ? (
                <p className="adp-empty-note">No sports assigned.</p>
              ) : (
                <div className="adp-row-list">
                  {user.assignedSports.map((s) => (
                    <div key={s.eventSportId} className="adp-row">
                      <div>
                        <span className="adp-row-name">{s.sport}</span>
                        <span className="adp-row-sub" style={{ marginLeft: 8 }}>{s.eventName}</span>
                      </div>
                      <button onClick={() => handleRemoveSport(s.eventSportId)} className="adp-link-remove">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileField({
  label, value, onChange, type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="adp-field">
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
