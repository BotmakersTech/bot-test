import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import {
  getAdminRobotDetail,
  updateAdminRobot,
  changeAdminRobotStatus,
  deleteAdminRobot,
  type AdminRobotDetail,
} from "../../SuperAdmin/api/robotManagement.api"
import { getWeightClassOptions, weightClassLabel, formatWeightClass } from "../../Robots/constants/weightClasses"
import "../../../shared/styles/adminDetailPage.css"

type Tab = "info" | "specs" | "actions"

function statusClass(status: string) {
  return `adp-status adp-status-${status.toLowerCase()}`
}

function StatusBadge({ status }: { status: string }) {
  return <span className={statusClass(status)}>{status}</span>
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="adp-spec-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function FormField({
  label, value, onChange, type = "text", step,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  step?: string
}) {
  return (
    <div className="adp-field">
      <label>{label}</label>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export default function AdminRobotDetailPage() {
  const { robotId } = useParams<{ robotId: string }>()
  const navigate = useNavigate()

  const [robot, setRobot]         = useState<AdminRobotDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [tab, setTab]             = useState<Tab>("info")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  const [form, setForm] = useState({
    robotName: "",
    description: "",
    weightClass: "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
  })

  useEffect(() => {
    if (!robotId) return
    setLoading(true)
    getAdminRobotDetail(robotId)
      .then((data) => {
        setRobot(data)
        setForm({
          robotName:   data.robotName ?? "",
          description: data.description ?? "",
          weightClass: data.weightClass ?? "",
          weightKg:    data.weightKg?.toString() ?? "",
          lengthCm:    data.lengthCm?.toString() ?? "",
          widthCm:     data.widthCm?.toString() ?? "",
          heightCm:    data.heightCm?.toString() ?? "",
        })
      })
      .catch(() => setError("Failed to load robot"))
      .finally(() => setLoading(false))
  }, [robotId])

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }, [])

  const handleSave = useCallback(async () => {
    if (!robotId) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateAdminRobot(robotId, {
        robotName:   form.robotName || undefined,
        description: form.description || undefined,
        weightClass: form.weightClass || undefined,
        weightKg:    form.weightKg ? parseFloat(form.weightKg) : undefined,
        lengthCm:    form.lengthCm ? parseFloat(form.lengthCm) : undefined,
        widthCm:     form.widthCm  ? parseFloat(form.widthCm)  : undefined,
        heightCm:    form.heightCm ? parseFloat(form.heightCm) : undefined,
      })
      setRobot(updated)
      showSuccess("Robot info saved.")
    } catch {
      setError("Failed to save robot info.")
    } finally {
      setSaving(false)
    }
  }, [robotId, form, showSuccess])

  const handleStatusChange = useCallback(async (status: string) => {
    if (!robotId) return
    setSaving(true)
    setError(null)
    try {
      const updated = await changeAdminRobotStatus(robotId, status)
      setRobot(updated)
      showSuccess(`Status changed to ${status}.`)
    } catch {
      setError("Failed to update status.")
    } finally {
      setSaving(false)
    }
  }, [robotId, showSuccess])

  const handleDelete = useCallback(async () => {
    if (!robotId) return
    setDeleting(true)
    try {
      await deleteAdminRobot(robotId)
      navigate("/admin/robots")
    } catch {
      setError("Failed to delete robot.")
      setDeleting(false)
    }
  }, [robotId, navigate])

  if (loading) {
    return <div className="adp-page"><div className="adp-center">Loading robot…</div></div>
  }

  return (
    <div className="adp-page">
      <div className="adp-topbar">
        <button onClick={() => navigate("/admin/robots")} className="adp-back-link">
          ← Back to Robot Management
        </button>
      </div>

      {error && <div className="adp-banner adp-banner-error" style={{ margin: "16px 40px 0" }}>{error}</div>}
      {successMsg && <div className="adp-banner adp-banner-success" style={{ margin: "16px 40px 0" }}>{successMsg}</div>}

      {robot && (
        <div className="adp-content">
          {/* Robot card */}
          <section className="adp-card">
            <div className="adp-card-left">
              <div className="adp-avatar adp-avatar-square">
                {robot.robotIMG ? (
                  <img src={robot.robotIMG} alt={robot.robotName} />
                ) : (
                  robot.robotName.charAt(0)
                )}
              </div>
              <div>
                <div className="adp-title-row">
                  <h2 className="adp-entity-name">{robot.robotName}</h2>
                  <StatusBadge status={robot.status} />
                </div>
                <p className="adp-entity-code">{robot.robotCode}</p>
                {robot.teamName && (
                  <p className="adp-entity-meta">
                    Team: {robot.teamName} <span style={{ color: "#999" }}>({robot.teamCode})</span>
                  </p>
                )}
                {robot.sport && <p className="adp-entity-meta">{robot.sport.replace(/_/g, " ")}</p>}
              </div>
            </div>
            <div className="adp-card-right">
              <div className="adp-stat">
                <h4>Type</h4>
                <span style={{ fontSize: 15 }}>{robot.robotType?.replace(/_/g, " ") ?? "—"}</span>
              </div>
              {robot.weightClass && (
                <div className="adp-stat">
                  <h4>Weight Class</h4>
                  <span style={{ fontSize: 15 }}>{formatWeightClass(robot.weightClass)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Tabs */}
          <div className="adp-tabs">
            {(["info", "specs", "actions"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={"adp-tab" + (tab === t ? " adp-tab-active" : "")}>
                {t === "actions" ? "Status & Actions" : t === "specs" ? "Specifications" : "Info"}
              </button>
            ))}
          </div>

          {/* ── Info ── */}
          {tab === "info" && (
            <div className="adp-form-card">
              <div className="adp-form-grid">
                <FormField label="Robot Name" value={form.robotName} onChange={(v) => setForm((f) => ({ ...f, robotName: v }))} />
                {(() => {
                  const wcOptions = getWeightClassOptions(robot?.sport)
                  if (wcOptions.length === 0) {
                    return <FormField label="Weight Class" value={form.weightClass} onChange={(v) => setForm((f) => ({ ...f, weightClass: v }))} />
                  }
                  return (
                    <div className="adp-field">
                      <label>Weight Class</label>
                      <select value={form.weightClass} onChange={(e) => setForm((f) => ({ ...f, weightClass: e.target.value }))}>
                        <option value="">Select Weight Class</option>
                        {wcOptions.map((wc) => <option key={wc} value={wc}>{weightClassLabel(wc)}</option>)}
                      </select>
                    </div>
                  )
                })()}
                <FormField label="Weight (kg)" value={form.weightKg} type="number" step="any" onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))} />
                <FormField label="Length (cm)" value={form.lengthCm} type="number" onChange={(v) => setForm((f) => ({ ...f, lengthCm: v }))} />
                <FormField label="Width (cm)" value={form.widthCm} type="number" onChange={(v) => setForm((f) => ({ ...f, widthCm: v }))} />
                <FormField label="Height (cm)" value={form.heightCm} type="number" onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))} />
                <div className="adp-field adp-full-width">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
              </div>
              <div className="adp-buttons">
                <button className="adp-btn-cancel" type="button" onClick={() => robot && setForm({
                  robotName: robot.robotName ?? "", description: robot.description ?? "", weightClass: robot.weightClass ?? "",
                  weightKg: robot.weightKg?.toString() ?? "", lengthCm: robot.lengthCm?.toString() ?? "",
                  widthCm: robot.widthCm?.toString() ?? "", heightCm: robot.heightCm?.toString() ?? "",
                })}>
                  Cancel
                </button>
                <button className="adp-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* ── Specs ── */}
          {tab === "specs" && (
            <div className="adp-form-card">
              <Field label="Robot Type"   value={robot.robotType?.replace(/_/g, " ")} />
              <Field label="Sport"        value={robot.sport?.replace(/_/g, " ")} />
              <Field label="Control Type" value={robot.controlType} />
              <Field label="Control Mode" value={robot.controlMode} />
              <Field label="Weight Class" value={formatWeightClass(robot.weightClass) || undefined} />
              <Field label="Weight"       value={robot.weightKg ? `${robot.weightKg} KG` : undefined} />
              <Field label="Length"       value={robot.lengthCm ? `${robot.lengthCm} cm` : undefined} />
              <Field label="Width"        value={robot.widthCm  ? `${robot.widthCm} cm`  : undefined} />
              <Field label="Height"       value={robot.heightCm ? `${robot.heightCm} cm` : undefined} />
              {robot.eligibleCategories && robot.eligibleCategories.length > 0 && (
                <div className="adp-spec-row">
                  <span>Age Categories</span>
                  <div className="adp-role-chips" style={{ marginTop: 0 }}>
                    {robot.eligibleCategories.map((c) => <span key={c} className="adp-chip">{c.replace(/_/g, " ")}</span>)}
                  </div>
                </div>
              )}
              {robot.attributes && Object.keys(robot.attributes).length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p className="adp-section-label">Sport-specific attributes</p>
                  {Object.entries(robot.attributes).map(([k, v]) => (
                    <div key={k} className="adp-spec-row">
                      <span>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Status & Actions ── */}
          {tab === "actions" && (
            <div className="adp-form-card">
              <p className="adp-section-label">Robot Status</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
                {["ACTIVE", "INACTIVE", "MAINTENANCE"].map((s) => (
                  <button
                    key={s}
                    disabled={saving || robot.status === s}
                    onClick={() => handleStatusChange(s)}
                    className={"adp-btn-ghost" + (robot.status === s ? " adp-btn-active" : "")}
                    style={{ padding: "10px 20px", fontSize: 14 }}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                    {robot.status === s && <Check size={13} style={{ marginLeft: 4, display: "inline", verticalAlign: "middle" }} />}
                  </button>
                ))}
              </div>

              <p className="adp-section-label">Danger Zone</p>
              <div className="adp-danger-zone">
                <p>Permanently remove this robot. It will be soft-deleted and hidden from all team views. This action cannot be undone.</p>
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
                    Delete Robot
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
