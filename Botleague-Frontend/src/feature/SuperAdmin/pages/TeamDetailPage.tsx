import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getAdminTeamDetail,
  changeAdminTeamStatus,
  removeMemberFromTeam,
  deleteAdminTeam,
  updateAdminTeam,
  type AdminTeamDetail,
  type AdminTeamMember,
} from "../api/teamManagement.api"

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACTIVE"
      ? "bg-green-500/15 text-green-400 border border-green-500/30"
      : status === "PENDING"
      ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
      : status === "REJECTED"
      ? "bg-red-500/15 text-red-400 border border-red-500/30"
      : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        role === "CAPTAIN"
          ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
          : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
      }`}
    >
      {role}
    </span>
  )
}

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()

  const [team, setTeam] = useState<AdminTeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<"info" | "members" | "actions">("info")
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [form, setForm] = useState({
    teamName: "",
    description: "",
    institutionName: "",
    city: "",
    state: "",
    country: "",
  })

  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    getAdminTeamDetail(teamId)
      .then((data) => {
        setTeam(data)
        setForm({
          teamName: data.teamName ?? "",
          description: data.description ?? "",
          institutionName: data.institutionName ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
        })
      })
      .catch(() => setError("Failed to load team"))
      .finally(() => setLoading(false))
  }, [teamId])

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }, [])

  const handleSaveInfo = useCallback(async () => {
    if (!teamId) return
    try {
      setSaving(true)
      setError(null)
      const updated = await updateAdminTeam(teamId, form)
      setTeam(updated)
      showSuccess("Team info saved.")
    } catch {
      setError("Failed to save team info.")
    } finally {
      setSaving(false)
    }
  }, [teamId, form, showSuccess])

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!teamId) return
      try {
        setSaving(true)
        setError(null)
        const updated = await changeAdminTeamStatus(teamId, status)
        setTeam(updated)
        showSuccess(`Status changed to ${status}.`)
      } catch {
        setError("Failed to update status.")
      } finally {
        setSaving(false)
      }
    },
    [teamId, showSuccess]
  )

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      if (!teamId) return
      try {
        setRemovingUserId(userId)
        await removeMemberFromTeam(teamId, userId)
        setTeam((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((m) =>
                  m.userId === userId ? { ...m, membershipStatus: "LEFT" } : m
                ),
              }
            : prev
        )
      } catch {
        setError("Failed to remove member.")
      } finally {
        setRemovingUserId(null)
      }
    },
    [teamId]
  )

  const handleDelete = useCallback(async () => {
    if (!teamId) return
    try {
      setDeleting(true)
      await deleteAdminTeam(teamId)
      navigate("/admin/teams")
    } catch {
      setError("Failed to delete team.")
      setDeleting(false)
    }
  }, [teamId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-gray-400">
        Loading team…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4">
        <button
          onClick={() => navigate("/admin/teams")}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 transition"
        >
          ← Back to Team Management
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400">
          {successMsg}
        </div>
      )}

      {team && (
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Team profile card */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6 flex items-start gap-5">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.teamName}
                className="h-16 w-16 rounded-full object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#fa4715]/20 text-[#fa4715] font-bold text-2xl">
                {team.teamName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white">{team.teamName}</h1>
                <StatusBadge status={team.status} />
              </div>
              <p className="font-mono text-xs text-gray-500 mt-1">{team.teamCode}</p>
              {team.institutionName && (
                <p className="text-sm text-gray-400 mt-0.5">{team.institutionName}</p>
              )}
              {(team.city || team.country) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[team.city, team.state, team.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right text-xs text-gray-500">
              <p>Members</p>
              <p className="text-white font-semibold text-base">{team.memberCount}</p>
              {team.createdAt && (
                <>
                  <p className="mt-1">Created</p>
                  <p className="text-gray-400">{new Date(team.createdAt).toLocaleDateString()}</p>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-5">
            {(["info", "members", "actions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-[#fa4715] text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {t === "members"
                  ? `Members (${team.members.length})`
                  : t === "actions"
                  ? "Status & Actions"
                  : "Team Info"}
              </button>
            ))}
          </div>

          {/* ── Team Info ── */}
          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Team Name"
                  value={form.teamName}
                  onChange={(v) => setForm((f) => ({ ...f, teamName: v }))}
                />
                <FormField
                  label="Institution / College"
                  value={form.institutionName}
                  onChange={(v) => setForm((f) => ({ ...f, institutionName: v }))}
                />
                <FormField
                  label="City"
                  value={form.city}
                  onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                />
                <FormField
                  label="State"
                  value={form.state}
                  onChange={(v) => setForm((f) => ({ ...f, state: v }))}
                />
                <FormField
                  label="Country"
                  value={form.country}
                  onChange={(v) => setForm((f) => ({ ...f, country: v }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fa4715]/50 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveInfo}
                  disabled={saving}
                  className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ── Members ── */}
          {tab === "members" && (
            <div className="space-y-2">
              {team.members.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No members</p>
              ) : (
                team.members.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    removing={removingUserId === member.userId}
                    onRemove={() => handleRemoveMember(member.userId)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Status & Actions ── */}
          {tab === "actions" && (
            <div className="space-y-8">
              {/* Status section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Team Status
                </p>
                <div className="flex flex-wrap gap-3">
                  {["PENDING", "ACTIVE", "REJECTED"].map((s) => (
                    <button
                      key={s}
                      disabled={saving || team.status === s}
                      onClick={() => handleStatusChange(s)}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                        team.status === s
                          ? s === "ACTIVE"
                            ? "bg-green-600 text-white"
                            : s === "REJECTED"
                            ? "bg-red-700 text-white"
                            : "bg-yellow-600 text-white"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
                      }`}
                    >
                      {s === "ACTIVE" ? "Approve" : s === "PENDING" ? "Set Pending" : "Reject"}
                      {team.status === s && " ✓"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Danger Zone
                </p>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="text-sm text-gray-300 mb-4">
                    Permanently delete this team and all its memberships. This action cannot be
                    undone.
                  </p>
                  {confirmDelete ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-xl px-4 py-2 text-sm text-gray-300 border border-white/10 hover:bg-white/5 transition"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={deleting}
                        onClick={handleDelete}
                        className="rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition"
                      >
                        {deleting ? "Deleting…" : "Confirm Delete"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 px-5 py-2 text-sm font-semibold transition"
                    >
                      Delete Team
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fa4715]/50"
      />
    </div>
  )
}

function MemberRow({
  member,
  removing,
  onRemove,
}: {
  member: AdminTeamMember
  removing: boolean
  onRemove: () => void
}) {
  const displayName =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.username ||
    member.botleagueId ||
    member.userId

  const isLeft = member.membershipStatus === "LEFT"

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ${
        isLeft ? "bg-white/3 opacity-60" : "bg-white/5"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {member.profilePhotoUrl ? (
          <img
            src={member.profilePhotoUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-slate-300 text-sm font-semibold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{displayName}</p>
          {member.email && <p className="text-xs text-gray-400 truncate">{member.email}</p>}
          {member.botleagueId && (
            <p className="font-mono text-xs text-gray-500">{member.botleagueId}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <RoleBadge role={member.teamRole} />
        <span className="text-xs text-gray-500">
          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : ""}
        </span>
        {isLeft ? (
          <span className="text-xs text-gray-500 italic">Left</span>
        ) : (
          <button
            disabled={removing}
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition"
          >
            {removing ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  )
}
