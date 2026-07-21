import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, ChevronLeft, ChevronRight, Users as UsersIcon } from "lucide-react"
import { searchAdminTeams, createAdminTeam, type AdminTeamSummary } from "../api/teamManagement.api"
import { getUsersWithoutTeam, type UserSummary } from "../api/userManagement.api"
import TeamLogo from "../../../shared/components/TeamLogo"
import { ORG } from "../../Organizer/theme/organizerTheme"
import PrimaryButton from "../../Organizer/components/PrimaryButton"
import "../../../styles/organizerTheme.css"

const STATUS_FILTERS = ["ALL", "PENDING", "ACTIVE", "REJECTED"]
const PAGE_SIZE = 20

function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ teamName:"", institutionName:"", city:"", state:"", country:"India", description:"", captainUserId:"" });
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    getUsersWithoutTeam().then(setUsers).catch(() => setUsers([]));
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamName || !form.captainUserId) { setErr("Team name and captain are required."); return; }
    setSaving(true); setErr(null);
    try {
      const team = await createAdminTeam({ ...form });
      onCreated(team.id);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message ?? "Failed to create team");
    } finally { setSaving(false); }
  };

  const inp = "w-full rounded-lg bg-[#f8f9ff] border border-[rgba(75,134,232,0.3)] px-4 py-2.5 text-sm text-[#111111] placeholder-gray-400 focus:outline-none focus:border-[#4b86e8]";
  const lbl = "block mb-1.5 text-xs font-bold text-[#5d5d5d] uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-[1.5px] border-[#4b86e8] bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold" style={{ fontFamily: ORG.fontHeading, color: ORG.blueHeading }}>Create Team</h2>
        <form onSubmit={handle} className="space-y-4">
          <div><label className={lbl}>Team Name *</label><input className={inp} value={form.teamName} onChange={e=>set("teamName",e.target.value)} placeholder="Thunder Bots" /></div>
          <div>
            <label className={lbl}>Captain * (users without a team)</label>
            <select className={`${inp} cursor-pointer`} value={form.captainUserId} onChange={e=>set("captainUserId",e.target.value)}>
              <option value="">— Select Captain —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : u.username} · {u.phone}
                </option>
              ))}
            </select>
            {users.length === 0 && <p className="mt-1 text-xs text-gray-400">No users available without a team.</p>}
          </div>
          <div><label className={lbl}>Institution / School</label><input className={inp} value={form.institutionName} onChange={e=>set("institutionName",e.target.value)} placeholder="IIT Bombay" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>City</label><input className={inp} value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Mumbai" /></div>
            <div><label className={lbl}>State</label><input className={inp} value={form.state} onChange={e=>set("state",e.target.value)} placeholder="MH" /></div>
            <div><label className={lbl}>Country</label><input className={inp} value={form.country} onChange={e=>set("country",e.target.value)} /></div>
          </div>
          <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Short team bio…" /></div>
          {err && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg bg-[#f8f9ff] border border-[rgba(75,134,232,0.3)] px-5 py-2.5 text-sm font-semibold text-[#5d5d5d] hover:bg-[#eef1ff]">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: ORG.gradientCta, boxShadow: ORG.btnShadow }}
            >
              {saving ? "Creating…" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const bg: Record<string, string> = {
    ACTIVE: "#1fa952",
    PENDING: "#a16207",
    REJECTED: "#e04b4b",
  }
  return (
    <span className="inline-block rounded-full px-4 py-1 text-xs font-semibold text-white" style={{ background: bg[status] ?? "#9ca3af" }}>
      {status}
    </span>
  )
}

export default function TeamManagementPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<AdminTeamSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async (q: string, p: number) => {
    try {
      setLoading(true)
      setError(null)
      const res = await searchAdminTeams(q || undefined, p, PAGE_SIZE)
      setTeams(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      setError("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(activeSearch, page)
  }, [activeSearch, page, load])

  const handleSearch = () => {
    setPage(0)
    setActiveSearch(search)
  }

  const filtered =
    statusFilter === "ALL" ? teams : teams.filter((t) => t.status === statusFilter)

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
          <CreateTeamModal
            onClose={() => setShowCreate(false)}
            onCreated={id => { setShowCreate(false); navigate(`/admin/teams/${id}`); }}
          />
        )}

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold tracking-wide" style={{ fontFamily: ORG.fontHeading, color: ORG.blueHeading }}>
              Team Management
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {totalElements} team{totalElements !== 1 ? "s" : ""} registered
            </p>
          </div>
          <PrimaryButton type="button" onClick={() => setShowCreate(true)} style={{ padding: "14px 26px", fontSize: "0.9rem", flexShrink: 0 }}>
            <Plus size={16} /> Create Team
          </PrimaryButton>
        </div>

        {/* Search + status filter row */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div
            className="flex min-w-[300px] flex-1 items-center overflow-hidden rounded-xl border shadow-sm"
            style={{ borderColor: "rgba(75,134,232,0.3)" }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, code, or institution…"
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

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
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

        {/* Table */}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading teams…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">No teams found</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr style={{ background: ORG.gradientPill }}>
                  <th className="px-5 py-4 font-semibold text-white">Team</th>
                  <th className="px-5 py-4 font-semibold text-white">Code</th>
                  <th className="hidden px-5 py-4 font-semibold text-white md:table-cell">Institution</th>
                  <th className="hidden px-5 py-4 font-semibold text-white lg:table-cell">Location</th>
                  <th className="px-5 py-4 text-center font-semibold text-white">Members</th>
                  <th className="px-5 py-4 text-center font-semibold text-white">Status</th>
                  <th className="hidden px-5 py-4 font-semibold text-white sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filtered.map((team) => (
                  <tr
                    key={team.id}
                    onClick={() => navigate(`/admin/teams/${team.id}`)}
                    className="cursor-pointer border-t transition-colors hover:bg-[#f8f9ff]"
                    style={{ borderColor: "rgba(75,134,232,0.14)" }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <TeamLogo
                          src={team.logoUrl}
                          alt={team.teamName}
                          className="h-8 w-8 shrink-0 rounded-full border object-cover"
                          style={{ borderColor: "rgba(75,134,232,0.25)" }}
                        />
                        <span className="font-medium text-[#374151]">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{team.teamCode}</td>
                    <td className="hidden px-5 py-3.5 text-gray-600 md:table-cell">
                      {team.institutionName ?? "—"}
                    </td>
                    <td className="hidden px-5 py-3.5 text-gray-600 lg:table-cell">
                      {[team.city, team.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-600">{team.memberCount}</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={team.status} />
                    </td>
                    <td className="hidden px-5 py-3.5 text-gray-500 sm:table-cell">
                      {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "—"}
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
              <UsersIcon size={13} /> {totalElements} total
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
