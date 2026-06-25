import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { searchAdminTeams, type AdminTeamSummary } from "../api/teamManagement.api"

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

  const load = useCallback(async (q: string, p: number) => {
    try {
      setLoading(true)
      setError(null)
      const res = await searchAdminTeams(q || undefined, p, 20)
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

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Team Management</h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalElements} team{totalElements !== 1 ? "s" : ""} registered
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex flex-1 min-w-60 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name, code, or institution…"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
          <button
            onClick={handleSearch}
            className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition"
          >
            Search
          </button>
        </div>
        <div className="flex gap-1.5">
          {["ALL", "PENDING", "ACTIVE", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
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

      {/* Table */}
      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading teams…</div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">No teams found</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Institution</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 text-center">Members</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((team) => (
                <tr
                  key={team.id}
                  onClick={() => navigate(`/admin/teams/${team.id}`)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.teamName}
                          className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold shrink-0">
                          {team.teamName.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-white">{team.teamName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{team.teamCode}</td>
                  <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                    {team.institutionName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden lg:table-cell">
                    {[team.city, team.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">{team.memberCount}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={team.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "—"}
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
