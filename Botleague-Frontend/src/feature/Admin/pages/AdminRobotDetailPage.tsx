import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  getAdminRobotDetail,
  updateAdminRobot,
  changeAdminRobotStatus,
  deleteAdminRobot,
  type AdminRobotDetail,
} from "../../SuperAdmin/api/robotManagement.api"

type Tab = "info" | "specs" | "actions"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:      "bg-green-500/15 text-green-400 border border-green-500/30",
    INACTIVE:    "bg-gray-500/15 text-gray-400 border border-gray-500/30",
    MAINTENANCE: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-gray-500/15 text-gray-400 border border-gray-500/30"}`}>
      {status}
    </span>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex gap-3 py-2 border-b border-white/5">
      <span className="w-36 shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
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
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-gray-400">
        Loading robot…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4">
        <button
          onClick={() => navigate("/admin/robots")}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5 transition"
        >
          ← Back to Robot Management
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

      {robot && (
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Profile card */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6 flex items-start gap-5">
            {robot.robotIMG ? (
              <img
                src={robot.robotIMG}
                alt={robot.robotName}
                className="h-16 w-16 rounded-xl object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#fa4715]/20 text-[#fa4715] font-bold text-2xl">
                {robot.robotName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white">{robot.robotName}</h1>
                <StatusBadge status={robot.status} />
              </div>
              <p className="font-mono text-xs text-gray-500 mt-1">{robot.robotCode}</p>
              {robot.teamName && (
                <p className="text-sm text-gray-400 mt-0.5">
                  Team: {robot.teamName}{" "}
                  <span className="font-mono text-gray-500 text-xs">({robot.teamCode})</span>
                </p>
              )}
              {robot.sport && (
                <p className="text-sm text-gray-500 mt-0.5">{robot.sport.replace(/_/g, " ")}</p>
              )}
            </div>
            <div className="shrink-0 text-right text-xs text-gray-500">
              <p>Type</p>
              <p className="text-white font-medium">{robot.robotType?.replace(/_/g, " ") ?? "—"}</p>
              {robot.weightClass && (
                <>
                  <p className="mt-1">Weight class</p>
                  <p className="text-gray-300">{robot.weightClass}</p>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-5">
            {(["info", "specs", "actions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-[#fa4715] text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {t === "actions" ? "Status & Actions" : t === "specs" ? "Specifications" : "Info"}
              </button>
            ))}
          </div>

          {/* ── Info ── */}
          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Robot Name"
                  value={form.robotName}
                  onChange={(v) => setForm((f) => ({ ...f, robotName: v }))}
                />
                <FormField
                  label="Weight (kg)"
                  value={form.weightKg}
                  onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))}
                  type="number"
                />
                <FormField
                  label="Length (cm)"
                  value={form.lengthCm}
                  onChange={(v) => setForm((f) => ({ ...f, lengthCm: v }))}
                  type="number"
                />
                <FormField
                  label="Width (cm)"
                  value={form.widthCm}
                  onChange={(v) => setForm((f) => ({ ...f, widthCm: v }))}
                  type="number"
                />
                <FormField
                  label="Height (cm)"
                  value={form.heightCm}
                  onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))}
                  type="number"
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
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-[#fa4715] hover:bg-orange-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ── Specs ── */}
          {tab === "specs" && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <Field label="Robot Type"   value={robot.robotType?.replace(/_/g, " ")} />
              <Field label="Sport"        value={robot.sport?.replace(/_/g, " ")} />
              <Field label="Control Type" value={robot.controlType} />
              <Field label="Control Mode" value={robot.controlMode} />
              <Field label="Weight Class" value={robot.weightClass} />
              <Field label="Weight"       value={robot.weightKg ? `${robot.weightKg} kg` : undefined} />
              <Field label="Length"       value={robot.lengthCm ? `${robot.lengthCm} cm` : undefined} />
              <Field label="Width"        value={robot.widthCm  ? `${robot.widthCm} cm`  : undefined} />
              <Field label="Height"       value={robot.heightCm ? `${robot.heightCm} cm` : undefined} />
              {robot.eligibleCategories && robot.eligibleCategories.length > 0 && (
                <div className="flex gap-3 py-2 border-b border-white/5">
                  <span className="w-36 shrink-0 text-xs text-gray-500">Age Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {robot.eligibleCategories.map((c) => (
                      <span key={c} className="rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 text-xs">
                        {c.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {robot.attributes && Object.keys(robot.attributes).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Sport-specific attributes</p>
                  <div className="space-y-1">
                    {Object.entries(robot.attributes).map(([k, v]) => (
                      <div key={k} className="flex gap-3">
                        <span className="w-36 shrink-0 text-xs text-gray-600">{k}</span>
                        <span className="text-sm text-gray-300">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Status & Actions ── */}
          {tab === "actions" && (
            <div className="space-y-8">
              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Robot Status
                </p>
                <div className="flex flex-wrap gap-3">
                  {["ACTIVE", "INACTIVE", "MAINTENANCE"].map((s) => (
                    <button
                      key={s}
                      disabled={saving || robot.status === s}
                      onClick={() => handleStatusChange(s)}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                        robot.status === s
                          ? s === "ACTIVE"
                            ? "bg-green-600 text-white"
                            : s === "MAINTENANCE"
                            ? "bg-yellow-600 text-white"
                            : "bg-gray-600 text-white"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
                      }`}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                      {robot.status === s && " ✓"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Danger Zone
                </p>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="text-sm text-gray-300 mb-4">
                    Permanently remove this robot. It will be soft-deleted and hidden from all
                    team views. This action cannot be undone.
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
                      Delete Robot
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
