import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { listUsers, type UserSummary } from "../../SuperAdmin/api/userManagement.api"

const JUDGE_ROLES = ["ADMIN", "SUPER_ADMIN"]

export default function AdminJudgesPage() {
  const navigate = useNavigate()
  const [judges, setJudges] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")

  useEffect(() => {
    setLoading(true)
    setError(null)
    listUsers(activeSearch || undefined, 0, 100)
      .then((res) => {
        const filtered = res.content.filter((u) =>
          u.allRoles?.some((r) => JUDGE_ROLES.includes(r))
        )
        setJudges(filtered)
      })
      .catch(() => setError("Failed to load judges"))
      .finally(() => setLoading(false))
  }, [activeSearch])

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Judge Ecosystem</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${judges.length} user${judges.length !== 1 ? "s" : ""} with judge-level access`}
        </p>
      </div>

      <div className="mb-5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300">
        Judges are users with <span className="font-semibold">MANAGER</span>,{" "}
        <span className="font-semibold">ADMINISTRATOR</span>, or{" "}
        <span className="font-semibold">SUPER_ADMIN</span> role. Assign roles via{" "}
        <button
          onClick={() => navigate("/admin/users")}
          className="underline hover:text-blue-200"
        >
          User Management
        </button>
        .
      </div>

      <div className="flex gap-2 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setActiveSearch(search)}
          placeholder="Search by name or email…"
          className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
        />
        <button
          onClick={() => setActiveSearch(search)}
          className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          Search
        </button>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : judges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-gray-500">No judges found.</p>
          <button
            onClick={() => navigate("/admin/users")}
            className="text-sm text-orange-400 hover:text-orange-300 transition"
          >
            Assign roles in User Management →
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {judges.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.profilePhotoUrl ? (
                        <img src={u.profilePhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {(u.firstName ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-white">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold">
                      {u.primaryRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
