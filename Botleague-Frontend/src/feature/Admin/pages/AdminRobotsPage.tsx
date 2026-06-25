import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { searchAdminRobots, type AdminRobotSummary } from "../../SuperAdmin/api/robotManagement.api"

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Robot Management</h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalElements} robot{totalElements !== 1 ? "s" : ""} registered across all teams
        </p>
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
