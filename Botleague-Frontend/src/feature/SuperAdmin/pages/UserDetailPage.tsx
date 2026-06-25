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

const ALL_ROLES = Object.values(AppRole)
const ALL_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING", "DEACTIVATED"]

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACTIVE"
      ? "bg-green-500/10 text-green-400"
      : status === "PENDING"
      ? "bg-yellow-500/10 text-yellow-400"
      : "bg-red-500/10 text-red-400"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status}
    </span>
  )
}

function RoleBadge({ role, onRemove }: { role: string; onRemove?: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[#fa4715]/10 px-2.5 py-0.5 text-xs font-medium text-orange-400 border border-[#fa4715]/20">
      {role}
      {onRemove && (
        <button
          onClick={onRemove}
          title="Remove role"
          className="ml-0.5 text-orange-400 hover:text-white leading-none"
        >
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
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 transition"
        >
          ← Back to User Management
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {!user && loading && (
        <div className="flex items-center justify-center py-32 text-gray-400">
          Loading user…
        </div>
      )}

      {user && (
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* User profile card */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6 flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#fa4715]/20 text-[#fa4715] font-bold text-2xl">
              {(user.firstName?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <StatusBadge status={user.accountStatus} />
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                {user.email && <span>{user.email}</span>}
                {user.email && user.phone && <span className="mx-1.5 text-gray-600">·</span>}
                {user.phone && <span>{user.phone}</span>}
              </p>
              <p className="font-mono text-xs text-gray-500 mt-1">{user.botleagueId}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {user.allRoles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs text-gray-300 border border-white/10"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right text-xs text-gray-500">
              <p>Joined</p>
              <p className="text-gray-400">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</p>
              {user.lastLoginAt && (
                <>
                  <p className="mt-1">Last login</p>
                  <p className="text-gray-400">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-5 overflow-x-auto">
            {(["profile", "roles", "status", "events", "sports"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-[#fa4715] text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {t === "events"
                  ? `Event Access (${user.assignedEvents?.length ?? 0})`
                  : t === "sports"
                  ? `Sport Access (${user.assignedSports?.length ?? 0})`
                  : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">Updating…</div>
          )}

          {/* ── Profile tab ── */}
          {!loading && tab === "profile" && (
            <div className="space-y-5">
              {profileSuccess && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400">
                  Profile saved successfully.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileField label="First Name" value={profileForm.firstName}
                  onChange={(v) => setProfileForm((f) => ({ ...f, firstName: v }))} />
                <ProfileField label="Last Name" value={profileForm.lastName}
                  onChange={(v) => setProfileForm((f) => ({ ...f, lastName: v }))} />
                <ProfileField label="Username" value={profileForm.username}
                  onChange={(v) => setProfileForm((f) => ({ ...f, username: v }))} />
                <ProfileField label="Email" value={profileForm.email} type="email"
                  onChange={(v) => setProfileForm((f) => ({ ...f, email: v }))} />
                <ProfileField label="Phone" value={profileForm.phone}
                  onChange={(v) => setProfileForm((f) => ({ ...f, phone: v }))} />
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fa4715]/50"
                  >
                    <option value="">— not set —</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <ProfileField label="Date of Birth" value={profileForm.dateOfBirth} type="date"
                  onChange={(v) => setProfileForm((f) => ({ ...f, dateOfBirth: v }))} />
                <ProfileField label="City" value={profileForm.city}
                  onChange={(v) => setProfileForm((f) => ({ ...f, city: v }))} />
                <ProfileField label="State" value={profileForm.state}
                  onChange={(v) => setProfileForm((f) => ({ ...f, state: v }))} />
                <ProfileField label="Country" value={profileForm.country}
                  onChange={(v) => setProfileForm((f) => ({ ...f, country: v }))} />
              </div>
              <ProfileField label="Address" value={profileForm.address}
                onChange={(v) => setProfileForm((f) => ({ ...f, address: v }))} />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition"
                >
                  {profileSaving ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </div>
          )}

          {!loading && tab === "roles" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Current Roles
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.allRoles.length === 0 ? (
                    <p className="text-sm text-gray-500">No roles assigned.</p>
                  ) : (
                    user.allRoles.map((r) => (
                      <RoleBadge key={r} role={r} onRemove={() => handleRemoveRole(r)} />
                    ))
                  )}
                </div>
              </div>
              {unassignedRoles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Add Role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassignedRoles.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleAssignRole(r)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400 hover:border-[#fa4715]/50 hover:text-white transition-colors"
                      >
                        + {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && tab === "status" && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Account Status
              </p>
              <div className="flex flex-wrap gap-3">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                      user.accountStatus === s
                        ? "bg-[#fa4715] text-white shadow-lg"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Current status:{" "}
                <strong className="text-white">{user.accountStatus}</strong>
              </p>
            </div>
          )}

          {!loading && tab === "events" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Assign Event
                </p>
                <div className="flex gap-2">
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fa4715]/50"
                  >
                    <option value="">Select an event…</option>
                    {availableEvents
                      .filter((ev) => !user.assignedEvents?.some((a) => a.eventId === ev.id))
                      .map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.eventName} ({ev.eventCode})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAssignEvent}
                    disabled={!selectedEventId}
                    className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition"
                  >
                    Assign
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Assigned Events ({user.assignedEvents?.length ?? 0})
                </p>
                {!user.assignedEvents?.length ? (
                  <p className="text-sm text-gray-500">No events assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {user.assignedEvents.map((e) => (
                      <li
                        key={e.eventId}
                        className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                      >
                        <div>
                          <span className="text-sm font-medium text-white">{e.eventName}</span>
                          <span className="ml-2 font-mono text-xs text-gray-500">{e.eventCode}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveEvent(e.eventId)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {!loading && tab === "sports" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Assign Sport
                </p>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value)
                      setSelectedSportId("")
                    }}
                    className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fa4715]/50"
                  >
                    <option value="">1. Select event…</option>
                    {availableEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.eventName} ({ev.eventCode})
                      </option>
                    ))}
                  </select>

                  {selectedEventId && (
                    <div className="flex gap-2">
                      <select
                        value={selectedSportId}
                        onChange={(e) => setSelectedSportId(e.target.value)}
                        className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fa4715]/50"
                      >
                        <option value="">2. Select sport…</option>
                        {availableSports
                          .filter((s) => !user.assignedSports?.some((a) => a.eventSportId === s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.sport}
                              {s.ageGroup ? ` · ${s.ageGroup}` : ""}
                              {s.weightClass ? ` (${s.weightClass})` : ""}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleAssignSport}
                        disabled={!selectedSportId}
                        className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition"
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Assigned Sports ({user.assignedSports?.length ?? 0})
                </p>
                {!user.assignedSports?.length ? (
                  <p className="text-sm text-gray-500">No sports assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {user.assignedSports.map((s) => (
                      <li
                        key={s.eventSportId}
                        className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                      >
                        <div>
                          <span className="text-sm font-medium text-white">{s.sport}</span>
                          <span className="ml-2 text-xs text-gray-400">{s.eventName}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveSport(s.eventSportId)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fa4715]/50"
      />
    </div>
  )
}
