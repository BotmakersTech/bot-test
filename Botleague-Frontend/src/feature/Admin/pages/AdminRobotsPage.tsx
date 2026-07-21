import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, ChevronLeft, ChevronRight, Bot as BotIcon } from "lucide-react"
import {
  searchAdminRobots,
  createAdminRobot,
  getAllTeamsForPicker,
  type AdminRobotSummary,
  type TeamOption,
} from "../../SuperAdmin/api/robotManagement.api"
import { getWeightClassOptions, weightClassLabel } from "../../Robots/constants/weightClasses"
import { ORG } from "../../Organizer/theme/organizerTheme"
import PrimaryButton from "../../Organizer/components/PrimaryButton"
import "../../../styles/organizerTheme.css"

const ROBOT_TYPES_CREATE = ["COMBAT_ROBOT","SOCCER_ROBOT","SUMO_ROBOT","LINE_FOLLOWER_ROBOT","TASK_ROBOT","RC_VEHICLE","DRONE","AIRCRAFT","INNOVATION_PROJECT"]
const SPORTS_CREATE = ["ROBOWAR_1_5KG","ROBOWAR_8KG","ROBOWAR_15KG","ROBOWAR_30KG","ROBOWAR_60KG","ROBO_SOCCER","ROBO_SUMO","LINE_FOLLOWER","LINE_FOLLOWER_AUTO","MANUAL_TASK","THEME_BASED_TASKING","DRONE_RACING","DRONE_SOCCER","RC_RACING","AEROMODELLING","PROJECT_BASED"]
const AGE_CATS = ["JUNIOR_INNOVATORS","YOUNG_ENGINEERS","ROBO_MINDS"]
const CTRL_TYPES = ["MANUAL","AUTONOMOUS","HYBRID"]
const CTRL_MODES = ["WIRELESS","WIRED"]
const PAGE_SIZE = 20

function CreateRobotModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ robotName:"", teamId:"", robotType:"COMBAT_ROBOT", sport:"ROBOWAR_1_5KG", ageCategory:"JUNIOR_INNOVATORS", controlType:"MANUAL", controlMode:"WIRELESS", weightClass:"", weightKg:"", description:"" });
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => { getAllTeamsForPicker().then(setTeams).catch(() => setTeams([])); }, []);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const setSport = (sport: string) => {
    const opts = getWeightClassOptions(sport);
    setForm(f => ({ ...f, sport, weightClass: opts.length === 1 ? opts[0] : "" }));
  };

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

  const inp = "w-full rounded-lg bg-[#f8f9ff] border border-[rgba(75,134,232,0.3)] px-4 py-2.5 text-sm text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#4b86e8]";
  const lbl = "block mb-1.5 text-xs font-bold text-[#5d5d5d] uppercase tracking-wide";
  const sel = `${inp} cursor-pointer`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-[1.5px] border-[#4b86e8] bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold" style={{ fontFamily: ORG.fontHeading, color: ORG.blueHeading }}>Create Robot</h2>
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
            <div><label className={lbl}>Sport</label><select className={sel} value={form.sport} onChange={e=>setSport(e.target.value)}>{SPORTS_CREATE.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Age Category</label><select className={sel} value={form.ageCategory} onChange={e=>set("ageCategory",e.target.value)}>{AGE_CATS.map(a=><option key={a} value={a}>{a.replace(/_/g," ")}</option>)}</select></div>
            <div><label className={lbl}>Control Type</label><select className={sel} value={form.controlType} onChange={e=>set("controlType",e.target.value)}>{CTRL_TYPES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={lbl}>Connection</label><select className={sel} value={form.controlMode} onChange={e=>set("controlMode",e.target.value)}>{CTRL_MODES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Weight Class</label>
              {(() => {
                const wcOptions = getWeightClassOptions(form.sport);
                if (wcOptions.length === 0) {
                  return <input className={inp} value={form.weightClass} onChange={e=>set("weightClass",e.target.value)} placeholder="N/A for this sport" />;
                }
                return (
                  <select className={sel} value={form.weightClass} onChange={e=>set("weightClass",e.target.value)}>
                    <option value="">— Select —</option>
                    {wcOptions.map(wc => <option key={wc} value={wc}>{weightClassLabel(wc)}</option>)}
                  </select>
                );
              })()}
            </div>
            <div><label className={lbl}>Weight (kg)</label><input className={inp} type="number" step="0.1" min="0" value={form.weightKg} onChange={e=>set("weightKg",e.target.value)} placeholder="1.4" /></div>
          </div>
          <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Short robot description…" /></div>
          {err && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg bg-[#f8f9ff] border border-[rgba(75,134,232,0.3)] px-5 py-2.5 text-sm font-semibold text-[#5d5d5d] hover:bg-[#eef1ff]">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: ORG.gradientCta, boxShadow: ORG.btnShadow }}
            >
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
  const bg: Record<string, string> = {
    ACTIVE: "#1fa952",
    INACTIVE: "#9ca3af",
    MAINTENANCE: "#a16207",
  }
  return (
    <span className="inline-block rounded-full px-4 py-1 text-xs font-semibold text-white" style={{ background: bg[status] ?? "#9ca3af" }}>
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
        PAGE_SIZE
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

  // Numbered page buttons with an ellipsis once there are more pages than fit —
  // always show first, last, current, and current's immediate neighbors.
  const pageNumbers = (() => {
    if (totalPages <= 1) return []
    const pages = new Set<number>([0, totalPages - 1, page, page - 1, page + 1])
    return [...pages].filter(p => p >= 0 && p < totalPages).sort((a, b) => a - b)
  })()

  return (
    <div className="org-page-bg" style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {showCreate && (
          <CreateRobotModal
            onClose={() => setShowCreate(false)}
            onCreated={id => { setShowCreate(false); navigate(`/admin/robots/${id}`); }}
          />
        )}

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold tracking-wide" style={{ fontFamily: ORG.fontHeading, color: ORG.blueHeading }}>
              Robot Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {totalElements} robot{totalElements !== 1 ? "s" : ""} registered across all teams
            </p>
          </div>
          <PrimaryButton type="button" onClick={() => setShowCreate(true)} style={{ padding: "14px 26px", fontSize: "0.9rem", flexShrink: 0 }}>
            <Plus size={16} /> Create Robot
          </PrimaryButton>
        </div>

        {/* Search + status filter row */}
        <div className="mb-3 flex flex-wrap gap-3">
          <div
            className="flex min-w-[300px] flex-1 items-center overflow-hidden rounded-xl border shadow-sm"
            style={{ borderColor: "rgba(75,134,232,0.3)" }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by robot name…"
              className="flex-1 px-5 py-3 text-[15px] text-[#374151] placeholder-gray-400 outline-none"
            />
            <button
              onClick={handleSearch}
              className="flex h-full items-center justify-center self-stretch px-6"
              style={{ background: ORG.gradientCta }}
              aria-label="Search"
            >
              <Search size={18} className="text-white" />
            </button>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
                style={
                  statusFilter === s
                    ? { background: "rgba(140,108,255,0.12)", color: ORG.violet, border: `1px solid ${ORG.violet}55` }
                    : { background: "#f8f9ff", color: ORG.muted, border: "1px solid rgba(75,134,232,0.2)" }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {ROBOT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition"
              style={
                typeFilter === t
                  ? { background: "rgba(75,134,232,0.12)", color: ORG.blueHeading, border: `1px solid ${ORG.blue}55` }
                  : { background: "#f8f9ff", color: ORG.muted, border: "1px solid rgba(75,134,232,0.2)" }
              }
            >
              {t === "ALL" ? "All Types" : t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Table */}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading robots…</div>
        ) : robots.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No robots found</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr style={{ background: ORG.gradientPill }}>
                  <th className="px-5 py-4 font-semibold text-white">Robot</th>
                  <th className="hidden px-5 py-4 font-semibold text-white sm:table-cell">Code</th>
                  <th className="hidden px-5 py-4 font-semibold text-white md:table-cell">Type</th>
                  <th className="hidden px-5 py-4 font-semibold text-white md:table-cell">Sport</th>
                  <th className="hidden px-5 py-4 font-semibold text-white lg:table-cell">Team</th>
                  <th className="hidden px-5 py-4 font-semibold text-white lg:table-cell">Weight</th>
                  <th className="px-5 py-4 text-center font-semibold text-white">Status</th>
                  <th className="hidden px-5 py-4 font-semibold text-white sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {robots.map((robot) => (
                  <tr
                    key={robot.id}
                    onClick={() => navigate(`/admin/robots/${robot.id}`)}
                    className="cursor-pointer border-t transition-colors hover:bg-[#f8f9ff]"
                    style={{ borderColor: "rgba(75,134,232,0.14)" }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {robot.robotIMG ? (
                          <img
                            src={robot.robotIMG}
                            alt={robot.robotName}
                            className="h-8 w-8 shrink-0 rounded-lg border object-cover"
                            style={{ borderColor: "rgba(75,134,232,0.25)" }}
                          />
                        ) : (
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ background: ORG.gradientCta }}
                          >
                            {robot.robotName.charAt(0)}
                          </span>
                        )}
                        <span className="font-medium text-[#374151]">{robot.robotName}</span>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 font-mono text-xs text-gray-500 sm:table-cell">
                      {robot.robotCode}
                    </td>
                    <td className="hidden px-5 py-3.5 text-gray-600 md:table-cell">
                      {robot.robotType?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="hidden px-5 py-3.5 text-gray-600 md:table-cell">
                      {robot.sport?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      {robot.teamName ? (
                        <div>
                          <p className="text-gray-600">{robot.teamName}</p>
                          <p className="font-mono text-xs text-gray-400">{robot.teamCode}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-3.5 text-gray-500 lg:table-cell">
                      {robot.weightClass ?? (robot.weightKg ? `${robot.weightKg} kg` : "—")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={robot.status} />
                    </td>
                    <td className="hidden px-5 py-3.5 text-gray-500 sm:table-cell">
                      {robot.createdAt ? new Date(robot.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {totalPages > 1 && (
            <>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "rgba(75,134,232,0.3)", color: ORG.muted }}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {pageNumbers.map((p, i) => (
                <span key={p} className="flex items-center">
                  {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                    style={p === page ? { background: ORG.blueHeading, color: "#fff" } : { color: ORG.blueHeading }}
                  >
                    {p + 1}
                  </button>
                </span>
              ))}

              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "rgba(75,134,232,0.3)", color: ORG.muted }}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          {!loading && totalElements > 0 && (
            <span className="ml-2 flex items-center gap-1.5 text-sm text-gray-400">
              <BotIcon size={13} /> {totalElements} total
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
