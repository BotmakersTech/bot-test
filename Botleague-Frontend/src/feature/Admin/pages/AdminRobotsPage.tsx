import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  searchAdminRobots,
  createAdminRobot,
  getAllTeamsForPicker,
  type AdminRobotSummary,
  type TeamOption,
} from "../../SuperAdmin/api/robotManagement.api"

const ROBOT_TYPES_CREATE = ["COMBAT_ROBOT","SOCCER_ROBOT","SUMO_ROBOT","LINE_FOLLOWER_ROBOT","TASK_ROBOT","RC_VEHICLE","DRONE","AIRCRAFT","INNOVATION_PROJECT"]
const SPORTS_CREATE = ["ROBOWAR_1_5KG","ROBOWAR_8KG","ROBOWAR_15KG","ROBOWAR_30KG","ROBOWAR_60KG","ROBO_SOCCER","ROBO_SUMO","LINE_FOLLOWER","LINE_FOLLOWER_AUTO","MANUAL_TASK","THEME_BASED_TASKING","DRONE_RACING","DRONE_SOCCER","RC_RACING","AEROMODELLING","PROJECT_BASED"]
const AGE_CATS = ["JUNIOR_INNOVATORS","YOUNG_ENGINEERS","ROBO_MINDS"]
const CTRL_TYPES = ["MANUAL","AUTONOMOUS","HYBRID"]
const CTRL_MODES = ["WIRELESS","WIRED"]

function CreateRobotModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ robotName:"", teamId:"", robotType:"COMBAT_ROBOT", sport:"ROBOWAR_1_5KG", ageCategory:"JUNIOR_INNOVATORS", controlType:"MANUAL", controlMode:"WIRELESS", weightClass:"", weightKg:"", description:"" });
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => { getAllTeamsForPicker().then(setTeams).catch(() => setTeams([])); }, []);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.robotName || !form.teamId) { setErr("Robot name and team are required."); return; }
    setSaving(true); setErr(null);
    try {
      const robot = await createAdminRobot({
        ...form,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
      });
      onCreated(robot.id);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message ?? "Failed to create robot");
    } finally { setSaving(false); }
  };

  const inp = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#fa4715]/50";
  const lbl = "block mb-1 text-xs font-semibold text-neutral-400 uppercase tracking-wide";
  const sel = `${inp} cursor-pointer`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-5 text-lg font-bold text-white">Create Robot</h2>
        <form onSubmit={handle} className="space-y-4">
          <div><label className={lbl}>Robot Name *</label><input className={inp} value={form.robotName} onChange={e=>set("robotName",e.target.value)} placeholder="Thunderstrike" /></div>
          <div>
            <label className={lbl}>Assign to Team *</label>
            <select className={sel} value={form.teamId} onChange={e=>set("teamId",e.target.value)}>
              <option value="">— Select Team —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.teamName} · {t.teamCode}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Robot Type</label><select className={sel} value={form.robotType} onChange={e=>set("robotType",e.target.value)}>{ROBOT_TYPES_CREATE.map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={lbl}>Sport</label><select className={sel} value={form.sport} onChange={e=>set("sport",e.target.value)}>{SPORTS_CREATE.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Age Category</label><select className={sel} value={form.ageCategory} onChange={e=>set("ageCategory",e.target.value)}>{AGE_CATS.map(a=><option key={a} value={a}>{a.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={lbl}>Control Type</label><select className={sel} value={form.controlType} onChange={e=>set("controlType",e.target.value)}>{CTRL_TYPES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={lbl}>Connection</label><select className={sel} value={form.controlMode} onChange={e=>set("controlMode",e.target.value)}>{CTRL_MODES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Weight Class</label><input className={inp} value={form.weightClass} onChange={e=>set("weightClass",e.target.value)} placeholder="1.5KG" /></div>
            <div><label className={lbl}>Weight (kg)</label><input className={inp} type="number" step="0.1" min="0" value={form.weightKg} onChange={e=>set("weightKg",e.target.value)} placeholder="1.4" /></div>
          </div>
          <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Short robot description…" /></div>
          {err && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#fa4715] px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50">
              {saving ? "Creating…" : "Create Robot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUSES = ["ALL", "ACTIVE", "INACTIVE", "MAINTENANCE"]
const ROBOT_TYPES = ["ALL", "COMBAT_ROBOT", "SOCCER_ROBOT", "SUMO_ROBOT", "LINE_FOLLOWER_ROBOT",
  "TASK_ROBOT", "RC_VEHICLE", "DRONE", "AIRCRAFT", "INNOVATION_PROJECT"]

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

export default function AdminRobotsPage() {
  const navigate = useNavigate()
  const [robots, setRobots]         = useState<AdminRobotSummary[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeFilter, setTypeFilter]     = useState("ALL")
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async (q: string, p: number, status: string, type: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await searchAdminRobots(
        q || undefined,
        type !== "ALL" ? type : undefined,
        status !== "ALL" ? status : undefined,
        p,
        20
      )
      setRobots(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      setError("Failed to load robots")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(activeSearch, page, statusFilter, typeFilter)
  }, [activeSearch, page, statusFilter, typeFilter, load])

  const handleSearch = () => {
    setPage(0)
    setActiveSearch(search)
  }

  const handleStatusChange = (s: string) => { setStatusFilter(s); setPage(0) }
  const handleTypeChange   = (t: string) => { setTypeFilter(t);   setPage(0) }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      {showCreate && (
        <CreateRobotModal
          onClose={() => setShowCreate(false)}
          onCreated={id => { setShowCreate(false); navigate(`/admin/robots/${id}`); }}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Robot Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalElements} robot{totalElements !== 1 ? "s" : ""} registered across all teams
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-[#fa4715] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
        >
          + Create Robot
        </button>
      </div>

      {/* Search + status filter row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex flex-1 min-w-60 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by robot name…"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
          <button
            onClick={handleSearch}
            className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition"
          >
            Search
          </button>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === s
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {ROBOT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              typeFilter === t
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            {t === "ALL" ? "All Types" : t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading robots…</div>
      ) : robots.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">No robots found</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Robot</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Code</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Sport</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Team</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Weight</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {robots.map((robot) => (
                <tr
                  key={robot.id}
                  onClick={() => navigate(`/admin/robots/${robot.id}`)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {robot.robotIMG ? (
                        <img
                          src={robot.robotIMG}
                          alt={robot.robotName}
                          className="h-8 w-8 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold shrink-0">
                          {robot.robotName.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-white">{robot.robotName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden sm:table-cell">
                    {robot.robotCode}
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                    {robot.robotType?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                    {robot.sport?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {robot.teamName ? (
                      <div>
                        <p className="text-gray-300">{robot.teamName}</p>
                        <p className="font-mono text-xs text-gray-500">{robot.teamCode}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                    {robot.weightClass ?? (robot.weightKg ? `${robot.weightKg} kg` : "—")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={robot.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {robot.createdAt ? new Date(robot.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-sm text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 px-4 py-2 text-sm text-white transition"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 px-4 py-2 text-sm text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
