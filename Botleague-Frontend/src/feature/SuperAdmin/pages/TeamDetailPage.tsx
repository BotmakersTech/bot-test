import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import {
  getAdminTeamDetail,
  changeAdminTeamStatus,
  removeMemberFromTeam,
  deleteAdminTeam,
  updateAdminTeam,
  type AdminTeamDetail,
  type AdminTeamMember,
} from "../api/teamManagement.api"
import TeamLogo from "../../../shared/components/TeamLogo"
import LocationSelects from "../../../shared/components/LocationSelects"
import { resolveAvatarSrc } from "../../Profile/constants/avatars"
import "../../../shared/styles/adminDetailPage.css"

function statusClass(status: string) {
  return `adp-status adp-status-${status.toLowerCase()}`
}

function StatusBadge({ status }: { status: string }) {
  return <span className={statusClass(status)}>{status}</span>
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="adp-chip" style={role === "CAPTAIN" ? { borderColor: "#F5A623", color: "#B8720B" } : undefined}>
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
    return <div className="adp-page"><div className="adp-center">Loading team…</div></div>
  }

  return (
    <div className="adp-page">
      <div className="adp-topbar">
        <button onClick={() => navigate("/admin/teams")} className="adp-back-link">
          ← Back to Team Management
        </button>
      </div>

      {error && <div className="adp-banner adp-banner-error" style={{ margin: "16px 40px 0" }}>{error}</div>}
      {successMsg && <div className="adp-banner adp-banner-success" style={{ margin: "16px 40px 0" }}>{successMsg}</div>}

      {team && (
        <div className="adp-content">
          {/* Team card */}
          <section className="adp-card">
            <div className="adp-card-left">
              <div className="adp-avatar">
                <TeamLogo src={team.logoUrl} alt={team.teamName} />
              </div>
              <div>
                <div className="adp-title-row">
                  <h2 className="adp-entity-name">{team.teamName}</h2>
                  <StatusBadge status={team.status} />
                </div>
                <p className="adp-entity-code">{team.teamCode}</p>
                {team.institutionName && <p className="adp-entity-meta">{team.institutionName}</p>}
                {(team.city || team.country) && (
                  <p className="adp-entity-meta">{[team.city, team.state, team.country].filter(Boolean).join(", ")}</p>
                )}
              </div>
            </div>
            <div className="adp-card-right">
              <div className="adp-stat">
                <h4>Members</h4>
                <span>{team.memberCount}</span>
              </div>
              {team.createdAt && (
                <div className="adp-stat">
                  <h4>Created</h4>
                  <span style={{ fontSize: 15 }}>{new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </section>

          {/* Tabs */}
          <div className="adp-tabs">
            {(["info", "members", "actions"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={"adp-tab" + (tab === t ? " adp-tab-active" : "")}>
                {t === "members" ? `Members (${team.members.length})` : t === "actions" ? "Status & Actions" : "Team Info"}
              </button>
            ))}
          </div>

          {/* ── Team Info ── */}
          {tab === "info" && (
            <div className="adp-form-card">
              <div className="adp-form-grid">
                <FormField label="Team Name" value={form.teamName} onChange={(v) => setForm((f) => ({ ...f, teamName: v }))} />
                <FormField label="Institution / College" value={form.institutionName} onChange={(v) => setForm((f) => ({ ...f, institutionName: v }))} />
                <LocationSelects
                  gridStyle={{ display: "contents" }}
                  itemClassName="adp-field"
                  state={form.state}
                  city={form.city}
                  onCountry={(v) => setForm((f) => ({ ...f, country: v }))}
                  onState={(v) => setForm((f) => ({ ...f, state: v }))}
                  onCity={(v) => setForm((f) => ({ ...f, city: v }))}
                />
                <div className="adp-field adp-full-width">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <div className="adp-buttons">
                <button className="adp-btn-cancel" type="button" onClick={() => team && setForm({
                  teamName: team.teamName ?? "", description: team.description ?? "", institutionName: team.institutionName ?? "",
                  city: team.city ?? "", state: team.state ?? "", country: team.country ?? "",
                })}>
                  Cancel
                </button>
                <button className="adp-btn-save" onClick={handleSaveInfo} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* ── Members ── */}
          {tab === "members" && (
            <div className="adp-form-card">
              {team.members.length === 0 ? (
                <p className="adp-empty-note">No members</p>
              ) : (
                <div className="adp-row-list">
                  {team.members.map((member) => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      removing={removingUserId === member.userId}
                      onRemove={() => handleRemoveMember(member.userId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Status & Actions ── */}
          {tab === "actions" && (
            <div className="adp-form-card">
              <p className="adp-section-label">Team Status</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
                {["PENDING", "ACTIVE", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    disabled={saving || team.status === s}
                    onClick={() => handleStatusChange(s)}
                    className={"adp-btn-ghost" + (team.status === s ? " adp-btn-active" : "")}
                    style={{ padding: "10px 20px", fontSize: 14 }}
                  >
                    {s === "ACTIVE" ? "Approve" : s === "PENDING" ? "Set Pending" : "Reject"}
                    {team.status === s && <Check size={13} style={{ marginLeft: 4, display: "inline", verticalAlign: "middle" }} />}
                  </button>
                ))}
              </div>

              <p className="adp-section-label">Danger Zone</p>
              <div className="adp-danger-zone">
                <p>Permanently delete this team and all its memberships. This action cannot be undone.</p>
                {confirmDelete ? (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => setConfirmDelete(false)} className="adp-btn-cancel" style={{ minWidth: 110, height: 42 }}>
                      Cancel
                    </button>
                    <button disabled={deleting} onClick={handleDelete} className="adp-btn-danger-solid">
                      {deleting ? "Deleting…" : "Confirm Delete"}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="adp-btn-danger-outline">
                    Delete Team
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="adp-field">
      <label>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function MemberRow({
  member, removing, onRemove,
}: {
  member: AdminTeamMember
  removing: boolean
  onRemove: () => void
}) {
  const displayName =
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    member.username || member.botleagueId || member.userId

  const isLeft = member.membershipStatus === "LEFT"

  return (
    <div className={"adp-row" + (isLeft ? " adp-row-muted" : "")}>
      <div className="adp-row-left">
        <div className="adp-row-avatar">
          {resolveAvatarSrc(member.profilePhotoUrl) ? (
            <img src={resolveAvatarSrc(member.profilePhotoUrl)!} alt={displayName} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="adp-row-name">{displayName}</p>
          {member.email && <p className="adp-row-sub">{member.email}</p>}
          {member.botleagueId && <p className="adp-entity-code" style={{ marginTop: 0 }}>{member.botleagueId}</p>}
        </div>
      </div>
      <div className="adp-row-right">
        <RoleBadge role={member.teamRole} />
        <span className="adp-row-sub">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : ""}</span>
        {isLeft ? (
          <span className="adp-row-sub" style={{ fontStyle: "italic" }}>Left</span>
        ) : (
          <button disabled={removing} onClick={onRemove} className="adp-link-remove">
            {removing ? "…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  )
}
